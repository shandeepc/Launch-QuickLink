/*
Project - Launch QuickLink - Plugin
Version - 1.0
Author - Shandeep - https://shandeep.dev
*/

function observerForLuickQinkMutation(selector) {
    return new Promise(function(resolve) {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(function(mutations) {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showQuickLinkConfirmationModal(displayName) {
    return new Promise(function(resolve) {
        var existingModal = document.getElementById('qlLaunchModalWrapper');
        if (existingModal) {
            existingModal.remove();
        }

        var wrapper = document.createElement('div');
        wrapper.id = 'qlLaunchModalWrapper';

        wrapper.innerHTML =
            '<div class="modal fade in" role="dialog" style="display: block; z-index: 1050;" tabindex="-1">' +
            '  <div class="modal-dialog" aria-labelledby="modalTitle">' +
            '    <div class="modal-content" uib-modal-transclude="">' +
            '      <div id="completionDialog" role="dialog" aria-labelledby="modalTitle" class="info-modal">' +
            '        <div class="modal-header">' +
            '          <h4 class="modal-title" id="modalTitle">Launch QuickLink</h4>' +
            '        </div>' +
            '        <div class="modal-body">' +
            '          <div id="modal-content">' +
            '            <div class="ng-scope">' +
            '              <div class="ng-binding ng-scope">' +
            '                You are requesting to launch the QuickLink <b>' + escapeHtml(displayName) + '</b>. Click <b>Launch</b> to proceed or <b>Cancel</b> to stay on this page.' +
            '              </div>' +
            '            </div>' +
            '          </div>' +
            '        </div>' +
            '        <div class="modal-footer bg-light lt ng-scope">' +
            '          <button type="button" id="qlModalCancelBtn" class="btn btn-cancel">Cancel</button>' +
            '          <button type="button" id="qlModalConfirmBtn" class="btn btn-info btn-default">Launch</button>' +
            '          <p id="inProgress" class="sr-only ng-binding"></p>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>' +
            '<div class="modal-backdrop fade in" style="z-index: 1040;"></div>';

        document.body.appendChild(wrapper);
        document.body.classList.add('modal-open');

        var isResolved = false;
        function finish(result) {
            if (isResolved) return;
            isResolved = true;
            document.removeEventListener('keydown', handleKeyDown);
            document.body.classList.remove('modal-open');
            if (wrapper && wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
            resolve(result);
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape' || event.keyCode === 27) {
                finish(false);
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        var confirmBtn = wrapper.querySelector('#qlModalConfirmBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                finish(true);
            });
            confirmBtn.focus();
        }

        var cancelBtn = wrapper.querySelector('#qlModalCancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                finish(false);
            });
        }

        var modalElement = wrapper.querySelector('.modal');
        if (modalElement) {
            modalElement.addEventListener('click', function(e) {
                if (e.target === modalElement) {
                    finish(false);
                }
            });
        }

        var backdrop = wrapper.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', function() {
                finish(false);
            });
        }
    });
}

function isWorkflowQuickLink(qlName) {
    var contextPath = (typeof SailPoint !== 'undefined' && typeof SailPoint.CONTEXT_PATH === 'string')
        ? SailPoint.CONTEXT_PATH
        : '';
    var restUrl = contextPath + '/ui/rest/quickLinks/' + encodeURIComponent(qlName);

    var csrfToken = (typeof PluginHelper !== 'undefined' && typeof PluginHelper.getCsrfToken === 'function')
        ? PluginHelper.getCsrfToken()
        : '';

    const requestOptions = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-XSRF-TOKEN': csrfToken
        },
        credentials: 'same-origin'
    };

    return fetch(restUrl, requestOptions)
    .then(function(response) {
        if (response.ok) {
            return response.json();
        }
        return null;
    })
    .then(function(data) {
        return Boolean(data && data.action === 'workflow');
    })
    .catch(function(err) {
        console.warn('Launch QuickLink: Could not verify QuickLink action type via REST API:', err);
        return false;
    });
}

function getQuickLinkDisplayName(link, fallbackName) {
    if (!link) {
        return fallbackName;
    }

    var submenu = link.closest ? link.closest('.dropdown-submenu') : null;
    if (!submenu && link.parentElement && link.parentElement.parentElement && link.parentElement.parentElement.parentElement) {
        var potentialSubmenu = link.parentElement.parentElement.parentElement;
        if (potentialSubmenu.classList && potentialSubmenu.classList.contains('dropdown-submenu')) {
            submenu = potentialSubmenu;
        }
    }

    if (submenu) {
        var toggle = submenu.querySelector('.dropdown-toggle');
        if (toggle && toggle.textContent && toggle.textContent.trim()) {
            return toggle.textContent.trim();
        }
    }

    var directText = link.textContent ? link.textContent.trim() : '';
    if (directText && directText.toLowerCase() !== 'for me' && directText.toLowerCase() !== 'for others') {
        return directText;
    }

    return fallbackName;
}

function findMatchingQuickLink(qLinks, targetQL, targetQLFor) {
    var forMode = (targetQLFor || 'me').trim().toLowerCase();
    var matchingLinks = [];

    for (var i = 0; i < qLinks.length; i++) {
        var link = qLinks[i];
        var href = link.getAttribute('href') || '';

        var match = href.match(/chooseQuickLink\s*\(\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]*)['"])?\s*\)/);
        if (match) {
            var qlName = match[1].trim();
            var identityId = match[2] ? match[2].trim() : '';

            if (qlName.toLowerCase() === targetQL.toLowerCase()) {
                matchingLinks.push({
                    element: link,
                    name: qlName,
                    displayName: getQuickLinkDisplayName(link, qlName),
                    hasIdentityId: Boolean(identityId)
                });
            }
        }
    }

    if (matchingLinks.length === 0) {
        return null;
    }

    if (matchingLinks.length === 1) {
        return matchingLinks[0];
    }

    if (forMode === 'others') {
        var othersLink = matchingLinks.find(function(l) { return !l.hasIdentityId; });
        return othersLink || matchingLinks[0];
    } else {
        var meLink = matchingLinks.find(function(l) { return l.hasIdentityId; });
        return meLink || matchingLinks[0];
    }
}

observerForLuickQinkMutation('#quicklinkPanel').then(function(elm) {
    var params = new URLSearchParams(window.location.search);
    if (!params.has('LaunchQL')) {
        return;
    }

    var targetQL = params.get('LaunchQL').trim();
    var targetQLFor = params.get('LaunchQLFor');
    var qLinks = document.querySelectorAll('a[href*="SailPoint.Quicklinks.chooseQuickLink"]');

    if (!qLinks || qLinks.length === 0) {
        console.warn('Launch QuickLink: No QuickLinks found in DOM.');
        return;
    }

    var match = findMatchingQuickLink(qLinks, targetQL, targetQLFor);
    if (!match) {
        console.warn('Launch QuickLink: No QuickLink found matching name "' + targetQL + '".');
        return;
    }

    isWorkflowQuickLink(match.name).then(function(isWorkflow) {
        if (isWorkflow) {
            var displayName = match.displayName || match.name;
            showQuickLinkConfirmationModal(displayName).then(function(confirmed) {
                if (!confirmed) {
                    return;
                }
                match.element.click();
            });
        } else {
            match.element.click();
        }
    });
});

/*
Project - Launch QuickLink - Plugin
Version - 1.1
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

/**
 * Checks whether a QuickLink is a workflow-type action by querying IdentityIQ's UI REST service.
 * @param {string} qlName - System name of the QuickLink
 * @returns {Promise<boolean>} Resolves to true if action is 'workflow', false otherwise
 */
function isWorkflowQuickLink(qlName) {
    var contextPath = (typeof SailPoint !== 'undefined' && SailPoint.CONTEXT_PATH)
        ? SailPoint.CONTEXT_PATH
        : '/identityiq';
    var restUrl = contextPath + '/ui/rest/quickLinks/' + encodeURIComponent(qlName);

    return fetch(restUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
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

/**
 * Finds the appropriate QuickLink anchor element by matching the canonical QuickLink name
 * extracted from the chooseQuickLink(...) arguments rather than relying on display text.
 * @param {NodeList|Array} qLinks - List of anchor elements
 * @param {string} targetQL - The requested QuickLink name
 * @param {string} targetQLFor - Target recipient mode ('me' or 'others')
 * @returns {Object|null} Matching object with element, name, and hasIdentityId, or null
 */
function findMatchingQuickLink(qLinks, targetQL, targetQLFor) {
    var forMode = (targetQLFor || 'me').trim().toLowerCase();
    var matchingLinks = [];

    for (var i = 0; i < qLinks.length; i++) {
        var link = qLinks[i];
        var href = link.getAttribute('href') || '';
        // Extract arguments from: SailPoint.Quicklinks.chooseQuickLink('QuickLinkName', 'identityId')
        var match = href.match(/chooseQuickLink\s*\(\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]*)['"])?\s*\)/);
        if (match) {
            var qlName = match[1].trim();
            var identityId = match[2] ? match[2].trim() : '';

            if (qlName.toLowerCase() === targetQL.toLowerCase()) {
                matchingLinks.push({
                    element: link,
                    name: qlName,
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

    // When both "For Me" and "For Others" exist for the same QuickLink
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

    // Check if the target QuickLink is a workflow-type action before running
    isWorkflowQuickLink(match.name).then(function(isWorkflow) {
        if (isWorkflow) {
            var confirmed = window.confirm(
                'Launch QuickLink Confirmation:\n\n' +
                'You are requesting to launch the workflow QuickLink "' + match.name + '".\n\n' +
                'Do you want to proceed?'
            );
            if (!confirmed) {
                console.log('Launch QuickLink: Workflow execution cancelled by user for "' + match.name + '".');
                return;
            }
        }

        console.log('Launch QuickLink: Launching QuickLink "' + match.name + '"' + (match.hasIdentityId ? ' (For Me)' : ' (For Others)'));
        match.element.click();
    });
});

/*
Project - Launch QuickLink - Plugin
Version - 1.0
Author - Shandeep - https://shandeep.dev
*/

function observerForLuickQinkMutation(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
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

observerForLuickQinkMutation('#quicklinkPanel').then((elm) => {
		const params = new URLSearchParams(window.location.search);
		if (params.has('LaunchQL')) { 
			const LaunchQL = params.get('LaunchQL');
			const LaunchQLFor = params.get('LaunchQLFor');
			const qLinks = $('a[href^="javascript:SailPoint.Quicklinks.chooseQuickLink"]');
			if(qLinks) {
				for(var i = 0; i < qLinks.length; i++){
					const qLink = qLinks[i];
					const qLinkName = qLink.text.trim();
					if(qLinkName === LaunchQL) {
						console.log("Launching QuickLink - " + qLink);
						qLink.click();
                        break;
					} else if((!LaunchQLFor || LaunchQLFor.toLowerCase() === "me") && qLinkName === "For Me") {
						if(qLink.parentElement.parentElement.parentElement.children[0].text.trim() === LaunchQL) {
							console.log("Launching QuickLink For Mw - " + qLink);
							qLink.click();
	                        break;
						}
					} else if(LaunchQLFor && LaunchQLFor.toLowerCase() === "others" && qLinkName === "For Others") {
						if(qLink.parentElement.parentElement.parentElement.children[0].text.trim() === LaunchQL) {
							console.log("Launching QuickLink For Other - " + qLink);
							qLink.click();
	                        break;
						}
					}
				}
			}
		}
});
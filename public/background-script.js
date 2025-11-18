chrome.action.onClicked.addListener(function(activeTab){
    chrome.tabs.create({ url: "index.html" });
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch(request.type) {
            case "openURL":
                chrome.tabs.create({ url: request.URL });
                break;
        }
    }
)
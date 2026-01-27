chrome.action.onClicked.addListener(function(activeTab){
    chrome.tabs.create({ url: "https://www.roblox.com/my/avatar-plus" });
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch(request.type) {
            case "openURL":
                chrome.tabs.create({ url: request.URL });
                break;
            case "cookie":
                chrome.cookies.get({ "name": request.name, "url": request.url }, function (e) {
                    sendResponse({"cookie": e?.value})
                })
                return true
                break;
        }
    }
)
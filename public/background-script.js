chrome.action.onClicked.addListener(function(activeTab){
    chrome.tabs.create({ url: "https://www.roblox.com/roavatar" });
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch(request.type) {
            case "openURL":
                chrome.tabs.create({ url: request.URL });
                break;
            case "fetch":
                const [input, init] = request.args

                sendResponse(fetch(input, init))
                break
        }
    }
)
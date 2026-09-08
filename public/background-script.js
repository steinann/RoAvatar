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

                let response = undefined

                if (init.headers) {
                    init.headers = new Headers(init.headers)
                }

                fetch(input, init).then((response2) => {
                    response = response2
                    return response2.json()
                }).then((data) => {
                    sendResponse({
                        status: response.status,
                        headers: response.headers,
                        data,
                    })
                }).catch((error) => {
                    sendResponse({
                        status: 500,
                        headers: response ? response.headers : {},
                        data: {}
                    })
                })

                return true
        }
    }
)
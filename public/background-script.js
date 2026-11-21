(chrome || browser).action.onClicked.addListener(function(activeTab){
    (chrome || browser).tabs.create({ url: "https://www.roblox.com/roavatar" });
});

(chrome || browser).runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch(request.type) {
            case "openURL":
                (chrome || browser).tabs.create({ url: request.URL });
                break;
            case "fetch":
                const [input, init] = request.args

                let response = undefined

                if (init && init.headers) {
                    init.headers = new Headers(init.headers)
                }

                serializedHeaders = undefined

                fetch(input, init).then((response2) => {
                    response = response2
                    serializedHeaders = Object.fromEntries(response.headers.entries())
                    return response2.json()
                }).then((data) => {
                    sendResponse({
                        status: response.status,
                        ok: response.ok,
                        headers: serializedHeaders,
                        data,
                    })
                }).catch((error) => {
                    sendResponse({
                        status: 500,
                        ok: false,
                        headers: serializedHeaders ? serializedHeaders : {},
                        data: {}
                    })
                })

                return true
        }
    }
)
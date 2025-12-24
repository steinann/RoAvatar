declare const browser: typeof chrome;

export async function browserCookiesGet(name: string, url: string): Promise<string | undefined> {
    return new Promise((resolve) => {
        if ((chrome || browser).cookies) {
            (chrome || browser).cookies.get({ "name": name, "url": url }, function (e) {
                resolve(e?.value)
            })
        } else {
            browserSendMessage({type: "cookie", name: name, url: url}).then((response) => {
                resolve(response.cookie)
            })
        }
    })
}

export function browserSendMessage(data: {[K in string]: string}) {
    return (chrome || browser).runtime.sendMessage(data)
}

export function browserOpenURL(url: string) {
    browserSendMessage({"type": "openURL", "URL": url})
}
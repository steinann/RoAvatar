export async function browserCookiesGet(name: string, url: string): Promise<string | undefined> {
    return new Promise((resolve) => {
        chrome.cookies.get({ "name": name, "url": url }, function (e) {
            resolve(e?.value)
        })
    })
}

export function browserSendMessage(data: {[K in string]: string}) {
    chrome.runtime.sendMessage(data)
}

export function browserOpenURL(url: string) {
    browserSendMessage({"type": "openURL", "URL": url})
}
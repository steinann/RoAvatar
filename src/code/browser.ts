export async function browserCookiesGet(name: string, url: string): Promise<string | undefined> {
    return new Promise((resolve) => {
        chrome.cookies.get({ "name": name, "url": url }, function (e) {
            resolve(e?.value)
        })
    })
}
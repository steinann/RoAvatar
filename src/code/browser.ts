declare const browser: typeof chrome;

export function browserSendMessage(data: {[K in string]: string}) {
    return (chrome || browser).runtime.sendMessage(data)
}

export function browserOpenURL(url: string) {
    browserSendMessage({"type": "openURL", "URL": url})
}
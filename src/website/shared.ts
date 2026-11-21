import { CONFIG } from "../react/generic/config";

declare const browser: typeof chrome;

export const fetchFunc = async (input: URL | RequestInfo, init?: RequestInit) => {
    if (input.toString().includes("roblox.com") || input.toString().includes(CONFIG.ROAVATAR_API_URL)) {
        if (init && init.headers) {
            init.headers = Object.fromEntries(Array.from(new Headers(init.headers).entries()))
        }

        const result = await (chrome || browser).runtime.sendMessage({
            type: "fetch",
            args: [input.toString(), init]
        })

        const status = result.status as number
        const headers = result.headers
        const data = result.data

        return new Response(JSON.stringify(data), {
            status: status,
            headers: headers
        })
    } else {
        return fetch(input, init)
    }
}
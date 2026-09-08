import { FLAGS, RBXRenderer } from "roavatar-renderer";
import { initOutfitsMadeWith, onURLChangeOutfitsMadeWith } from "./marketplace/outfitsMadeWith";
import { initObserver } from "./observe";
import { initAvatarHistory, onURLChangeAvatarHistory } from "./profile/avatarHistory";
//import workerUrl from "../renderer-worker?worker&url"

let rendererSuccess: boolean | undefined = undefined
let rendererSetupInterval: NodeJS.Timeout | undefined = undefined
let lastURL = ""
export function initWebsite() {
    lastURL = window.location.href

    FLAGS.ONLINE_ASSETS = false
    FLAGS.USE_WORKERS = false
    FLAGS.ASSETS_PATH = chrome.runtime.getURL("assets/rbxasset/")
    FLAGS.RIG_PATH = chrome.runtime.getURL("assets/")

    FLAGS.FETCH_FUNC = async (input: URL | RequestInfo, init?: RequestInit) => {
        if (input.toString().includes("assetdelivery.roblox.com")) {
            if (init && init.headers) {
                init.headers = Object.fromEntries(new Headers(init.headers).entries())
            }

            const result = await chrome.runtime.sendMessage({
                type: "fetch",
                args: [input, init]
            })

            const status = result.status as number
            //const headers = result.headers

            const data = result.data

            const fakeResponse = {
                status: status,
                ok: status === 200,
                json: () => {
                    return data;
                },
            }

            return fakeResponse as Response
        } else {
            return fetch(input, init)
        }
    }

    setInterval(() => {
        if (lastURL !== window.location.href) {
            lastURL = window.location.href
            onURLChange()
        }
    })

    initObserver()
    initFeatures()
}

export function onURLChange() {
    if (rendererSuccess) {
        onURLChangeOutfitsMadeWith()
        onURLChangeAvatarHistory()
    }
}

export function initFeatures() {
    rendererSetupInterval = setInterval(() => {
        if (document.head && document.body) {
            if (rendererSetupInterval) {
                clearInterval(rendererSetupInterval)
            }

            RBXRenderer.fullSetup().then((success) => {
                rendererSuccess = success
                if (success) {
                    initOutfitsMadeWith()
                    initAvatarHistory()
                }
            })
        }
    }, 50)
}
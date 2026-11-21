import { FLAGS, RBXRenderer } from "roavatar-renderer";
import { initOutfitsMadeWith, onURLChangeOutfitsMadeWith } from "./marketplace/outfitsMadeWith";
import { initObserver } from "./observe";
import { initAvatarHistory, onURLChangeAvatarHistory } from "./profile/avatarHistory";
import { fetchFunc } from "./shared";
//import workerUrl from "../renderer-worker?worker&url"

declare const browser: typeof chrome;

let rendererSuccess: boolean | undefined = undefined
let rendererSetupInterval: NodeJS.Timeout | undefined = undefined
let lastURL = ""
export function initWebsite(fullInit: boolean = true) {
    lastURL = window.location.href

    FLAGS.ONLINE_ASSETS = false
    FLAGS.USE_WORKERS = false
    FLAGS.ASSETS_PATH = (chrome || browser).runtime.getURL("assets/rbxasset/")
    FLAGS.RIG_PATH = (chrome || browser).runtime.getURL("assets/")
    FLAGS.AUDIO_ENABLED = false

    FLAGS.FETCH_FUNC = fetchFunc;

    if (fullInit) {
        setInterval(() => {
            if (lastURL !== window.location.href) {
                lastURL = window.location.href
                onURLChange()
            }
        })

        initObserver()
        initFeatures()
    }
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
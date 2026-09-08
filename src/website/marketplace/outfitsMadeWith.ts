import { Authentication, generateOutfitThumbnail, OutfitModel } from "roavatar-renderer";
import { ROAVATAR_API, type AvatarListV1 } from "../../react/generic/roavatar-api";
import { createElementFromHTML } from "../misc/htmlHelper";
import { getIdFromUrl } from "../misc/urlHelper";
import { observeElement } from "../observe";
import { getSetting } from "../../react/generic/settings";

function createOutfitList(sponsoredCatalogItems: Element, avatarList: AvatarListV1) {
    const alreadyContainer = document.getElementById("outfit-made-with-container")
    if (alreadyContainer) return

    const outfitListContainer = createElementFromHTML(`
        <div class="item-list" id="outfits-made-with-container">
            <div class="item-list-container layer" id="populated-item-list">
                <div class="item-list-carousel-title">
                    <h1 class="font-header-1">Outfits made with item</h1>
                </div>
                <div class="item-list-carousel">
                    <div class="item-list-cards">

                        

                    </div>
                </div>
            </div>
        </div>
    `)

    const outfitListCards = outfitListContainer.querySelector(".item-list-cards")
    const itemCards: HTMLDivElement[] = []

    const avatarDataPromises: Promise<OutfitModel | Response>[] = []

    for (let i = 0; i < Math.min(avatarList.data.length, 7); i++) {
        const avatar = avatarList.data[i]

        const itemCard = createElementFromHTML(`
            <div class="item-list-item-card">
                <div style="display: contents;">
                    <div class="list-item item-card grid-item-container">
                        <div class="item-card-container"><a
                                href="" target="_self"
                                class="item-card-link">
                                <div class="item-card-link">
                                    <div class="item-card-thumb-container">
                                        <div class="item-card-thumb-container-inner">
                                            <div><span class="thumbnail-2d-container"><img class=""
                                                        src=""
                                                        alt=""></span></div>
                                        </div>
                                    </div>
                                </div>
                            </a></div>
                    </div>
                </div>
            </div>
        `) as HTMLDivElement
        itemCards.push(itemCard)

        const imgElement = itemCard.querySelector("img")
        if (imgElement) imgElement.src = chrome.runtime.getURL("assets/broken-avatar-200px.png")

        const linkElement = itemCard.querySelector("a.item-card-link") as HTMLAnchorElement | undefined
        if (linkElement) linkElement.href = `https://www.roblox.com/roavatar?api=${avatar.id}`
        
        avatarDataPromises.push(new Promise((resolve) => {
            ROAVATAR_API.avatars.getAvatar(avatar.id).then((outfit) => {
                if (outfit instanceof Response) {
                    resolve(outfit)
                    return
                }

                const outfitModel = new OutfitModel()
                outfitModel.outfit = outfit
                
                resolve(outfitModel)
            })
        }))

        if (outfitListCards) outfitListCards.appendChild(itemCard)
    }

    Promise.all(avatarDataPromises).then(async (avatarDatas) => {
        for (let i = 0; i < avatarDatas.length; i++) {
            const avatarData = avatarDatas[i]

            const itemCard = itemCards[i]

            const imgElement = itemCard.querySelector("img")
            if (imgElement) {
                if (avatarData instanceof Response) {
                    imgElement.src = chrome.runtime.getURL("assets/error.svg")
                    continue
                }

                //make sure thumbnails are only being rendered if they can kinda be seen
                new Promise((resolve) => {
                    const renderThumbnail = async () => {
                        const thumbnail = await generateOutfitThumbnail(new Authentication(), avatarData, [150,150], "png", 1, false, false, undefined, "avatarFullbody")
                        if (typeof thumbnail === "string") {
                            imgElement.src = thumbnail
                        } else {
                            imgElement.src = chrome.runtime.getURL("assets/error.svg")
                        }
                        resolve(undefined)
                    }

                    const renderInterval = setInterval(() => {
                        if (window.scrollY > 400) {
                            renderThumbnail()
                            clearInterval(renderInterval)
                        }
                    }, 500)
                })
            }
        }
    })

    sponsoredCatalogItems.parentNode?.appendChild(outfitListContainer)
}

export function initOutfitsMadeWith() {
    onURLChangeOutfitsMadeWith()
}

export async function onURLChangeOutfitsMadeWith() {
    const settingValue = await getSetting("s-avatars-made-with", true)
    if (!settingValue) return

    const url = window.location.href;
    if (!url.includes("/catalog/")) return

    const assetId = getIdFromUrl(url)
    if (assetId) {
        ROAVATAR_API.avatars.withAsset(assetId).then((result) => {
            if (result instanceof Response) return
            if (result.data.length <= 0) return

            setTimeout(() => {
                if (getIdFromUrl(window.location.href) !== assetId) return true
                const sponsoredCatalogItems = document.querySelector("#sponsored-catalog-items")
                
                if (sponsoredCatalogItems) {
                    createOutfitList(sponsoredCatalogItems, result)
                } else {
                    observeElement("#sponsored-catalog-items", (sponsoredCatalogItems) => {
                        if (getIdFromUrl(window.location.href) !== assetId) return true
                        createOutfitList(sponsoredCatalogItems, result)
                        return true
                    })
                }
            }, 2000)
        })
    }
}
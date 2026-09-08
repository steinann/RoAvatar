import { Authentication, generateOutfitThumbnail, OutfitModel } from "roavatar-renderer";
import { ROAVATAR_API, type AvatarListV1 } from "../../react/generic/roavatar-api";
import { createElementFromHTML } from "../misc/htmlHelper";
import { getIdFromUrl } from "../misc/urlHelper";
import { observeElement } from "../observe";
import 'javascript-time-ago/locale/en'
import TimeAgo from "javascript-time-ago";
import { getSetting } from "../../react/generic/settings";

const timeAgo = new TimeAgo('en')

let timesAppended = 0

function createOutfitList(profileTabContent: Element, avatarList: AvatarListV1, userId: number) {
    const avatarHistory = document.getElementById("roavatar-avatar-history")
    if (avatarHistory) {
        if (timesAppended <= 1000) {
            const profileCommunities = profileTabContent.querySelector(".profile-communities")

            timesAppended += 1
            if (profileCommunities) {
                profileTabContent.insertBefore(avatarHistory, profileCommunities)
            } else {
                profileTabContent.appendChild(avatarHistory)
            }
        }
        return
    }

    const outfitListContainer = createElementFromHTML(`
        <div class="profile-carousel" id="roavatar-avatar-history">
            <div class="css-17g81zd-collectionCarouselContainer">
                <div><!--<a href="" class="items-center inline-flex">-->
                        <h2 class="content-emphasis text-heading-small padding-none inline-block">Recent avatars</h2><!--<span
                            class="icon-chevron-heavy-right"></span>
                    </a>--></div>
                <div class="css-1jynqc0-carouselContainer">
                    <div class="css-1i465w8-carousel" style="display: flex; flex-direction: row;">
                        
                    </div>
                </div>
            </div>
        </div>
    `)

    const linkElement = outfitListContainer.querySelector("a")
    if (linkElement) linkElement.href = `https://www.roblox.com/roavatar?avatarHistory=${Number(userId)}`

    const outfitListCards = outfitListContainer.querySelector(".css-1i465w8-carousel")

    for (let i = 0; i < Math.min(avatarList.data.length, 5); i++) {
        const avatar = avatarList.data[i]
        const timestamp = new Date(avatar.timestamp)
        const timeStr = timeAgo.format(timestamp)

        const itemCard = createElementFromHTML(`
            <div id="collection-carousel-item" class="css-ysmxkl-carouselItem">
                <div>
                    <div class="base-tile"><a class="flex flex-col" href=""
                            title="First discovered ...">
                            <div class="base-tile-thumbnail-wrapper" style="max-width: 200px; max-height: 200px; aspect-ratio: 1;"><span
                                    class="thumbnail-2d-container base-tile-thumbnail radius-medium"><img class=""
                                        src=""
                                        alt=""></span></div>
                            <div class="base-tile-title content-emphasis text-title-medium padding-top-medium">
                                </div>
                            <div class="base-tile-metadata content-default text-body-medium padding-top-xsmall">
                            </div>
                        </a></div>
                </div>
            </div>
        `)

        const imgElement = itemCard.querySelector("img")
        if (imgElement) imgElement.src = chrome.runtime.getURL("assets/broken-avatar-200px.png")

        const linkElement = itemCard.querySelector("a") as HTMLAnchorElement | undefined
        if (linkElement) {
            linkElement.title = `First discovered ${timeStr}`
            linkElement.href = `https://www.roblox.com/roavatar?api=${avatar.id}&userId=${userId}`
        }
        const baseTileTitleElement = itemCard.querySelector(".base-tile-title") as HTMLElement | undefined
        if (baseTileTitleElement) baseTileTitleElement.innerText = timeStr

        ROAVATAR_API.avatars.getAvatar(avatar.id).then((outfit) => {
            if (outfit instanceof Response) return

            const imgElement = itemCard.querySelector("img")
            if (imgElement) {
                const outfitModel = new OutfitModel()
                outfitModel.outfit = outfit
                
                const renderInterval = setInterval(() => {
                    if (window.scrollY > 200) {
                        clearInterval(renderInterval)
                        generateOutfitThumbnail(new Authentication(), outfitModel, [200,200], "png", 1, false, false, undefined, "avatarFullbody").then((result) => {
                            if (typeof result === "string" && imgElement) {
                                imgElement.src = result
                            }
                        })
                    }
                }, 500)
            }
        })

        if (outfitListCards) outfitListCards.appendChild(itemCard)
    }

    const profileCommunities = profileTabContent.querySelector(".profile-communities")

    if (profileCommunities) {
        profileTabContent.insertBefore(outfitListContainer, profileCommunities)
    } else {
        profileTabContent.appendChild(outfitListContainer)
    }
}

export function initAvatarHistory() {
    onURLChangeAvatarHistory()
}

export async function onURLChangeAvatarHistory() {
    const settingValue = await getSetting("s-avatar-history", true)
    if (!settingValue) return

    const url = window.location.href;
    if (!url.includes("/users/") || !url.includes("/profile")) return

    const userId = getIdFromUrl(url)
    if (userId) {
        ROAVATAR_API.users.getAvatarHistory(userId).then((result) => {
            if (result instanceof Response) return
            if (result.data.length <= 0) return

            setTimeout(() => {
                if (getIdFromUrl(window.location.href) !== userId) return true
                const profileTabContent = document.querySelector(".profile-tab-content")
                if (profileTabContent) {
                    createOutfitList(profileTabContent, result, userId)
                }

                observeElement("div", (potentialProfileElement) => {
                    if (getIdFromUrl(window.location.href) !== userId) return true

                    const validClasses = ["profile-currently-wearing", "profile-store", "profile-favorite-experiences", "react-friends-carousel-container", "profile-communities"]
                    let containsClass = false
                    for (const validClass of validClasses) {
                        if (potentialProfileElement.classList.contains(validClass)) {
                            containsClass = true
                            break
                        }
                    }

                    if (!containsClass) return false

                    const profileTabContent = document.querySelector(".profile-tab-content")

                    if (containsClass && profileTabContent && potentialProfileElement.id !== "roavatar-avatar-history") {
                        createOutfitList(profileTabContent, result, userId)
                    }
                })
            }, 2000)
        })
    }
}
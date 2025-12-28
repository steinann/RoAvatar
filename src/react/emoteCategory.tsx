import { useCallback, useContext, useEffect, useState } from "react"
import { API, type Authentication } from "../code/api"
import { ItemInfo } from "../code/avatar/asset"
import type { Outfit } from "../code/avatar/outfit"
import ItemCategory from "./itemCategory"
import BarCategory from "./barCategory"
import { AuthContext } from "./context/auth-context"
import React from "react"
import ItemCard from "./itemCard"

//Box that represents slot in emote wheel
function EmoteBox({ setAnimName, setCurrentSlot, currentSlot, slot, auth, itemInfo }: {setAnimName: (a: string) => void, setCurrentSlot: (a: number) => void, currentSlot: number, slot: number, auth?: Authentication, itemInfo?: ItemInfo}): React.JSX.Element {
    const [imageUrl, setImageUrl] = useState<string | undefined>("loading")

    //when emote inside changes, remove image
    useEffect(() => {
        setImageUrl("loading")
    }, [itemInfo])

    //load image
    useEffect(() => {
        if (auth && itemInfo) {
            if (imageUrl === "loading") {
                API.Thumbnails.GetThumbnail(auth, itemInfo.itemType, itemInfo.id, "150x150").then((result) => {
                    setImageUrl(result)
                })
            }
        } else if (imageUrl !== "loading") {
            setImageUrl("loading")
        }
    }, [auth, imageUrl, itemInfo])

    let cardImage: React.JSX.Element | null = imageUrl !== "loading" ? (<img src={imageUrl}></img>) : (<div className="item-loading"></div>)
    if (!itemInfo) {
        //cardImage = null
        cardImage = <span className="emote-box-empty roboto-600">{slot}</span>
    }

    return <button title={itemInfo ? itemInfo.name : "No emote equipped"} className={`emote-box${currentSlot === slot ? " emote-equipped" : ""}`} onClick={() => {
            setCurrentSlot(slot)
            if (itemInfo) {
                setAnimName(`emote.${itemInfo.id}`)
            } else {
                setAnimName("idle.Animation1")
            }
        }}>
        {cardImage}
    </button>
}

type EmoteInfo = {
    assetId: number,
    assetName: string,
    position: number
}

export default function EmoteCategory({categoryType, setOutfit, setAnimName, setAlertText, setAlertEnabled}: {categoryType: string, setOutfit: (a: Outfit) => void, setAnimName: (a: string) => void, setAlertText?: (a: string) => void, setAlertEnabled?: (a: boolean) => void}): React.JSX.Element {
    const auth = useContext(AuthContext)
    
    const [currentSlot, setCurrentSlot] = useState(1)
    const [equippedEmotes, setEquippedEmotes] = useState<EmoteInfo[] | undefined>(undefined)

    //load equipped emotes
    useEffect(() => {
        if (!equippedEmotes && auth) {
            API.Avatar.GetEmotes(auth).then((result) => {
                if (result.status === 200) {
                    result.json().then((body: EmoteInfo[]) => {
                        setEquippedEmotes(body)

                        for (const emoteInfo of body) {
                            if (emoteInfo.position === 1) {
                                setAnimName(`emote.${emoteInfo.assetId}`)
                            }
                        }
                    })
                }
            })
        }
    })

    //list of emote asset ids
    const wornEmotes = []

    //get emote itemInfos and push to wornEmotes
    const itemInfos = new Array(8).fill(undefined)
    if (equippedEmotes) {
        for (const emoteInfo of equippedEmotes) {
            const itemInfo = new ItemInfo("Asset", "EmoteAnimation", emoteInfo.assetId, emoteInfo.assetName)
            itemInfos[emoteInfo.position - 1] = itemInfo
            if (emoteInfo.position ===  currentSlot) {
                wornEmotes.push(emoteInfo.assetId)
            }
        }
    }

    //unequip emote function
    const unequipEmote = useCallback(() => {
        if (!auth) return
        setAnimName(`idle.Animation1`)

        if (!equippedEmotes) return

        const newEquippedEmottes = []

        for (const emoteInfo of equippedEmotes) {
            if (emoteInfo.position !== currentSlot) {
                newEquippedEmottes.push({
                    assetId: emoteInfo.assetId,
                    assetName: emoteInfo.assetName,
                    position: emoteInfo.position,
                })
            }
        }

        setEquippedEmotes(newEquippedEmottes)

        API.Avatar.UnequipEmote(auth, currentSlot)
    }, [auth, currentSlot, equippedEmotes, setAnimName])

    let contents = null
    contents = (<>
    <BarCategory className={"emote-bar align-center"}>
        <EmoteBox setAnimName={setAnimName} setCurrentSlot={setCurrentSlot} currentSlot={currentSlot} auth={auth} slot={1} itemInfo={itemInfos[0]}/>
        <EmoteBox setAnimName={setAnimName} setCurrentSlot={setCurrentSlot} currentSlot={currentSlot} auth={auth} slot={2} itemInfo={itemInfos[1]}/>
        <EmoteBox setAnimName={setAnimName} setCurrentSlot={setCurrentSlot} currentSlot={currentSlot} auth={auth} slot={3} itemInfo={itemInfos[2]}/>
        <EmoteBox setAnimName={setAnimName} setCurrentSlot={setCurrentSlot} currentSlot={currentSlot} auth={auth} slot={4} itemInfo={itemInfos[3]}/>
        <EmoteBox setAnimName={setAnimName} setCurrentSlot={setCurrentSlot} currentSlot={currentSlot} auth={auth} slot={5} itemInfo={itemInfos[4]}/>
        <EmoteBox setAnimName={setAnimName} setCurrentSlot={setCurrentSlot} currentSlot={currentSlot} auth={auth} slot={6} itemInfo={itemInfos[5]}/>
        <EmoteBox setAnimName={setAnimName} setCurrentSlot={setCurrentSlot} currentSlot={currentSlot} auth={auth} slot={7} itemInfo={itemInfos[6]}/>
        <EmoteBox setAnimName={setAnimName} setCurrentSlot={setCurrentSlot} currentSlot={currentSlot} auth={auth} slot={8} itemInfo={itemInfos[7]}/>
    </BarCategory>
    <ItemCategory categoryType={categoryType} subCategoryType={"_Emotes"} setAlertText={setAlertText} setAlertEnabled={setAlertEnabled} setOutfit={setOutfit} setAnimName={setAnimName} wornItems={wornEmotes} onClickItem={(auth: Authentication, item: ItemInfo) => {
        if (!equippedEmotes) return

        let isEmoteEquipped = false

        for (const emoteInfo of equippedEmotes) {
            if (emoteInfo.assetId === item.id && emoteInfo.position === currentSlot) {
                isEmoteEquipped = true
                break
            }
        }

        if (!isEmoteEquipped) {
            //equip emote
            setAnimName(`emote.${item.id}`)
            const newEquippedEmotes = []

            for (const emoteInfo of equippedEmotes) {
                if (emoteInfo.position !== currentSlot) {
                    newEquippedEmotes.push({
                        assetId: emoteInfo.assetId,
                        assetName: emoteInfo.assetName,
                        position: emoteInfo.position,
                    })
                }
            }

            newEquippedEmotes.push({
                assetId: item.id,
                assetName: item.name,
                position: currentSlot,
            })

            setEquippedEmotes(newEquippedEmotes)

            API.Avatar.EquipEmote(auth, item.id, currentSlot)
        } else {
            unequipEmote()
        }
    }}>
        <ItemCard setAlertText={setAlertText} setAlertEnabled={setAlertEnabled} forceImage="../assets/newremove.png" imageAffectedByTheme={true} auth={auth} itemInfo={new ItemInfo("None", "", -1, "Unequip")} onClick={() => {
            //unequip emote
            unequipEmote()
        }}/>
    </ItemCategory>
    </>)

    return <>
        {contents}
    </>
}
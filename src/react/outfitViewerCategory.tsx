import { useContext, useRef, useState } from "react";
import UserSearch from "./generic/userSearch";
import { API, generateOutfitThumbnail, ItemInfo, Outfit } from "roavatar-renderer";
import ItemCard from "./itemCard";
import { AuthContext } from "./context/auth-context";
import NothingLoaded from "./nothingLoaded";
import { defaultOnClick } from "./categoryShared";
import { OutfitFuncContext } from "./context/outfit-context";
import { ROAVATAR_API, type AvatarListElementV1 } from "./generic/roavatar-api";
import SelectInput from "./generic/selectInput";
import 'javascript-time-ago/locale/en';
import TimeAgo from "javascript-time-ago";

let lastLoadId = 0

interface OutfitInfo {
    id: number,
    isAvatar: boolean,
    name: string,
}

const timeAgo = new TimeAgo('en')

export default function OutfitViewerCategory(): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfitFuncContext = useContext(OutfitFuncContext)

    const [userId, _setUserId] = useState<number | undefined>(undefined)
    const [outfits, setOutfits] = useState<OutfitInfo[]>([])
    const [avatarHistory, setAvatarHistory] = useState<AvatarListElementV1[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [failedToLoad, setFailedToLoad] = useState<boolean>(false)
    const [selectedType, setSelectedType] = useState<string>("Outfits")
    const [, forceUpdate] = useState(0);

    const avatarDataMap = useRef<Map<string,Outfit>>(new Map())
    const avatarImageMap = useRef<Map<string,string>>(new Map())

    function loadOutfits(userId: number) {
        lastLoadId += 1
        const currentLoadId = lastLoadId
        
        setIsLoading(true)
        setFailedToLoad(false)

        API.Avatar.GetUserOutfits(userId).then((result) => {
            if (currentLoadId !== lastLoadId) return

            if (result instanceof Response) {
                setFailedToLoad(true)
            } else {
                setFailedToLoad(false)
                const outfitInfos: OutfitInfo[] = []
                outfitInfos.push({
                    id: userId,
                    isAvatar: true,
                    name: "Current Avatar",
                })

                for (const outfit of result.data) {
                    outfitInfos.push({
                        id: outfit.id,
                        isAvatar: false,
                        name: outfit.name,
                    })
                }
                setOutfits(outfitInfos)
            }
            setIsLoading(false)
        })
    }

    function loadAvatarHistory(userId: number) {
        if (!auth) return

        lastLoadId += 1
        const currentLoadId = lastLoadId
        
        setIsLoading(true)
        setFailedToLoad(false)

        ROAVATAR_API.users.getAvatarHistory(userId, 25).then((result) => {
            if (currentLoadId !== lastLoadId) return

            if (result instanceof Response) {
                setFailedToLoad(true)
            } else {
                setFailedToLoad(false)
                const avatarInfos: AvatarListElementV1[] = []

                for (const avatar of result.data) {
                    avatarInfos.push(avatar)

                    if (!avatarDataMap.current.has(avatar.id)) {
                        ROAVATAR_API.avatars.getAvatar(avatar.id).then((outfit) => {
                            if (outfit instanceof Outfit) {
                                avatarDataMap.current.set(avatar.id, outfit)

                                if (!avatarImageMap.current.has(avatar.id)) {
                                    generateOutfitThumbnail(auth, outfit, [150,150], "png", undefined, undefined, undefined, undefined, "avatarFullbody").then((result) => {
                                        if (result) {
                                            avatarImageMap.current.set(avatar.id, result as string)
                                            forceUpdate(forceUpdate => forceUpdate + 1)
                                        } else {
                                            avatarImageMap.current.set(avatar.id, "../assets/broken-avatar-200px.png")
                                            forceUpdate(forceUpdate => forceUpdate + 1)
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
                setAvatarHistory(avatarInfos)
            }
            setIsLoading(false)
        })
    }

    function setUserId(userId: number) {
        _setUserId(userId)
        if (selectedType === "Outfits") loadOutfits(userId)
        if (selectedType === "Avatar History") loadAvatarHistory(userId)
    }

    return <div className="container">
        <div>
            <SelectInput value={selectedType} alternatives={["Outfits", "Avatar History"]} setValue={(newValue: string) => {
                if (userId) {
                    if (newValue === "Outfits") loadOutfits(userId)
                    if (newValue === "Avatar History") loadAvatarHistory(userId)
                }
                setSelectedType(newValue)
            }}/>
            <UserSearch userId={userId} setUserId={setUserId}/>
        </div>
        <div className="item-container dark-scrollbar">
            {failedToLoad ? 
            <NothingLoaded loadedAll={true} itemCount={0} forceText="An error occured"/>
            : <>
                {isLoading ? 
                new Array(25).fill(0).map(() => {return <ItemCard/>})
                : <>
                {selectedType === "Outfits" ? outfits.map((userOutfit) => {
                    const itemInfo = new ItemInfo(userOutfit.isAvatar ? "Avatar" : "Outfit", "Outfit", userOutfit.id, userOutfit.name)
                    itemInfo.creatorId = userId

                    return <ItemCard
                    auth={auth}
                    itemInfo={itemInfo}
                    onClick={(itemInfo) => {defaultOnClick(itemInfo, outfitFuncContext.outfitModel, outfitFuncContext.setOutfitModel, outfitFuncContext.setAnimName, outfitFuncContext.animName)}}
                    />
                }) :
                avatarHistory.map((avatar) => {
                    const timestamp = new Date(avatar.timestamp)
                    const timeStr = timeAgo.format(timestamp)

                    const itemInfo = new ItemInfo("None", "RoAvatar_Avatar", avatar.id, timeStr)
                    itemInfo.creatorId = userId

                    return <ItemCard
                    auth={auth}
                    itemInfo={itemInfo}
                    onClick={() => {
                        const newOutfit = avatarDataMap.current.get(avatar.id)
                        if (newOutfit) {
                            outfitFuncContext.setOutfit(newOutfit)
                        }
                    }}
                    forceImage={avatarImageMap.current.get(avatar.id)}
                    />
                })}
                </>
                }
            </>}
        </div>
    </div>
}
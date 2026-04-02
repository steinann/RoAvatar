import { useContext, useState } from "react";
import UserSearch from "./generic/userSearch";
import { API, ItemInfo } from "roavatar-renderer";
import ItemCard from "./itemCard";
import { AuthContext } from "./context/auth-context";
import NothingLoaded from "./nothingLoaded";
import { defaultOnClick } from "./categoryShared";
import { OutfitContext, OutfitFuncContext } from "./context/outfit-context";

let lastLoadId = 0

interface OutfitInfo {
    id: number,
    isAvatar: boolean,
    name: string,
}

export default function OutfitViewerCategory(): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    const outfitFuncContext = useContext(OutfitFuncContext)

    const [userId, _setUserId] = useState<number | undefined>(undefined)
    const [outfits, setOutfits] = useState<OutfitInfo[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [failedToLoad, setFailedToLoad] = useState<boolean>(false)

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

    function setUserId(userId: number) {
        _setUserId(userId)
        loadOutfits(userId)
    }

    return <div className="container">
        <UserSearch userId={userId} setUserId={setUserId}/>
        <div className="item-container dark-scrollbar">
            {failedToLoad ? 
            <NothingLoaded loadedAll={true} itemCount={0} forceText="An error occured"/>
            : <>
                {isLoading ? 
                new Array(20).fill(0).map(() => {return <ItemCard/>})
                :
                outfits.map((userOutfit) => {
                    const itemInfo = new ItemInfo(userOutfit.isAvatar ? "Avatar" : "Outfit", "Outfit", userOutfit.id, userOutfit.name)
                    itemInfo.creatorId = userId

                    return <ItemCard
                    auth={auth}
                    itemInfo={itemInfo}
                    onClick={(itemInfo) => {defaultOnClick(itemInfo, outfit, outfitFuncContext.setAnimName, outfitFuncContext.setOutfit, outfitFuncContext.animName)}}
                    />
                })
                }
            </>}
        </div>
    </div>
}
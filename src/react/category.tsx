import { useContext, useEffect, useState } from "react"
import { AuthContext } from "./context/auth-context"
import { OutfitContext } from "./context/outfit-context"
import { Outfit } from "../code/avatar/outfit"

function useItems(category: string) {
    const [items, setItems] = useState<unknown[]>([])

    useEffect(() => {
        fetch("https://avatar.roblox.com/v1/avatar-inventory?sortOption=recentAdded&pageLimit=50")
        .then(res => res.json())
        .then(body => setItems([...items, ...body.avatarInventoryItems]))
    }, [category])

    return {items}
}

type AvatarInventoryItem = {
    itemName: string,
    itemId: number,
}

export default function Category({categoryType, setOutfit}: {categoryType: string, setOutfit: (a: Outfit) => void}): React.JSX.Element {
    console.log(categoryType)
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    const {items} = useItems(categoryType)

    return <div className="item-container">
        {
            items.map((item) => (
                <button className="item" onClick={() => {if (!auth) return; const newOutfit = new Outfit(); newOutfit.fromJson(outfit.toJson()); newOutfit.addAsset(auth, (item as AvatarInventoryItem).itemId).then(() => {setOutfit(newOutfit)})}}>
                    <div className="item-image">
                        <img src="https://tr.rbxcdn.com/180DAY-25e61e639f20fe4a2f2a9bab05a8bb7a/150/150/Pants/Webp/noFilter"></img>
                    </div>
                    <span className="item-name">{(item as AvatarInventoryItem).itemName}</span>
                </button>
            ))
        }
    </div>
}
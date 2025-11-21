import { useEffect, useState } from "react";
import type { ItemInfo } from "../code/avatar/asset";
import { API, Authentication } from "../code/api";

export default function ItemCard({ auth, itemInfo, isWorn = false, onClick }: {auth?: Authentication, itemInfo?: ItemInfo, isWorn?: boolean, onClick?: (itemInfo: ItemInfo) => void}): React.JSX.Element {
    const [imageUrl, setImageUrl] = useState<string | undefined>("loading")

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

    const cardImage = imageUrl !== "loading" ? (<img className={isWorn ? "darken-item" : ""} src={imageUrl}></img>) : (<div className="item-loading"></div>)

    if (auth && itemInfo) {
        
        return (<a className="item" title={itemInfo.name} href={itemInfo.itemType === "Asset" ? `https://www.roblox.com/catalog/${itemInfo.id}` : undefined}>
            <button className={`item-image`} onClick={(e) => {e.preventDefault(); if (onClick) onClick(itemInfo)}}>
                {<span className="material-symbols-outlined worn-item-check" style={{opacity: isWorn ? 1 : 0}}>check_box</span>}
                {cardImage}
            </button>
            <span className="item-name roboto-600">{itemInfo.name}</span>
        </a>)
    } else {
        const nameStyle = {
            width: "6rem",
            height: "1rem",
            marginTop: "0.5rem",
        }

        return (<div className="item">
            <button className="item-image">
                {cardImage}
            </button>
            <div className="item-name loading-gradient" style={nameStyle}></div>
        </div>)
    }
}
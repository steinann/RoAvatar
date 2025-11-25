import { useEffect, useRef, useState } from "react";
import type { ItemInfo } from "../code/avatar/asset";
import { API, Authentication } from "../code/api";
import { browserOpenURL } from "../code/browser";
import RadialButton from "./radialButton";

export default function ItemCard({ auth, itemInfo, isWorn = false, onClick, className, includeName = true}: {auth?: Authentication, itemInfo?: ItemInfo, isWorn?: boolean, onClick?: (itemInfo: ItemInfo) => void, className?: string, includeName?: boolean}): React.JSX.Element {
    const [imageUrl, setImageUrl] = useState<string | undefined>("loading")

    const nameRef = useRef(null)

    useEffect(() => {
        if (auth && itemInfo) {
            if (imageUrl === "loading") {
                API.Thumbnails.GetThumbnail(auth, itemInfo.itemType, itemInfo.id, "150x150").then((result) => {
                    if (!result) {
                        if (itemInfo.itemType === "Asset") {
                            setImageUrl("../assets/error.svg")
                        } else if (itemInfo.itemType === "Bundle") {
                            setImageUrl("../assets/broken-avatar-200px.png")
                        }
                    } else {
                        setImageUrl(result)
                    }
                })
            }
        } else if (imageUrl !== "loading") {
            setImageUrl("loading")
        }
    }, [auth, imageUrl, itemInfo])

    const cardImage = imageUrl !== "loading" ? (<img className={isWorn ? "darken-item" : ""} src={imageUrl}></img>) : (<div className="item-loading"></div>)

    if (auth && itemInfo) {
        
        return (<a className={"item" + className ? "item " + className : ""} title={itemInfo.name} href={itemInfo.itemType === "Asset" ? `https://www.roblox.com/catalog/${itemInfo.id}` : undefined} onClick={(e) => {
            if (itemInfo.itemType === "Asset" && e.target === nameRef.current) {
                e.preventDefault()
                browserOpenURL(`https://www.roblox.com/catalog/${itemInfo.id}`)
            }
        }}>
            <RadialButton className={`item-image`} onClick={(e) => {e.preventDefault(); if (onClick) onClick(itemInfo)}}>
                {<span className="material-symbols-outlined worn-item-check" style={{opacity: isWorn ? 1 : 0}}>check_box</span>}
                {cardImage}
            </RadialButton>
            {includeName ? <span ref={nameRef} className="item-name roboto-600">{itemInfo.name}</span> : null}
        </a>)
    } else {
        const nameStyle = {
            width: "6rem",
            height: "1rem",
            marginTop: "0.5rem",
        }

        return (<div className={"item" + className ? "item " + className : ""}>
            <RadialButton className="item-image">
                {cardImage}
            </RadialButton>
            {includeName ? <div ref={nameRef} className="item-name loading-gradient" style={nameStyle}></div> : null}
        </div>)
    }
}
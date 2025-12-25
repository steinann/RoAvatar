import { useEffect, useRef, useState } from "react";
import type { ItemInfo } from "../code/avatar/asset";
import { API, Authentication } from "../code/api";
import { browserOpenURL } from "../code/browser";
import RadialButton from "./generic/radialButton";

export default function ItemCard({ auth, itemInfo, isWorn = false, onClick, className, buttonClassName, includeName = true, forceImage = undefined, imageAffectedByTheme = false, showOrderArrows = false, onArrowClick}: {auth?: Authentication, itemInfo?: ItemInfo, isWorn?: boolean, onClick?: (itemInfo: ItemInfo) => void, className?: string, buttonClassName?: string, includeName?: boolean, forceImage?: string, imageAffectedByTheme?: boolean, showOrderArrows?: boolean, onArrowClick?: (itemInfo: ItemInfo, isUp: boolean) => void}): React.JSX.Element {
    const [imageUrl, setImageUrl] = useState<string | undefined>("loading")

    const nameRef = useRef(null)

    //Pre load item
    /*useEffect(() => {
        if (itemInfo && itemInfo.itemType === "Asset") {
            let headers = undefined
            if (itemInfo.type.includes("Accessory") || itemInfo.type.includes("Hat")) {
                headers = {"Roblox-AssetFormat":"avatar_meshpart_accessory"}
            }
            API.Asset.GetRBX("rbxassetid://" + itemInfo.id, headers, auth).then(result => {
                if (result instanceof RBX) {
                    const tree = result.generateTree()
                    for (const child of tree.GetChildren()) {
                        if (child.HasProperty("MeshId")) {
                            const meshId = child.Prop("MeshId") as string
                            if (meshId.length > 0) {
                                API.Asset.GetMesh(meshId, undefined, auth)
                            }
                        }
                        const texturePropNames = ["TextureID", "TextureId", "Texture", "OverlayTextureId", "BaseTextureId", "ColorMap", "NormalMap", "RoughnessMap", "MetalnessMap"]
                        for (const texturePropName of texturePropNames) {
                            if (child.HasProperty(texturePropName)) {
                                const textureId = child.Prop(texturePropName)
                                if (typeof textureId === "string" && textureId.length > 0) {
                                    API.Generic.LoadImage(textureId)
                                }
                            }
                        }
                    }
                }
            })
        }
    }, [auth,itemInfo])*/

    useEffect(() => {
        if (forceImage && imageUrl !== forceImage) {
            setImageUrl(forceImage)
            return
        }

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
    }, [auth, forceImage, imageUrl, itemInfo])

    const cardImage = imageUrl !== "loading" ? (<img style={imageAffectedByTheme ? {filter:"var(--icon-filter)"} : {}} className={isWorn ? "darken-item" : ""} src={imageUrl}></img>) : (<div className="item-loading"></div>)

    const actualClassName = `item${className ? ` ${className}` : ""}`
    const actualButtonClassName = `item-image${buttonClassName ? ` ${buttonClassName}` : ""}`

    if (auth && itemInfo) {
        
        return (<a className={actualClassName} title={itemInfo.name} href={itemInfo.itemType === "Asset" ? `https://www.roblox.com/catalog/${itemInfo.id}` : undefined} onClick={(e) => {
            e.preventDefault()
            if (itemInfo.itemType === "Asset" && e.target === nameRef.current) {
                browserOpenURL(`https://www.roblox.com/catalog/${itemInfo.id}`)
            }
        }}>
            <RadialButton className={actualButtonClassName} onClick={(e) => {e.preventDefault(); if (onClick) onClick(itemInfo)}}>
                {<span className="material-symbols-outlined worn-item-check" style={{opacity: isWorn ? 1 : 0}}>check_box</span>}
                {showOrderArrows ? <div className="order-arrows">
                    <button className="arrow-up" onClick={() => {if (onArrowClick) {onArrowClick(itemInfo, true)}}}><span className="material-symbols-outlined">arrow_upward</span></button>
                    <button className="arrow-down" onClick={() => {if (onArrowClick) {onArrowClick(itemInfo, false)}}}><span className="material-symbols-outlined">arrow_downward</span></button>
                </div> : null}
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

        return (<div className={actualClassName}>
            <RadialButton className={actualButtonClassName}>
                {cardImage}
            </RadialButton>
            {includeName ? <div ref={nameRef} className="item-name loading-gradient" style={nameStyle}></div> : null}
        </div>)
    }
}
import { useContext, useEffect, useRef, useState } from "react";
import type { ItemInfo } from "../code/avatar/asset";
import { API, Authentication } from "../code/api";
import { browserOpenURL } from "../code/browser";
import RadialButton from "./generic/radialButton";
import { OutfitContext } from "./context/outfit-context";

export default function ItemCard({ auth, itemInfo, isWorn = false, onClick, className, buttonClassName, includeName = true, forceImage = undefined, imageAffectedByTheme = false, showOrderArrows = false, onArrowClick, canEditOutfit = false, refresh, setAlertText, setAlertEnabled, showViewButton = false}: 
    {
        auth?: Authentication,
        itemInfo?: ItemInfo,
        isWorn?: boolean,
        onClick?: (itemInfo: ItemInfo) => void,
        className?: string,
        buttonClassName?: string,
        includeName?: boolean,
        forceImage?: string,
        imageAffectedByTheme?: boolean,
        showOrderArrows?: boolean,
        onArrowClick?: (itemInfo: ItemInfo, isUp: boolean) => void,
        canEditOutfit?: boolean, 
        refresh?: () => void,
        setAlertText?: (a: string) => void,
        setAlertEnabled?: (a: boolean) => void,
        showViewButton?: boolean
    }): React.JSX.Element {
    const outfit = useContext(OutfitContext)
    
    const [imageUrl, setImageUrl] = useState<string | undefined>("loading")

    const [mouseOver, setMouseOver] = useState(false)

    const [editOpen, setEditOpen] = useState(false)
    const [updateOpen, setUpdateOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [renameOpen, setRenameOpen] = useState(false)

    const nameRef = useRef(null)
    const editRef = useRef<HTMLButtonElement>(null)
    const updateDialogRef = useRef<HTMLDialogElement>(null)
    const deleteDialogRef = useRef<HTMLDialogElement>(null)
    const renameDialogRef = useRef<HTMLDialogElement>(null)
    const outfitNameInputRef: React.RefObject<HTMLInputElement | null> = useRef(null)

    //update open state of outfit dialogs
    useEffect(() => {
        if (updateOpen) {
            updateDialogRef.current?.showModal()
        } else {
            updateDialogRef.current?.close()
        }
        if (deleteOpen) {
            deleteDialogRef.current?.showModal()
        } else {
            deleteDialogRef.current?.close()
        }
        if (renameOpen) {
            renameDialogRef.current?.showModal()
        } else {
            renameDialogRef.current?.close()
        }
    }, [updateOpen, deleteOpen, renameOpen])

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

    //load item image
    useEffect(() => {
        if (forceImage && imageUrl !== forceImage) {
            setImageUrl(forceImage)
            return
        }

        if (auth && itemInfo) {
            if (imageUrl === "loading") {
                const thumbnailType = itemInfo.itemType === "Bundle" ? "BundleThumbnail" : itemInfo.itemType
                API.Thumbnails.GetThumbnail(auth, thumbnailType, itemInfo.id, "150x150").then((result) => {
                    if (!result) {
                        if (itemInfo.itemType === "Bundle" || itemInfo.itemType === "Outfit") {
                            setImageUrl("../assets/broken-avatar-200px.png")
                        } else {
                            setImageUrl("../assets/error.svg")
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

    if (auth && itemInfo) { //loaded item
        //get url
        let url = undefined
        if (itemInfo.itemType === "Asset") {
            url = `https://www.roblox.com/catalog/${itemInfo.id}`
        } else if (itemInfo.itemType === "Bundle")  {
            url = `https://www.roblox.com/bundles/${itemInfo.id}`
        }

        return (<>
        {/*Update outfit dialot*/
        canEditOutfit ? <dialog style={updateOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={updateDialogRef} onCancel={() => {setUpdateOpen(false)}}>
            <span className="dialog-title roboto-700">Update Character</span>
            <div className="dialog-actions">
                <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                    setUpdateOpen(false)
                }}>Cancel</RadialButton>
                <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                    setUpdateOpen(false)

                    const newOutfit = outfit.clone()
                    newOutfit.name = itemInfo.name

                    API.Avatar.UpdateOutfit(auth, itemInfo.id, newOutfit).then((result) => {
                        API.Thumbnails.UncacheThumbnail(itemInfo.itemType, itemInfo.id, "150x150")
                        if (result.status === 200 && refresh) {
                            refresh()
                        } else if (setAlertText && setAlertEnabled) {
                            setAlertText("Failed to update character")
                            setAlertEnabled(true)
                            setTimeout(() => {
                                setAlertEnabled(false)
                            }, 3000)
                        }
                    })
                }}>Update</RadialButton>
            </div>
        </dialog> : null}
        {/*Delete outfit dialog*/
        canEditOutfit ? <dialog style={deleteOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={deleteDialogRef} onCancel={() => {setDeleteOpen(false)}}>
            <span className="dialog-title roboto-700">Delete Character</span>
            <div className="dialog-actions">
                <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                    setDeleteOpen(false)
                }}>Cancel</RadialButton>
                <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                    setDeleteOpen(false)

                    API.Avatar.DeleteOutfit(auth, itemInfo.id).then((result) => {
                        API.Thumbnails.UncacheThumbnail(itemInfo.itemType, itemInfo.id, "150x150")
                        if (result.status === 200 && refresh) {
                            refresh()
                        } else if (setAlertText && setAlertEnabled) {
                            setAlertText("Failed to delete character")
                            setAlertEnabled(true)
                            setTimeout(() => {
                                setAlertEnabled(false)
                            }, 3000)
                        }
                    })
                }}>Delete</RadialButton>
            </div>
        </dialog> : null}
        {//Rename outfit dialog
        canEditOutfit ? <dialog style={renameOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={renameDialogRef} onCancel={() => {setRenameOpen(false)}}>
            <span className="dialog-title roboto-700">Rename Character</span>
            <input ref={outfitNameInputRef} className="dialog-text-input roboto-300" placeholder="Name"></input>
            <div className="dialog-actions">
                <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                    setRenameOpen(false)
                }}>Cancel</RadialButton>
                <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                    setRenameOpen(false)

                    const nameValue = outfitNameInputRef.current?.value || ""

                    let toUseName = "Untitled Avatar"
                    if (nameValue.length > 0) {
                        toUseName = nameValue
                    }

                    API.Avatar.PatchOutfit(auth, itemInfo.id, {name: toUseName}).then((result) => {
                        if (result.status === 200 && refresh) {
                            refresh()
                        } else if (setAlertText && setAlertEnabled) {
                            setAlertText("Failed to rename character")
                            setAlertEnabled(true)
                            setTimeout(() => {
                                setAlertEnabled(false)
                            }, 3000)
                        }
                    })
                }}>Rename</RadialButton>
            </div>
        </dialog> : null}
        
        {/*Actual item element*/}
        <a className={actualClassName} title={itemInfo.name} href={url} onClick={(e) => {
            e.preventDefault()
            if (url && e.target === nameRef.current) {
                browserOpenURL(url)
            }
        }}>
            <RadialButton effectDisabled={editOpen} className={actualButtonClassName} onMouseEnter={() => {setMouseOver(true)}} onMouseLeave={() => {setMouseOver(false)}} onClick={(e) => {
                    //on item clicked
                    e.preventDefault();
                    if ((e.target as HTMLButtonElement).classList.contains("item-view")) return;
                    if (editRef.current && editRef.current.contains(e.target as Node) || editOpen) return;
                    if (onClick) onClick(itemInfo)
                }}>
                {/*Worn item icon*/}
                {<span className="material-symbols-outlined worn-item-check" style={{opacity: isWorn ? 1 : 0}}>check_box</span>}
                {/*Orders for layered clothing ordering*/}
                {showOrderArrows ? <div className="order-arrows">
                    <button className="arrow-up" onClick={() => {if (onArrowClick) {onArrowClick(itemInfo, true)}}}><span className="material-symbols-outlined">arrow_upward</span></button>
                    <button className="arrow-down" onClick={() => {if (onArrowClick) {onArrowClick(itemInfo, false)}}}><span className="material-symbols-outlined">arrow_downward</span></button>
                </div> : null}
                {/*Edit outfit button*/
                canEditOutfit ? <button className="edit-outfit" ref={editRef} onClick={()=>{setEditOpen(true)}}><span className="material-symbols-outlined">settings</span></button> : null}
                {/*Manage outfit buttons*/
                editOpen ? <div className="edit-outfit-menu">
                    <button className="roboto-600" onClick={()=>{setUpdateOpen(true)}}>Update</button>
                    <button className="roboto-600" onClick={()=>{setRenameOpen(true)}}>Rename</button>
                    <button className="roboto-600" onClick={()=>{setDeleteOpen(true)}}>Delete</button>
                    <button className="roboto-600" onClick={()=>{setEditOpen(false); setUpdateOpen(false); setDeleteOpen(false); setRenameOpen(false)}}>Cancel</button>
                </div> : null}
                {/*Item tags*/}
                {itemInfo.limitedType === "Limited" ? <span className="tag-limited"></span> : null}
                {itemInfo.limitedType === "LimitedUnique" ? <span className="tag-limited-unique"></span> : null}
                {/*View button*/}
                {showViewButton && mouseOver ? <button className="item-view roboto-600" onClick={() => {
                    if (url) {
                        browserOpenURL(url)
                    }
                }}>
                    View
                </button> : null}
                {/*Image*/}
                {cardImage}
            </RadialButton>
            {includeName ? <span ref={nameRef} className="item-name roboto-600">{itemInfo.name}</span> : null}
            {itemInfo.price !== undefined ? 
                <span className="item-price roboto-600">
                    {itemInfo.price > 0 ? <><span className="icon-robux-16x16"></span>{new Intl.NumberFormat('no').format(itemInfo.price)}</> : "Free"}
                </span>
            : null}
        </a>
        </>)
    } else { //loading item
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
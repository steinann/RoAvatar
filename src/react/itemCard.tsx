import { useContext, useEffect, useRef, useState } from "react";
import RadialButton from "./generic/radialButton";
import { OutfitContext } from "./context/outfit-context";
import { AlertContext } from "./context/alert-context";
import { Authentication, ItemInfo, Outfit, API, browserOpenURL, cleanString, snapToNumber } from "roavatar-renderer";
import Icon from "./generic/icon";

export default function ItemCard({ auth, itemInfo, isWorn = false, onClick, className, buttonClassName, includeName = true, forceImage = undefined, imageAffectedByTheme = false, showOrderArrows = false, onArrowClick, canEditOutfit = false, refresh, showViewButton = false, isSpecialOutfit = false, interactive = true, deleteCallback, updateCallback, renameCallback}: 
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
        showViewButton?: boolean,
        isSpecialOutfit?: boolean,
        interactive?: boolean,
        deleteCallback?: () => void,
        updateCallback?: (a: Outfit) => void,
        renameCallback?: (a: string) => void,
    }): React.JSX.Element {
    const outfit = useContext(OutfitContext)
    const alert = useContext(AlertContext)
    
    const [imageUrl, setImageUrl] = useState<string | undefined>("loading")

    const [mouseOver, setMouseOver] = useState(false)

    const [editOpen, setEditOpen] = useState(false)
    const [updateOpen, setUpdateOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [renameOpen, setRenameOpen] = useState(false)

    const [renameValue, setRenameValue] = useState(itemInfo?.name || "")

    const cardRef = useRef<HTMLAnchorElement>(null)
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

    //load item image
    useEffect(() => {
        if (forceImage && imageUrl !== forceImage) {
            setImageUrl(forceImage)
            return
        }

        if (auth && itemInfo) {
            if (imageUrl === "loading") {
                const thumbnailType = itemInfo.itemType === "Bundle" ? "BundleThumbnail" : itemInfo.itemType
                API.Thumbnails.GetThumbnail(auth, thumbnailType, itemInfo.id, "150x150", itemInfo.headShape).then((result) => {
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

    //close edit menu
    useEffect(() => {
        const mouseUpListener = (e: MouseEvent) => {
            if (!cardRef.current?.contains(e.target as HTMLElement)) {
                setEditOpen(false)
            }
        }

        document.addEventListener("mouseup", mouseUpListener)
        
        return () => {
            document.removeEventListener("mouseup", mouseUpListener)
        }
    })

    //check if bundle is worn
    if (!canEditOutfit && itemInfo && itemInfo.bundledAssets && itemInfo.bundledAssets.length > 0) {
        let isMissingAsset = false
        for (const assetId of itemInfo.bundledAssets) {
            if (!outfit.containsAsset(assetId)) {
                isMissingAsset = true
                break
            }
        }

        isWorn = isWorn || !isMissingAsset
    }

    const cardImage = imageUrl !== "loading" ? (<img style={imageAffectedByTheme ? {filter:"var(--icon-filter)"} : {}} className={isWorn ? "darken-item" : ""} src={imageUrl}></img>) : (<div className="item-loading"></div>)

    const actualClassName = `item${className ? ` ${className}` : ""}`
    const actualButtonClassName = `item-image${buttonClassName ? ` ${buttonClassName}` : ""}`

    let timeIcon = "nest_clock_farsight_analog"
    let timeText = ""
    let timeInfo = ""

    const acquisitionTime = itemInfo?.acquisitionTime
    const expirationTime = itemInfo?.expirationTime

    if (acquisitionTime && expirationTime) {
        const currentTime = new Date()
        const timeDiffAcquisition = expirationTime.getTime()/1000 - acquisitionTime.getTime()/1000
        const timeDiffNow = expirationTime.getTime()/1000 - currentTime.getTime()/1000

        const percent = snapToNumber(timeDiffNow / timeDiffAcquisition * 100, [10, 20, 40, 60, 80, 90])
        timeIcon = `clock_loader_${percent}`
    }

    if (expirationTime) {
        const currentTime = new Date()
        let timeAppend = "s"
        let timeDiff = expirationTime.getTime()/1000 - currentTime.getTime()/1000
        if (timeDiff > 60) {
            timeDiff /= 60
            timeAppend = "m"

            if (timeDiff > 60) {
                timeDiff /= 60
                timeAppend = "h"

                if (timeDiff > 24) {
                    timeDiff /= 24
                    timeAppend = "d"
                }
            }
        }
        timeDiff = Math.round(timeDiff)

        timeInfo = `Expires ${expirationTime.toLocaleString()}`
        timeText = `${timeDiff}${timeAppend}`
    }

    if (auth && itemInfo) { //loaded item
        //get url
        let url = undefined
        const cleanName = cleanString(itemInfo.name)
        if (itemInfo.itemType === "Asset") {
            url = `https://www.roblox.com/catalog/${itemInfo.id}/${cleanName}`
        } else if (itemInfo.itemType === "Bundle")  {
            url = `https://www.roblox.com/bundles/${itemInfo.id}/${cleanName}`
        } else if (itemInfo.itemType === "Look") {
            url = `https://www.roblox.com/looks/${itemInfo.id}/${cleanName}`
        }

        return (<>
        {/*Update outfit dialot*/
        canEditOutfit && (!isSpecialOutfit || updateCallback) ? <dialog style={updateOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={updateDialogRef} onCancel={() => {setUpdateOpen(false)}}>
            <span className="dialog-title roboto-700">Update Character</span>
            <div className="dialog-line"></div>
            <span className="dialog-text roboto-400">This will permanently overwrite your saved character with your current appearance</span>
            <div className="dialog-line"></div>
            <div className="dialog-actions">
                <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                    setUpdateOpen(false)
                }}>Cancel</RadialButton>
                <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                    setUpdateOpen(false)

                    const newOutfit = outfit.clone()
                    newOutfit.name = itemInfo.name

                    if (!isSpecialOutfit) {
                        API.Avatar.UpdateOutfit(auth, itemInfo.id, newOutfit).then((result) => {
                            API.Thumbnails.UncacheThumbnail(itemInfo.itemType, itemInfo.id, "150x150")
                            if (result.status === 200 && refresh) {
                                refresh()
                            } else if (alert) {
                                alert("Failed to update character", 3000, false)
                            }
                        })
                    } else if (updateCallback) {
                        updateCallback(outfit)
                    }
                }}>Update</RadialButton>
            </div>
        </dialog> : null}
        {/*Delete outfit dialog*/
        canEditOutfit && (!isSpecialOutfit || deleteCallback) ? <dialog style={deleteOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={deleteDialogRef} onCancel={() => {setDeleteOpen(false)}}>
            <span className="dialog-title roboto-700">Delete Character</span>
            <div className="dialog-line"></div>
            <span className="dialog-text roboto-400">This will permanently delete your saved character</span>
            <div className="dialog-line"></div>
            <div className="dialog-actions">
                <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                    setDeleteOpen(false)
                }}>Cancel</RadialButton>
                <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                    setDeleteOpen(false)

                    if (!isSpecialOutfit) {
                        API.Avatar.DeleteOutfit(auth, itemInfo.id).then((result) => {
                            API.Thumbnails.UncacheThumbnail(itemInfo.itemType, itemInfo.id, "150x150")
                            if (result.status === 200 && refresh) {
                                refresh()
                            } else if (alert) {
                                alert("Failed to delete character", 3000, false)
                            }
                        })
                    } else if (deleteCallback) {
                        deleteCallback()
                    }
                }}>Delete</RadialButton>
            </div>
        </dialog> : null}
        {//Rename outfit dialog
        canEditOutfit && (!isSpecialOutfit || renameCallback) ? <dialog style={renameOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={renameDialogRef} onCancel={() => {setRenameOpen(false)}}>
            <span className="dialog-title roboto-700">Rename Character</span>
            <div className="dialog-line"></div>
            <span className="dialog-text dialog-text-margin roboto-400">Choose a new name for your character</span>
            <input ref={outfitNameInputRef} className="dialog-text-input roboto-400" placeholder="Name" value={renameValue} onChange={() => {setRenameValue(outfitNameInputRef.current?.value || "")}}></input>
            <div className="dialog-line"></div>
            <div className="dialog-actions">
                <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                    setRenameOpen(false)
                    setRenameValue(itemInfo.name)
                }}>Cancel</RadialButton>
                <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                    setRenameOpen(false)

                    const nameValue = outfitNameInputRef.current?.value || ""

                    let toUseName = "Untitled Avatar"
                    if (nameValue.length > 0) {
                        toUseName = nameValue
                    }

                    if (!isSpecialOutfit) {
                        API.Avatar.PatchOutfit(auth, itemInfo.id, {name: toUseName}).then((result) => {
                            if (result.status === 200 && refresh) {
                                if (outfitNameInputRef.current) {
                                    outfitNameInputRef.current.value = ""
                                }

                                refresh()
                            } else if (alert) {
                                alert("Failed to rename character", 3000, false)
                            }
                        })
                    } else if (renameCallback) {
                        renameCallback(toUseName)
                    }
                }}>Rename</RadialButton>
            </div>
        </dialog> : null}
        
        {/*Actual item element*/}
        <a ref={cardRef} className={actualClassName} title={itemInfo.name} href={url} onClick={(e) => {
            e.preventDefault()
            if (url && e.target === nameRef.current) {
                browserOpenURL(url)
            }
        }}>
            <RadialButton effectDisabled={editOpen || !interactive} style={interactive ? {} : {cursor: "unset"}} className={actualButtonClassName} onMouseEnter={() => {setMouseOver(true)}} onMouseLeave={() => {setMouseOver(false)}} onClick={(e) => {
                    //on item clicked
                    e.preventDefault();
                    if ((e.target as HTMLButtonElement).classList.contains("item-view")) return;
                    if (editRef.current && editRef.current.contains(e.target as Node) || editOpen) return;
                    if (onClick) onClick(itemInfo)
                }}>
                {/*Worn item icon*/}
                {<span className="material-symbols-outlined worn-item-check" style={{opacity: isWorn ? 1 : 0}}>check_box</span>}
                {/*Expiry time icon*/}
                {expirationTime ? <div className="item-expiry-time" title={timeInfo}>
                    <Icon style={{fontSize: "16px"}}>{timeIcon}</Icon><span className="item-expiry-time-text roboto-600">{timeText}</span>
                </div> : null}
                {/*Orders for layered clothing ordering*/}
                {showOrderArrows ? <div className="order-arrows">
                    <button className="arrow-up" onClick={() => {if (onArrowClick) {onArrowClick(itemInfo, true)}}}><span className="material-symbols-outlined">arrow_upward</span></button>
                    <button className="arrow-down" onClick={() => {if (onArrowClick) {onArrowClick(itemInfo, false)}}}><span className="material-symbols-outlined">arrow_downward</span></button>
                </div> : null}
                {/*Edit outfit button*/
                canEditOutfit ? <button className="edit-outfit" ref={editRef} onClick={()=>{setEditOpen(true)}}><span className="material-symbols-outlined">settings</span></button> : null}
                {/*Manage outfit buttons*/
                editOpen ? <div className="edit-outfit-menu">
                    {!isSpecialOutfit || updateCallback ? <button className="roboto-600" onClick={()=>{setEditOpen(false); setUpdateOpen(true)}}>Update</button> : null}
                    {!isSpecialOutfit || renameCallback ? <button className="roboto-600" onClick={()=>{setEditOpen(false); setRenameOpen(true)}}>Rename</button> : null}
                    {!isSpecialOutfit || deleteCallback ? <button className="roboto-600" onClick={()=>{setEditOpen(false); setDeleteOpen(true)}}>Delete</button> : null}
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
            : (itemInfo.offsale ? <span className="item-price roboto-600">
                    Off Sale
                </span> : null)}
        </a>
        </>)
    } else { //loading item
        const nameStyle = {
            width: "6rem",
            height: "1rem",
            marginTop: "0.5rem",
        }

        return (<div className={actualClassName}>
            <RadialButton effectDisabled={true} className={actualButtonClassName}>
                {cardImage}
            </RadialButton>
            {includeName ? <div ref={nameRef} className="item-name loading-gradient" style={nameStyle}></div> : null}
        </div>)
    }
}
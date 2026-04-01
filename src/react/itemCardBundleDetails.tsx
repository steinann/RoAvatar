import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Icon from "./generic/icon";
import { API, ItemInfo, Outfit, type Vec2 } from "roavatar-renderer";
import NothingLoaded from "./nothingLoaded";
import ItemCard from "./itemCard";
import { AuthContext } from "./context/auth-context";
import { defaultOnClick } from "./categoryShared";
import { OutfitContext } from "./context/outfit-context";

export default function ItemCardBundleDetails({ref, itemInfo, setOutfit, animName}: {ref: React.Ref<HTMLDivElement>, itemInfo: ItemInfo, setOutfit: (a: Outfit) => void, animName: string}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    const [open, setOpen] = useState<boolean>(false)
    
    const [assets, setAssets] = useState<ItemInfo[] | undefined>(undefined)
    const [framePos, setFramePos] = useState<Vec2>([-1000,-1000])
    const [failedToLoad, setFailedToLoad] = useState<boolean>(false)

    const frameRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (!open) return

        const mouseUpListener = (e: MouseEvent) => {
            if (!frameRef.current?.contains(e.target as HTMLElement) && !buttonRef.current?.contains(e.target as HTMLElement)) {
                setOpen(false)
            }
        }

        const wheelListener = (e: Event) => {
            if (!frameRef.current?.contains(e.target as HTMLElement) && !buttonRef.current?.contains(e.target as HTMLElement)) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", mouseUpListener)
        document.addEventListener("mouseup", mouseUpListener)
        document.addEventListener("wheel", wheelListener)

        return () => {
            document.removeEventListener("mousedown", mouseUpListener)
            document.removeEventListener("mouseup", mouseUpListener)
            document.removeEventListener("wheel", wheelListener)
        }
    })

    function addOutfitAssets(outfit: Outfit | Response) {
        if (outfit instanceof Response) {
            setFailedToLoad(true)
            return
        }

        const totalAssets: ItemInfo[] = []
        for (const asset of outfit.assets) {
            const assetItemInfo = new ItemInfo("Asset", asset.assetType.name, asset.id, asset.name, asset.supportsHeadShapes)
            totalAssets.push(assetItemInfo)
        }
        if (totalAssets.length === 0) {
            setFailedToLoad(true)
        }

        setAssets(totalAssets)
    }

    function loadAssets() {
        if (assets) return

        setAssets([])

        switch (itemInfo.itemType) {
            case "Bundle":
                API.Catalog.GetBundleDetails(itemInfo.id).then((result) => {
                    if (result instanceof Response) {
                        setFailedToLoad(true)
                        return
                    }

                    for (const bundledItem of result.bundledItems) {
                        if (bundledItem.type === "UserOutfit") {
                            API.Avatar.GetOutfitDetails(bundledItem.id, result.creatorTargetId).then((outfit) => {
                                addOutfitAssets(outfit)
                            })
                            break
                        }
                    }
                })
                break
            case "Outfit":
                API.Avatar.GetOutfitDetails(itemInfo.id, -1).then((outfit) => {
                    addOutfitAssets(outfit)
                })
                break
            case "Look":
                API.Looks.GetLook(itemInfo.id.toString()).then((look) => {
                    if (look instanceof Response || !auth) {
                        setFailedToLoad(true)
                        return
                    }
                    const outfit = new Outfit()
                    outfit.fromLook(look.look, auth).then((success) => {
                        if (!success) {
                            setFailedToLoad(true)
                        } else {
                            addOutfitAssets(outfit)
                        }
                    })
                })
                break
            case "Avatar":
                API.Avatar.GetAvatarDetails(Number(itemInfo.id)).then((outfit) => {
                    addOutfitAssets(outfit)
                })
                break
            case "None":
                if (itemInfo.type === "LocalOutfit") {
                    API.LocalOutfit.GetLocalOutfits().then((localOutfits) => {
                        if (!auth) {
                            setFailedToLoad(true)
                            return
                        }

                        const localOutfit = localOutfits[Number(itemInfo.id)]
                        localOutfit.toOutfit(auth).then((outfit) => {
                            addOutfitAssets(outfit)
                        })
                    })
                }
                break
            default:
                setFailedToLoad(true)
        }
    }

    const button = buttonRef.current
    const buttonRect = button?.getBoundingClientRect()

    const updateFramePos = useCallback(() => {
        if (!buttonRect || !button) return

        const buttonPos: Vec2 = [buttonRect.left + button.clientWidth, buttonRect.top + button.clientHeight]

        const newFramePos: Vec2 = [...buttonPos]
        const frame = frameRef.current
        if (frame) {
            const frameWidth = frame.clientWidth > 100 ? frame.clientWidth : 300

            const endWidth = buttonPos[0] + frameWidth
            const endHeight = buttonPos[1] + frame.clientHeight
            if (endWidth > window.innerWidth) {
                newFramePos[0] -= frameWidth
                if (button) {
                    newFramePos[0] -= button.clientWidth
                }
            }
            if (endHeight > window.innerHeight) {
                newFramePos[1] += window.innerHeight - endHeight - 3
            }
        }

        if (framePos[0] === newFramePos[0] && framePos[1] === newFramePos[1]) return
        setFramePos(newFramePos)
    }, [button, buttonRect, framePos])

    useEffect(() => {
        if (open) {
            updateFramePos()
        }
    }, [assets, open, updateFramePos])

    return <div ref={ref}>
        <button ref={buttonRef} title="Contents" className="item-bundle-details itemcard-button" onClick={() => {
            if (!open) {
                setOpen(true)
                updateFramePos()
                loadAssets()
            } else {
                setOpen(false)
            }
        }}>
            <Icon>stack</Icon>
        </button>
        {open && framePos[0] >= 0 ? 
        <div ref={frameRef} className="item-bundle-details-frame" style={{left: `${framePos[0]}px`, top: `${framePos[1]}px`}}>
            <div className="item-bundle-details-frame-top">
                <span className="roboto-600">Contents</span>
                <button title="Close" style={{height: "3em"}} className="exit-button icon-button" onClick={() => {setOpen(false)}}>
                    <Icon>close</Icon>
                </button>
            </div>
            <div className="dialog-line"></div>
            <div className="item-bundle-details-container item-container dark-scrollbar">
                {failedToLoad ? <NothingLoaded loadedAll={true} itemCount={0} searchData={undefined} forceText="Failed to load"/> : 
                <>
                    {assets && assets.length > 0 ? assets.map((asset) => (
                        <ItemCard auth={auth} itemInfo={asset} isWorn={outfit.containsAsset(Number(asset.id))}
                        onClick={(itemInfo) => {defaultOnClick(itemInfo, outfit, ()=>{}, setOutfit, animName)}}
                        />
                    ))
                    :
                    <><ItemCard/><ItemCard/></>
                    }
                </>
                }
            </div>
        </div>
        : null}
    </div>
}
import { useContext, useEffect, useRef, useState } from "react";
import SliderInput from "./generic/sliderInput";
import ItemCard from "./itemCard";
import { OutfitContext } from "./context/outfit-context";
import { accessoryRefinementLowerBounds, accessoryRefinementTypes, accessoryRefinementUpperBounds } from "../code/avatar/constant";
import { AuthContext } from "./context/auth-context";
import { Asset, AssetMeta, ItemInfo, LayeredAssetTypes, SpecialLayeredAssetTypes } from "../code/avatar/asset";
import type { Outfit } from "../code/avatar/outfit";
import { mapNum } from "../code/misc/misc";

type Axis = "x" | "y" | "z"
type AdjustType = "position" | "rotation" | "scale"

function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function AdjustInput({asset, axis, type, outfit, setOutfit, _setOutfit, allAxis = false}: {asset: Asset, axis: Axis, type: AdjustType, outfit: Outfit, setOutfit: (a: Outfit) => void, _setOutfit: (a: Outfit) => void, allAxis?: boolean}): React.JSX.Element {
    let rawValue = 0
    if (type === "scale") {
        rawValue = 1
    }
    const meta = asset.meta
    if (meta) {
        const adjust = meta[type]
        if (adjust) {
            rawValue = adjust[axis.toUpperCase() as "X" | "Y" | "Z"]
        }
    }

    const lowerBound = accessoryRefinementLowerBounds[asset.assetType.name][type][axis + capitalizeFirstLetter(type)]
    const upperBound = accessoryRefinementUpperBounds[asset.assetType.name][type][axis + capitalizeFirstLetter(type)]
    
    return <SliderInput value={
        mapNum(rawValue, lowerBound, upperBound, 0, 1)
    } setValue={(value: number, mouseUp: boolean) => {
        const newOutfit = outfit.clone()
        let newAsset = undefined
        for (const outfitAsset of newOutfit.assets) {
            if (outfitAsset.id === asset.id) {
                newAsset = outfitAsset
            }
        }
        
        if (!newAsset) return

        if (!newAsset.meta) {
            newAsset.meta = new AssetMeta()
        }
        if (!newAsset.meta[type]) {
            if (type === "scale") {
                newAsset.meta[type] = {"X": 1, "Y": 1, "Z": 1}
            } else {
                newAsset.meta[type] = {"X": 0, "Y": 0, "Z": 0}
            }
        }
        newAsset.meta[type][axis.toUpperCase() as "X" | "Y" | "Z"] = mapNum(value, 0, 1, lowerBound, upperBound)

        if (allAxis) {
            newAsset.meta[type]["Y"] = newAsset.meta[type]["X"]
            newAsset.meta[type]["Z"] = newAsset.meta[type]["X"]
        }

        if (mouseUp) {
            setOutfit(newOutfit)
        } else {
            _setOutfit(newOutfit)
        }
    }}/>
}

export default function AvatarAdjustment({setOutfit, _setOutfit}: {setOutfit: (a: Outfit) => void, _setOutfit: (a: Outfit) => void}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    const [open, _setOpen] = useState(false)
    const [adjustOpen, _setAdjustOpen] = useState(false)
    const [orderOpen, _setOrderOpen] = useState(false)

    const [adjustType, setAdjustType] = useState<AdjustType>("position")

    const [adjustAssetId, setAdjustAssetId] = useState<number | undefined>(undefined)
    const [adjustAsset, setAdjustAsset] = useState<Asset | undefined>(undefined)

    const menuRef = useRef<HTMLUListElement>(null)

    const buttonOpen = adjustOpen || orderOpen

    function setAdjustOpen(open: boolean) {
        if (open === false) {
            setAdjustAsset(undefined)
            setAdjustAssetId(undefined)
            setAdjustType("position")
        }
        _setAdjustOpen(open)
    }

    function setOrderOpen(open: boolean) {
        _setOrderOpen(open)
    }

    //hamburger menu
    function setOpen(open: boolean) {
        setOrderOpen(false)
        setAdjustOpen(false)
        _setOpen(open)
    }

    //get list of orderableAssets or adjustableAssets for item list
    const adjustableAssets: number[] = []
    const orderableAssets: number[] = []
    const idToOrder = new Map<number,number>()

    for (const asset of outfit.assets) {
        if (accessoryRefinementTypes.includes(asset.assetType.id)) {
            adjustableAssets.push(asset.id)
        } else if (LayeredAssetTypes.includes(asset.assetType.name) && !SpecialLayeredAssetTypes.includes(asset.assetType.name)) {
            orderableAssets.push(asset.id)
            idToOrder.set(asset.id, asset.meta?.order || 0)
        }
    }
    orderableAssets.sort((a, b) => (idToOrder.get(b) || 0) - (idToOrder.get(a) || 0))

    //close when click outside preview
    useEffect(() => {
        const menuElement = menuRef.current

        const mouseUpListener = (e: MouseEvent) => {
            if (menuElement && !menuElement.contains(e.target as HTMLElement) && !buttonOpen) {
                setOpen(false)
            }
        }

        document.addEventListener("mouseup", mouseUpListener)
        
        return () => {
            document.removeEventListener("mouseup", mouseUpListener)
        }
    })

    //update adjustAsset based on id of adjustAsset
    useEffect(() => {
        for (const asset of outfit.assets) {
            if (asset.id === adjustAssetId && adjustAsset !== asset) {
                setAdjustAsset(asset)
            }
        }
    }, [adjustAsset, adjustAssetId, setAdjustAsset, outfit.assets])

    //reset adjustment to initial, based on current type (position/rotation/scale)
    function clearAdjust() {
        if (!outfit.containsAsset(adjustAssetId || 0)) return

        const newOutfit = outfit.clone()

        let newAsset = undefined
        for (const outfitAsset of newOutfit.assets) {
            if (outfitAsset.id === adjustAssetId) {
                newAsset = outfitAsset
            }
        }
        
        if (!newAsset) return

        if (!newAsset.meta) {
            newAsset.meta = new AssetMeta()
        }

        switch (adjustType) {
            case "position":
                newAsset.meta.position = {"X":0,"Y":0,"Z":0}
                break
            case "rotation":
                newAsset.meta.rotation = {"X":0,"Y":0,"Z":0}
                break
            case "scale":
                newAsset.meta.scale = {"X":1,"Y":1,"Z":1}
                break
        }

        setOutfit(newOutfit)
    }

    return <>
        <ul ref={menuRef} className='menu-icons'>
            {/*Hamburger menu*/}
            <ul className='inner-menu-icons first-menu-icons'>
                <button title={open ? "Close Menu" : "Open Menu"} className={`menu-icon menu-open${buttonOpen ? " menu-icon-inactive":""}`} onClick={() => {setOpen(!open)}}><span className='material-symbols-outlined'>{open ? "close" : "menu"}</span></button>
                <ul className={`small-menu-icons${open ? "" : " icons-collapsed"}`}>
                    <button title="Accessory Adjustment" className={`menu-icon menu-adjust${adjustOpen ? " menu-icon-active" : ""}${buttonOpen && !adjustOpen ? " menu-icon-inactive":""}`} onClick={() => {setAdjustOpen(!adjustOpen)}}><span className='material-symbols-outlined'>eyeglasses_2</span></button>
                    <button title="Layered Clothing Order" className={`menu-icon menu-adjust${orderOpen ? " menu-icon-active" : ""}${buttonOpen && !orderOpen ? " menu-icon-inactive":""}`} onClick={() => {setOrderOpen(!orderOpen)}}><span className='material-symbols-outlined'>apparel</span></button>
                </ul>
            </ul>
            {/*Accessory adjustment buttons*/}
            <ul className={`inner-menu-icons adjust-menu-icons${adjustOpen ? "" : " icons-collapsed"}`}>
                <button title="Move" className={`menu-icon menu-adjust-move${adjustType === "position" ? " menu-icon-active" : ""}`} onClick={() => {setAdjustType("position")}}><span className='material-symbols-outlined'>drag_pan</span></button>
                <button title="Rotate" className={`menu-icon menu-adjust-rotate${adjustType === "rotation" ? " menu-icon-active" : ""}`} onClick={() => {setAdjustType("rotation")}}><span className='material-symbols-outlined'>autorenew</span></button>
                <button title="Scale" className={`menu-icon menu-adjust-scale${adjustType === "scale" ? " menu-icon-active" : ""}`} onClick={() => {setAdjustType("scale")}}><span className='material-symbols-outlined'>expand_content</span></button>
            </ul>
        </ul>

        {/*Accessory list on right, used for adjust list and order list*/}
        <ul className={`accessory-select${adjustOpen || orderOpen ? "" : " icons-collapsed"}`}>
            {/*Per asset*/}
            {(adjustOpen ? adjustableAssets : orderableAssets).length === 0 ? <ItemCard auth={auth} key={0} interactive={false} imageAffectedByTheme={true} forceImage="../assets/blankline.png" itemInfo={new ItemInfo("None", "", 0, adjustOpen ? "Adjustable items appear here" : "Layered items appear here")} includeName={false} buttonClassName="item-template-button" /> : null}
            {(adjustOpen ? adjustableAssets : orderableAssets).map((assetId) => {
                let asset = undefined
                for (const outfitAsset of outfit.assets) {
                    if (outfitAsset.id === assetId) {
                        asset = outfitAsset
                    }
                }

                if (!asset) return

                const itemInfo = new ItemInfo("Asset", asset.assetType.name, asset.id, asset.name)
                const className = adjustAsset?.id === assetId ? "adjust-asset" : undefined
                return <ItemCard key={asset._uuid} showOrderArrows={orderOpen} buttonClassName={className} auth={auth} includeName={false} itemInfo={itemInfo} onClick={() => {
                    //open adjust if set to adjust mode
                    if (adjustOpen) {
                        setAdjustAssetId(assetId)
                    }
                }} onArrowClick={(itemInfo, isUp) => {
                    //order item
                    const index = orderableAssets.indexOf(itemInfo.id)
                    
                    if ((index > 0 || !isUp) && (index < orderableAssets.length - 1 || isUp)) {
                        const previousIndex = index + (isUp ? -1 : 1)
                        const previousId = orderableAssets[previousIndex]

                        const previousOrder = idToOrder.get(previousId)
                        const selfOrder = idToOrder.get(itemInfo.id)

                        if (previousOrder !== undefined && selfOrder !== undefined) {
                            const newOutfit = outfit.clone()
                            const previousAsset = newOutfit.getAssetId(previousId)
                            const selfAsset = newOutfit.getAssetId(itemInfo.id)
                            if (previousAsset && selfAsset) {
                                previousAsset.setOrder(selfOrder)
                                selfAsset.setOrder(previousOrder)
                                setOutfit(newOutfit)
                            }
                        }
                    }
                }}/>
            })}
        </ul>

        {/*Adjustment sliders for rotation/position*/}
        {adjustOpen && adjustType !== "scale" && outfit.containsAsset(adjustAssetId || 0) && adjustAsset ? 
            <div className={`adjustment-menu`}>
                <div className="adjustment-top">
                    <span className="adjustment-title roboto-600">{capitalizeFirstLetter(adjustType)}</span>
                    <button className="adjustment-clear" onClick={clearAdjust}><span className='material-symbols-outlined'>delete</span></button>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon x roboto-800">X</span>
                    <AdjustInput asset={adjustAsset} axis="x" type={adjustType} outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit}/>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon y roboto-800">Y</span>
                    <AdjustInput asset={adjustAsset} axis="y" type={adjustType} outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit}/>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon z roboto-800">Z</span>
                    <AdjustInput asset={adjustAsset} axis="z" type={adjustType} outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit}/>
                </div>
            </div>
        : null}
        {/*Adjustment slider for scale*/}
        {adjustOpen && adjustType === "scale" && outfit.containsAsset(adjustAssetId || 0) && adjustAsset ?
            <div className={`adjustment-menu`}>
                <div className="adjustment-top">
                    <span className="adjustment-title roboto-600">{capitalizeFirstLetter(adjustType)}</span>
                    <button className="adjustment-clear" onClick={clearAdjust}><span className='material-symbols-outlined'>delete</span></button>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon z roboto-800"></span>
                    <AdjustInput asset={adjustAsset} axis="x" allAxis={true} type={adjustType} outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit}/>
                </div>
            </div>
        : null}
    </>
}
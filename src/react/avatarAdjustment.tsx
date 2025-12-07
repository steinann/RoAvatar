import { useContext, useEffect, useState } from "react";
import SliderInput from "./generic/sliderInput";
import ItemCard from "./itemCard";
import { OutfitContext } from "./context/outfit-context";
import { accessoryRefinementLowerBounds, accessoryRefinementTypes, accessoryRefinementUpperBounds } from "../code/avatar/constant";
import { AuthContext } from "./context/auth-context";
import { Asset, AssetMeta, ItemInfo } from "../code/avatar/asset";
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
    const [adjustType, setAdjustType] = useState<"move" | "rotate" | "scale">("move")

    const [adjustAssetId, setAdjustAssetId] = useState<number | undefined>(undefined)
    const [adjustAsset, setAdjustAsset] = useState<Asset | undefined>(undefined)

    function setAdjustOpen(open: boolean) {
        if (open === false) {
            setAdjustAsset(undefined)
            setAdjustAssetId(undefined)
            setAdjustType("move")
        }
        _setAdjustOpen(open)
    }

    function setOpen(open: boolean) {
        setAdjustOpen(false)
        _setOpen(open)
    }

    const adjustableAssets: number[] = []
    for (const asset of outfit.assets) {
        if (accessoryRefinementTypes.includes(asset.assetType.id)) {
            adjustableAssets.push(asset.id)
        }
    }

    useEffect(() => {
        for (const asset of outfit.assets) {
            if (asset.id === adjustAssetId && adjustAsset !== asset) {
                setAdjustAsset(asset)
            }
        }
    }, [adjustAsset, adjustAssetId, setAdjustAsset, outfit.assets])

    let adjustInputType: AdjustType = "position"
    switch (adjustType) {
        case "move":
            adjustInputType = "position"
            break
        case "rotate":
            adjustInputType = "rotation"
            break
        case "scale":
            adjustInputType = "scale"
            break
    }

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
            case "move":
                newAsset.meta.position = {"X":0,"Y":0,"Z":0}
                break
            case "rotate":
                newAsset.meta.rotation = {"X":0,"Y":0,"Z":0}
                break
            case "scale":
                newAsset.meta.scale = {"X":1,"Y":1,"Z":1}
                break
        }

        setOutfit(newOutfit)
    }

    return <>
        <ul className='menu-icons'>
            {/*Hamburger menu*/}
            <ul className='inner-menu-icons first-menu-icons'>
                <button title={open ? "Open Menu" : "Close Menu"} className={`menu-icon menu-open${adjustOpen ? " menu-icon-inactive":""}`} onClick={() => {setOpen(!open)}}><span className='material-symbols-outlined'>{open ? "close" : "menu"}</span></button>
                <ul className={`small-menu-icons${open ? "" : " icons-collapsed"}`}>
                    <button title="Accessory Adjustment" className={`menu-icon menu-adjust${adjustOpen ? " menu-icon-active" : ""}`} onClick={() => {setAdjustOpen(!adjustOpen)}}><span className='material-symbols-outlined'>eyeglasses_2</span></button>
                </ul>
            </ul>
            {/*Accessory adjustment buttons*/}
            <ul className={`inner-menu-icons adjust-menu-icons${adjustOpen ? "" : " icons-collapsed"}`}>
                <button title="Move" className={`menu-icon menu-adjust-move${adjustType === "move" ? " menu-icon-active" : ""}`} onClick={() => {setAdjustType("move")}}><span className='material-symbols-outlined'>drag_pan</span></button>
                <button title="Rotate" className={`menu-icon menu-adjust-rotate${adjustType === "rotate" ? " menu-icon-active" : ""}`} onClick={() => {setAdjustType("rotate")}}><span className='material-symbols-outlined'>autorenew</span></button>
                <button title="Scale" className={`menu-icon menu-adjust-scale${adjustType === "scale" ? " menu-icon-active" : ""}`} onClick={() => {setAdjustType("scale")}}><span className='material-symbols-outlined'>expand_content</span></button>
            </ul>
        </ul>

        {/*Choose accessory*/}
        <ul className={`accessory-select${adjustOpen ? "" : " icons-collapsed"}`}>
            {adjustableAssets.map((assetId) => {
                let asset = undefined
                for (const outfitAsset of outfit.assets) {
                    if (outfitAsset.id === assetId) {
                        asset = outfitAsset
                    }
                }

                if (!asset) return

                const itemInfo = new ItemInfo("Asset", asset.assetType.name, asset.id, asset.name)
                const className = adjustAsset?.id === assetId ? "adjust-asset" : undefined
                return <ItemCard buttonClassName={className} key={asset.id}  auth={auth} includeName={false} itemInfo={itemInfo} onClick={() => {
                    setAdjustAssetId(assetId)
                }}/>
            })}
        </ul>

        {/*Adjustment sliders*/}
        {adjustOpen && adjustInputType !== "scale" && outfit.containsAsset(adjustAssetId || 0) && adjustAsset ? 
            <div className={`adjustment-menu`}>
                <div className="adjustment-top">
                    <span className="adjustment-title roboto-600">{capitalizeFirstLetter(adjustInputType)}</span>
                    <button className="adjustment-clear" onClick={clearAdjust}><span className='material-symbols-outlined'>delete</span></button>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon x roboto-800">X</span>
                    <AdjustInput asset={adjustAsset} axis="x" type={adjustInputType} outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit}/>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon y roboto-800">Y</span>
                    <AdjustInput asset={adjustAsset} axis="y" type={adjustInputType} outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit}/>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon z roboto-800">Z</span>
                    <AdjustInput asset={adjustAsset} axis="z" type={adjustInputType} outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit}/>
                </div>
            </div>
        : null}
        {adjustOpen && adjustInputType === "scale" && outfit.containsAsset(adjustAssetId || 0) && adjustAsset ?
            <div className={`adjustment-menu`}>
                <div className="adjustment-top">
                    <span className="adjustment-title roboto-600">{capitalizeFirstLetter(adjustInputType)}</span>
                    <button className="adjustment-clear" onClick={clearAdjust}><span className='material-symbols-outlined'>delete</span></button>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon z roboto-800"></span>
                    <AdjustInput asset={adjustAsset} axis="x" allAxis={true} type={adjustInputType} outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit}/>
                </div>
            </div>
        : null}
    </>
}
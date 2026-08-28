import { useCallback, useContext, useEffect, useRef, useState } from "react";
import AccessoryList from "./accessoryList";
import { AuthContext } from "./context/auth-context";
import { OutfitContext, OutfitFuncContext } from "./context/outfit-context";
import { accessoryRefinementLowerBounds, accessoryRefinementTypes, accessoryRefinementUpperBounds, Asset, AssetMeta, mapNum } from "roavatar-renderer";
import SliderInput from "./generic/sliderInput";
import { getCameraData, setCameraData } from "./generic/cameraData";

type Axis = "x" | "y" | "z"
export type AdjustType = "position" | "rotation" | "scale"

function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function AdjustInput({asset, axis, type, allAxis = false}: {asset: Asset, axis: Axis, type: AdjustType, allAxis?: boolean}): React.JSX.Element {
    const outfit = useContext(OutfitContext)
    const outfitFunc = useContext(OutfitFuncContext)
    
    const [proposedValue, setProposedValue] = useState<string | undefined>(undefined)

    const inputRef = useRef<HTMLInputElement>(null)

    //remove proposed value on unfocus
    useEffect(() => {
        const input = inputRef.current
        if (!input) return

        function focusoutEvent() {
            setProposedValue(undefined)
        }

        input.addEventListener("focusout", focusoutEvent)

        return () => {
            input.removeEventListener("focusout", focusoutEvent)
        }
    })

    //calculate raw value
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
    
    //invert axis for x and z at position
    const lv = axis === "y" || type !== "position" ? 0 : 1
    const uv = axis === "y" || type !== "position" ? 1 : 0

    let calculatedValueToShow = Math.round(mapNum(rawValue, lowerBound, upperBound, lv, uv) * 100)
    if (type === "scale") calculatedValueToShow = Math.round(mapNum(calculatedValueToShow, 0, 100, lowerBound*100, upperBound*100))

    const valueToShow = proposedValue !== undefined ? proposedValue : calculatedValueToShow

    const updateValue = useCallback((value: number, mouseUp: boolean) => {
        if (type !== "scale") {
            value = Math.round(value*100)/100
        } else {
            value = mapNum(Math.round(mapNum(value, 0, 1, lowerBound*100, upperBound*100)), lowerBound*100, upperBound*100, 0, 1)
        }
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
        newAsset.meta[type][axis.toUpperCase() as "X" | "Y" | "Z"] = mapNum(value, lv, uv, lowerBound, upperBound)

        if (allAxis) {
            newAsset.meta[type]["Y"] = newAsset.meta[type]["X"]
            newAsset.meta[type]["Z"] = newAsset.meta[type]["X"]
        }

        if (mouseUp) {
            outfitFunc.setOutfit(newOutfit)
        } else {
            outfitFunc._setOutfit(newOutfit)
        }
    }, [allAxis, asset.id, axis, lowerBound, lv, outfit, outfitFunc, type, upperBound, uv])

    return <div>
        <SliderInput value={
            mapNum(rawValue, lowerBound, upperBound, lv, uv)
        } setValue={updateValue}/>
        <div className="adjustment-bar-right">
            <input ref={inputRef} className="roboto-600"
                value={valueToShow}
                onChange={(e) => {
                    const input = inputRef.current
                    if (input) {
                        //get value as only numbers
                        let strNum = e.target.value.match(/\d+/g)?.toString()
                        if (!strNum) strNum = ""
                        
                        if (strNum.length <= 3) {
                            const proposedValue = strNum

                            let proposedValueNum = proposedValue.length > 0 ? Number(proposedValue) : 0
                            if (type === "scale") proposedValueNum = Math.round(mapNum(proposedValueNum, lowerBound*100, upperBound*100, 0, 100))

                            if (proposedValueNum >= 0 && proposedValueNum <= 100) { //if valid
                                //update outfit
                                updateValue(proposedValueNum / 100, true)

                                setProposedValue(undefined)
                            } else { //not valid
                                //update proposal
                                setProposedValue(proposedValue)
                            }
                        }
                    }
                }}
            />
            <span className="roboto-600">%</span>
        </div>
    </div>
}

export function AccessoryAdjustment({isOpen, adjustType}: {isOpen: boolean, adjustType: AdjustType}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    const outfitFunc = useContext(OutfitFuncContext)

    const [adjustAssetId, setAdjustAssetId] = useState<number>(0)

    //update camera data adjust id
    useEffect(() => {
        const newCameraData = getCameraData().clone()
        newCameraData.adjustmentId = BigInt(adjustAssetId)
        setCameraData(newCameraData)
    }, [isOpen, adjustAssetId])

    if (!auth) return <></>

    //get list of orderableAssets or adjustableAssets for item list
    const adjustableAssets: number[] = []

    for (const asset of outfit.assets) {
        if (accessoryRefinementTypes.includes(asset.assetType.id)) {
            adjustableAssets.push(asset.id)
        }
    }

    const adjustAsset = outfit.getAssetId(adjustAssetId)

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

        outfitFunc.setOutfit(newOutfit)
    }

    return <>
        {/*Accessory list on right, used for adjust list and order list*/}
        <AccessoryList
        auth={auth}
        open={isOpen}
        assets={adjustableAssets}
        nothingMessage="Adjustable items appear here"
        selectedAssetIds={[adjustAssetId]}
        onItemClick={(itemInfo) => {
            setAdjustAssetId(Number(itemInfo.id))
        }}
        />

        {/*Adjustment sliders for rotation/position*/}
        {isOpen && adjustType !== "scale" && outfit.containsAsset(adjustAssetId || 0) && adjustAsset ? 
            <div className={`adjustment-menu`}>
                <div className="adjustment-top">
                    <span className="adjustment-title roboto-600">{capitalizeFirstLetter(adjustType)}</span>
                    <button className="adjustment-clear" onClick={clearAdjust}><span className='material-symbols-outlined'>delete</span></button>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon x roboto-800">X</span>
                    <AdjustInput asset={adjustAsset} axis="x" type={adjustType}/>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon y roboto-800">Y</span>
                    <AdjustInput asset={adjustAsset} axis="y" type={adjustType}/>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon z roboto-800">Z</span>
                    <AdjustInput asset={adjustAsset} axis="z" type={adjustType}/>
                </div>
            </div>
        : null}
        {/*Adjustment slider for scale*/}
        {isOpen && adjustType === "scale" && outfit.containsAsset(adjustAssetId || 0) && adjustAsset ?
            <div className={`adjustment-menu`}>
                <div className="adjustment-top">
                    <span className="adjustment-title roboto-600">{capitalizeFirstLetter(adjustType)}</span>
                    <button className="adjustment-clear" onClick={clearAdjust}><span className='material-symbols-outlined'>delete</span></button>
                </div>
                <div className="adjustment-bar">
                    <span className="adjustment-icon z roboto-800"></span>
                    <AdjustInput asset={adjustAsset} axis="x" allAxis={true} type={adjustType}/>
                </div>
            </div>
        : null}
    </>
}
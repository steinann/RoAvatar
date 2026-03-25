import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/auth-context";
import { OutfitContext } from "./context/outfit-context";
import { API, AssetMeta, ItemInfo, type AvatarInventory_Result, type Outfit } from "roavatar-renderer";
import ToggleButton from "./generic/toggleButton";
import ItemCard from "./itemCard";
import NothingLoaded from "./nothingLoaded";

export default function HeadAdjustmentCategory({setOutfit}: {setOutfit: (a: Outfit) => void}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    const [headShapesList, setHeadShapesList] = useState<AvatarInventory_Result | undefined>(undefined)
    
    useEffect(() => {
        let shouldCancel = false

        if (!headShapesList) {
            API.Avatar.GetHeadShapes(undefined).then((result) => {
                if (shouldCancel) return

                if (!(result instanceof Response)) {
                    result.avatarInventoryItems.unshift({
                        "headShape": undefined,
                        "itemId": 0,
                        "itemName": "",
                        "itemCategory": {
                            itemType: 0,
                            itemSubType: 0
                        },
                        "availabilityStatus": "",
                        "acquisitionTime": "",
                    })
                    setHeadShapesList(result)
                }
            })
        }

        return () => {
            shouldCancel = true
        }
    }, [headShapesList])

    let dynamicHeadAsset = undefined
    for (const asset of outfit.assets) {
        if (asset.assetType.name === "DynamicHead") {
            dynamicHeadAsset = asset
            break
        }
    }

    const supportHeadShapes = dynamicHeadAsset?.supportsHeadShapes
    const staticFacialAnimation = dynamicHeadAsset?.meta?.staticFacialAnimation

    return <div className="container">
        <div className={!dynamicHeadAsset ? "item-container" : "headadjustment-category"}>
            {dynamicHeadAsset ? <>
                <span className="headadjustment-title roboto-600 staticfacialanimation-title">Facial Animation</span>
                <ToggleButton value={!staticFacialAnimation} setValue={(newValue) => {
                    const newOutfit = outfit.clone()
                    for (const asset of newOutfit.assets) {
                        if (asset.assetType.name === "DynamicHead") {
                            if (!asset.meta) {
                                asset.meta = new AssetMeta()
                            }

                            asset.meta.staticFacialAnimation = !newValue
                        }
                    }

                    setOutfit(newOutfit)
                }}></ToggleButton>

                <>
                    <span className="headadjustment-title roboto-600">{supportHeadShapes && headShapesList ? `Head Shapes` : "Head Shapes not supported for this head"}</span>
                    <div className="item-container dark-scrollbar" style={{width: "100%", margin: 0}}>
                        {supportHeadShapes && headShapesList ? 
                        headShapesList.avatarInventoryItems.map((headShape) => {
                            const itemInfo = new ItemInfo("Asset", "DynamicHead", dynamicHeadAsset.id, dynamicHeadAsset.name)
                            itemInfo.headShape = headShape.headShape
                            return <ItemCard key={itemInfo.headShape && itemInfo.headShape.length > 0 ? itemInfo.headShape : "none"} auth={auth} itemInfo={itemInfo} includeName={false} isWorn={dynamicHeadAsset.meta?.headShape === itemInfo.headShape} onClick={(itemInfo) => {
                                const newOutfit = outfit.clone()
                                for (const asset of newOutfit.assets) {
                                    if (asset.assetType.name === "DynamicHead") {
                                        if (!asset.meta) {
                                            asset.meta = new AssetMeta()
                                        }

                                        asset.meta.headShape = itemInfo.headShape
                                    }
                                }
                                setOutfit(newOutfit)
                            }}/>
                        })
                        : 
                        <ItemCard auth={auth} includeName={false} interactive={false} imageAffectedByTheme={true} buttonClassName="item-template-button" itemInfo={new ItemInfo("None", "", 0, "No head shapes available")} forceImage="../assets/blankline.png"/>}
                    </div>
                </>
            </>
            : 
            <>
                <NothingLoaded loadedAll={true} itemCount={0} forceText="Only Dynamic Heads can be adjusted"/>
                {/*<span className="headadjustment-title roboto-600">Only Dynamic Heads can be adjusted</span>*/}
            </>}
        </div>
    </div>
}
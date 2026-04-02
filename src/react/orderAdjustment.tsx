import { useContext } from "react";
import AccessoryList from "./accessoryList";
import { AuthContext } from "./context/auth-context";
import { LayeredAssetTypes, SpecialLayeredAssetTypes } from "roavatar-renderer";
import { OutfitContext, OutfitFuncContext } from "./context/outfit-context";

export default function OrderAdjustment({isOpen}: {isOpen: boolean}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    const outfitFunc = useContext(OutfitFuncContext)

    if (!auth) return <></>

    //get list of orderableAssets or adjustableAssets for item list
    const orderableAssets: number[] = []
    const idToOrder = new Map<number,number>()

    for (const asset of outfit.assets) {
        if (LayeredAssetTypes.includes(asset.assetType.name) && !SpecialLayeredAssetTypes.includes(asset.assetType.name)) {
            orderableAssets.push(asset.id)
            idToOrder.set(asset.id, asset.meta?.order || 0)
        }
    }
    orderableAssets.sort((a, b) => (idToOrder.get(b) || 0) - (idToOrder.get(a) || 0))

    return <>
        <AccessoryList
        auth={auth}
        open={isOpen}
        assets={orderableAssets}
        nothingMessage="Layered items appear here"
        showOrderArrows={true}
        onArrowClick={(itemInfo, isUp) => {
                //order item
                const index = orderableAssets.indexOf(Number(itemInfo.id))
                
                if ((index > 0 || !isUp) && (index < orderableAssets.length - 1 || isUp)) {
                    const previousIndex = index + (isUp ? -1 : 1)
                    const previousId = orderableAssets[previousIndex]

                    const previousOrder = idToOrder.get(previousId)
                    const selfOrder = idToOrder.get(Number(itemInfo.id))

                    if (previousOrder !== undefined && selfOrder !== undefined) {
                        const newOutfit = outfit.clone()
                        const previousAsset = newOutfit.getAssetId(previousId)
                        const selfAsset = newOutfit.getAssetId(Number(itemInfo.id))
                        if (previousAsset && selfAsset) {
                            previousAsset.setOrder(selfOrder)
                            selfAsset.setOrder(previousOrder)
                            outfitFunc.setOutfit(newOutfit)
                        }
                    }
                }
            }}
        />
    </>
}
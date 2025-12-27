import { API, type Authentication } from "../code/api";
import { ItemInfo, ToRemoveBeforeBundleType, WearableAssetTypes } from "../code/avatar/asset";
import { Outfit } from "../code/avatar/outfit";
import { DefaultAnimations, type AnimationProp } from "../code/rblx/constant";

export const defaultOnClick = (auth: Authentication, item: ItemInfo, outfit: Outfit, setAnimName: (a: string) => void, setOutfit: (a: Outfit) => void) => {
    if (item.itemType !== "Asset") {
        setAnimName(`idle.Animation1`)
    }

    if (!outfit.containsAsset(item.id) && item.itemType === "Asset") { //if asset (not worn)
        const newOutfit = outfit.clone(); 
        if (WearableAssetTypes.includes(item.type)) {
            newOutfit.addAsset(item.id, item.type, item.name);
        }
        if (item.type.endsWith("Animation") && item.type !== "EmoteAnimation") {
            const entry = DefaultAnimations[item.type as AnimationProp]
            const mainName = entry[0]
            const subArr = entry[1]
            const sub0 = subArr[0]
            if (sub0) {
                const sub0Name = sub0[0]

                setAnimName(`${mainName}.${sub0Name}`)
            }
        } else if (item.type === "EmoteAnimation") {
            setAnimName(`emote.${item.id}`)
        } else {
            setAnimName(`idle.Animation1`)
        }
        setOutfit(newOutfit)
    } else if (item.itemType === "Asset") { //if asset thats already worn
        const newOutfit = outfit.clone(); 
        newOutfit.removeAsset(item.id);
        setOutfit(newOutfit)
    } else if (item.itemType === "Outfit" && (item.type === "Outfit" || item.type === "Character")) { //if full outfit
        API.Avatar.GetOutfitDetails(auth, item.id, outfit.creatorId || 1).then((result) => {
            if (result instanceof Outfit) {
                if (item.type === "Character") {
                    result.bodyColors = outfit.bodyColors.clone()
                }

                setOutfit(result)
            }
        })
    } else if (item.itemType === "Outfit" && (item.type === "DynamicHead" || item.type === "Shoes" || item.type === "AnimationPack")) { //if partial outfit
        const newOutfit = outfit.clone()

        const toRemove = ToRemoveBeforeBundleType[item.type]
        for (const type of toRemove) {
            newOutfit.removeAssetType(type)
        }

        API.Avatar.GetOutfitDetails(auth, item.id, outfit.creatorId || 1).then((result) => {
            if (result instanceof Outfit) {
                for (const asset of result.assets) {
                    newOutfit.addAsset(asset.id, asset.assetType.id, asset.name)
                }

                setOutfit(newOutfit)
            }
        })
    } else if (item.itemType === "Bundle") { //if bundle
        API.Catalog.GetBundleDetails(auth, item.id).then((result) => {
            if (!(result instanceof Response)) {
                for (const item of result.bundledItems) {
                    if (item.type === "UserOutfit") { //find first outfit in bundle
                        API.Avatar.GetOutfitDetails(auth, item.id, outfit.creatorId || 1).then((result) => {
                            if (result instanceof Outfit) {
                                const newOutfit = outfit.clone()
                                for (const asset of result.assets) {
                                    newOutfit.addAsset(asset.id, asset.assetType.id, asset.name)
                                }

                                setOutfit(newOutfit)
                            }
                        })
                        break
                    }
                }
            }
        })
    }
}
import { API } from "../code/api";
import { CatalogBundleTypes, ItemInfo, ToRemoveBeforeBundleType, WearableAssetTypes } from "../code/avatar/asset";
import { Outfit } from "../code/avatar/outfit";
import { DefaultAnimations, type AnimationProp } from "../code/rblx/constant";

export const defaultOnClick = (item: ItemInfo, outfit: Outfit, setAnimName: (a: string) => void, setOutfit: (a: Outfit) => void, animName: string) => {
    if (item.itemType !== "Asset") {
        setAnimName(`idle`)
    }

    if (!outfit.containsAsset(item.id) && item.itemType === "Asset") { //if asset (not worn)
        const newOutfit = outfit.clone(); 
        if (WearableAssetTypes.includes(item.type)) {
            newOutfit.addAsset(item.id, item.type, item.name);
        }
        if (item.type.endsWith("Animation") && item.type !== "EmoteAnimation" && item.type !== "MoodAnimation") {
            const entry = DefaultAnimations[item.type as AnimationProp]
            const mainName = entry[0]
            
            setAnimName(`${mainName}`)
        } else if (item.type === "EmoteAnimation") {
            if (animName !== `emote.${item.id}`) {
                setAnimName(`emote.${item.id}`)
            } else {
                setAnimName(`idle`)
            }
        } else {
            setAnimName(`idle`)
        }
        setOutfit(newOutfit)
    } else if (item.itemType === "Asset") { //if asset thats already worn
        const newOutfit = outfit.clone(); 
        newOutfit.removeAsset(item.id);
        setOutfit(newOutfit)
    } else if (item.itemType === "Outfit" && (item.type === "Outfit" || item.type === "Character")) { //if full outfit
        API.Avatar.GetOutfitDetails(item.id, outfit.creatorId || 1).then((result) => {
            if (result instanceof Outfit) {
                //check if we need to unequip or equip
                const isWorn = outfit.containsAssets(result.assets.map((a) => {return a.id}))

                if (!isWorn || item.type === "Outfit") {
                    if (item.type === "Outfit") {
                        setOutfit(result)
                    } else {
                        const newOutfit = outfit.clone()

                        newOutfit.scale = result.scale.clone()

                        const toRemove = ToRemoveBeforeBundleType["Character"]
                        for (const type of toRemove) {
                            newOutfit.removeAssetType(type)
                        }

                        for (const asset of result.assets) {
                            newOutfit.addAsset(asset.id, asset.assetType.id, asset.name)
                        }
                        setOutfit(newOutfit)
                    }
                } else {
                    const newOutfit = outfit.clone()
                    for (const asset of result.assets) {
                        newOutfit.removeAsset(asset.id)
                    }
                    setOutfit(newOutfit)
                }
            }
        })
    } else if (item.itemType === "Outfit" && (item.type === "DynamicHead" || item.type === "Shoes" || item.type === "AnimationPack")) { //if partial outfit
        const newOutfit = outfit.clone()

        const toRemove = ToRemoveBeforeBundleType[item.type]
        for (const type of toRemove) {
            newOutfit.removeAssetType(type)
        }

        API.Avatar.GetOutfitDetails(item.id, outfit.creatorId || 1).then((result) => {
            if (result instanceof Outfit) {
                //check if we need to unequip or equip
                const isWorn = outfit.containsAssets(result.assets.map((a) => {return a.id}))

                if (!isWorn) {
                    for (const asset of result.assets) {
                        newOutfit.addAsset(asset.id, asset.assetType.id, asset.name)
                    }
                } else {
                    for (const asset of result.assets) {
                        newOutfit.removeAsset(asset.id)
                    }
                }

                setOutfit(newOutfit)
            }
        })
    } else if (item.itemType === "Bundle") { //if bundle
        API.Catalog.GetBundleDetails(item.id).then((result) => {
            if (!(result instanceof Response)) {
                const bundleType = CatalogBundleTypes[result.bundleType]

                for (const item of result.bundledItems) {
                    if (item.type === "UserOutfit") { //find first outfit in bundle
                        API.Avatar.GetOutfitDetails(item.id, outfit.creatorId || 1).then((result) => {
                            if (result instanceof Outfit) {
                                //check if we need to unequip or equip
                                const isWorn = outfit.containsAssets(result.assets.map((a) => {return a.id}))

                                const newOutfit = outfit.clone()

                                if (!isWorn) { //equip
                                    for (const asset of result.assets) {
                                        newOutfit.addAsset(asset.id, asset.assetType.id, asset.name)
                                    }

                                    if (bundleType === "Character") {
                                        newOutfit.scale = result.scale.clone()
                                    }
                                } else { //unequip
                                    for (const asset of result.assets) {
                                        newOutfit.removeAsset(asset.id)
                                    }
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
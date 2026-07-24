import { API, Asset, Authentication, CatalogBundleTypes, DefaultAnimations, Outfit, OutfitModel, ToRemoveBeforeBundleType, WearableAssetTypes, type AnimationProp, type ItemInfo } from "roavatar-renderer";

export const defaultOnClick = (item: ItemInfo, outfitModel: OutfitModel, setOutfitModel: (a: OutfitModel) => void, setAnimName: (a: string) => void, animName: string, auth?: Authentication) => {
    const outfit = outfitModel.outfit

    function setOutfit(newOutfit: Outfit) {
        const newOutfitModel = outfitModel.clone()
        newOutfitModel.outfit = newOutfit
        setOutfitModel(newOutfitModel)
    }

    if (item.itemType !== "Asset") {
        setAnimName(`idle`)
    }

    if (!outfit.containsAsset(Number(item.id)) && item.itemType === "Asset") { //if asset (not worn)
        const newOutfit = outfit.clone(); 
        if (WearableAssetTypes.includes(item.type)) {
            newOutfit.addAsset(Number(item.id), item.type, item.name, item.supportsHeadShapes);
            setOutfit(newOutfit)
        } else {
            if (item.type === "AvatarBackground") { // background
                const newOutfitModel = outfitModel.clone()
                if (!outfitModel.background || outfitModel.background.id !== Number(item.id)) { //not worn
                    newOutfitModel.background = new Asset()
                    newOutfitModel.background.id = Number(item.id)
                    newOutfitModel.background.assetType.name = item.type
                    newOutfitModel.background.name = item.name
                } else { //worn
                    newOutfitModel.background = undefined
                }
                setOutfitModel(newOutfitModel)
            }
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
    } else if (item.itemType === "Asset") { //if asset thats already worn
        const newOutfit = outfit.clone(); 
        newOutfit.removeAsset(Number(item.id));
        setOutfit(newOutfit)
    } else if (item.itemType === "Outfit" && (item.type === "Outfit" || item.type === "Character")) { //if full outfit
        API.Avatar.GetOutfitModel(item.id, item.creatorId || outfit.creatorId || 0).then((resultModel) => {
            if (resultModel instanceof OutfitModel) {
                const result = resultModel.outfit
                //check if we need to unequip or equip
                const isWorn = outfit.containsAssets(result.assets.map((a) => {return a.id}))

                if (!isWorn || item.type === "Outfit") {
                    if (item.type === "Outfit") {
                        setOutfitModel(resultModel)
                    } else {
                        const newOutfitModel = outfitModel.clone()
                        const newOutfit = newOutfitModel.outfit

                        newOutfit.scale = result.scale.clone()

                        const toRemove = ToRemoveBeforeBundleType["Character"]
                        for (const type of toRemove) {
                            newOutfit.removeAssetType(type)
                        }

                        for (const asset of result.assets) {
                            newOutfit.addAsset(asset.id, asset.assetType.id, asset.name, asset.supportsHeadShapes)
                        }
                        setOutfitModel(newOutfitModel)
                    }
                } else {
                    const newOutfitModel = outfitModel.clone()
                    for (const asset of result.assets) {
                        newOutfitModel.outfit.removeAsset(asset.id)
                    }
                    setOutfitModel(newOutfitModel)
                }
            }
        })
    } else if (item.itemType === "Outfit" && (item.type === "DynamicHead" || item.type === "Shoes" || item.type === "AnimationPack" || item.type === "MakeupLook")) { //if partial outfit
        const newOutfit = outfit.clone()

        const toRemove = ToRemoveBeforeBundleType[item.type]
        for (const type of toRemove) {
            newOutfit.removeAssetType(type)
        }

        API.Avatar.GetOutfitDetails(item.id, item.creatorId || outfit.creatorId || 0).then((result) => {
            if (result instanceof Outfit) {
                //check if we need to unequip or equip
                const isWorn = outfit.containsAssets(result.assets.map((a) => {return a.id}))

                if (!isWorn) {
                    for (const asset of result.assets) {
                        newOutfit.addAsset(asset.id, asset.assetType.id, asset.name, asset.supportsHeadShapes)
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

                const ogItem = item

                for (const item of result.bundledItems) {
                    if (item.type === "UserOutfit") { //find first outfit in bundle
                        API.Avatar.GetOutfitDetails(item.id, ogItem.creatorId || outfit.creatorId || 1).then((result) => {
                            if (result instanceof Outfit) {
                                //check if we need to unequip or equip
                                const isWorn = outfit.containsAssets(result.assets.map((a) => {return a.id}))

                                const newOutfit = outfit.clone()

                                if (!isWorn) { //equip
                                    for (const asset of result.assets) {
                                        newOutfit.addAsset(asset.id, asset.assetType.id, asset.name, asset.supportsHeadShapes)
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
            } else {
                console.warn("Failed to get bundleDetails", result)
            }
        })
    } else if (item.itemType === "Avatar") {
        API.Avatar.GetAvatarDetails(Number(item.id)).then((result) => {
            if (!(result instanceof Response)) {
                setOutfit(result)
            }
        })
    } else if (item.itemType === "Look") {
        if (!auth) return

        const newOutfit = new Outfit()
        API.Looks.GetLook(item.id.toString()).then(lookDetails => {
            if (!(lookDetails instanceof Response)) {
                newOutfit.fromLook(lookDetails.look, auth).then((success) => {
                    if (success) {
                        setOutfit(newOutfit)
                    }
                })
            }
        })
    }
}
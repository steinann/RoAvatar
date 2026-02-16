import { HAIR_IS_BODYPART } from "../misc/flags"
import { AssetTypeNameToId } from "./asset"

export class ItemSort {
    subType: number
    itemType: string

    constructor(subType: number, itemType: string = "Asset") {
        this.subType = subType
        this.itemType = itemType
    }
}

export class SortInfo {
    sortOption: string
    itemCategories: ItemSort[] = []

    constructor(itemCategories: ItemSort[], sortOption = "1") {
        this.itemCategories = itemCategories
        this.sortOption = sortOption
    }
}

export class SpecialInfo {
    type: string

    constructor(type: string) {
        this.type = type
    }
}

//&itemCategories[0].ItemSubType=19&itemCategories[0].ItemType=Asset&itemCategories[1].ItemSubType=8&itemCategories[1].ItemType=Asset&itemCategories[2].ItemSubType=42&itemCategories[2].ItemType=Asset&itemCategories[3].ItemSubType=43&itemCategories[3].ItemType=Asset&itemCategories[4].ItemSubType=44&itemCategories[4].ItemType=Asset&itemCategories[5].ItemSubType=45&itemCategories[5].ItemType=Asset&itemCategories[6].ItemSubType=46&itemCategories[6].ItemType=Asset&itemCategories[7].ItemSubType=47&itemCategories[7].ItemType=Asset
export const AllAccessorySorts = [
    new ItemSort(19), new ItemSort(8), new ItemSort(42), new ItemSort(43), new ItemSort(44), new ItemSort(45), new ItemSort(46), new ItemSort(47)
]
if (!HAIR_IS_BODYPART) {
    AllAccessorySorts.push(new ItemSort(41))
}

//itemCategories[0].ItemSubType=12&itemCategories[0].ItemType=Asset&itemCategories[1].ItemSubType=11&itemCategories[1].ItemType=Asset&itemCategories[2].ItemSubType=2&itemCategories[2].ItemType=Asset&itemCategories[3].ItemSubType=72&itemCategories[3].ItemType=Asset&itemCategories[4].ItemSubType=67&itemCategories[4].ItemType=Asset&itemCategories[5].ItemSubType=70&itemCategories[5].ItemType=Asset&itemCategories[6].ItemSubType=71&itemCategories[6].ItemType=Asset&itemCategories[7].ItemSubType=66&itemCategories[7].ItemType=Asset&itemCategories[8].ItemSubType=65&itemCategories[8].ItemType=Asset&itemCategories[9].ItemSubType=69&itemCategories[9].ItemType=Asset&itemCategories[10].ItemSubType=68&itemCategories[10].ItemType=Asset&itemCategories[11].ItemSubType=64&itemCategories[11].ItemType=Asset
export const AllClothingSorts = [
    new ItemSort(12), new ItemSort(11), new ItemSort(2), new ItemSort(72), new ItemSort(67), new ItemSort(70), new ItemSort(71), new ItemSort(66), new ItemSort(65), new ItemSort(69), new ItemSort(68), new ItemSort(64)
]

//&itemCategories[0].ItemSubType=18&itemCategories[0].ItemType=Asset&itemCategories[1].ItemSubType=17&itemCategories[1].ItemType=Asset&itemCategories[2].ItemSubType=29&itemCategories[2].ItemType=Asset&itemCategories[3].ItemSubType=30&itemCategories[3].ItemType=Asset&itemCategories[4].ItemSubType=28&itemCategories[4].ItemType=Asset&itemCategories[5].ItemSubType=31&itemCategories[5].ItemType=Asset&itemCategories[6].ItemSubType=27&itemCategories[6].ItemType=Asset&itemCategories[7].ItemSubType=41&itemCategories[7].ItemType=Asset
export const AllBodyPartsSorts = [
    new ItemSort(18), new ItemSort(17), new ItemSort(29), new ItemSort(30), new ItemSort(28), new ItemSort(31), new ItemSort(27)
]
if (HAIR_IS_BODYPART) {
    AllBodyPartsSorts.push(new ItemSort(41))
}

//itemCategories[0].ItemSubType=48&itemCategories[0].ItemType=Asset&itemCategories[1].ItemSubType=50&itemCategories[1].ItemType=Asset&itemCategories[2].ItemSubType=51&itemCategories[2].ItemType=Asset&itemCategories[3].ItemSubType=52&itemCategories[3].ItemType=Asset&itemCategories[4].ItemSubType=53&itemCategories[4].ItemType=Asset&itemCategories[5].ItemSubType=54&itemCategories[5].ItemType=Asset&itemCategories[6].ItemSubType=55&itemCategories[6].ItemType=Asset&itemCategories[7].ItemSubType=61&itemCategories[7].ItemType=Asset
export const AllAnimationSorts = [
    new ItemSort(48), new ItemSort(50), new ItemSort(51), new ItemSort(52), new ItemSort(53), new ItemSort(54), new ItemSort(55), //new ItemSort(61)
]

//itemCategories[0].ItemSubType=1&itemCategories[0].ItemType=Outfit&itemCategories[1].ItemSubType=5&itemCategories[1].ItemType=Outfit
export const AllCharacterSorts = [
    new ItemSort(1, "Outfit"), new ItemSort(5, "Outfit")
]

//Source -> Category -> SubCategory
export const CategoryDictionary: { [K in string]: { [K in string]: { [K in string]: SortInfo | SpecialInfo } } } = {
    "Inventory": {
        "Recent": {
            "All": new SortInfo([], "recentAdded"),
            "Recent Worn": new SortInfo([], "2"),
            "Accessories": new SortInfo(AllAccessorySorts, "recentEquipped"),
            "Clothing": new SortInfo(AllClothingSorts, "recentEquipped"),
            "Body": new SortInfo(AllBodyPartsSorts, "recentEquipped"),
            "Animations": new SortInfo(AllAnimationSorts, "recentEquipped"),
            "Characters": new SortInfo([new ItemSort(1, "Outfit")], "recentEquipped"),
        },
        "Avatars": {
            "Creations": new SortInfo([new ItemSort(3, "Outfit")]),
            "Purchased": new SortInfo(AllCharacterSorts),
            "Local": new SpecialInfo("LocalOutfits")
        },
        "Clothing": {
            "All": new SortInfo(AllClothingSorts),
            "Shirts": new SortInfo([new ItemSort(AssetTypeNameToId.get("Shirt") || 0)]),
            "Pants": new SortInfo([new ItemSort(AssetTypeNameToId.get("Pants") || 0)]),
            "T-Shirts": new SortInfo([new ItemSort(AssetTypeNameToId.get("TShirt") || 0)]),
            "Tops": new SortInfo([new ItemSort(AssetTypeNameToId.get("TShirtAccessory") || 0), new ItemSort(AssetTypeNameToId.get("ShirtAccessory") || 0), new ItemSort(AssetTypeNameToId.get("SweaterAccessory") || 0)]),
            "Outerwear": new SortInfo([new ItemSort(AssetTypeNameToId.get("JacketAccessory") || 0)]),
            "Bottoms": new SortInfo([new ItemSort(AssetTypeNameToId.get("PantsAccessory") || 0), new ItemSort(AssetTypeNameToId.get("ShortsAccessory") || 0), new ItemSort(AssetTypeNameToId.get("DressSkirtAccessory") || 0)]),
            "Shoes": new SortInfo([new ItemSort(AssetTypeNameToId.get("LeftShoeAccessory") || 0), new ItemSort(AssetTypeNameToId.get("RightShoeAccessory") || 0)]),
        },
        "Accessories": {
            "All": new SortInfo(AllAccessorySorts),
            "Hair": new SortInfo([new ItemSort(41)]),
            "Head": new SortInfo([new ItemSort(AssetTypeNameToId.get("Hat") || 0)]),
            "Face": new SortInfo([new ItemSort(AssetTypeNameToId.get("FaceAccessory") || 0)]),
            "Neck": new SortInfo([new ItemSort(AssetTypeNameToId.get("NeckAccessory") || 0)]),
            "Shoulders": new SortInfo([new ItemSort(AssetTypeNameToId.get("ShoulderAccessory") || 0)]),
            "Front": new SortInfo([new ItemSort(AssetTypeNameToId.get("FrontAccessory") || 0)]),
            "Back": new SortInfo([new ItemSort(AssetTypeNameToId.get("BackAccessory") || 0)]),
            "Waist": new SortInfo([new ItemSort(AssetTypeNameToId.get("WaistAccessory") || 0)]),
            "Gear": new SortInfo([new ItemSort(AssetTypeNameToId.get("Gear") || 0)]),
        },
        "Head": {
            "Dynamic Heads": new SortInfo([new ItemSort(2, "Outfit")]),
            "Heads": new SortInfo([new ItemSort(17)]),
            "Faces": new SortInfo([new ItemSort(18)]),
            "Eyebrows": new SortInfo([new ItemSort(AssetTypeNameToId.get("EyebrowAccessory") || 0)], "inventory"),
            "Eyelashes": new SortInfo([new ItemSort(AssetTypeNameToId.get("EyelashAccessory") || 0)], "inventory"),
        },
        "Body": {
            "Skin Color": new SpecialInfo("Skin Color"),
            "Scale": new SpecialInfo("Scale"),
            "Torso": new SortInfo([new ItemSort(27)]),
            "Left Arm": new SortInfo([new ItemSort(29)]),
            "Right Arm": new SortInfo([new ItemSort(28)]),
            "Left Leg": new SortInfo([new ItemSort(30)]),
            "Right Leg": new SortInfo([new ItemSort(31)]),
        },
        "Animations": {
            "All": new SortInfo(AllAnimationSorts),
            "Emotes": new SpecialInfo("Emotes"),
            "_Emotes": new SortInfo([new ItemSort(AssetTypeNameToId.get("EmoteAnimation") || 0)]),
            "Idle": new SortInfo([new ItemSort(51)]),
            "Walk": new SortInfo([new ItemSort(55)]),
            "Run": new SortInfo([new ItemSort(53)]),
            "Fall": new SortInfo([new ItemSort(50)]),
            "Jump": new SortInfo([new ItemSort(52)]),
            "Swim": new SortInfo([new ItemSort(54)]),
            "Climb": new SortInfo([new ItemSort(48)]),
            "Mood": new SortInfo([new ItemSort(AssetTypeNameToId.get("MoodAnimation") || 0)], "inventory"),
        }
    }
}

export const DefaultSearchData: {[K in string]: {[K in string]: unknown}} = {
    "Inventory": {
        includeOffsale: true,
        limitedOnly: false,
    },
    "Marketplace": {
        includeOffsale: false,
        limitedOnly: false,
    }
}
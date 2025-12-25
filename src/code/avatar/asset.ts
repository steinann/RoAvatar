type VecXYZ = {X: number, Y: number, Z: number}

type AssetMetaJson = {
    version?: number

    position?: VecXYZ,
    rotation?: VecXYZ,
    scale?: VecXYZ,
    order?: number
    puffiness?: number
}

type AssetTypeJson = { id?: number; name?: string }

type AssetJson = {
    id?: number,
    name?: string,
    assetType?: AssetTypeJson,
    currentVersionId?: number,
    meta?: AssetMetaJson,
}

export const AssetTypes = [
    "",
    "Image",
    "TShirt",
    "Audio",
    "Mesh",
    "Lua",
    "",
    "",
    "Hat",
    "Place",
    "Model",
    "Shirt",
    "Pants",
    "Decal",
    "",
    "",
    "",
    "Head",
    "Face",
    "Gear",
    "",
    "Badge",
    "",
    "",
    "Animation",
    "",
    "",
    "Torso",
    "RightArm",
    "LeftArm",
    "LeftLeg",
    "RightLeg",
    "Package",
    "",
    "GamePass",
    "",
    "",
    "",
    "Plugin",
    "",
    "MeshPart",
    "HairAccessory",
    "FaceAccessory",
    "NeckAccessory",
    "ShoulderAccessory",
    "FrontAccessory",
    "BackAccessory",
    "WaistAccessory",
    "ClimbAnimation",
    "DeathAnimation",
    "FallAnimation",
    "IdleAnimation",
    "JumpAnimation",
    "RunAnimation",
    "SwimAnimation",
    "WalkAnimation",
    "PoseAnimation",
    "EarAccessory",
    "EyeAccessory",
    "",
    "",
    "EmoteAnimation",
    "Video",
    "",
    "TShirtAccessory",
    "ShirtAccessory",
    "PantsAccessory",
    "JacketAccessory",
    "SweaterAccessory",
    "ShortsAccessory",
    "LeftShoeAccessory",
    "RightShoeAccessory",
    "DressSkirtAccessory",
    "FontFamily",
    "",
    "",
    "EyebrowAccessory",
    "EyelashAccessory",
    "MoodAnimation",
    "DynamicHead",
]

export const WearableAssetTypes = [
    "TShirt",
    "Hat",
    "Shirt",
    "Pants",
    "Head",
    "Face",
    "Gear",
    "Torso",
    "RightArm",
    "LeftArm",
    "LeftLeg",
    "RightLeg",
    "HairAccessory",
    "FaceAccessory",
    "NeckAccessory",
    "ShoulderAccessory",
    "FrontAccessory",
    "BackAccessory",
    "WaistAccessory",
    "ClimbAnimation",
    "FallAnimation",
    "IdleAnimation",
    "JumpAnimation",
    "RunAnimation",
    "SwimAnimation",
    "WalkAnimation",
    "TShirtAccessory",
    "ShirtAccessory",
    "PantsAccessory",
    "JacketAccessory",
    "SweaterAccessory",
    "ShortsAccessory",
    "LeftShoeAccessory",
    "RightShoeAccessory",
    "DressSkirtAccessory",
    "EyebrowAccessory",
    "EyelashAccessory",
    "MoodAnimation",
    "DynamicHead",

    "PoseAnimation",
    "EarAccessory",
    "EyeAccessory",
    "DeathAnimation",
]

export const AccessoryAssetTypes = [
    "Hat",
    "HairAccessory",
    "FaceAccessory",
    "NeckAccessory",
    "ShoulderAccessory",
    "FrontAccessory",
    "BackAccessory",
    "WaistAccessory",
]

export const LayeredAssetTypes = [
    "TShirtAccessory",
    "ShirtAccessory",
    "PantsAccessory",
    "JacketAccessory",
    "SweaterAccessory",
    "ShortsAccessory",
    "LeftShoeAccessory",
    "RightShoeAccessory",
    "DressSkirtAccessory",

    "EyebrowAccessory",
    "EyelashAccessory",

    "HairAccessory",
]

export const SpecialLayeredAssetTypes = [
    "EyebrowAccessory",
    "EyelashAccessory",
    "HairAccessory",
]

export const MaxOneOfAssetTypes = [
    "TShirt",
    "Shirt",
    "Pants",
    "Head",
    "Face",
    "Gear",
    "Torso",
    "RightArm",
    "LeftArm",
    "LeftLeg",
    "RightLeg",
    "ClimbAnimation",
    "DeathAnimation",
    "FallAnimation",
    "IdleAnimation",
    "JumpAnimation",
    "RunAnimation",
    "SwimAnimation",
    "WalkAnimation",
    "PoseAnimation",
    "MoodAnimation",
    "DynamicHead",
    "EyebrowAccessory",
    "EyelashAccessory",
]

export const ToRemoveBeforeBundleType = {
    "DynamicHead": ["MoodAnimation", "DynamicHead", "EyebrowAccessory", "EyelashAccessory", "Head"],
    "Shoes": ["LeftShoeAccessory", "RightShoeAccessory"],
    "AnimationPack": [
        "ClimbAnimation",
        "DeathAnimation",
        "FallAnimation",
        "IdleAnimation",
        "JumpAnimation",
        "RunAnimation",
        "SwimAnimation",
        "WalkAnimation",
        "PoseAnimation",
        "MoodAnimation",
    ]
}

export const AssetTypeNameToId = new Map<string,number>()
for (let i = 0; i < AssetTypes.length; i++) {
    const name = AssetTypes[i]
    AssetTypeNameToId.set(name, i)
}

export const ActualBundleTypes = [ //names used by Roblox
    "",
    "Avatar", //traditional bundle
    "DynamicHead",
    "Avatar", //outfit
    "Shoes",
    "Avatar", //animation pack
]

export const BundleTypes = [
    "",
    "Character",
    "DynamicHead",
    "Outfit",
    "Shoes",
    "AnimationPack"
]

type ItemType = "Asset" | "Bundle" | "None"
export class ItemInfo {
    itemType: ItemType
    type: string
    id: number
    name: string
    
    constructor(itemType: ItemType, type: string, id: number, name: string) {
        this.itemType = itemType
        this.type = type
        this.id = id
        this.name = name
    }
}

class AssetType {
    _id: number //67
    name: string //JacketAccessory

    constructor() {
        this._id = 2
        this.name = "TShirt"
    }

    clone() {
        const copy = new AssetType()
        copy.id = this.id
        copy.name = this.name
        
        return copy
    }

    toJson() {
        return {
            "id": this.id,
            "name": this.name,
        }
    }

    fromJson(assetTypeJson: AssetTypeJson) {
        if (assetTypeJson.id)
            this.id = assetTypeJson.id
        if (assetTypeJson.name)
            this.name = assetTypeJson.name
    }

    set id(newId) {
        this._id = newId
        this.name = AssetTypes[Number(newId)]
    }

    get id() {
        return this._id
    }
}

function cloneVecXYZ(vec: VecXYZ): VecXYZ {
    return {X: vec.X, Y: vec.Y, Z: vec.Z}
}

class AssetMeta {
    version: number
    order?: number
    puffiness?: number //deprecated by roblox

    position?: VecXYZ
    rotation?: VecXYZ
    scale?: VecXYZ

    constructor() {
        this.version = 1
    }

    clone() {
        const copy = new AssetMeta()
        copy.version = this.version
        copy.order = this.order
        copy.puffiness = this.puffiness

        if (this.position) copy.position = cloneVecXYZ(this.position)
        if (this.rotation) copy.rotation = cloneVecXYZ(this.rotation)
        if (this.scale) copy.scale = cloneVecXYZ(this.scale)

        return copy
    }

    toJson() {
        const toReturn: AssetMetaJson = {
            "version": this.version,
            "position": this.position,
            "rotation": this.rotation,
            "scale": this.scale,
        }

        if (this.order || this.order == 0) {
            toReturn["order"] = this.order
        }
        if (this.puffiness || this.puffiness == 0) {
            toReturn["puffiness"] = this.puffiness
        }

        return toReturn
    }

    fromJson(assetMetaJson: AssetMetaJson) {
        if (assetMetaJson.version) {
            this.version = assetMetaJson.version
        }

        this.order = assetMetaJson.order
        this.puffiness = assetMetaJson.puffiness

        this.position = assetMetaJson.position
        this.rotation = assetMetaJson.rotation
        this.scale = assetMetaJson.scale
    }
}

class Asset {
    id: number = 0
    name: string = "Error"

    assetType: AssetType = new AssetType()
    currentVersionId?: number

    meta?: AssetMeta //only present on layered clothing and positioned assets

    //class only
    notOwned?: boolean

    clone() {
        const copy = new Asset()
        copy.id = this.id
        copy.name = this.name

        copy.assetType = this.assetType.clone()
        copy.currentVersionId = this.currentVersionId

        if (this.meta) copy.meta = this.meta.clone()

        copy.notOwned = this.notOwned

        return copy
    }

    toJson() {
        const toReturn: AssetJson = {
            "id": this.id,
            "name": this.name,
            "assetType": this.assetType.toJson(),
            "currentVersionId": this.currentVersionId,
        }

        if (this.meta) {
            toReturn["meta"] = this.meta.toJson()
        }

        return toReturn
    }

    fromJson(assetJson: AssetJson) {
        this.id = Number(assetJson.id)
        if (assetJson.name)
            this.name = assetJson.name

        this.assetType = new AssetType()
        if (assetJson.assetType)
            this.assetType.fromJson(assetJson.assetType)

        this.currentVersionId = assetJson.currentVersionId
        
        if (assetJson.meta) {
            this.meta = new AssetMeta()
            this.meta.fromJson(assetJson.meta)
        }
    }

    setOrder(order: number) {
        if (!this.meta) {
            this.meta = new AssetMeta()
        }

        this.meta.order = order
    }
}

export { AssetType, AssetMeta, Asset }
export type { AssetTypeJson, AssetMetaJson, AssetJson }

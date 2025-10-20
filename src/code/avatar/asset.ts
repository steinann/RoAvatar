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

const AssetTypes = [
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

class AssetType {
    _id: number //67
    name: string //JacketAccessory

    constructor() {
        this._id = 2
        this.name = "TShirt"
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
}

export { AssetType, AssetMeta, Asset }
export type { AssetTypeJson, AssetMetaJson, AssetJson }

//Dependencies: asset.js

import { API } from "../api";
import SimpleView from "../lib/simple-view";
import { BODYCOLOR3 } from "../misc/flags"
import { download, hexToRgb, mapNum, rgbToHex } from "../misc/misc";
import { changeXMLProperty, setXMLProperty } from "../misc/xml";
import { AccessoryAssetTypes, Asset, AssetMeta, AssetType, AssetTypeNameToId, AssetTypes, CatalogBundleTypes, LayeredAssetTypes, MaxOneOfAssetTypes, ToRemoveBeforeBundleType, WearableAssetTypes } from "./asset";
import type { AssetJson } from "./asset"
import { AvatarType, BrickColors, LayeredClothingAssetOrder, MaxPerAsset, OutfitOrigin } from "./constant"

function createAccessoryBlob(asset: Asset, assetType: string) {
    return {"Order": asset.meta?.order, "AssetId": asset.id, "AccessoryType": assetType, "Puffiness": asset.meta?.puffiness}
}

export type ColorType = "BrickColor" | "Color3"
type ValidationIssueType = "AccessoryLimit" | "LayeredLimit" | "OneOfTypeLimit" | "DuplicateId" | "NotWearable" | "MissingLayeredMeta" | "InvalidAsset"
type ValidationIssue = {
    type: ValidationIssueType,
    text: string,
    assetIndex?: number,
}

type ScaleJson = {
    height?: number,
    width?: number,
    head?: number,
    depth?: number,
    proportion?: number,
    bodyType?: number,
}

type BodyColor3sJson = { headColor3?: string; torsoColor3?: string; rightArmColor3?: string; leftArmColor3?: string; rightLegColor3?: string; leftLegColor3?: string; }
type BodyColorsJson = { headColorId?: number; torsoColorId?: number; rightArmColorId?: number; leftArmColorId?: number; rightLegColorId?: number; leftLegColorId?: number; }

type OutfitJson = {
    scale?: ScaleJson;
    playerAvatarType?: AvatarType;
    assets?: AssetJson[];
    outfitType?: string;
    name?: string;
    creatorId?: number;
    outfitId?: number;
    collections?: string[];
    creationDate?: number;
    bodyColors?: BodyColorsJson;
    bodyColor3s?: BodyColor3sJson;
    id?: number;

    scales?: ScaleJson //i hate this inconsistency, my code will always use scale
}

export type ScaleName = "height" | "width" | "head" | "depth" | "proportion" | "bodyType"
export class Scale {
    height!: number //1
    width!: number //1
    head!: number //0.95
    depth!: number //1
    proportion!: number //0.5
    bodyType!: number //0

    constructor() {
        this.reset()
    }

    clone() {
        const copy = new Scale()
        copy.height = this.height
        copy.width = this.width
        copy.head = this.head
        copy.depth = this.depth
        copy.proportion = this.proportion
        copy.bodyType = this.bodyType

        return copy
    }

    reset() {
        this.height = 1
        this.width = 1
        this.head = 1
        this.depth = 1
        this.proportion = 0
        this.bodyType = 0
    }

    toJson() {
        return {
            "height": this.height,
            "width": this.width,
            "head": this.head,
            "depth": this.depth,
            "proportion": this.proportion,
            "bodyType": this.bodyType,
        }
    }

    fromJson(scaleJson: ScaleJson) {
        if (scaleJson.height)
            this.height = scaleJson.height
        if (scaleJson.width)
            this.width = scaleJson.width
        if (scaleJson.head)
            this.head = scaleJson.head
        if (scaleJson.depth)
            this.depth = scaleJson.depth
        if (scaleJson.proportion)
            this.proportion = scaleJson.proportion
        if (scaleJson.bodyType)
            this.bodyType = scaleJson.bodyType
    }
}

type BodyColor3Name = "headColor3" | "torsoColor3" | "rightArmColor3" | "leftArmColor3" | "rightLegColor3" | "leftLegColor3"
export class BodyColor3s {
    colorType: ColorType //Color3

    headColor3!: string // FFFFFF

    torsoColor3!: string

    rightArmColor3!: string
    leftArmColor3!: string

    rightLegColor3!: string
    leftLegColor3!: string

    constructor() {
        this.colorType = "Color3"

        this.setAll("FFFFFF")
    }

    clone() {
        const copy = new BodyColor3s()
        copy.colorType = this.colorType

        copy.headColor3 = this.headColor3

        copy.torsoColor3 = this.torsoColor3

        copy.rightArmColor3 = this.rightArmColor3
        copy.leftArmColor3 = this.leftArmColor3
        
        copy.rightLegColor3 = this.rightLegColor3
        copy.leftLegColor3 = this.leftLegColor3

        return copy
    }

    setAll(color: string) {
        this.headColor3 = color

        this.torsoColor3 = color

        this.rightArmColor3 = color
        this.leftArmColor3 = color

        this.rightLegColor3 = color
        this.leftLegColor3 = color
    }

    toJson(): BodyColor3sJson {
        return {
            "headColor3": this.headColor3,
            "torsoColor3": this.torsoColor3,

            "rightArmColor3": this.rightArmColor3,
            "leftArmColor3": this.leftArmColor3,

            "rightLegColor3": this.rightLegColor3,
            "leftLegColor3": this.leftLegColor3,
        }
    }
    toHexJson() {
        return {
            "headColor": this.headColor3,
            "torsoColor": this.torsoColor3,

            "rightArmColor": this.rightArmColor3,
            "leftArmColor": this.leftArmColor3,

            "rightLegColor": this.rightLegColor3,
            "leftLegColor": this.leftLegColor3,
        }
    }


    fromJson(bodyColorsJson: BodyColor3sJson) {
        if (bodyColorsJson.headColor3)
            this.headColor3 = bodyColorsJson.headColor3
        if (bodyColorsJson.torsoColor3)
            this.torsoColor3 = bodyColorsJson.torsoColor3

        if (bodyColorsJson.rightArmColor3)
            this.rightArmColor3 = bodyColorsJson.rightArmColor3
        if (bodyColorsJson.leftArmColor3)
            this.leftArmColor3 = bodyColorsJson.leftArmColor3

        if (bodyColorsJson.rightLegColor3)
            this.rightLegColor3 = bodyColorsJson.rightLegColor3
        if (bodyColorsJson.leftLegColor3)
            this.leftLegColor3 = bodyColorsJson.leftLegColor3
    }
}

export class BodyColors {
    colorType: ColorType //BrickColor

    headColorId!: number //1001 - Institutional White

    torsoColorId!: number

    rightArmColorId!: number
    leftArmColorId!: number

    rightLegColorId!: number
    leftLegColorId!: number

    constructor() {
        this.colorType = "BrickColor"

        this.setAll(1001)
    }

    clone() {
        const copy = new BodyColors()

        copy.colorType = this.colorType

        copy.headColorId = this.headColorId
        
        copy.torsoColorId = this.torsoColorId
        
        copy.rightArmColorId = this.rightArmColorId
        copy.leftArmColorId = this.leftArmColorId
        
        copy.rightLegColorId = this.rightLegColorId
        copy.leftLegColorId = this.leftLegColorId

        return copy
    }

    setAll(colorId: number) {
        this.headColorId = colorId

        this.torsoColorId = colorId

        this.rightArmColorId = colorId
        this.leftArmColorId = colorId

        this.rightLegColorId = colorId
        this.leftLegColorId = colorId
    }

    toJson(): BodyColorsJson {
        return {
            "headColorId": this.headColorId,
            "torsoColorId": this.torsoColorId,

            "rightArmColorId": this.rightArmColorId,
            "leftArmColorId": this.leftArmColorId,

            "rightLegColorId": this.rightLegColorId,
            "leftLegColorId": this.leftLegColorId,
        }
    }

    toHexJson() {
        return {
            "headColor": BrickColors[this.headColorId],
            "torsoColor": BrickColors[this.torsoColorId],

            "rightArmColor": BrickColors[this.rightArmColorId],
            "leftArmColor": BrickColors[this.leftArmColorId],

            "rightLegColor": BrickColors[this.rightLegColorId],
            "leftLegColor": BrickColors[this.leftLegColorId],
        }
    }

    fromJson(bodyColorsJson: BodyColorsJson) {
        if (bodyColorsJson.headColorId)
            this.headColorId = bodyColorsJson.headColorId
        if (bodyColorsJson.torsoColorId)
            this.torsoColorId = bodyColorsJson.torsoColorId

        if (bodyColorsJson.rightArmColorId)
            this.rightArmColorId = bodyColorsJson.rightArmColorId
        if (bodyColorsJson.leftArmColorId)
            this.leftArmColorId = bodyColorsJson.leftArmColorId

        if (bodyColorsJson.rightLegColorId)
            this.rightLegColorId = bodyColorsJson.rightLegColorId
        if (bodyColorsJson.leftLegColorId)
            this.leftLegColorId = bodyColorsJson.leftLegColorId
    }

    toColor3(): BodyColor3s {
        const newBodyColor3s = new BodyColor3s()

        newBodyColor3s.headColor3 = BrickColors[this.headColorId].replace("#","")
        newBodyColor3s.torsoColor3 = BrickColors[this.torsoColorId].replace("#","")

        newBodyColor3s.rightArmColor3 = BrickColors[this.rightArmColorId].replace("#","")
        newBodyColor3s.leftArmColor3 = BrickColors[this.leftArmColorId].replace("#","")

        newBodyColor3s.rightLegColor3 = BrickColors[this.rightLegColorId].replace("#","")
        newBodyColor3s.leftLegColor3 = BrickColors[this.leftLegColorId].replace("#","")

        return newBodyColor3s
    }
}

export class Outfit {
    scale: Scale = new Scale()
    bodyColors: BodyColors | BodyColor3s = new BodyColor3s()
    playerAvatarType: AvatarType = "R15"

    assets: Asset[] = []

    //outfits only
    name: string = "New Outfit"
    _id: number = 1

    //class only
    origin?: OutfitOrigin
    _creatorId?: number
    creationDate?: number
    cachedImage?: string //outfits saved to computer
    editable?: boolean
    collections?: string[] //collections this outfit is stored in

    /**
     * @param {number} newId
     */
    set id (newId) {
        this._id = Number(newId)
    }

    get id() {
        return this._id
    }

    /**
     * @param {number} newId
     */
    set creatorId (newId) {
        this._creatorId = Number(newId)
    }

    get creatorId() {
        return this._creatorId
    }

    constructor() {
        this.creationDate = Date.now()
    }

    clone() {
        const copy = new Outfit()
        copy.scale = this.scale.clone()
        copy.bodyColors = this.bodyColors.clone()
        copy.playerAvatarType = this.playerAvatarType

        copy.assets = []
        for (const asset of this.assets) {
            copy.assets.push(asset.clone())
        }

        copy.name = this.name
        copy.id = this.id
        
        copy.origin = this.origin
        copy.creatorId = this.creatorId
        copy.creationDate = this.creationDate
        copy.cachedImage = this.cachedImage
        copy.editable = this.editable
        if (this.collections) {
            copy.collections = []
            for (const collection of this.collections) {
                copy.collections.push(collection)
            }
        } else {
            copy.collections = undefined
        }

        return copy
    }

    toJson(removeNotOwnedAssets: boolean = false) {
        const outfitJson: OutfitJson = {
            "scale": this.scale.toJson(),
            "playerAvatarType": this.playerAvatarType,

            "assets": this.getAssetsJson(removeNotOwnedAssets),

            "outfitType": "Avatar",
            "name": this.name,

            //for computer outfits
            "creatorId": this.creatorId,
            "outfitId": this.id,
            "collections": this.collections,
            "creationDate": this.creationDate,
        }

        if (this.bodyColors.colorType === "BrickColor") {
            outfitJson.bodyColors = this.bodyColors.toJson() as BodyColors
        } else if (this.bodyColors.colorType === "Color3") {
            outfitJson.bodyColor3s = this.bodyColors.toJson() as BodyColor3s
        }

        return outfitJson
    }

    toCleanJson(removeNotOwnedAssets: boolean = false) {
        const ogJson = this.toJson(removeNotOwnedAssets)
        ogJson.creatorId = undefined
        ogJson.outfitType = undefined
        ogJson.collections = undefined

        return ogJson
    }

    fromJson(outfitJson: OutfitJson) {
        //scale
        this.scale = new Scale()
        if (outfitJson.scale) {
            this.scale.fromJson(outfitJson.scale)
        } else if (outfitJson.scales) {
            this.scale.fromJson(outfitJson.scales)
        }

        //bodycolors
        const bodyColorsJson: BodyColor3sJson | BodyColorsJson | undefined = outfitJson.bodyColors

        if (bodyColorsJson && !("headColor3" in bodyColorsJson)) {
            const oldBodyColors = new BodyColors()
            oldBodyColors.fromJson(bodyColorsJson)

            if (BODYCOLOR3) {
                this.bodyColors = oldBodyColors.toColor3()
            } else {
                this.bodyColors = oldBodyColors
            }
        } else if (outfitJson.bodyColor3s) {
            if (!BODYCOLOR3) {
                throw new Error("Creating BodyColor3s while they are disabled!")
            }

            this.bodyColors = new BodyColor3s()
            this.bodyColors.fromJson(outfitJson.bodyColor3s)
        } else if (bodyColorsJson) {
            this.bodyColors = new BodyColor3s()
            this.bodyColors.fromJson(bodyColorsJson as BodyColor3sJson)
        }

        //playerAvatarType
        if (outfitJson.playerAvatarType)
            this.playerAvatarType = outfitJson.playerAvatarType

        //assets
        if (outfitJson.assets) {
            this.assets = []
            for (let i = 0; i < outfitJson.assets.length; i++) {
                const asset = new Asset()
                asset.fromJson(outfitJson.assets[i])
                this.assets.push(asset)
            }
        }

        //name
        if (outfitJson.name) {
            this.name = outfitJson.name
        } else {
            this.name = "Avatar"
        }

        //id
        if (outfitJson.id || outfitJson.outfitId) {
            if (outfitJson.outfitId)
                this.id = outfitJson.outfitId
            if (outfitJson.id)
                this.id = outfitJson.id
        }

        //creatorId
        if (outfitJson.creatorId) {
            this.creatorId = outfitJson.creatorId
        }

        //collections
        if (outfitJson.collections) {
            this.collections = outfitJson.collections
        }

        //creationDate
        if (outfitJson.creationDate) {
            this.creationDate = outfitJson.creationDate
        }

        this.fixOrders()
    }

    /**
     * @deprecated Incorrect, use getValidationIssues() instead
     */
    isValid() {
        const count: {[K in string]: number} = {}

        for (let i = 0; i < this.assets.length; i++) {
            if (MaxPerAsset[this.assets[i].assetType.name]) {
                if (!count[this.assets[i].assetType.name]) {
                    count[this.assets[i].assetType.name] = 1
                } else {
                    count[this.assets[i].assetType.name] += 1
                }
            }
        }

        for (const key in count) {
            if (count[key]) {
                if (MaxPerAsset[key] < count[key]) {
                    //AlertMessage("Exceeded maximum of: " + key, true, 5)
                    return false
                }
            }
        }

        return true
    }

    getValidationIssues(): ValidationIssue[] {
        const issues: ValidationIssue[] = []

        const usedIds: number[] = []

        let totalAccessories = 0
        let totalLayered = 0

        for (let i = 0; i < this.assets.length; i++) {
            const asset = this.assets[i]

            //check for type
            if (!(asset instanceof Asset)) {
                issues.push({
                    type: "InvalidAsset",
                    text: "Asset is not of type Asset",
                    assetIndex: i,
                })
                continue;
            }

            //check for valid structure
            let structureIsValid = true
            if (typeof asset.id !== "number" || isNaN(asset.id) || asset.id < 1 || Math.floor(asset.id) !== asset.id) {
                structureIsValid = false
            }
            if (typeof asset.name !== "string") {
                structureIsValid = false
            }
            if (asset.currentVersionId) {
                if (typeof asset.currentVersionId !== "number") {
                    structureIsValid = false
                }
            }

            if (!structureIsValid) {
                issues.push({
                    type: "InvalidAsset",
                    text: "Asset has invalid structure",
                    assetIndex: i,
                })
                continue;
            }

            //accessory limit
            if (AccessoryAssetTypes.includes(asset.assetType.name)) {
                totalAccessories += 1

                if (totalAccessories > 10) {
                    issues.push({
                        type: "AccessoryLimit",
                        text: "Too many accessories",
                        assetIndex: i,
                    })
                }
            }

            //layered limit
            if (LayeredAssetTypes.includes(asset.assetType.name)) {
                totalLayered += 1

                if (totalLayered > 10) {
                    issues.push({
                        type: "LayeredLimit",
                        text: "Too many layered accessories",
                        assetIndex: i,
                    })
                }
            }

            //one of type limit
            if (MaxOneOfAssetTypes.includes(asset.assetType.name)) {
                for (let j = 0; j < this.assets.length; j++) {
                    const otherAsset = this.assets[j]
                    if (otherAsset.assetType.name === asset.assetType.name && j < i) {
                        issues.push({
                            type: "OneOfTypeLimit",
                            text: `${asset.assetType.name} cannot be worn multiple times`,
                            assetIndex: i,
                        })
                    }
                }
            }

            //duplicate id
            if (usedIds.includes(asset.id)) {
                issues.push({
                    type: "DuplicateId",
                    text: "Same asset worn twice",
                    assetIndex: i,
                })
            } else {
                usedIds.push(asset.id)
            }

            //not wearable type
            if (!WearableAssetTypes.includes(asset.assetType.name)) {
                issues.push({
                    type: "NotWearable",
                    text: `${asset.assetType.name} is not wearable`,
                    assetIndex: i,
                })
            }

            //check for layered meta
            if (!AccessoryAssetTypes.includes(asset.assetType.name) && LayeredAssetTypes.includes(asset.assetType.name)) {
                if (asset.meta) {
                    if (typeof asset.meta.order !== "number") {
                        issues.push({
                            type: "MissingLayeredMeta",
                            text: "Layered accessory is missing order",
                            assetIndex: i,
                        })
                    }
                }
            }
        }

        return issues
    }

    async toHumanoidDescription(): Promise<Document | null> { //TODO: work with accessory adjustment
        const response = await fetch("/assets/HumanoidDescriptionTemplate.xml")
        if (response.status !== 200) 
            return null
        
        const responseText = await response.text()
        const HumanoidDescription = new window.DOMParser().parseFromString(responseText, "text/xml")

        const AccessoryBlob = [] //layered clothing

        //assets
        for (let i = 0; i < this.assets.length; i++) {
            if (this.assets[i].assetType.name.endsWith("Accessory")) {
                switch (this.assets[i].assetType.name) {
                    //regular accessories
                    case "BackAccessory":
                        changeXMLProperty(HumanoidDescription, "BackAccessory", this.assets[i].id)
                        break;
                    case "FaceAccessory":
                        changeXMLProperty(HumanoidDescription, "FaceAccessory", this.assets[i].id)
                        break;
                    case "FrontAccessory":
                        changeXMLProperty(HumanoidDescription, "FrontAccessory", this.assets[i].id)
                        break;
                    case "HairAccessory":
                        changeXMLProperty(HumanoidDescription, "HairAccessory", this.assets[i].id)
                        break;
                    case "NeckAccessory":
                        changeXMLProperty(HumanoidDescription, "NeckAccessory", this.assets[i].id)
                        break;
                    case "ShoulderAccessory":
                        changeXMLProperty(HumanoidDescription, "ShouldersAccessory", this.assets[i].id)
                        break;
                    case "WaistAccessory":
                        changeXMLProperty(HumanoidDescription, "WaistAccessory", this.assets[i].id)
                        break;
                    
                    //layered clothing
                    case "DressSkirtAccessory":
                        AccessoryBlob.push(createAccessoryBlob(this.assets[i], "DressSkirt"))
                        break;
                    case "ShortsAccessory":
                        AccessoryBlob.push(createAccessoryBlob(this.assets[i], "Shorts"))
                        break;
                    case "JacketAccessory":
                        AccessoryBlob.push(createAccessoryBlob(this.assets[i], "Jacket"))
                        break;
                    case "ShirtAccessory":
                        AccessoryBlob.push(createAccessoryBlob(this.assets[i], "Shirt"))
                        break;
                    case "SweaterAccessory":
                        AccessoryBlob.push(createAccessoryBlob(this.assets[i], "Sweater"))
                        break;
                    case "TShirtAccessory":
                        AccessoryBlob.push(createAccessoryBlob(this.assets[i], "TShirt"))
                        break;
                    case "PantsAccessory":
                        AccessoryBlob.push(createAccessoryBlob(this.assets[i], "Pants"))
                        break;
                    case "LeftShoeAccessory":
                        AccessoryBlob.push(createAccessoryBlob(this.assets[i], "LeftShoe"))
                        break;
                    case "RightShoeAccessory":
                        AccessoryBlob.push(createAccessoryBlob(this.assets[i], "RightShoe"))
                        break;
                    case "EyebrowAccessory":
                        AccessoryBlob.push(createAccessoryBlob(this.assets[i], "Eyebrow"))
                        break;
                    
                    default:
                        console.log("Unknown accessory type: " + this.assets[i].assetType.name)
                        break;
                }
            } else if (this.assets[i].assetType.name.endsWith("Animation")) { //animations
                setXMLProperty(HumanoidDescription, this.assets[i].assetType.name, this.assets[i].id)
            } else { //clothes and body parts and hats
                if (this.assets[i].assetType.name != "DynamicHead" && this.assets[i].assetType.name != "TShirt" && this.assets[i].assetType.name != "Hat") {
                    setXMLProperty(HumanoidDescription, this.assets[i].assetType.name, this.assets[i].id)
                } else {
                    switch (this.assets[i].assetType.name) {
                        case "DynamicHead":
                            setXMLProperty(HumanoidDescription, "Head", this.assets[i].id)
                            break;
                        case "TShirt":
                            setXMLProperty(HumanoidDescription, "GraphicTShirt", this.assets[i].id)
                            break;
                        case "Hat":
                            changeXMLProperty(HumanoidDescription, "HatAccessory", this.assets[i].id)
                            break;
                        
                        default:
                            console.log("Unknown asset type: " + this.assets[i].assetType.name)
                            break;
                    }
                }
            }
        }

        //set layered clothing accessory
        setXMLProperty(HumanoidDescription, "AccessoryBlob", JSON.stringify(AccessoryBlob).replaceAll('"',"&quot;"))

        //body colors
        let bodyColors = this.bodyColors

        if (this.bodyColors.colorType == "BrickColor") {
            bodyColors = (bodyColors as BodyColors).toColor3()
        }

        bodyColors = bodyColors as BodyColor3s

        const HeadColor = hexToRgb(bodyColors.headColor3.toLowerCase())

        const LeftArmColor = hexToRgb(bodyColors.leftArmColor3.toLowerCase())
        const LeftLegColor = hexToRgb(bodyColors.leftLegColor3.toLowerCase())

        const RightArmColor = hexToRgb(bodyColors.rightArmColor3.toLowerCase())
        const RightLegColor = hexToRgb(bodyColors.rightLegColor3.toLowerCase())
        
        const TorsoColor = hexToRgb(bodyColors.torsoColor3.toLowerCase())

        if (!HeadColor || !LeftArmColor || !LeftLegColor || !RightArmColor || !RightLegColor || !TorsoColor) {
            console.log(bodyColors)
            throw new Error("Invalid body color")
        }

        setXMLProperty(HumanoidDescription, "HeadColor", `
        <R>${HeadColor.r}</R>
        <G>${HeadColor.g}</G>
        <B>${HeadColor.b}</B>
        `)

        setXMLProperty(HumanoidDescription, "LeftArmColor", `
        <R>${LeftArmColor.r}</R>
        <G>${LeftArmColor.g}</G>
        <B>${LeftArmColor.b}</B>
        `)

        setXMLProperty(HumanoidDescription, "LeftLegColor", `
        <R>${LeftLegColor.r}</R>
        <G>${LeftLegColor.g}</G>
        <B>${LeftLegColor.b}</B>
        `)

        setXMLProperty(HumanoidDescription, "RightArmColor", `
        <R>${RightArmColor.r}</R>
        <G>${RightArmColor.g}</G>
        <B>${RightArmColor.b}</B>
        `)

        setXMLProperty(HumanoidDescription, "RightLegColor", `
        <R>${RightLegColor.r}</R>
        <G>${RightLegColor.g}</G>
        <B>${RightLegColor.b}</B>
        `)

        setXMLProperty(HumanoidDescription, "TorsoColor", `
        <R>${TorsoColor.r}</R>
        <G>${TorsoColor.g}</G>
        <B>${TorsoColor.b}</B>
        `)

        //scale
        setXMLProperty(HumanoidDescription, "BodyTypeScale", this.scale.bodyType)
        setXMLProperty(HumanoidDescription, "DepthScale", this.scale.depth)
        setXMLProperty(HumanoidDescription, "HeadScale", this.scale.head)
        setXMLProperty(HumanoidDescription, "HeightScale", this.scale.height)
        setXMLProperty(HumanoidDescription, "ProportionScale", this.scale.proportion)
        setXMLProperty(HumanoidDescription, "WidthScale", this.scale.width)

        //player avatar type
        if (this.playerAvatarType == "R6") {
            setXMLProperty(HumanoidDescription, "AttributesSerialize", "AQAAABAAAABQbGF5ZXJBdmF0YXJUeXBlAgIAAABSNg==")
        } else {
            setXMLProperty(HumanoidDescription, "AttributesSerialize", "AQAAABAAAABQbGF5ZXJBdmF0YXJUeXBlAgMAAABSMTU=")
        }

        //rocostumes tag
        setXMLProperty(HumanoidDescription, "Tags", "Uk9DT1NUVU1FU19BVVRPX0xPQUQ=")

        //name
        if (this.name) {
            setXMLProperty(HumanoidDescription, "Name", this.name)
        }

        return HumanoidDescription
    }

    //TODO: Implement
    async fromHumanoidDescription(rootDocument: Document) {
        const humanoidDescription = rootDocument.querySelector(".HumanoidDescription")
        console.log(humanoidDescription)
    }

    async downloadHumanoidDescription() {
        const humanoidDescription = await this.toHumanoidDescription()

        if (humanoidDescription) {
            const xmlText = new XMLSerializer().serializeToString(humanoidDescription);
            if (this.name) {
                download(this.name + ".rbxmx", xmlText)
            } else {
                download("HumanoidDescription.rbxmx", xmlText)
            }
        }
    }

    getAssetsJson(removeNotOwnedAssets: boolean = false) {
        const serializedAssets: AssetJson[] = []
        if (this.assets) {
            for (let i = 0; i < this.assets.length; i++) {
                if (!removeNotOwnedAssets || !this.assets[i].notOwned) {
                    serializedAssets.push(this.assets[i].toJson())
                }
            }
        }

        return serializedAssets
    }

    containsAsset(assetId: number) {
        let contains = false

        if (this.assets) {
            for (let i = 0; i < this.assets.length; i++) {
                if (this.assets[i].id == assetId) {
                    contains = true
                    break
                }
            }
        }

        return contains
    }

    containsAssets(assetIds: number[]) {
        let isMissingAsset = false
        for (const asset of assetIds) {
            if (!this.containsAsset(asset)) {
                isMissingAsset = true
                break
            }
        }

        return !isMissingAsset
    }

    containsAssetType(assetType: string) {
        for (const asset of this.assets) {
            if (asset.assetType.name === assetType) {
                return true
            }
        }

        return false
    }

    //INCORRECT IMPLEMENTATION, SOME REGULAR ACCESSORIES CAN CONTAIN WrapLayer
    /*containsLayered() {
        let contains = false

        for (const asset of this.assets) {
            switch(asset.assetType.name) {
                case "DressSkirtAccessory":
                case "ShortsAccessory":
                case "JacketAccessory":
                case "ShirtAccessory":
                case "SweaterAccessory":
                case "TShirtAccessory":
                case "PantsAccessory":
                case "LeftShoeAccessory":
                case "RightShoeAccessory":
                case "EyebrowAccessory":
                    contains = true
                    break;
                default:
                    break
            }
        }

        return contains
    }*/

    removeAsset(assetId: number) {
        let index = null

        for (let i = 0; i < this.assets.length; i++) {
            if (this.assets[i].id == assetId) {
                index = i
                break
            }
        }

        if (index || index == 0) {
            this.assets.splice(index,1)
        }
    }

    removeAssetType(type: string | number) {
        let typeName = ""
        if (typeof type === "number") {
            typeName = AssetTypes[type]
        } else {
            typeName = type
        }

        for (let i = this.assets.length - 1; i >= 0; i--) {
            const asset = this.assets[i]
            if (asset.assetType.name === typeName) {
                this.assets.splice(i, 1)
            }
        }
    }

    addAsset(id: number, type: string | number, name: string) {
        if (this.containsAsset(id)) {
            return
        }

        let typeId = 0
        let typeName = ""
        if (typeof type === "number") {
            typeId = type
            typeName = AssetTypes[type]
        } else {
            typeName = type
            typeId = AssetTypeNameToId.get(type) || 0
        }

        if (MaxOneOfAssetTypes.includes(typeName)) {
            this.removeAssetType(typeName)
        }

        if (typeName === "Head") {
            const toRemove = ToRemoveBeforeBundleType.DynamicHead
            for (const type of toRemove) {
                this.removeAssetType(type)
            }
        }

        const asset = new Asset()
        asset.id = id
        asset.name = name

        asset.assetType = new AssetType()
        asset.assetType.id = typeId
        if (LayeredClothingAssetOrder[asset.assetType.id]) {
            asset.meta = new AssetMeta()
            const toUseOrder = this.getNextOrder(LayeredClothingAssetOrder[asset.assetType.id])
            asset.meta.order = toUseOrder
        }
        asset.assetType.name = typeName

        this.assets.push(asset)
    }

    fixOrders() {
        for (const asset of this.assets.slice().reverse()) {
            if (asset.meta && asset.meta.order && this.isOrderUsed(asset.meta.order, asset)) {
                asset.setOrder(this.getNextOrder(asset.meta.order))
            }
        }
    }

    isOrderUsed(order: number, self?: Asset): boolean {
        for (const asset of this.assets) {
            if (asset !== self && asset.meta && asset.meta.order === order) {
                return true
            }
        }

        return false
    }

    getNextOrder(order: number): number {
        while (this.isOrderUsed(order)) {
            order += 1
        }

        return order
    }

    async addAssetId(assetId: number): Promise<boolean> {
        const assetDetailsResponse = await API.Economy.GetAssetDetails(assetId)

        if (assetDetailsResponse.status !== 200) {
            return false
        }

        const assetDetails = await assetDetailsResponse.json()

        if (assetDetails.errors) {
            return false
        }

        this.addAsset(assetId, assetDetails.AssetTypeId, assetDetails.Name)

        /*const asset = new Asset()
        asset.id = assetId
        asset.name = assetDetails.Name

        asset.assetType = new AssetType()
        asset.assetType.id = assetDetails.AssetTypeId
        if (LayeredClothingAssetOrder[asset.assetType.id]) {
            asset.meta = new AssetMeta()
            asset.meta.order = LayeredClothingAssetOrder[asset.assetType.id]
        }
        asset.assetType.name = AssetTypes[assetDetails.AssetTypeId]

        this.assets.push(asset)*/

        return true
    }

    async addBundleId(bundleId: number): Promise<boolean> {
        const bundleDetails = await API.Catalog.GetBundleDetails(bundleId)

        if (!(bundleDetails instanceof Response)) {
            const bundleType = CatalogBundleTypes[bundleDetails.bundleType]

            for (const item of bundleDetails.bundledItems) {
                if (item.type === "UserOutfit") { //find first outfit in bundle
                    const result = await API.Avatar.GetOutfitDetails(item.id, this.creatorId || 1)
                    if (result instanceof Outfit) {
                        for (const asset of result.assets) {
                            this.addAsset(asset.id, asset.assetType.id, asset.name)
                        }

                        if (bundleType === "Character") {
                            this.scale = result.scale.clone()
                        }

                        return true
                    }
                    break
                }
            }
        }

        return false
    }

    getAssetId(assetId: number): Asset | undefined {
        for (const asset of this.assets) {
            if (asset.id === assetId) {
                return asset
            }
        }
    }

    async fromBuffer(buffer: ArrayBuffer) {
        const view = new SimpleView(buffer)

        //flags
        const outfitFlags = view.readUint8()
        
        const allSameColor = !!(outfitFlags & 2)
        this.playerAvatarType = (outfitFlags & 1) ? AvatarType.R15 : AvatarType.R6

        //scale
        this.scale.height = view.readUint8() / 100
        this.scale.width = view.readUint8() / 100
        this.scale.depth = view.readUint8() / 100
        this.scale.head = view.readUint8() / 100
        const rawBodyType = view.readUint8()
        this.scale.bodyType = rawBodyType / 100
        if (rawBodyType > 0) {
            this.scale.proportion = view.readUint8() / 100
        }

        //body colors
        this.bodyColors = new BodyColor3s()
        if (allSameColor) {
            const r = view.readUint8()
            const g = view.readUint8()
            const b = view.readUint8()
            const color = rgbToHex(r,g,b)
            this.bodyColors.setAll(color)
        } else {
            const bodyColorNames: BodyColor3Name[] = ["headColor3", "torsoColor3", "leftArmColor3", "rightArmColor3", "leftLegColor3", "rightLegColor3"]
            for (const bodyColor of bodyColorNames) {
                const r = view.readUint8()
                const g = view.readUint8()
                const b = view.readUint8()
                const color = rgbToHex(r,g,b)
                this.bodyColors[bodyColor] = color
            }
        }

        //assets
        const assetPromises: Promise<undefined>[] = []

        while (view.viewOffset < view.buffer.byteLength) {
            const flags = view.readUint8()
            let id = 0

            if (flags & 16) {
                id = Number(view.readUint64())
            } else {
                id = view.readUint32()
            }

            //order
            let assetOrder = undefined

            if (flags & 1) {
                const order = view.readUint8()
                assetOrder = order
            }

            //pos
            let assetPos = undefined

            if (flags & 2) {
                const posX = mapNum(view.readUint8(), 0,255, -1,1)
                const posY = mapNum(view.readUint8(), 0,255, -1,1)
                const posZ = mapNum(view.readUint8(), 0,255, -1,1)
                assetPos = {X: posX, Y: posY, Z: posZ}
            }

            //rot
            let assetRot = undefined

            if (flags & 4) {
                const rotX = mapNum(view.readUint8(), 0,255, -90,90)
                const rotY = mapNum(view.readUint8(), 0,255, -90,90)
                const rotZ = mapNum(view.readUint8(), 0,255, -90,90)
                assetRot = {X: rotX, Y: rotY, Z: rotZ}
            }

            //scale
            let assetScale = undefined

            if (flags & 8) {
                const scaleX = mapNum(view.readUint8(), 0,255, 0.5,2)
                const scaleY = mapNum(view.readUint8(), 0,255, 0.5,2)
                const scaleZ = mapNum(view.readUint8(), 0,255, 0.5,2)
                assetScale = {X: scaleX, Y: scaleY, Z: scaleZ}
            }

            //headshape
            let assetHeadShape: number | undefined = undefined
            if (flags & 32) {
                assetHeadShape = Number(view.readUint64())
            }

            assetPromises.push(new Promise((resolve) => {
                this.addAssetId(id).then(() => {
                    let asset: Asset | undefined = undefined
                    for (const assetIn of this.assets) {
                        if (assetIn.id === id) {
                            asset = assetIn
                        }
                    }

                    if (asset && (assetOrder || assetPos || assetRot || assetScale || assetHeadShape !== undefined)) {
                        asset.meta = new AssetMeta()
                        asset.meta.order = assetOrder
                        asset.meta.position = assetPos
                        asset.meta.rotation = assetRot
                        asset.meta.scale = assetScale
                        asset.meta.headShape = assetHeadShape
                    }

                    resolve(undefined)
                })
            }))
            
        }

        await Promise.all(assetPromises)

        this.fixOrders()

        return this
    }

    toBuffer(): ArrayBuffer {
        //get right bodycolors
        let bodyColors: BodyColor3s | undefined = undefined
        if (this.bodyColors instanceof BodyColor3s) {
            bodyColors = this.bodyColors
        } else {
            bodyColors = this.bodyColors.toColor3()
        }

        //calculate buffer size
        let bufferSize = 1+5+3
        if (Math.floor(this.scale.bodyType * 100) > 0) bufferSize += 1
        const m = bodyColors.headColor3;
        const allSameColor = (bodyColors.headColor3 === m && bodyColors.torsoColor3 === m && bodyColors.leftArmColor3 === m && bodyColors.rightArmColor3 === m && bodyColors.leftLegColor3 === m && bodyColors.rightLegColor3)
        if (!allSameColor) bufferSize += 15
        for (const asset of this.assets) {
            const order = asset.meta?.order
            let pos = asset.meta?.position
            let rot = asset.meta?.rotation
            let scale = asset.meta?.scale
            const headShape = asset.meta?.headShape

            if (pos && (Math.abs(pos.X) + Math.abs(pos.Y) + Math.abs(pos.Z)) < 0.01) {
                pos = undefined
            }

            if (rot && (Math.abs(rot.X) + Math.abs(rot.Y) + Math.abs(rot.Z)) < 0.01) {
                rot = undefined
            }

            if (scale && (Math.round(scale.X * 100) === 100 && Math.round(scale.Y * 100) === 100 && Math.round(scale.Z * 100)) === 100) {
                scale = undefined
            }

            bufferSize += 5
            if (asset.id > Math.pow(2,32)) bufferSize += 4

            if (order !== undefined) bufferSize += 1
            if (pos) bufferSize += 3
            if (rot) bufferSize += 3
            if (scale) bufferSize += 3
            if (headShape !== undefined) bufferSize += 8
        }

        //create buffer
        console.log(`Outfit is ${bufferSize} bytes`)
        const buffer = new ArrayBuffer(bufferSize)
        const view = new SimpleView(buffer)

        //flags 1 byte
        let outfitFlags = 0
        if (this.playerAvatarType === AvatarType.R15) outfitFlags += 1
        if (allSameColor) outfitFlags += 2
        view.writeUint8(outfitFlags)

        //scale 5-6 bytes
        view.writeUint8(Math.floor(this.scale.height * 100))
        view.writeUint8(Math.floor(this.scale.width * 100))
        view.writeUint8(Math.floor(this.scale.depth * 100))
        view.writeUint8(Math.floor(this.scale.head * 100))
        view.writeUint8(Math.floor(this.scale.bodyType * 100))
        if (Math.floor(this.scale.bodyType * 100) > 0) {
            view.writeUint8(Math.floor(this.scale.proportion * 100))
        }

        //body colors 3-18 bytes
        const headColor = hexToRgb(bodyColors.headColor3) || {r:0,g:0,b:0}
        view.writeUint8(Math.floor(headColor.r * 255))
        view.writeUint8(Math.floor(headColor.g * 255))
        view.writeUint8(Math.floor(headColor.b * 255))

        if (!allSameColor) {
            const torsoColor = hexToRgb(bodyColors.torsoColor3) || {r:0,g:0,b:0}
            view.writeUint8(Math.floor(torsoColor.r * 255))
            view.writeUint8(Math.floor(torsoColor.g * 255))
            view.writeUint8(Math.floor(torsoColor.b * 255))

            const leftArmColor = hexToRgb(bodyColors.leftArmColor3) || {r:0,g:0,b:0}
            view.writeUint8(Math.floor(leftArmColor.r * 255))
            view.writeUint8(Math.floor(leftArmColor.g * 255))
            view.writeUint8(Math.floor(leftArmColor.b * 255))

            const rightArmColor = hexToRgb(bodyColors.rightArmColor3) || {r:0,g:0,b:0}
            view.writeUint8(Math.floor(rightArmColor.r * 255))
            view.writeUint8(Math.floor(rightArmColor.g * 255))
            view.writeUint8(Math.floor(rightArmColor.b * 255))

            const leftLegColor = hexToRgb(bodyColors.leftLegColor3) || {r:0,g:0,b:0}
            view.writeUint8(Math.floor(leftLegColor.r * 255))
            view.writeUint8(Math.floor(leftLegColor.g * 255))
            view.writeUint8(Math.floor(leftLegColor.b * 255))

            const rightLegColor = hexToRgb(bodyColors.rightLegColor3) || {r:0,g:0,b:0}
            view.writeUint8(Math.floor(rightLegColor.r * 255))
            view.writeUint8(Math.floor(rightLegColor.g * 255))
            view.writeUint8(Math.floor(rightLegColor.b * 255))
        }

        //assets 5-15 bytes each
        for (const asset of this.assets) {
            const id = asset.id

            const order = asset.meta?.order
            let pos = asset.meta?.position
            let rot = asset.meta?.rotation
            let scale = asset.meta?.scale
            const headShape = asset.meta?.headShape

            if (pos && (Math.abs(pos.X) + Math.abs(pos.Y) + Math.abs(pos.Z)) < 0.01) {
                pos = undefined
            }

            if (rot && (Math.abs(rot.X) + Math.abs(rot.Y) + Math.abs(rot.Z)) < 0.01) {
                rot = undefined
            }

            if (scale && (Math.round(scale.X * 100) === 100 && Math.round(scale.Y * 100) === 100 && Math.round(scale.Z * 100)) === 100) {
                scale = undefined
            }

            const idIs64bit = id > Math.pow(2,32)

            let flags = 0
            if (order !== undefined) flags += 1
            if (pos) flags += 2
            if (rot) flags += 4
            if (scale) flags += 8
            if (idIs64bit) flags += 16
            if (headShape !== undefined) flags += 32

            view.writeUint8(flags)

            if (!idIs64bit) {
                view.writeUint32(id)
            } else {
                view.writeUint64(BigInt(id))
            }

            if (order !== undefined) {
                view.writeUint8(order)
            }

            if (pos) {
                view.writeUint8(Math.floor(mapNum(pos.X, -1,1, 0,255)))
                view.writeUint8(Math.floor(mapNum(pos.Y, -1,1,0,255)))
                view.writeUint8(Math.floor(mapNum(pos.Z, -1,1, 0,255)))
            }

            if (rot) {
                view.writeUint8(Math.floor(mapNum(rot.X, -90,90, 0,255)))
                view.writeUint8(Math.floor(mapNum(rot.Y, -90,90, 0,255)))
                view.writeUint8(Math.floor(mapNum(rot.Z, -90,90, 0,255)))
            }

            if (scale) {
                view.writeUint8(Math.floor(mapNum(scale.X, 0.5,2, 0,255)))
                view.writeUint8(Math.floor(mapNum(scale.Y, 0.5,2, 0,255)))
                view.writeUint8(Math.floor(mapNum(scale.Z, 0.5,2, 0,255)))
            }

            if (headShape !== undefined) {
                view.writeUint64(BigInt(headShape))
            }
        }

        return view.buffer
    }

    /*wear(auth: Authentication, onlyItems: boolean) {
        API.Avatar.WearOutfit(auth, this, onlyItems)
    }*/

    /*async saveToRoblox(auth: Authentication) {
        return (await SaveOutfitToRoblox(auth, this))
    }*/

    /*saveToComputer(auth, userInfo) {
        if (userInfo) {
            SaveOutfitToComputer(this, userInfo)
        } else {
            GetUserInfo(auth).then(v => {
                userInfo = v
        
                SaveOutfitToComputer(this, userInfo)
            })
        }
    }*/

    /*async getPurchaseInfo(auth: Authentication, userInfo: { id: number; }, ignoreOwned: boolean) { //RETURN: {purchaseInfos: purchaseInfo[], failedAssets[]: {id: Number, isOwned: boolean}}
        const outfit = this

        return new Promise((resolve) => {
            const purchaseInfos: PurchaseInfo[] = []
            let checkedAssets = 0
            const failedAssets = []

            function onAssetFinished(success, itemId, itemType, expectedPrice, resaleOnly, purchaseFunc) {
                //Add asset that finished
                if (success) {
                    purchaseInfos.push(new PurchaseInfo(itemId, itemType, expectedPrice, resaleOnly, purchaseFunc))
                } else {
                    failedAssets.push({"id": itemId, "isOwned": itemType ? true : false})
                    if (!itemType) { //itemType is used as isOwned
                        console.warn(`Failed to check item with id ${itemId}`)
                    } else {
                        console.warn(`User already owns asset with id ${itemId}`)
                    }
                }

                checkedAssets++;

                //If all assets finished
                if (checkedAssets >= outfit.assets.length) {
                    //Remove duplicates
                    let newPurchaseInfos = []
                    let addedAssetIds = []

                    for (let purchaseInfo of purchaseInfos) {
                        let purchaseInfoIdentifier = purchaseInfo.itemType + purchaseInfo.itemId

                        if (!addedAssetIds.includes(purchaseInfoIdentifier)) {
                            newPurchaseInfos.push(purchaseInfo)
                            addedAssetIds.push(purchaseInfoIdentifier)
                        }
                    }

                    //Return list of asset purchase infos
                    resolve({"purchaseInfos": newPurchaseInfos, "failedAssets": failedAssets})
                }
            }
    
            for (let asset of this.assets) {
                try {
                    if (ignoreOwned) {
                        ItemIsOwned(auth, userInfo.id, "Asset", asset.id).then(isOwned => {
                            if (!isOwned) {
                                itemNotOwned()
                            } else {
                                onAssetFinished(false, asset.id, true)
                            }
                        })
                    } else {
                        itemNotOwned()
                    }

                    function itemNotOwned() {
                        GetAssetDetails(auth, asset.id).then(assetDetails => {
                            if (assetDetails.IsForSale || assetDetails.IsLimited || assetDetails.IsLimitedUnique) {
                                switch (assetDetails.ProductType) {
                                    case "User Product": //USER PRODUCT
                                        if ((assetDetails.IsLimited || assetDetails.IsLimitedUnique) && (!assetDetails.Remaining)) { //is user product limited
                                            GetAssetResellers(auth, asset.id).then(response => {
                                                if (response.status === 200) {
                                                    (response.json()).then(body => {
                                                        let data = body.data
                                                        if (data.length > 0) {
                                                            onAssetFinished(true, asset.id, "Asset", data[0].price, true, async () => { //SHOULD WORK IN THEORY
                                                                return PurchaseProduct(auth, assetDetails.ProductId, data[0].price, data[0].seller.id, data[0].userAssetId)
                                                            })
                                                        } else {
                                                            onAssetFinished(false, asset.id)
                                                        }
                                                    })
                                                } else {
                                                    onAssetFinished(false, asset.id)
                                                }
                                            })
                                        } else if (assetDetails.IsForSale) { //regular user product (does this even still exist?)
                                            onAssetFinished(true, asset.id, "Asset", assetDetails.PriceInRobux, false, async () => { //SHOULD WORK IN THEORY
                                                return PurchaseProductFromAssetDetails(auth, assetDetails)
                                            })
                                        } else {
                                            onAssetFinished(false, asset.id)
                                        }
                                        break
                                    case "Collectible Item": //COLLECTIBLE ITEM
                                        if (assetDetails.CollectiblesItemDetails?.IsLimited && !assetDetails.Remaining) {//is collectible item limited
                                            if (assetDetails.CollectiblesItemDetails?.CollectibleLowestResalePrice) {
                                                GetCollectibleResellers(auth, assetDetails.CollectibleItemId).then(response => {
                                                    if (response.status === 200) {
                                                        (response.json()).then(body => {
                                                            let data = body.data
                                                            if (data.length > 0) {
                                                                onAssetFinished(true, asset.id, "Asset", data[0].price, true, async () => { //CONFIRMED WORKING
                                                                    return PurchaseCollectibleResale(auth, assetDetails.CollectibleItemId, data[0].price, data[0].collectibleProductId, userInfo.id, data[0].seller.sellerId, data[0].seller.sellerType, data[0].collectibleItemInstanceId)
                                                                })
                                                            } else {
                                                                onAssetFinished(false, asset.id)
                                                            }
                                                        })
                                                    } else {
                                                        onAssetFinished(false, asset.id)
                                                    }
                                                })
                                            } else {
                                                onAssetFinished(false, asset.id)
                                            }
                                        } else if (assetDetails.IsForSale) {//regular collectible item
                                            onAssetFinished(true, asset.id, "Asset", assetDetails.PriceInRobux, false, async () => { //CONFIRMED WORKING
                                                console.log(assetDetails)
                                                return PurchaseCollectibleFromAssetDetails(auth, userInfo, assetDetails)
                                            })
                                        } else {
                                            onAssetFinished(false, asset.id)
                                        }
        
                                        break
                                }
                            } else if (asset.id !== 14618207727) { //check if bundle
                                GetAssetBundles(auth, asset.id).then(data => {
                                    let cheapestBundle = undefined
                                    let cheapestBundlePrice = undefined
                                    let cheapestBundleIsResale = false
    
                                    for (let bundle of data) {
                                        if (bundle.collectibleItemDetail) {
                                            if (bundle.collectibleItemDetail.resaleRestriction === "None" && bundle.collectibleItemDetail.unitsAvailable === 0) {//limited bundle
                                                if (bundle.collectibleItemDetail.hasResellers) {
                                                    if (!cheapestBundle || bundle.collectibleItemDetail.lowestResalePrice < cheapestBundlePrice) {
                                                        cheapestBundle = bundle
                                                        cheapestBundlePrice = bundle.collectibleItemDetail.lowestResalePrice
                                                        cheapestBundleIsResale = true
                                                    }
                                                }
                                            } else {//regular bundle
                                                if (!cheapestBundle || bundle.collectibleItemDetail.price < cheapestBundlePrice) {
                                                    cheapestBundle = bundle
                                                    cheapestBundlePrice = bundle.collectibleItemDetail.price
                                                    cheapestBundleIsResale = false
                                                }
                                            }
                                        } else { //assume user product unlimited (not confirmed) OR offsale collectible bundle
                                            if (bundle.product) {
                                                if (!cheapestBundle || bundle.product.priceInRobux < cheapestBundlePrice) {
                                                    cheapestBundle = bundle
                                                    cheapestBundlePrice = bundle.product.priceInRobux
                                                    cheapestBundleIsResale = false
                                                }
                                            }
                                        }
                                    }
    
                                    if (cheapestBundle) { //IF IT FOUND A BUNDLE
                                        onAssetFinished(true, cheapestBundle.id, "Bundle", cheapestBundlePrice, cheapestBundleIsResale, async () => {
                                            return new Promise((resolve, reject) => {
                                                let cid = cheapestBundle.collectibleItemDetail
    
                                                if (cid) {
                                                    if (cheapestBundleIsResale) {
                                                        GetCollectibleResellers(auth, cid.collectibleItemId).then(response => {
                                                            if (response.status == 200) {
                                                                (response.json()).then(data => {
                                                                    data = data.data
                                                                    if (data.length > 0) {
                                                                        if (data[0].price === cheapestBundlePrice) {
                                                                            console.log("bundle - collectible - limited")
                                                                            resolve(PurchaseCollectibleResale(auth, cid.collectibleItemId, data[0].collectibleProductId, cheapestBundlePrice, userInfo.id, data[0].seller.sellerId, data[0].seller.sellerType, data[0].collectibleItemInstanceId)) //SHOULD WORK IN THEORY
                                                                        } else {
                                                                            console.log("bundle - collectible - limited - pruche changed")
                                                                            resolve(new Response(JSON.stringify({"error": "Price has changed"}), {status: 500}))
                                                                        }
                                                                    } else {
                                                                        console.log("bundle - collectible - limited - no resellers")
                                                                        resolve(new Response(JSON.stringify({"error": "No resellers"}), {status: 500}))
                                                                    }
                                                                })
                                                            } else {
                                                                resolve(response)
                                                                return
                                                            }
                                                        })
                                                    } else {
                                                        console.log("bundle - collectible - not limited")
                                                        resolve(PurchaseCollectible(auth, cid.collectibleItemId, cid.collectibleProductId, cheapestBundlePrice, userInfo.id, cheapestBundle.creator.id, cheapestBundle.creator.type)) //SHOULD WORK IN THEORY (REQUEST URL AND BODY MATCHES ROBLOX'S GENERATED ONE)
                                                    }
                                                } else {
                                                    console.log("bundle - product - not limited")
                                                    resolve(PurchaseProduct(auth, cheapestBundle.product.id, cheapestBundlePrice, cheapestBundle.creator.id)) //NOT TESTED
                                                }
                                            })
                                        })
                                    } else {
                                        onAssetFinished(false, asset.id)
                                    }
                                })
                            } else {
                                onAssetFinished(false, asset.id, true)
                            }
                        })
                    }
                } catch (error) { //if an error occured in the code
                    console.warn(error)
                    onAssetFinished(false, asset.id)
                }
            }
        })
    }

    async getPrice(auth, userInfo, ignoreOwned) {
        let purchaseData = await this.getPurchaseInfo(auth, userInfo, ignoreOwned)
        let purchaseInfos = purchaseData.purchaseInfos

        let totalPrice = 0

        let checkedItems = []

        for (let purchaseInfo of purchaseInfos) {
            let purchaseInfoId = purchaseInfo.itemType + purchaseInfo.itemId

            if (!checkedItems.includes(purchaseInfoId)) {
                checkedItems.push(purchaseInfoId)
                totalPrice += purchaseInfo.expectedPrice
            }
        }

        for (let failedAsset of purchaseData.failedAssets) { //headless head price fix (none of the limbs count :())
            if (failedAsset.id == 15093053680) {
                totalPrice += 31000
            }
        }

        return totalPrice
    }*/
}


/*class PurchaseInfo {
    itemId
    itemType //Bundle or Asset
    expectedPrice
    resaleOnly
    purchaseFunc

    constructor(newItemId: number, newItemType: "Bundle" | "asset", newExpectedPrice: number, newResaleOnly: boolean, newPurchaseFunc: () => Response) {
        this.itemId = newItemId
        this.itemType = newItemType
        this.expectedPrice = newExpectedPrice
        this.resaleOnly = newResaleOnly
        this.purchaseFunc = newPurchaseFunc
    }

    async purchase() {
        const response = await this.purchaseFunc()
        if (!response || response.status !== 200) {
            return {"success": false, "response": response}
        }

        const data = await response.json()
        if (!data.purchased) {
            return {"success": false, "response": response}
        }

        return {"success": true, "response": response}
    }
}*/
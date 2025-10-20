//Dependencies: asset.js

import { API, type Authentication } from "../api";
import { BODYCOLOR3 } from "../misc/flags"
import { download } from "../misc/misc";
import { changeXMLProperty, setXMLProperty } from "../misc/xml";
import { Asset, AssetMeta, AssetType } from "./asset";
import type { AssetJson } from "./asset"
import { AvatarType, BrickColors, LayeredClothingAssetOrder, MaxPerAsset, OutfitOrigin } from "./constant"

function createAccessoryBlob(asset: Asset, assetType: string) {
    return {"Order": asset.meta?.order, "AssetId": asset.id, "AccessoryType": assetType, "Puffiness": asset.meta?.puffiness}
}

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : null;
}

type ColorType = "BrickColor" | "Color3"

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

class Scale {
    height!: number //1
    width!: number //1
    head!: number //0.95
    depth!: number //1
    proportion!: number //0.5
    bodyType!: number //0

    constructor() {
        this.reset()
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

class BodyColor3s {
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

class BodyColors {
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

class Outfit {
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

    toJson(removeNotOwnedAssets: boolean) {
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
    }

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

    containsLayered() {
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
    }

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

    async addAsset(auth: Authentication, assetId: number): Promise<boolean> {
        const assetDetailsResponse = await API.Economy.GetAssetDetails(auth, assetId)

        if (assetDetailsResponse.status !== 200) {
            return false
        }

        const assetDetails = await assetDetailsResponse.json()

        if (assetDetails.errors) {
            return false
        }

        const asset = new Asset()
        asset.id = assetId
        asset.name = assetDetails.Name

        asset.assetType = new AssetType()
        asset.assetType.id = assetDetails.AssetTypeId
        if (LayeredClothingAssetOrder[asset.assetType.id]) {
            asset.meta = new AssetMeta()
            asset.meta.order = LayeredClothingAssetOrder[asset.assetType.id]
        }
        //asset.assetType.name = AssetTypes[assetDetails.AssetTypeId]

        this.assets.push(asset)

        return true
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
        // eslint-disable-next-line @typescript-eslint/no-this-alias
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

export { Outfit }
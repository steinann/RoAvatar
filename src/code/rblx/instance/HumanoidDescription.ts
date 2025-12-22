/*
ISSUES (++ Probably fixed, -- Not fixed)
-- Face is included in dynamic head (but not rendered)
*/

import { API, Authentication } from "../../api";
import { AvatarType, defaultPantAssetIds, defaultShirtAssetIds, minimumDeltaEBodyColorDifference } from "../../avatar/constant";
import { Outfit, type BodyColor3s, type BodyColors } from "../../avatar/outfit";
import { hexToColor3, hexToRgb } from "../../misc/misc";
import { AnimationTrack } from "../animation";
import { delta_CIEDE2000 } from "../color-similarity";
import { AccessoryType, AllAnimations, AllBodyParts, AssetTypeToAccessoryType, BodyPart, BodyPartEnumToNames, DataType, DefaultAnimations, DefaultAnimationsR6, HumanoidRigType, NeverLayeredAccessoryTypes, type AnimationProp } from "../constant";
import { CFrame, Color3, hasSameVal, hasSameValFloat, Instance, isSameColor, isSameVector3, Property, RBX, Vector3 } from "../rbx";
import { replaceBodyPart, ScaleAccessory, ScaleCharacter, type RigData } from "../scale";
import AccessoryDescriptionWrapper from "./AccessoryDescription";
import AnimatorWrapper from "./Animator";
import BodyPartDescriptionWrapper from "./BodyPartDescription";
import InstanceWrapper from "./InstanceWrapper";

type ClothingDiffType = "Shirt" | "Pants" | "GraphicTShirt"
type HumanoidDescriptionDiff = "scale" | "bodyColor" | "animation" | "bodyPart" | "clothing" | "face" | "accessory"

function isSameAccessoryDesc(desc0: Instance, desc1: Instance) {
    return hasSameVal(desc0, desc1, "AssetId") &&
        hasSameVal(desc0, desc1, "AccessoryType") &&
        hasSameVal(desc0, desc1, "IsLayered") &&
        hasSameVal(desc0, desc1, "Puffiness") &&
        hasSameVal(desc0, desc1, "Order") &&
        isSameVector3(desc0.Prop("Position") as Vector3, desc1.Prop("Position") as Vector3) &&
        isSameVector3(desc0.Prop("Rotation") as Vector3, desc1.Prop("Rotation") as Vector3) &&
        isSameVector3(desc0.Prop("Scale") as Vector3, desc1.Prop("Scale") as Vector3)
}

export default class HumanoidDescriptionWrapper extends InstanceWrapper {
    static className: string = "HumanoidDescription"
    static requiredProperties: string[] = [
        "Name",
        "BodyTypeScale",
        "ProportionScale",
        "WidthScale",
        "HeightScale",
        "DepthScale",
        "HeadScale",
        "ClimbAnimation",
        "FallAnimation",
        "IdleAnimation",
        "JumpAnimation",
        "MoodAnimation",
        "RunAnimation",
        "SwimAnimation",
        "WalkAnimation",
        "GraphicTShirt",
        "Pants",
        "Shirt",
        "Face",
    ]

    cancelApply: boolean = false //apply changes to original description to reflect progress, this way we dont have to mark the entire old one dirty if we cancel OR combine comparison of both humanoid descriptions?

    setup() {
        // BASIC
        this.instance.addProperty(new Property("Name", DataType.String), "HumanoidDescription")
        //stuff is missing here, but we dont care about it

        // SCALE
        this.instance.addProperty(new Property("BodyTypeScale", DataType.Float32), 0.0)
        this.instance.addProperty(new Property("ProportionScale", DataType.Float32), 0.0)

        this.instance.addProperty(new Property("WidthScale", DataType.Float32), 1.0)
        this.instance.addProperty(new Property("HeightScale", DataType.Float32), 1.0)
        this.instance.addProperty(new Property("DepthScale", DataType.Float32), 1.0)
        this.instance.addProperty(new Property("HeadScale", DataType.Float32), 1.0)
        
        // ANIMATION
        this.instance.addProperty(new Property("ClimbAnimation", DataType.Int64), 0n)
        this.instance.addProperty(new Property("FallAnimation", DataType.Int64), 0n)
        this.instance.addProperty(new Property("IdleAnimation", DataType.Int64), 0n)
        this.instance.addProperty(new Property("JumpAnimation", DataType.Int64), 0n)
        this.instance.addProperty(new Property("MoodAnimation", DataType.Int64), 0n)
        this.instance.addProperty(new Property("RunAnimation", DataType.Int64), 0n)
        this.instance.addProperty(new Property("SwimAnimation", DataType.Int64), 0n)
        this.instance.addProperty(new Property("WalkAnimation", DataType.Int64), 0n)

        // CLOTHES
        this.instance.addProperty(new Property("GraphicTShirt", DataType.Int64), 0n)
        this.instance.addProperty(new Property("Pants", DataType.Int64), 0n)
        this.instance.addProperty(new Property("Shirt", DataType.Int64), 0n)

        // OTHER
        this.instance.addProperty(new Property("Face", DataType.Int64), 0n)

        //many properties are missing because theyre not actually serialized, check for accessorydescriptions and bodypartdescriptions that are children
    }

    reset() {
        this.instance.setProperty("Name", "HumanoidDescription")

        this.instance.setProperty("BodyTypeScale", 0)
        this.instance.setProperty("ProportionScale", 0)

        this.instance.setProperty("WidthScale", 1)
        this.instance.setProperty("HeightScale", 1)
        this.instance.setProperty("DepthScale", 1)
        this.instance.setProperty("HeadScale", 1)

        this.instance.setProperty("ClimbAnimation", 0n)
        this.instance.setProperty("FallAnimation", 0n)
        this.instance.setProperty("IdleAnimation", 0n)
        this.instance.setProperty("JumpAnimation", 0n)
        this.instance.setProperty("MoodAnimation", 0n)
        this.instance.setProperty("RunAnimation", 0n)
        this.instance.setProperty("SwimAnimation", 0n)
        this.instance.setProperty("WalkAnimation", 0n)

        this.instance.setProperty("GraphicTShirt", 0n)
        this.instance.setProperty("Pants", 0n)
        this.instance.setProperty("Shirt", 0n)

        this.instance.setProperty("Face", 0n)

        for (const child of this.instance.GetChildren()) {
            child.Destroy()
        }
    }

    /**
     * @returns [diffs, addedAccessories, removedAccessories]
    */
    compare(originalW: HumanoidDescriptionWrapper): [HumanoidDescriptionDiff[], bigint[], bigint[]] {
        const self = this.instance
        const other = originalW.instance

        const diffs: HumanoidDescriptionDiff[] = []

        // SCALE
        const scaleSame = hasSameValFloat(self, other, "BodyTypeScale") &&
                            hasSameValFloat(self, other, "ProportionScale") &&
                            hasSameValFloat(self, other, "WidthScale") &&
                            hasSameValFloat(self, other, "HeightScale") &&
                            hasSameValFloat(self, other, "DepthScale") &&
                            hasSameValFloat(self, other, "HeadScale")
        
        if (!scaleSame) {
            diffs.push("scale")
        }

        // ANIMATION
        const animationSame = hasSameVal(self, other, "ClimbAnimation") &&
                                hasSameVal(self, other, "FallAnimation") &&
                                hasSameVal(self, other, "IdleAnimation") &&
                                hasSameVal(self, other, "JumpAnimation") &&
                                hasSameVal(self, other, "MoodAnimation") &&
                                hasSameVal(self, other, "RunAnimation") &&
                                hasSameVal(self, other, "SwimAnimation") &&
                                hasSameVal(self, other, "WalkAnimation")
        
        if (!animationSame) {
            diffs.push("animation")
        }

        // BODY COLORS & BODY PARTS
        let bodyColorsSame = true
        let bodyPartsSame = true
        
        for (const bodyPart of AllBodyParts) {
            if (!isSameColor(this.getBodyPartColor(bodyPart), originalW.getBodyPartColor(bodyPart))) {
                bodyColorsSame = false
            }
            if (this.getBodyPartId(bodyPart) !== originalW.getBodyPartId(bodyPart)) {
                bodyPartsSame = false
            }
        }

        if (!bodyColorsSame) {
            diffs.push("bodyColor")
        }
        if (!bodyPartsSame) {
            diffs.push("bodyPart")
        }

        // CLOTHING
        const clothingSame = hasSameVal(self, other, "Shirt") &&
                            hasSameVal(self, other, "Pants") &&
                            hasSameVal(self, other, "GraphicTShirt")
        
        if (!clothingSame) {
            diffs.push("clothing")
        }

        // FACE
        const faceSame = hasSameVal(self, other, "Face")

        if (!faceSame) {
            diffs.push("face")
        }

        //ACCESSORIES
        let accessoriesSame = true
        const selfAccessoryDescriptions = this.getAccessoryDescriptions()
        const otherAccessoryDescriptions = originalW.getAccessoryDescriptions()

        if (selfAccessoryDescriptions.length !== otherAccessoryDescriptions.length) {
            accessoriesSame = false
        } else {
            for (const desc of selfAccessoryDescriptions) {
                let foundSame = false

                for (const otherDesc of otherAccessoryDescriptions) {
                    if (isSameAccessoryDesc(desc, otherDesc)) {
                        foundSame = true
                        break
                    }
                }

                if (!foundSame) {
                    accessoriesSame = false
                    break
                }
            }
        }

        if (!accessoriesSame) {
            diffs.push("accessory")
        }

        //ADDED AND REMOVED ACCESSORIES
        const originalIdList = originalW.getAccessoryIds()
        const newIdList = this.getAccessoryIds()

        const addedIds: bigint[] = []
        const removedIds: bigint[] = []

        for (const id of newIdList) {
            if (!originalIdList.includes(id)) {
                addedIds.push(id)
            }
        }

        for (const id of originalIdList) {
            if (!newIdList.includes(id)) {
                removedIds.push(id)
            }
        }

        return [diffs, addedIds, removedIds]
    }

    getAccessoryDescriptions(): Instance[] {
        const accessoryDescriptions: Instance[] = []

        for (const child of this.instance.GetChildren()) {
            if (child.className === "AccessoryDescription") {
                accessoryDescriptions.push(child)
            }
        }

        return accessoryDescriptions
    }

    getAccessoryIds(): bigint[] {
        const descs = this.getAccessoryDescriptions()
        const ids: bigint[] = []

        for (const desc of descs) {
            ids.push(desc.Prop("AssetId") as bigint)
        }

        return ids
    }

    getAccessoryDescriptionWithId(id: bigint): Instance | undefined {
        for (const desc of this.getAccessoryDescriptions()) {
            if (desc.Prop("AssetId") as bigint === id) {
                return desc
            }
        }

        return undefined
    }

    getBodyPartDescription(bodyPart: number): Instance | undefined {
        for (const child of this.instance.GetChildren()) {
            if (child.className === "BodyPartDescription") {
                if (child.Prop("BodyPart") === bodyPart) {
                    return child
                }
            }
        }
    }

    getBodyPartColor(bodyPart: number): Color3 {
        const bodyPartDesc = this.getBodyPartDescription(bodyPart)
        if (bodyPartDesc) {
            return bodyPartDesc.Prop("Color") as Color3
        }

        return new Color3(0,0,0)
    }

    setBodyPartId(bodyPart: number, id: bigint) {
        const bodyPartDesc = this.getBodyPartDescription(bodyPart)
        if (bodyPartDesc) {
            bodyPartDesc.setProperty("AssetId", id)
        }
    }

    getBodyPartId(bodyPart: number): bigint {
        const bodyPartDesc = this.getBodyPartDescription(bodyPart)
        if (bodyPartDesc) {
            return bodyPartDesc.Prop("AssetId") as bigint
        }

        return 0n
    }

    createRigData(): RigData | undefined {
        const humanoid = this.instance.parent
        const rig = humanoid?.parent

        if (rig) {
            const mockOutfit = new Outfit()
            mockOutfit.playerAvatarType = AvatarType.R15
            mockOutfit.scale.bodyType = this.instance.Prop("BodyTypeScale") as number
            mockOutfit.scale.proportion = this.instance.Prop("ProportionScale") as number

            mockOutfit.scale.width = this.instance.Prop("WidthScale") as number
            mockOutfit.scale.height = this.instance.Prop("HeightScale") as number
            mockOutfit.scale.depth = this.instance.Prop("DepthScale") as number
            mockOutfit.scale.head = this.instance.Prop("HeadScale") as number

            const self: RigData = {
                "outfit": mockOutfit,
                "rig": rig,
                "cumulativeStepHeightLeft": 0.0,
                "cumulativeStepHeightRight": 0.0,
                "cumulativeLegLeft": 0.0,
                "cumulativeLegRight": 0.0,
                "stepHeight": 0.0,
                "bodyScale": new Vector3(mockOutfit.scale.width, mockOutfit.scale.height, mockOutfit.scale.depth),
                "headScale": mockOutfit.scale.head
            }

            return self
        } else {
            return undefined
        }
    }

    async fromOutfit(outfit: Outfit, auth: Authentication): Promise<Instance | Response> {
        // SCALE
        this.instance.setProperty("BodyTypeScale", outfit.scale.bodyType)
        this.instance.setProperty("ProportionScale", outfit.scale.proportion)

        this.instance.setProperty("WidthScale", outfit.scale.width)
        this.instance.setProperty("HeightScale", outfit.scale.height)
        this.instance.setProperty("DepthScale", outfit.scale.depth)
        this.instance.setProperty("HeadScale", outfit.scale.head)

        // BODY COLORS
        const headDescriptionWrapper = new BodyPartDescriptionWrapper(new Instance("BodyPartDescription"))
        const torsoDescriptionWrapper = new BodyPartDescriptionWrapper(new Instance("BodyPartDescription"))

        const rightArmDescriptionWrapper = new BodyPartDescriptionWrapper(new Instance("BodyPartDescription"))
        const leftArmDescriptionWrapper = new BodyPartDescriptionWrapper(new Instance("BodyPartDescription"))

        const rightLegDescriptionWrapper = new BodyPartDescriptionWrapper(new Instance("BodyPartDescription"))
        const leftLegDescriptionWrapper = new BodyPartDescriptionWrapper(new Instance("BodyPartDescription"))

        let bodyColors = outfit.bodyColors
        let bodyColor3s: BodyColor3s | undefined = undefined

        if (bodyColors.colorType === "BrickColor") {
            bodyColors = bodyColors as BodyColors
            bodyColor3s = bodyColors.toColor3()
        } else {
            bodyColor3s = bodyColors as BodyColor3s
        }

        headDescriptionWrapper.instance.setProperty("BodyPart", BodyPart.Head)
        headDescriptionWrapper.instance.setProperty("Color", hexToColor3(bodyColor3s.headColor3))
        torsoDescriptionWrapper.instance.setProperty("BodyPart", BodyPart.Torso)
        torsoDescriptionWrapper.instance.setProperty("Color", hexToColor3(bodyColor3s.torsoColor3))

        rightArmDescriptionWrapper.instance.setProperty("BodyPart", BodyPart.RightArm)
        rightArmDescriptionWrapper.instance.setProperty("Color", hexToColor3(bodyColor3s.rightArmColor3))
        leftArmDescriptionWrapper.instance.setProperty("BodyPart", BodyPart.LeftArm)
        leftArmDescriptionWrapper.instance.setProperty("Color", hexToColor3(bodyColor3s.leftArmColor3))

        rightLegDescriptionWrapper.instance.setProperty("BodyPart", BodyPart.RightLeg)
        rightLegDescriptionWrapper.instance.setProperty("Color", hexToColor3(bodyColor3s.rightLegColor3))
        leftLegDescriptionWrapper.instance.setProperty("BodyPart", BodyPart.LeftLeg)
        leftLegDescriptionWrapper.instance.setProperty("Color", hexToColor3(bodyColor3s.leftLegColor3))

        headDescriptionWrapper.instance.setParent(this.instance)
        torsoDescriptionWrapper.instance.setParent(this.instance)

        rightArmDescriptionWrapper.instance.setParent(this.instance)
        leftArmDescriptionWrapper.instance.setParent(this.instance)

        rightLegDescriptionWrapper.instance.setParent(this.instance)
        leftLegDescriptionWrapper.instance.setParent(this.instance)

        //default clothing
        if (!outfit.containsAssetType("Pants")) {
            const torsoColor = hexToRgb(bodyColor3s.torsoColor3) || {r: 0, g: 0, b: 0}
            const leftLegColor = hexToRgb(bodyColor3s.leftLegColor3) || {r: 0, g: 0, b: 0}
            const rightLegColor = hexToRgb(bodyColor3s.rightLegColor3) || {r: 0, g: 0, b: 0}

            const minDeltaE = Math.min(delta_CIEDE2000(torsoColor, leftLegColor), delta_CIEDE2000(torsoColor, rightLegColor))

            if (minDeltaE <= minimumDeltaEBodyColorDifference) {
                const defaultClothesIndex = Number(outfit.creatorId || outfit.id || 1) % defaultShirtAssetIds.length

                //create default pants
                this.instance.setProperty("Pants", BigInt(defaultPantAssetIds[defaultClothesIndex]))

                //create default shirt
                if (!outfit.containsAssetType("Shirt")) {
                    this.instance.setProperty("Shirt", BigInt(defaultShirtAssetIds[defaultClothesIndex]))
                }
            }
        }

        // ASSETS
        const assetPromises: Promise<undefined | Response>[] = []

        for (const asset of outfit.assets) {
            switch (asset.assetType.name) {
                    case "TShirt":
                        this.instance.setProperty("GraphicTShirt", BigInt(asset.id))
                        break
                    case "Shirt":
                        this.instance.setProperty("Shirt", BigInt(asset.id))
                        break
                    case "Pants":
                        this.instance.setProperty("Pants", BigInt(asset.id))
                        break
                    case "Face":
                        this.instance.setProperty("Face", BigInt(asset.id))
                        break
                    case "Hat":
                    case "HairAccessory":
                    case "FaceAccessory":
                    case "NeckAccessory":
                    case "ShoulderAccessory":
                    case "FrontAccessory":
                    case "BackAccessory":
                    case "WaistAccessory":
                    case "TShirtAccessory":
                    case "ShirtAccessory":
                    case "PantsAccessory":
                    case "JacketAccessory":
                    case "SweaterAccessory":
                    case "ShortsAccessory":
                    case "LeftShoeAccessory":
                    case "RightShoeAccessory":
                    case "DressSkirtAccessory":
                    case "EyebrowAccessory":
                    case "EyelashAccessory":
                        {
                            const accessoryType = AssetTypeToAccessoryType[asset.assetType.name]

                            const accessoryDescriptionWrapper = new AccessoryDescriptionWrapper(new Instance("AccessoryDescription"))
                            const instance = accessoryDescriptionWrapper.instance
                            instance.setProperty("AssetId", BigInt(asset.id))
                            instance.setProperty("AccessoryType", accessoryType)

                            if (accessoryType === AccessoryType.Hair) {
                                assetPromises.push(new Promise((resolve) => {
                                    API.Asset.GetRBX(`rbxassetid://${asset.id}`, undefined, auth).then(result => {
                                        if (result instanceof RBX) {
                                            const dataModel = result.generateTree()
                                            const descendants = dataModel.GetDescendants()
                                            let hasWrapLayer = false

                                            for (const child of descendants) {
                                                if (child.className === "WrapLayer") {
                                                    hasWrapLayer = true
                                                }
                                            }

                                            instance.setProperty("IsLayered", hasWrapLayer)

                                            resolve(undefined)
                                        } else {
                                            console.warn("Failed to get accessory")
                                            resolve(result)
                                        }
                                    })
                                }))
                            } else if (NeverLayeredAccessoryTypes.includes(accessoryType)) {
                                instance.setProperty("IsLayered", false)
                            } else {
                                instance.setProperty("IsLayered", true)
                            }

                            instance.setProperty("Puffiness", 1.0) //this is deprecated
                            instance.setProperty("Order", asset.meta?.order || 1)

                            if (asset.meta?.position) {
                                const positionVector3 = new Vector3()
                                positionVector3.X = asset.meta.position.X
                                positionVector3.Y = asset.meta.position.Y
                                positionVector3.Z = asset.meta.position.Z
                                instance.setProperty("Position", positionVector3)
                            }

                            if (asset.meta?.rotation) {
                                const rotationVector3 = new Vector3()
                                rotationVector3.X = asset.meta.rotation.X
                                rotationVector3.Y = asset.meta.rotation.Y
                                rotationVector3.Z = asset.meta.rotation.Z
                                instance.setProperty("Rotation", rotationVector3)
                            }

                            if (asset.meta?.scale) {
                                const scaleVector3 = new Vector3()
                                scaleVector3.X = asset.meta.scale.X
                                scaleVector3.Y = asset.meta.scale.Y
                                scaleVector3.Z = asset.meta.scale.Z
                                instance.setProperty("Scale", scaleVector3)
                            }

                            instance.setParent(this.instance)
                        }
                        break
                    case "Torso":
                    case "LeftLeg":
                    case "RightLeg":
                    case "LeftArm":
                    case "RightArm":
                    case "Head":
                    case "DynamicHead":
                        {
                            let bodyPartName = asset.assetType.name
                            if (bodyPartName === "DynamicHead") {
                                bodyPartName = "Head"
                            }

                            const bodyPart = BodyPart[bodyPartName]
                            this.setBodyPartId(bodyPart, BigInt(asset.id))
                        }
                        break
                    case "ClimbAnimation":
                    case "FallAnimation":
                    case "IdleAnimation":
                    case "JumpAnimation":
                    case "RunAnimation":
                    case "SwimAnimation":
                    case "WalkAnimation":
                    case "MoodAnimation":
                        {
                            this.instance.setProperty(asset.assetType.name, BigInt(asset.id))
                        }
                        break
                    default:
                        console.warn(`Unsupported assetType: ${asset.assetType.name}`)
            }
        }

        const results = await Promise.all(assetPromises)
        for (const result of results) {
            if (result) {
                return result
            }
        }

        return this.instance
    }

    _applyScale(humanoid: Instance) {
        const rig = humanoid.parent
        if (!rig) {
            return
        }

        const avatarType = humanoid.Prop("RigType") === HumanoidRigType.R15 ? AvatarType.R15 : AvatarType.R6

        //create mock outfit for ease of use and old api compatibility
        const mockOutfit = new Outfit()
        mockOutfit.playerAvatarType = AvatarType.R15
        mockOutfit.scale.bodyType = this.instance.Prop("BodyTypeScale") as number
        mockOutfit.scale.proportion = this.instance.Prop("ProportionScale") as number

        mockOutfit.scale.width = this.instance.Prop("WidthScale") as number
        mockOutfit.scale.height = this.instance.Prop("HeightScale") as number
        mockOutfit.scale.depth = this.instance.Prop("DepthScale") as number
        mockOutfit.scale.head = this.instance.Prop("HeadScale") as number

        //update number values
        const bodyTypeValue = humanoid.FindFirstChild("BodyTypeScale")
        const bodyProportionValue = humanoid.FindFirstChild("BodyProportionScale")

        const bodyWidthScaleValue = humanoid.FindFirstChild("BodyWidthScale")
        const bodyHeightScaleValue = humanoid.FindFirstChild("BodyHeightScale")
        const bodyDepthScaleValue = humanoid.FindFirstChild("BodyDepthScale")
        const headScaleValue = humanoid.FindFirstChild("HeadScale")

        bodyTypeValue?.setProperty("Value", mockOutfit.scale.bodyType)
        bodyProportionValue?.setProperty("Value", mockOutfit.scale.proportion)

        bodyWidthScaleValue?.setProperty("Value", mockOutfit.scale.width)
        bodyHeightScaleValue?.setProperty("Value", mockOutfit.scale.height)
        bodyDepthScaleValue?.setProperty("Value", mockOutfit.scale.depth)
        headScaleValue?.setProperty("Value", mockOutfit.scale.head)

        //apply scale
        let scaleInfo = null

        if (avatarType === AvatarType.R15) {
            scaleInfo = ScaleCharacter(rig, mockOutfit, this.instance)
        } else {
            const children = rig.GetChildren()
            for (const child of children) {
                if (child.className === "Accessory") {
                    //BUG: Roblox scales accessories even in R6, it's also inconsistent and sometimes some accessories may not be scaled
                    //Also this is neccessary here because the code below adjusts accessories, maybe thats why roblox also does it?
                    ScaleAccessory(child, new Vector3(1,1,1), new Vector3(1,1,1), null, null, rig, this.instance)
                }
            }
        }

        //align feet with ground
        if (scaleInfo) {
            const hrp = rig.FindFirstChild("HumanoidRootPart")
            if (hrp) {
                const cf = (hrp.Prop("CFrame") as CFrame).clone()
                cf.Position[1] = scaleInfo.stepHeight + (hrp.Prop("Size") as Vector3).Y / 2
                hrp.setProperty("CFrame", cf)
            }
        }

        //recalculate motor6ds
        for (const child of rig.GetDescendants()) {
            if (child.className === "Motor6D" || child.className === "Weld") {
                child.setProperty("C0", child.Prop("C0"))
            }
        }
    }

    _applyBodyColors(humanoid: Instance) {
        const rig = humanoid.parent
        if (!rig) {
            return
        }

        const bodyColors = rig.FindFirstChildOfClass("BodyColors")
        if (bodyColors) {
            bodyColors.setProperty("HeadColor3", this.getBodyPartColor(BodyPart.Head))
            bodyColors.setProperty("TorsoColor3", this.getBodyPartColor(BodyPart.Torso))

            bodyColors.setProperty("LeftArmColor3", this.getBodyPartColor(BodyPart.LeftArm))
            bodyColors.setProperty("RightArmColor3", this.getBodyPartColor(BodyPart.RightArm))

            bodyColors.setProperty("LeftLegColor3", this.getBodyPartColor(BodyPart.LeftLeg))
            bodyColors.setProperty("RightLegColor3", this.getBodyPartColor(BodyPart.RightLeg))
        }
    }

    /**
     * @returns undefined on success
     */
    async _applyBodyParts(humanoid: Instance, auth: Authentication, toChange = AllBodyParts): Promise<Response | undefined> {
        const rig = humanoid.parent
        if (!rig) {
            return undefined
        }

        const avatarType = humanoid.Prop("RigType") === HumanoidRigType.R15 ? AvatarType.R15 : AvatarType.R6

        const promises: Promise<undefined | Response>[] = []

        for (const bodyPart of toChange) {
            const assetId = this.getBodyPartId(bodyPart)
            if (assetId > 0) {
                promises.push(new Promise((resolve) => {
                    let headers: HeadersInit | undefined = undefined
                    if (avatarType === AvatarType.R15 && bodyPart === BodyPart.Head) {
                        headers = {"Roblox-AssetFormat":"avatar_meshpart_head"}
                    }

                    API.Asset.GetRBX(`rbxassetid://${assetId}`, headers, auth).then(bodyPartRBX => {
                        if (this.cancelApply) resolve(undefined)
                        if (!(bodyPartRBX instanceof RBX)) {
                            resolve(bodyPartRBX)
                        } else {
                            const dataModel = bodyPartRBX.generateTree()

                            //non head body parts
                            if (bodyPart !== BodyPart.Head) {
                                if (avatarType === AvatarType.R6) {
                                    const R6Folder = dataModel.FindFirstChild("R6")
                                    let characterMesh = undefined

                                    if (R6Folder) {
                                        characterMesh = R6Folder.FindFirstChildOfClass("CharacterMesh")
                                    } else {
                                        characterMesh = dataModel.FindFirstChildOfClass("CharacterMesh")
                                    }
                                    if (characterMesh) {
                                        for (const oldCharacterMesh of rig.GetChildren()) {
                                            if (oldCharacterMesh.className === "CharacterMesh") {
                                                if (oldCharacterMesh.Prop("BodyPart") === characterMesh.Prop("BodyPart")) {
                                                    oldCharacterMesh.Destroy()
                                                }
                                            }
                                        }

                                        characterMesh.setParent(rig)
                                    }
                                    
                                } else {
                                    let R15Folder = dataModel.FindFirstChild("R15ArtistIntent")
                                    if (!R15Folder || R15Folder.GetChildren().length === 0) {
                                        R15Folder = dataModel.FindFirstChild("R15Fixed")
                                    }

                                    if (R15Folder) {
                                        const children = R15Folder.GetChildren()
                                        for (const child of children) {
                                            replaceBodyPart(rig, child)
                                        }
                                    }
                                }

                                resolve(undefined)
                            } else {
                                if (avatarType === AvatarType.R6) {
                                    const headMesh = dataModel.FindFirstChildOfClass("SpecialMesh")
                                    if (headMesh) {
                                        const bodyHeadMesh = rig.FindFirstChild("Head")?.FindFirstChildOfClass("SpecialMesh")
                                        if (bodyHeadMesh) {
                                            bodyHeadMesh.Destroy()
                                        }

                                        headMesh.setParent(rig.FindFirstChild("Head"))
                                    }
                                } else {
                                    const head = dataModel.FindFirstChildOfClass("MeshPart")

                                    if (head) {
                                        replaceBodyPart(rig, head)
                                    }
                                }

                                /*this._applyFace(humanoid, auth).then(result => {
                                    if (!result) {
                                        resolve(undefined)
                                    } else {
                                        resolve(result)
                                    }
                                })*/
                               resolve(undefined)
                            }
                        }
                    })
                }))
            } else {
                promises.push(new Promise((resolve) => {
                    API.Asset.GetRBX(avatarType === AvatarType.R6 ? "../assets/RigR6.rbxm" : "../assets/RigR15.rbxm", undefined, auth).then(result => {
                        if (this.cancelApply) resolve(undefined)
                        if (result instanceof RBX) {
                            const dataModel = result.generateTree()
                            const rigSource = dataModel.GetChildren()[0]
                            if (rigSource) {
                                for (const bodyPartName of BodyPartEnumToNames[bodyPart]) {
                                    if (avatarType === AvatarType.R15) {
                                        const bodyPartPart = rigSource.FindFirstChild(bodyPartName)
                                        if (bodyPartPart) {
                                            replaceBodyPart(rig, bodyPartPart)
                                        }
                                    } else if (avatarType === AvatarType.R6) {
                                        if (bodyPart !== BodyPart.Head) {
                                            let replacementCharacterMesh = undefined

                                            for (const newCharacterMesh of rigSource.GetChildren()) {
                                                if (newCharacterMesh.className === "CharacterMesh") {
                                                    if (newCharacterMesh.Prop("BodyPart") === bodyPart) {
                                                        replacementCharacterMesh = newCharacterMesh
                                                    }
                                                }
                                            }

                                            for (const oldCharacterMesh of rig.GetChildren()) {
                                                if (oldCharacterMesh.className === "CharacterMesh") {
                                                    if (oldCharacterMesh.Prop("BodyPart") === bodyPart) {
                                                        oldCharacterMesh.Destroy()
                                                    }
                                                }
                                            }

                                            if (replacementCharacterMesh) {
                                                replacementCharacterMesh.setParent(rig)
                                            }
                                        } else {
                                            const head = rigSource.FindFirstChild("Head")
                                            if (head) {
                                                const originalHead = rig.FindFirstChild("Head")
                                                if (originalHead) {
                                                    const originalHeadMesh = originalHead.FindFirstChildOfClass("SpecialMesh")
                                                    if (originalHeadMesh) {
                                                        originalHeadMesh.Destroy()
                                                    }

                                                    const headMesh = head.FindFirstChildOfClass("SpecialMesh")
                                                    if (headMesh) {
                                                        headMesh.setParent(originalHead)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            resolve(undefined)
                        } else {
                            resolve(result)
                        }
                    })
                }))
            }
        }

        const values = await Promise.all(promises)
        if (this.cancelApply) return undefined
        
        for (const value of values) {
            if (value) {
                return value
            }
        }

        return undefined
    }

    /**
     * @returns undefined on success
     */
    async _applyClothing(humanoid: Instance, auth: Authentication, toChange: ClothingDiffType[] = ["Shirt", "Pants", "GraphicTShirt"]): Promise<undefined | Response> {
        const rig = humanoid.parent
        if (!rig) {
            return undefined
        }

        const promises: Promise<undefined | Response>[] = []

        for (const change of toChange) {
            const id = this.instance.Prop(change) as bigint

            if (id > 0) {
                promises.push(new Promise((resolve) => {
                    API.Asset.GetRBX(`rbxassetid://${id}`, undefined, auth).then(rbx => {
                        if (this.cancelApply) resolve(undefined)
                        if (rbx instanceof RBX) {
                            const dataModel = rbx.generateTree()
                            const asset = dataModel.GetChildren()[0]
                            if (asset) {
                                const assetClassName = asset.className
                                const originalAsset = rig.FindFirstChildOfClass(assetClassName)
                                if (originalAsset) {
                                    originalAsset.Destroy()
                                }

                                asset.setParent(rig)
                            }
                            resolve(undefined)
                        } else {
                            resolve(rbx)
                        }
                    })
                }))
            } else {
                let className: string = change
                if (className === "GraphicTShirt") {
                    className = "ShirtGraphic"
                }

                const originalAsset = rig.FindFirstChildOfClass(className)
                if (originalAsset) {
                    originalAsset.Destroy()
                }
            }
        }

        const values = await Promise.all(promises)
        if (this.cancelApply) return undefined

        for (const value of values) {
            if (value) {
                return value
            }
        }

        return undefined
    }

    /**
     * @returns undefined on success
     */
    async _applyFace(humanoid: Instance, auth: Authentication): Promise<undefined | Response> {
        const rig = humanoid.parent
        if (!rig) {
            return undefined
        }

        const id = this.instance.Prop("Face") as bigint

        if (id > 0) {
            const rbx = await API.Asset.GetRBX(`rbxassetid://${id}`, undefined, auth)
            if (this.cancelApply) return undefined
            if (rbx instanceof RBX) {
                const dataModel = rbx.generateTree()
                const face = dataModel.GetChildren()[0]
                if (face) {
                    const head = rig.FindFirstChild("Head")
                    if (head) {
                        const oldFace = head.FindFirstChildOfClass("Decal")
                        if (oldFace) {
                            oldFace.Destroy()
                        }
                        //if (!head.FindFirstChildOfClass("FaceControls")) { //TODO: find out how roblox avoids adding faces to dynamic heads
                            face.setParent(head)
                        //} else {
                        //    face.Destroy()
                        //}
                    }
                }
            } else {
                return rbx
            }
        } else {
            const head = rig.FindFirstChild("Head")
            if (head) {
                const oldFace = head.FindFirstChildOfClass("Decal")
                if (oldFace) {
                    oldFace.setProperty("Texture","rbxasset://textures/face.png")
                }
            }
        }

        return undefined
    }

    _inheritAccessoryReferences(originalW: HumanoidDescriptionWrapper) {
        for (const accessoryDesc of originalW.getAccessoryDescriptions()) {
            for (const newAccessoryDesc of this.getAccessoryDescriptions()) {
                if (accessoryDesc.Prop("AssetId") === newAccessoryDesc.Prop("AssetId")) {
                    if (accessoryDesc.Prop("Instance")) {
                        newAccessoryDesc.setProperty("Instance", accessoryDesc.Prop("Instance"))
                    }
                }
            }
        }
    }

    /**
     * @returns undefined on success
     */
    async _applyAccessories(humanoid: Instance, auth: Authentication, originalW?: HumanoidDescriptionWrapper, addedIds?: bigint[], removedIds?: bigint[]): Promise<undefined | Response> {
        if (!addedIds || !removedIds) {
            addedIds = this.getAccessoryIds()
            removedIds = []
        }

        const rig = humanoid.parent
        if (!rig) {
            return undefined
        }

        const avatarType = humanoid.Prop("RigType") === HumanoidRigType.R15 ? AvatarType.R15 : AvatarType.R6

        // remove old accessories
        if (!originalW) {
            for (const accessory of rig.GetChildren()) {
                if (accessory.className === "Accessory") {
                    accessory.Destroy()
                }
            }
        } else {
            const descs = originalW.getAccessoryDescriptions()
            for (const desc of descs) {
                const accessory = desc.Prop("Instance") as Instance | undefined
                if (accessory) {
                    if (removedIds.includes(desc.Prop("AssetId") as bigint)) {
                        accessory.Destroy()
                    }
                }
            }
        }

        const promises: Promise<undefined | Response>[] = []

        // add new accessories
        for (const id of addedIds) {
            let headers: undefined | HeadersInit = undefined
            if (avatarType === AvatarType.R15) {
                headers = {"Roblox-AssetFormat":"avatar_meshpart_accessory"}
            }

            promises.push(new Promise((resolve) => {
                API.Asset.GetRBX(`rbxassetid://${id}`, headers, auth).then(rbx => {
                    if (this.cancelApply) resolve(undefined)
                    if (rbx instanceof RBX) {
                        const dataModel = rbx.generateTree()
                        const accessory = dataModel.GetChildren()[0]

                        if (accessory) {
                            let isLayered = false
                            const handle = accessory.FindFirstChild("Handle")
                            if (handle) {
                                isLayered = !!handle.FindFirstChildOfClass("WrapLayer")
                            }

                            if (!isLayered || avatarType === AvatarType.R15) {
                                accessory.setParent(rig)
                            }

                            const accessoryDesc = this.getAccessoryDescriptionWithId(id)
                            if (accessoryDesc) {
                                accessoryDesc.setProperty("Instance", accessory)
                            }
                        }
                        
                        resolve(undefined)
                    } else {
                        resolve(rbx)
                    }
                })
            }))
        }

        const values = await Promise.all(promises)
        if (this.cancelApply) return undefined

        //update order for layered clothing
        if (avatarType === AvatarType.R15) {
            for (const accessory of rig.GetChildren()) {
                if (accessory.className === "Accessory") {
                    const handle = accessory.FindFirstChildOfClass("MeshPart")
                    if (handle) {
                        const wrapLayer = handle.FindFirstChildOfClass("WrapLayer")
                        if (wrapLayer) {
                            for (const accessoryDesc of this.getAccessoryDescriptions()) {
                                if (accessoryDesc.Prop("Instance") === accessory) {
                                    wrapLayer.setProperty("Order", accessoryDesc.Prop("Order"))
                                }
                            }
                        }
                    }
                }
            }
        }

        for (const value of values) {
            if (value) {
                return value
            }
        }

        return undefined
    }

    /**
     * @returns undefined on success
     */
    //TODO: CLEAN UP THIS CODE, the comments are not enough!
    async _applyAnimations(humanoid: Instance, auth: Authentication, toChange: AnimationProp[] = AllAnimations): Promise<undefined | Response> {
        const animator = humanoid.FindFirstChildOfClass("Animator")
        if (!animator) {
            throw new Error("Humanoid is missing an Animator")
        }
        
        const avatarType = humanoid.Prop("RigType") === HumanoidRigType.R15 ? AvatarType.R15 : AvatarType.R6

        const animatorW = new AnimatorWrapper(animator)

        const promises: Promise<undefined | Response>[] = []
        for (const animationProp of toChange) { //for every animation that should update
            
            if (this.instance.HasProperty(animationProp) && this.instance.Prop(animationProp) as bigint > 0n && avatarType === AvatarType.R15) { //if not a default animation
                const id = this.instance.Prop(animationProp) as bigint
                promises.push(new Promise((resolve) => {
                    animatorW.loadAvatarAnimation(auth, id, false, true).then((result) => {
                        resolve(result)
                    })
                }))
            } else { //if a default animation
                const [animName, subAnims] = avatarType === AvatarType.R15 ? DefaultAnimations[animationProp] : DefaultAnimationsR6[animationProp]

                //load sub animations
                for (const subAnim of subAnims) {
                    const [subName, subId] = subAnim

                    //actual request
                    promises.push(new Promise((resolve) => {
                        API.Asset.GetRBX(`rbxassetid://${subId}`, undefined, auth).then(result => {
                            if (result instanceof RBX) {
                                //get and parse track
                                const animTrackInstance = result.generateTree().GetChildren()[0]
                                if (animTrackInstance && humanoid.parent) {
                                    const animTrack = new AnimationTrack().loadAnimation(humanoid.parent, animTrackInstance);
                                    (animatorW.instance.Prop("_TrackMap") as Map<bigint,AnimationTrack>).set(subId, animTrack);
                                    (animatorW.instance.Prop("_NameIdMap") as Map<string,bigint>).set(`${animName}.${subName}`, subId)
                                    animatorW.instance.setProperty("_HasLoadedAnimation",true)
                                }

                                resolve(undefined)
                            } else {
                                resolve(result)
                            }
                        })
                    }))
                }
            }
        }

        const values = await Promise.all(promises)
        if (this.cancelApply) return undefined
        for (const value of values) {
            if (value) {
                return value
            }
        }

        return undefined
    }

    /**
     * @returns undefined on success
     */
    async _applyAll(humanoid: Instance, auth: Authentication): Promise<undefined | Response> {
        const promises: Promise<Response | undefined>[] = []

        promises.push(this._applyAccessories(humanoid, auth))
        promises.push(this._applyClothing(humanoid, auth))
        promises.push(this._applyBodyParts(humanoid, auth))
        promises.push(this._applyFace(humanoid, auth))
        promises.push(this._applyAnimations(humanoid, auth))
        
        const values = await Promise.all(promises)
        if (this.cancelApply) return undefined
        
        for (const value of values) {
            if (value) {
                return value
            }
        }
        
        this._applyBodyColors(humanoid)
        //scale should be last, right?
        this._applyScale(humanoid)
        this._applyScale(humanoid)

        return undefined
    }

    /**
     * @returns Instance on success
     */
    async applyDescription(humanoid: Instance, auth: Authentication): Promise<Instance | Response | undefined> {
        if (this.instance.parent?.className === "Humanoid") {
            throw new Error("This HumanoidDescription has already been applied! Create a new one instead")
        }

        const promises: Promise<undefined | Response>[] = []
        const results: (undefined | Response)[] = []

        const originalDescription = humanoid.FindFirstChildOfClass("HumanoidDescription")

        if (!originalDescription) {
            promises.push(this._applyAll(humanoid, auth))
        } else {
            const originalDescriptionW = new HumanoidDescriptionWrapper(originalDescription)
            const [diffs, addedAccessories, removedAccessories] = this.compare(originalDescriptionW)
            
            const miniPromises: Promise<undefined | Response>[] = []

            //accessories
            this._inheritAccessoryReferences(originalDescriptionW)

            if (diffs.includes("accessory")) {
                miniPromises.push(this._applyAccessories(humanoid, auth, originalDescriptionW, addedAccessories, removedAccessories))
            }

            //face
            if (diffs.includes("face")) {
                miniPromises.push(this._applyFace(humanoid, auth))
            }

            //clothing
            if (diffs.includes("clothing")) {
                const toChange: ClothingDiffType[] = []
                if (this.instance.Prop("Shirt") !== originalDescriptionW.instance.Prop("Shirt")) {
                    toChange.push("Shirt")
                }
                if (this.instance.Prop("Pants") !== originalDescriptionW.instance.Prop("Pants")) {
                    toChange.push("Pants")
                }
                if (this.instance.Prop("GraphicTShirt") !== originalDescriptionW.instance.Prop("GraphicTShirt")) {
                    toChange.push("GraphicTShirt")
                }

                miniPromises.push(this._applyClothing(humanoid, auth, toChange))
            }

            //body parts
            if (diffs.includes("bodyPart")) {
                const toChange = []
                for (const bodyPart of AllBodyParts) {
                    if (this.getBodyPartId(bodyPart) !== originalDescriptionW.getBodyPartId(bodyPart)) {
                        toChange.push(bodyPart)
                    }
                }

                miniPromises.push(this._applyBodyParts(humanoid, auth, toChange))
            }

            //animations
            const animator = humanoid.FindFirstChildOfClass("Animator")
            if (diffs.includes("animation") || !animator?.HasProperty("_HasLoadedAnimation") || !animator?.Prop("_HasLoadedAnimation")) {
                const toChange: AnimationProp[] = []

                for (const animationProp of AllAnimations) {
                    if (this.instance.Prop(animationProp) !== originalDescriptionW.instance.Prop(animationProp) || !animator?.HasProperty("_HasLoadedAnimation") || !animator?.Prop("_HasLoadedAnimation")) {
                        toChange.push(animationProp)
                    }
                }

                if (!animator?.HasProperty("_HasLoadedAnimation") || !animator?.Prop("_HasLoadedAnimation")) {
                    toChange.push("dance1")
                    toChange.push("dance2")
                    toChange.push("dance3")
                }

                miniPromises.push(this._applyAnimations(humanoid, auth, toChange))
            }

            const miniValues = await Promise.all(miniPromises)
            if (this.cancelApply) return undefined

            for (const value of miniValues) {
                if (value) {
                    return value
                }
            }

            //body color
            if (diffs.includes("bodyPart") || diffs.includes("bodyColor")) {
                this._applyBodyColors(humanoid)
            }

            //scale
            if (diffs.includes("scale") || diffs.includes("bodyPart") || diffs.includes("accessory")) {
                //only applying it once breaks stuff (I DONT KNOW WHY) TODO: FIX THIS
                this._applyScale(humanoid)
                this._applyScale(humanoid)
            }
        }

        const values = await Promise.all(promises)
        if (this.cancelApply) return undefined
        originalDescription?.Destroy()

        for (const value of values) {
            results.push(value)
        }

        for (const result of results) {
            if (result) {
                return result
            }
        }

        this.instance.setParent(humanoid)
        
        return this.instance
    }
}
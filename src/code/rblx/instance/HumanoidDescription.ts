import { API } from "../../api";
import { AvatarType, defaultPantAssetIds, defaultShirtAssetIds, minimumDeltaEBodyColorDifference } from "../../avatar/constant";
import { Outfit, type BodyColor3s, type BodyColors } from "../../avatar/outfit";
import { hexToColor3, hexToRgb } from "../../misc/misc";
import { delta_CIEDE2000 } from "../color-similarity";
import { AccessoryType, AssetTypeToAccessoryType, BodyPart, DataType, HumanoidRigType, NeverLayeredAccessoryTypes } from "../constant";
import { CFrame, Color3, Instance, Property, RBX, Vector3 } from "../rbx";
import { ScaleAccessory, ScaleCharacter } from "../scale";
import AccessoryDescriptionWrapper from "./AccessoryDescription";
import BodyPartDescriptionWrapper from "./BodyPartDescription";
import InstanceWrapper from "./InstanceWrapper";

type HumanoidDescriptionDiff = "scale" | "bodyColor" | "animation" | "bodyPart" | "clothing" | "face" | "accessory"

function hasSameValFloat(instance0: Instance, instance1: Instance, propertyName: string) {
    return Math.round(instance0.Prop(propertyName) as number * 1000) === Math.round(instance1.Prop(propertyName) as number * 1000)
}

function hasSameVal(instance0: Instance, instance1: Instance, propertyName: string) {
    return instance0.Prop(propertyName) === instance1.Prop(propertyName)
}

function isSameColor(color0: Color3, color1: Color3) {
    return Math.round(color0.R * 1000) === Math.round(color1.R * 1000) && Math.round(color0.G * 1000) === Math.round(color1.G * 1000) && Math.round(color0.B * 1000) === Math.round(color1.B * 1000)
}

function isSameVector3(vec0: Vector3, vec1: Vector3) {
    return Math.round(vec0.X * 1000) === Math.round(vec1.X * 1000) && Math.round(vec0.Y * 1000) === Math.round(vec1.Y * 1000) && Math.round(vec0.Z * 1000) === Math.round(vec1.Z * 1000)
}

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
     * @returns [diffs, <AccessoryDescription[]>unchangedAccessories]
    */
    compare(otherW: HumanoidDescriptionWrapper): [HumanoidDescriptionDiff[], Instance[]] {
        const self = this.instance
        const other = otherW.instance

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
        const bodyParts = [BodyPart.Head, BodyPart.Torso, BodyPart.RightArm, BodyPart.LeftArm, BodyPart.RightLeg, BodyPart.LeftLeg]
        for (const bodyPart of bodyParts) {
            if (!isSameColor(this.getBodyPartColor(bodyPart), otherW.getBodyPartColor(bodyPart))) {
                bodyColorsSame = false
            }
            if (this.getBodyPartId(bodyPart) !== otherW.getBodyPartId(bodyPart)) {
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
        const unchangedAccessories = []
        let accessoriesSame = true
        const selfAccessoryDescriptions = this.getAccessoryDescriptions()
        const otherAccessoryDescriptions = otherW.getAccessoryDescriptions()

        if (selfAccessoryDescriptions.length !== otherAccessoryDescriptions.length) {
            accessoriesSame = false
        } else {
            for (const desc of selfAccessoryDescriptions) {
                let foundSame = false

                for (const otherDesc of otherAccessoryDescriptions) {
                    if (isSameAccessoryDesc(desc, otherDesc)) {
                        unchangedAccessories.push(desc)
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

        return [diffs, unchangedAccessories]
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

    async fromOutfit(outfit: Outfit): Promise<Instance | Response> {
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
                console.log(defaultClothesIndex)

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
                                    API.Asset.GetRBX(`rbxassetid://${asset.id}`).then(result => {
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

                                            console.log(dataModel)
                                            console.log(descendants)

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

    applyScale(humanoid: Instance) {
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
            scaleInfo = ScaleCharacter(rig, mockOutfit)
        } else {
            const children = rig.GetChildren()
            for (const child of children) {
                if (child.className === "Accessory") {
                    //BUG: Roblox scales accessories even in R6, it's also inconsistent and sometimes some accessories may not be scaled
                    ScaleAccessory(child, new Vector3(1,1,1), new Vector3(1,1,1), null, null, rig)
                }
            }
        }

        //recalculate motor6ds
        for (const child of rig.GetDescendants()) {
            if (child.className === "Motor6D" || child.className === "Weld") {
                child.setProperty("C0", child.Prop("C0"))
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
    }

    async applyAll(humanoid: Instance) {
        //scale should be last, right?
        this.applyScale(humanoid)
    }

    async applyDescription(humanoid: Instance): Promise<Instance | Response> {
        if (this.instance.parent?.className === "Humanoid") {
            throw new Error("This HumanoidDescription has already been applied! Create a new one instead")
        }

        const originalDescription = humanoid.FindFirstChildOfClass("HumanoidDescription")

        if (!originalDescription) {
            this.applyAll(humanoid)
        } else {
            const [diffs, unchangedAccessories] = this.compare(new HumanoidDescriptionWrapper(originalDescription))
            console.log(unchangedAccessories)
            
            if (diffs.includes("scale") || diffs.includes("bodyPart") || diffs.includes("accessory")) {
                this.applyScale(humanoid)
            }
        }

        originalDescription?.Destroy()
        this.instance.setParent(humanoid)
        
        return this.instance
    }
}
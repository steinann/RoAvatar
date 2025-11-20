export const magic = "<roblox!"
export const xmlMagic = "<roblox "

//local enumItems = Enum.AccessoryType:GetEnumItems() local result = "" for i = 1,#enumItems do result = result.."\"".. enumItems[i].Name.. "\": ".. enumItems[i].Value.. ",\n" end print(result)

export const RenderedClassTypes = ["Part", "MeshPart"]

export const NormalId = {
    "Right": 0,
    "Top": 1,
    "Back": 2,
    "Left": 3,
    "Bottom": 4,
    "Front": 5,
}

export const MeshType = {
    "Brick": 6,
    "Cylinder": 4,
    "FileMesh": 5,
    "Head": 0,
    "Sphere": 3,
    "Torso": 1,
    "Wedge": 2,
}

export const AlphaMode = {
    "Overlay": 0,
    "Transparency": 1,
    "TintMask": 2,
}

export const AccessoryType = { //THIS IS THE ENUM FROM ROBLOX STUDIO, NOT TO BE MISTAKEN WITH THE ACTUAL ASSET TYPE ID
    "Unknown": 0,
    "Hat": 1,
    "Hair": 2,
    "Face": 3,
    "Neck": 4,
    "Shoulder": 5,
    "Front": 6,
    "Back": 7,
    "Waist": 8,
    "TShirt": 9,
    "Shirt": 10,
    "Pants": 11,
    "Jacket": 12,
    "Sweater": 13,
    "Shorts": 14,
    "LeftShoe": 15,
    "RightShoe": 16,
    "DressSkirt": 17,
    "Eyebrow": 18,
    "Eyelash": 19,
}

export const HumanoidRigType = {
    "R6": 0,
    "R15": 1,
}

export const AssetTypeToAccessoryType = {
    "Hat": AccessoryType.Hat,
    "HairAccessory": AccessoryType.Hair,
    "FaceAccessory": AccessoryType.Face,
    "NeckAccessory": AccessoryType.Neck,
    "ShoulderAccessory": AccessoryType.Shoulder,
    "FrontAccessory": AccessoryType.Front,
    "BackAccessory": AccessoryType.Back,
    "WaistAccessory": AccessoryType.Waist,
    "TShirtAccessory": AccessoryType.TShirt,
    "ShirtAccessory": AccessoryType.Shirt,
    "PantsAccessory": AccessoryType.Pants,
    "JacketAccessory": AccessoryType.Jacket,
    "SweaterAccessory": AccessoryType.Sweater,
    "ShortsAccessory": AccessoryType.Shorts,
    "LeftShoeAccessory": AccessoryType.LeftShoe,
    "RightShoeAccessory": AccessoryType.RightShoe,
    "DressSkirtAccessory": AccessoryType.DressSkirt,
    "EyebrowAccessory": AccessoryType.Eyebrow,
    "EyelashAccessory": AccessoryType.Eyelash,
}

export const NeverLayeredAccessoryTypes = [
    AccessoryType.Hat,
    AccessoryType.Face,
    AccessoryType.Neck,
    AccessoryType.Shoulder,
    AccessoryType.Front,
    AccessoryType.Back,
    AccessoryType.Waist,
]

export const BodyPart = {
    "Head": 0,
    "Torso": 1,
    "LeftArm": 2,
    "RightArm": 3,
    "LeftLeg": 4,
    "RightLeg": 5,
}

export const AllBodyParts = Object.values(BodyPart)

export const BodyPartNameToEnum: {[K in string]: number} = {
    "Head": BodyPart.Head,
    "Torso": BodyPart.Torso,
    "Left Arm": BodyPart.LeftArm,
    "Right Arm": BodyPart.RightArm,
    "Left Leg": BodyPart.LeftLeg,
    "Right Leg": BodyPart.RightLeg,

    //R15
    "LeftUpperArm": BodyPart.LeftArm,
    "LeftLowerArm": BodyPart.LeftArm,
    "LeftHand": BodyPart.LeftArm,

    "RightUpperArm": BodyPart.RightArm,
    "RightLowerArm": BodyPart.RightArm,
    "RightHand": BodyPart.RightArm,

    "LeftUpperLeg": BodyPart.LeftLeg,
    "LeftLowerLeg": BodyPart.LeftLeg,
    "LeftFoot": BodyPart.LeftLeg,

    "RightUpperLeg": BodyPart.RightLeg,
    "RightLowerLeg": BodyPart.RightLeg,
    "RightFoot": BodyPart.RightLeg,

    "UpperTorso": BodyPart.Torso,
    "LowerTorso": BodyPart.Torso,
}

export const BodyPartEnumToNames: {[K in number]: string[]} = {
    [BodyPart.Head]: ["Head"],
    [BodyPart.Torso]: ["Torso", "UpperTorso", "LowerTorso"],
    [BodyPart.LeftArm]: ["Left Arm", "LeftUpperArm", "LeftLowerArm", "LeftHand"],
    [BodyPart.RightArm]: ["Right Arm", "RightUpperArm", "RightLowerArm", "RightHand"],
    [BodyPart.LeftLeg]: ["Left Leg", "LeftUpperLeg", "LeftLowerLeg", "LeftFoot"],
    [BodyPart.RightLeg]: ["Right Leg", "RightUpperLeg", "RightLowerLeg", "RightFoot"]
}

export type AnimationProp = "ClimbAnimation" | "FallAnimation" | "IdleAnimation" | "JumpAnimation" | "MoodAnimation" | "RunAnimation" | "SwimAnimation" | "WalkAnimation"
export const AllAnimations: AnimationProp[] = [
    "ClimbAnimation",
    "FallAnimation",
    "IdleAnimation",
    "JumpAnimation",
    "MoodAnimation",
    "RunAnimation",
    "SwimAnimation",
    "WalkAnimation",
]

export const DefaultAnimations: {[K in AnimationProp]: [string,[string,bigint][]]} = {
    "ClimbAnimation": ["climb",[["ClimbAnim",507765644n]]],
    "FallAnimation": ["fall",[["FallAnim",507767968n]]],
    "IdleAnimation": ["idle",[["Animation1",507766388n],["Animation2",507766666n]]],
    "JumpAnimation": ["jump",[["JumpAnim",507765000n]]],
    "MoodAnimation": ["mood",[["Animation1",7715096377n]]],
    "RunAnimation": ["run",[["RunAnim",913376220n]]],
    "SwimAnimation": ["swim",[["Swim",913384386n]]],
    "WalkAnimation": ["walk",[["WalkAnim",913402848n]]]
}

export const DefaultAnimationsR6: typeof DefaultAnimations = {
    "ClimbAnimation": ["climb",[["ClimbAnim",180436334n]]],
    "FallAnimation": ["fall",[["FallAnim",180436148n]]],
    "IdleAnimation": ["idle",[["Animation1",180435571n],["Animation2",180435792n]]],
    "JumpAnimation": ["jump",[["JumpAnim",125750702n]]],
    "MoodAnimation": ["mood",[]],
    "RunAnimation": ["run",[["RunAnim",180426354n]]],
    "SwimAnimation": ["swim",[]],
    "WalkAnimation": ["walk",[["WalkAnim",180426354n]]]
}

export const DataType = {
    "String": 0x01,
    "Bool": 0x02,
    "Int32": 0x03,
    "Float32": 0x04,
    "Float64": 0x05,
    "UDim": 0x06,
    "UDim2": 0x07,
    "Ray": 0x08,
    "Faces": 0x09, //NOT IMPLEMENTED
    "Axes": 0x0a, //NOT IMPLEMENTED
    "BrickColor": 0x0b,
    "Color3": 0x0c,
    "Vector2": 0x0d, //NOT IMPLEMENTED
    "Vector3": 0x0e,
    "CFrame": 0x10,
    "Enum": 0x12,
    "Referent": 0x13,

    "Color3uint8": 0x1a,
    "Int64": 0x1b,

    "Capabilites": 0x21, //NOT IMPLEMENTED

    "NonSerializable": 9999 //not a real type
}

export const PropertyTypeInfo = {
    "Pants": {
        "PantsTemplate": "String",
        "Name": "String",
        "archiveable": "Bool"
    },
    "Shirt": {
        "ShirtTemplate": "String",
        "Name": "String",
        "archiveable": "Bool"
    },
    "ShirtGraphic": {
        "Graphic": "String",
        "Name": "String",
        "archiveable": "Bool"
    }
}
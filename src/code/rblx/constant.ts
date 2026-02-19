export const magic = "<roblox!"
export const xmlMagic = "<roblox "

//local enumItems = Enum.AccessoryType:GetEnumItems() local result = "" for i = 1,#enumItems do result = result.."\"".. enumItems[i].Name.. "\": ".. enumItems[i].Value.. ",\n" end print(result)

export const RenderedClassTypes = ["Part", "MeshPart"]

export const WrapLayerAutoSkin = {
    "Disabled": 0,
    "EnabledPreserve": 1,
    "EnabledOverride": 2,
}

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

export type AnimationProp = "ClimbAnimation" | "FallAnimation" | "IdleAnimation" | "JumpAnimation" | "MoodAnimation" | "RunAnimation" | "SwimAnimation" | "WalkAnimation" | "dance1" | "dance2" | "dance3" | "toolnone"
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

export const MainToSubNames: {[K in string]: string[]} = {
    "climb": ["ClimbAnim"],
    "fall": ["FallAnim"],
    "idle": ["Animation1", "Animation2"],
    "jump": ["JumpAnim"],
    "mood": ["Animation1"],
    "run": ["RunAnim"],
    "swim": ["Swim"],
    "walk": ["WalkAnim"]
}

export const AnimationPropToName: {[K in AnimationProp]: string} = {
    "ClimbAnimation": "climb",
    "FallAnimation": "fall",
    "IdleAnimation": "idle",
    "JumpAnimation": "jump",
    "MoodAnimation": "mood",
    "RunAnimation": "run",
    "SwimAnimation": "swim",
    "WalkAnimation": "walk",
    "dance1": "dance1",
    "dance2": "dance2",
    "dance3": "dance3",
    "toolnone": "toolnone",
}

/**
 * @deprecated
 */
export const DefaultAnimations: {[K in AnimationProp]: [string,[string,bigint][]]} = {
    "ClimbAnimation": ["climb",[["ClimbAnim",507765644n]]],
    "FallAnimation": ["fall",[["FallAnim",507767968n]]],
    "IdleAnimation": ["idle",[["Animation1",507766388n],["Animation2",507766666n]]],
    "JumpAnimation": ["jump",[["JumpAnim",507765000n]]],
    "MoodAnimation": ["mood",[["Animation1",7715096377n]]],
    "RunAnimation": ["run",[["RunAnim",913376220n]]],
    "SwimAnimation": ["swim",[["Swim",913384386n]]],
    "WalkAnimation": ["walk",[["WalkAnim",913402848n]]],

    //sourced from the last id in their tables
    "dance1": ["dance1",[["2",507772104n]]],
    "dance2": ["dance2",[["2",507776879n]]],
    "dance3": ["dance3",[["2",507777623n]]],

    "toolnone": ["toolnone",[["ToolNoneAnim", 507768375n]]]
}

/**
 * @deprecated
 */
export const DefaultAnimationsR6: typeof DefaultAnimations = {
    "ClimbAnimation": ["climb",[["ClimbAnim",180436334n]]],
    "FallAnimation": ["fall",[["FallAnim",180436148n]]],
    "IdleAnimation": ["idle",[["Animation1",180435571n],["Animation2",180435792n]]],
    "JumpAnimation": ["jump",[["JumpAnim",125750702n]]],
    "MoodAnimation": ["mood",[]],
    "RunAnimation": ["run",[["RunAnim",180426354n]]],
    "SwimAnimation": ["swim",[]],
    "WalkAnimation": ["walk",[["WalkAnim",180426354n]]],

    //sourced from the last id in their tables
    "dance1": ["dance1",[["2",182491065n]]],
    "dance2": ["dance2",[["2",182491277n]]],
    "dance3": ["dance3",[["2",182491423n]]],

    "toolnone": ["toolnone",[["ToolNoneAnim", 182393478n]]]
}

export type AnimationSetEntry = {id: string, weight: number, isEmote?: boolean}
export type AnimationSet = {[K in string]: AnimationSetEntry[]}

export const animNamesR6: AnimationSet = {
    idle: [
        { id: "http://www.roblox.com/asset/?id=180435571", weight: 9 },
        { id: "http://www.roblox.com/asset/?id=180435792", weight: 1 }
    ],
    walk: [
        { id: "http://www.roblox.com/asset/?id=180426354", weight: 10 }
    ],
    /*run: [
        { id: "run.xml", weight: 10 }
    ],*/
    jump: [
        { id: "http://www.roblox.com/asset/?id=125750702", weight: 10 }
    ],
    fall: [
        { id: "http://www.roblox.com/asset/?id=180436148", weight: 10 }
    ],
    climb: [
        { id: "http://www.roblox.com/asset/?id=180436334", weight: 10 }
    ],
    sit: [
        { id: "http://www.roblox.com/asset/?id=178130996", weight: 10 }
    ],
    toolnone: [
        { id: "http://www.roblox.com/asset/?id=182393478", weight: 10 }
    ],
    toolslash: [
        { id: "http://www.roblox.com/asset/?id=129967390", weight: 10 },
//        { id: "slash.xml", weight: 10 }
    ],
    toollunge: [
        { id: "http://www.roblox.com/asset/?id=129967478", weight: 10 }
    ],
    /*wave: [
        { id: "http://www.roblox.com/asset/?id=128777973", weight: 10 }
    ],
    point: [
        { id: "http://www.roblox.com/asset/?id=128853357", weight: 10 }
    ],*/
    dance1: [
        { id: "http://www.roblox.com/asset/?id=182435998", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=182491037", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=182491065", weight: 10 }
    ],
    dance2: [
        { id: "http://www.roblox.com/asset/?id=182436842", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=182491248", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=182491277", weight: 10 }
    ],
    dance3: [
        { id: "http://www.roblox.com/asset/?id=182436935", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=182491368", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=182491423", weight: 10 }
    ],
    /*laugh: [
        { id: "http://www.roblox.com/asset/?id=129423131", weight: 10 }
    ],
    cheer: [
        { id: "http://www.roblox.com/asset/?id=129423030", weight: 10 }
    ],*/
}

export const animNamesR15: AnimationSet = {
    idle: [
        { id: "http://www.roblox.com/asset/?id=507766666", weight: 1 },
        { id: "http://www.roblox.com/asset/?id=507766388", weight: 9 }
    ],
    walk: [
        { id: "http://www.roblox.com/asset/?id=913402848", weight: 10 }
    ],
    run: [
        { id: "http://www.roblox.com/asset/?id=913376220", weight: 10 }
    ],
    swim: [
        { id: "http://www.roblox.com/asset/?id=913384386", weight: 10 }
    ],
    swimidle: [
        { id: "http://www.roblox.com/asset/?id=913389285", weight: 10 }
    ],
    jump: [
        { id: "http://www.roblox.com/asset/?id=507765000", weight: 10 }
    ],
    fall: [
        { id: "http://www.roblox.com/asset/?id=507767968", weight: 10 }
    ],
    climb: [
        { id: "http://www.roblox.com/asset/?id=507765644", weight: 10 }
    ],
    sit: [
        { id: "http://www.roblox.com/asset/?id=2506281703", weight: 10 }
    ],
    toolnone: [
        { id: "http://www.roblox.com/asset/?id=507768375", weight: 10 }
    ],
    toolslash: [
        { id: "http://www.roblox.com/asset/?id=522635514", weight: 10 }
    ],
    toollunge: [
        { id: "http://www.roblox.com/asset/?id=522638767", weight: 10 }
    ],
    /*wave: [
        { id: "http://www.roblox.com/asset/?id=507770239", weight: 10 }
    ],
    point: [
        { id: "http://www.roblox.com/asset/?id=507770453", weight: 10 }
    ],
    dance: [
        { id: "http://www.roblox.com/asset/?id=507771019", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=507771955", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=507772104", weight: 10 }
    ],
    dance2: [
        { id: "http://www.roblox.com/asset/?id=507776043", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=507776720", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=507776879", weight: 10 }
    ],
    dance3: [
        { id: "http://www.roblox.com/asset/?id=507777268", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=507777451", weight: 10 },
        { id: "http://www.roblox.com/asset/?id=507777623", weight: 10 }
    ],
    laugh: [
        { id: "http://www.roblox.com/asset/?id=507770818", weight: 10 }
    ],
    cheer: [
        { id: "http://www.roblox.com/asset/?id=507770677", weight: 10 }
    ],*/
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
    "SharedString": 0x1c,
    "Bytecode": 0x1d,

    "Capabilites": 0x21, //NOT IMPLEMENTED
    "Content": 0x22,

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

export const FaceControlNames = [
    "Corrugator",
    "LeftBrowLowerer", "LeftInnerBrowRaiser", "LeftNoseWrinkler", "LeftOuterBrowRaiser",
    "RightBrowLowerer", "RightInnerBrowRaiser", "RightNoseWrinkler", "RightOuterBrowRaiser",
    "EyesLookDown", "EyesLookLeft", "EyesLookRight", "EyesLookUp",
    "LeftCheekRaiser", "LeftEyeClosed", "LeftEyeUpperLidRaiser",
    "RightCheekRaiser", "RightEyeClosed", "RightEyeUpperLidRaiser",
    "JawDrop",  "JawLeft", "JawRight",
    "ChinRaiser", "ChinRaiserUpperLip", "FlatPucker", "Funneler",
    "LeftCheekPuff", "LeftDimpler", "LeftLipCornerDown", "LeftLipCornerPuller", "LeftLipStretcher", "LeftLowerLipDepressor", "LeftUpperLipRaiser",
    "LipPresser", "LipsTogether", "LowerLipSuck", "MouthLeft", "MouthRight", "Pucker",
    "RightCheekPuff", "RightDimpler", "RightLipCornerDown", "RightLipCornerPuller", "RightLipStretcher", "RightLowerLipDepressor", "RightUpperLipRaiser",
    "UpperLipSuck",
    "TongueDown", "TongueOut", "TongueUp"
]

/**
 * @deprecated Face bone names are not standardized
 */
export const FaceBoneNames = [
    "TongueBase",
    "RightOuterBrow",
    "RightEyeRoot",
    "LeftLowerCornerMouth",
    "RightLowerOuterEyelid",
    "RightInnerBrow",
    "LeftLowerEyelid",
    "LeftEyePupil",
    "Chin",
    "RightUpperEyelid",
    "RightLowerOuterMouth",
    "LeftUpperInnerEyelid",
    "LeftUpperEyelid",
    "LeftUpperOuterEyelid",
    "LeftEyeBar",
    "LowerTeethRoot",
    "LeftLowerOuterMouth",
    "RightUpperOuterEyelid",
    "TongueTip",
    "RightUpperInnerEyelid",
    "RightLowerInnerEyelid",
    "LeftUpperOuterMouth",
    "Jaw",
    "LeftOuterBrow",
    "RightLowerCornerMouth",
    "LeftLowerOuterEyelid",
    "LeftCheek",
    "LeftEyeRoot",
    "RightCheek",
    "LeftLowerInnerEyelid",
    "RightEyePupil",
    "TongueRoot",
    "RightEyeBar",
    "UpperTeethRoot",
    "LeftInnerBrow",
    "RightLowerEyelid",
    "RightUpperOuterMouth"
]

const ExtraFaceBoneNames = [
    "TongueBase",
    "RightLowerOuterMouth",
    "RightUpperOuterEyelid",
    "joint27",
    "RightOuterBrow",
    "RightEyeRoot",
    "LeftLowerEyelid",
    "joint2",
    "joint17",
    "LeftLowerOuterMouth",
    "RightLowerOuterEyelid",
    "LeftLowerCornerMouth",
    "LeftUpperOuterEyelid",
    "joint28",
    "joint15",
    "joint25",
    "LeftUpperOuterMouth",
    "joint18",
    "joint26",
    "RightLowerInnerEyelid",
    "joint23",
    "joint24",
    "RightUpperEyelid",
    "Chin",
    "joint19",
    "joint21",
    "joint9",
    "LeftCheek",
    "joint22",
    "Jaw",
    "LeftOuterBrow",
    "RightLowerCornerMouth",
    "LeftLowerOuterEyelid",
    "joint4",
    "joint11",
    "joint3",
    "joint16",
    "joint1",
    "LeftUpperInnerEyelid",
    "joint14",
    "LeftUpperEyelid",
    "joint8",
    "joint20",
    "RightUpperOuterMouth",
    "joint7",
    "joint12",
    "joint6",
    "joint13",
    "joint5",
    "joint10",
    "LeftLowerInnerEyelid",
    "TongueRoot",
    "RightInnerBrow",
    "TongueTip",
    "RightUpperInnerEyelid",
    "LowerTeethRoot",
    "LeftEyeRoot",
    "RightCheek",
    "LeftInnerBrow",
    "RightLowerEyelid",
    "UpperTeethRoot"
]

for (const extraBoneName of ExtraFaceBoneNames) {
    if (!FaceBoneNames.includes(extraBoneName)) {
        FaceBoneNames.push(extraBoneName)
    }
}

export const AbbreviationToFaceControlProperty: {[K in string]: string} = {
    "c_COR": "Corrugator",
    "c_CR": "ChinRaiser",
    "c_CRUL": "ChinRaiserUpperLip",
    "c_ELD": "EyesLookDown",
    "c_ELL": "EyesLookLeft",
    "c_ELR": "EyesLookRight",
    "c_ELU": "EyesLookUp",
    "c_FN": "Funneler",
    "c_FP": "FlatPucker",
    "c_JD": "JawDrop",
    "c_JL": "JawLeft",
    "c_JR": "JawRight",
    "c_LLS": "LowerLipSuck",
    "c_LP": "LipPresser",
    "c_LPT": "LipsTogether",
    "c_ML": "MouthLeft",
    "c_MR": "MouthRight",
    "c_PK": "Pucker",
    "c_TD": "TongueDown",
    "c_TO": "TongueOut",
    "c_TU": "TongueUp",
    "c_ULS": "UpperLipSuck",
    "l_BL": "LeftBrowLowerer",
    "l_CHP": "LeftCheekPuff",
    "l_CHR": "LeftCheekRaiser",
    "l_DM": "LeftDimpler",
    "l_EC": "LeftEyeClosed",
    "l_EULR": "LeftEyeUpperLidRaiser",
    "l_IBR": "LeftInnerBrowRaiser",
    "l_LCD": "LeftLipCornerDown",
    "l_LCP": "LeftLipCornerPuller",
    "l_LLD": "LeftLowerLipDepressor",
    "l_LS": "LeftLipStretcher",
    "l_NW": "LeftNoseWrinkler",
    "l_OBR": "LeftOuterBrowRaiser",
    "l_ULR": "LeftUpperLipRaiser",
    "r_BL": "RightBrowLowerer",
    "r_CHP": "RightCheekPuff",
    "r_CHR": "RightCheekRaiser",
    "r_DM": "RightDimpler",
    "r_EC": "RightEyeClosed",
    "r_EULR": "RightEyeUpperLidRaiser",
    "r_IBR": "RightInnerBrowRaiser",
    "r_LCD": "RightLipCornerDown",
    "r_LCP": "RightLipCornerPuller",
    "r_LLD": "RightLowerLipDepressor",
    "r_LS": "RightLipStretcher",
    "r_NW": "RightNoseWrinkler",
    "r_OBR": "RightOuterBrowRaiser",
    "r_ULR": "RightUpperLipRaiser",
}

export const StringBufferProperties = [
    "ValuesAndTimes",
    "label",
    "name",
    "parent",
    "preTransform",
    "transform",
    "postTransform"
]
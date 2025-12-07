//scaling notes
/*
R15 --> Slim = R15_Wide * R15_Proportions

*/

import { AvatarType } from "../avatar/constant"
import type { Outfit } from "../avatar/outfit"
import { lerp, lerpVec3, specialClamp } from "../misc/misc"
import { DataType, MeshType } from "./constant"
import { CFrame, Instance, Property, Vector3 } from "./rbx"

export type RigData = { outfit: Outfit; rig: Instance; stepHeight: number, cumulativeStepHeightLeft: number, cumulativeStepHeightRight: number, cumulativeLegLeft: number, cumulativeLegRight: number, bodyScale: Vector3, headScale: number }

//scaling data
const originalPositionName = "OriginalPosition"
const originalOrientationName = "OriginalOrientation"
const originalSizeName = "OriginalSize"
const rigAttachmentName = "RigAttachment"

const stepHeightNarrow = 2.4
const stepHeightWide = 2.7

//Default positions of the attachments related to the Head part
const headAttachmentMap: {[K in string]: Vector3} = {
	FaceCenterAttachment: Vector3.new(0, 0, 0),
	FaceFrontAttachment: Vector3.new(0, 0, -0.6),
	HairAttachment: Vector3.new(0, 0.6, 0),
	HatAttachment: Vector3.new(0, 0.6, 0),
	NeckRigAttachment: Vector3.new(0, -0.5, 0)
}

//Default scaling values for character with classic proportions (used in lerp calcuations with desired scaling factor)
const scalingWideValues: {[K in string]: Vector3} = {
	LeftLowerArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	LeftFoot: Vector3.new(1.0789999961853, 1.2669999599457, 1.1289999485016),
	Head: Vector3.new(0.94199997186661, 0.94199997186661, 0.94199997186661),
	UpperTorso: Vector3.new(1.0329999923706, 1.3090000152588, 1.1399999856949),
	RightHand: Vector3.new(1.0659999847412, 1.1740000247955, 1.2309999465942),
	LowerTorso: Vector3.new(1.0329999923706, 1.3090000152588, 1.1399999856949),
	LeftUpperLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073),
	LeftUpperArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	RightLowerArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	LeftHand: Vector3.new(1.0659999847412, 1.1740000247955, 1.2309999465942),
	RightUpperArm: Vector3.new(1.1289999485016, 1.3420000076294, 1.1319999694824),
	RightUpperLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073),
	RightLowerLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073),
	RightFoot: Vector3.new(1.0789999961853, 1.2669999599457, 1.1289999485016),
	LeftLowerLeg: Vector3.new(1.0230000019073, 1.5060000419617, 1.0230000019073)
}

//Default scaling values for character with classic proportions (used in lerp calcuations with desired scaling factor)
const scalingNarrowValues: {[K in string]: Vector3} = {
	LeftLowerArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	LowerTorso: Vector3.new(0.9856870174408, 1.0046048164368, 1.0133333206177),
	Head: Vector3.new(0.89628922939301, 0.94199997186661, 0.89628922939301),
	UpperTorso: Vector3.new(0.90534615516663, 1.2042318582535, 1.0133333206177),
	RightHand: Vector3.new(0.94755554199219, 1.1740000247955, 1.0942221879959),
	RightFoot: Vector3.new(1.029580116272, 1.133273601532, 1.0035555362701),
	LeftFoot: Vector3.new(1.029580116272, 1.133273601532, 1.0035555362701),
	LeftUpperArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	RightLowerArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	LeftHand: Vector3.new(0.94755554199219, 1.1740000247955, 1.0942221879959),
	RightUpperLeg: Vector3.new(0.97614508867264, 1.4009301662445, 0.90933334827423),
	RightUpperArm: Vector3.new(1.0035555362701, 1.2079209089279, 1.0062222480774),
	RightLowerLeg: Vector3.new(0.97614508867264, 1.300518155098, 0.90933334827423),
	LeftUpperLeg: Vector3.new(0.97614508867264, 1.4009301662445, 0.90933334827423),
	LeftLowerLeg: Vector3.new(0.97614508867264, 1.300518155098, 0.90933334827423)
}

//Default scaling values for character with slender or normal proportions
//(used in lerp calcuations with desired scaling factor)
const scalingNativeR15ToWide: {[K in string]: Vector3} = {
	LeftLowerArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	LowerTorso: Vector3.new(0.98619323968887, 1.228501200676, 1.0822510719299),
	Head: Vector3.new(0.625, 0.625, 0.625),
	UpperTorso: Vector3.new(0.98619323968887, 1.228501200676, 1.0822510719299),
	RightHand: Vector3.new(0.71942448616028, 1.034126162529, 0.83263945579529),
	RightFoot: Vector3.new(0.71225070953369, 1.0493179559708, 1.0741138458252),
	LeftFoot: Vector3.new(0.71225070953369, 1.0493179559708, 1.0741138458252),
	LeftUpperArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	RightLowerArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	LeftHand: Vector3.new(0.71942448616028, 1.034126162529, 0.83263945579529),
	RightUpperLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869),
	RightUpperArm: Vector3.new(0.89206063747406, 1.468428850174, 1.033057808876),
	RightLowerLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869),
	LeftUpperLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869),
	LeftLowerLeg: Vector3.new(1.0224949121475, 1.228501200676, 0.94696968793869)
}

//Default scaling values for character with slender or normal proportions
//(used in lerp calcuations with desired scaling factor)
const scalingNativeR15ToNarrow: {[K in string]: Vector3} = {
	LeftLowerArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	LowerTorso: Vector3.new(0.94102412462234, 0.94282519817352, 0.96200096607208),
	Head: Vector3.new(0.59467172622681, 0.625, 0.59467172622681),
	UpperTorso: Vector3.new(0.86432361602783, 1.130175948143, 0.96200096607208),
	RightHand: Vector3.new(0.63948839902878, 1.034126162529, 0.74012398719788),
	RightFoot: Vector3.new(0.67962855100632, 0.93856704235077, 0.95476788282394),
	LeftFoot: Vector3.new(0.67962855100632, 0.93856704235077, 0.95476788282394),
	LeftUpperArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	RightLowerArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	LeftHand: Vector3.new(0.63948839902878, 1.034126162529, 0.74012398719788),
	RightUpperLeg: Vector3.new(0.97566312551498, 1.1427917480469, 0.84175086021423),
	RightUpperArm: Vector3.new(0.79294276237488, 1.3217180967331, 0.91827362775803),
	RightLowerLeg: Vector3.new(0.97566312551498, 1.0608818531036, 0.84175086021423),
	LeftUpperLeg: Vector3.new(0.97566312551498, 1.1427917480469, 0.84175086021423),
	LeftLowerLeg: Vector3.new(0.97566312551498, 1.0608818531036, 0.84175086021423)
}

const SCALE_R15_Wide: {[K in string]: Vector3} = {
    Head: Vector3.new(0.9420000314712524,0.9419999718666077,0.9419999718666077),
    LeftHand: Vector3.new(1.065999984741211,1.1740000247955322,1.2309999465942383),
    RightHand: Vector3.new(1.065999984741211,1.1740000247955322,1.2309999465942383),
    LeftLowerArm: Vector3.new(1.128999948501587,1.3420000076293945,1.1319999694824219),
    RightLowerArm: Vector3.new(1.128999948501587,1.3420000076293945,1.1319999694824219),
    LeftUpperArm: Vector3.new(1.128999948501587,1.3420000076293945,1.1319999694824219),
    RightUpperArm: Vector3.new(1.128999948501587,1.3420000076293945,1.1319999694824219),
    LeftFoot: Vector3.new(1.0789999961853027,1.2669999599456787,1.128999948501587),
    LeftLowerLeg: Vector3.new(1.0230000019073486,1.50600004196167,1.0230000019073486),
    UpperTorso: Vector3.new(1.0329999923706055,1.3089998960494995,1.1399999856948853),
    LeftUpperLeg: Vector3.new(1.0230000019073486,1.50600004196167,1.0230000019073486),
    RightFoot: Vector3.new(1.0789999961853027,1.2669999599456787,1.128999948501587),
    RightLowerLeg: Vector3.new(1.0230000019073486,1.50600004196167,1.0230000019073486),
    LowerTorso: Vector3.new(1.0329999923706055,1.309000015258789,1.1399999856948853),
    RightUpperLeg: Vector3.new(1.0230000019073486,1.50600004196167,1.0230000019073486),
}

const SCALE_R15_Proportions: {[K in string]: Vector3} = {
    Head: Vector3.new(0.9514747858047485,1,0.9514748454093933),
    LeftHand: Vector3.new(0.8888888955116272,1,0.8888888955116272),
    RightHand: Vector3.new(0.8888888955116272,1,0.8888888955116272),
    LeftLowerArm: Vector3.new(0.8888888955116272,0.9000900387763977,0.888888955116272),
    RightLowerArm: Vector3.new(0.8888888955116272,0.9000900387763977,0.888888955116272),
    LeftUpperArm: Vector3.new(0.8888888955116272,0.9000900983810425,0.888888955116272),
    RightUpperArm: Vector3.new(0.8888888955116272,0.9000900983810425,0.888888955116272),
    LeftFoot: Vector3.new(0.95419842004776,0.8944543600082397,0.8888888955116272),
    LeftLowerLeg: Vector3.new(0.9541985392570496,0.8635578155517578,0.8888888955116272),
    UpperTorso: Vector3.new(0.8764241933822632,0.9199632406234741,0.8888888955116272),
    LeftUpperLeg: Vector3.new(0.9541985392570496,0.9302324652671814,0.888888955116272),
    RightFoot: Vector3.new(0.95419842004776,0.8944543600082397,0.8888888955116272),
    RightLowerLeg: Vector3.new(0.9541985392570496,0.8635578155517578,0.8888888955116272),
    LowerTorso: Vector3.new(0.9541984796524048,0.7674597501754761,0.8888888955116272),
    RightUpperLeg: Vector3.new(0.9541985392570496,0.9302324652671814,0.888888955116272)
}

const SCALE_Wide_R15: {[K in string]: Vector3} = {
    LeftLowerArm: Vector3.new(1.121000051498413,0.6809999942779541,0.968000054359436),
    RightLowerArm: Vector3.new(1.121000051498413,0.6809999942779541,0.968000054359436),
    LeftUpperArm: Vector3.new(1.121000051498413,0.6809999942779541,0.968000054359436),
    RightUpperArm: Vector3.new(1.121000051498413,0.6809999942779541,0.968000054359436),
    Head: Vector3.new(1.600000023841858,1.600000023841858,1.600000023841858),
    LeftLowerLeg: Vector3.new(0.9779999852180481,0.8140000700950623,1.055999994277954),
    LeftUpperLeg: Vector3.new(0.9779999256134033,0.8140000104904175,1.055999994277954),
    LeftHand: Vector3.new(1.3899999856948853,0.9670000076293945,1.2009999752044678),
    RightLowerLeg: Vector3.new(0.9779999852180481,0.8140000700950623,1.055999994277954),
    RightUpperLeg: Vector3.new(0.9779999256134033,0.8140000104904175,1.055999994277954),
    UpperTorso: Vector3.new(1.0140000581741333,0.8140000104904175,0.9240000247955322),
    LeftFoot: Vector3.new(1.4040000438690186,0.953000009059906,0.9309999942779541),
    LowerTorso: Vector3.new(1.0140000581741333,0.8140000104904175,0.9240000247955322),
    RightHand: Vector3.new(1.3899999856948853,0.9670000076293945,1.2009999752044678),
    RightFoot: Vector3.new(1.4040000438690186,0.953000009059906,0.9309999942779541)
}

//Returns an array of the character parts
function GetCharacterParts(rig: Instance) {
	const characterParts = []
	for (const item of rig.GetChildren()) {
		if (item.className === "MeshPart" || item.className === "Part") {
		    characterParts.push(item)	
        }
    }
	return characterParts
}

//Returns the matching attachment found on the character
function FindFirstMatchingAttachment(attachmentName: string, rig: Instance) {
	const characterParts = GetCharacterParts(rig)
	for (const part of characterParts) {
		for (const child of part.GetChildren()) {
			if (child.Prop("Name") == attachmentName) {
				return child
            }
        }
    }
	return null
}

//Returns the character part the accessory is attached to
function GetAttachedPart(accessory: Instance, rig: Instance) {
	const handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }

	const accessoryWeld = handle.FindFirstChild("AccessoryWeld")
	if (accessoryWeld) {
		let attachedPart
		if (accessoryWeld.Prop("Part0") !== handle) {
			attachedPart = accessoryWeld.Prop("Part0") as Instance
        } else {
			attachedPart = accessoryWeld.Prop("Part1") as Instance
        }
		return attachedPart
    }

	const accessoryAttachment = handle.FindFirstChildOfClass("Attachment")
	if (accessoryAttachment) {
		const matchingAttachment = FindFirstMatchingAttachment(accessoryAttachment.Prop("Name") as string, rig)
		if (matchingAttachment && matchingAttachment.parent) {
			return matchingAttachment.parent
        }
    }

	return rig.Child("Head")
}

//Returns the scale of a part with consideration for proportion type
function getPartScale(part: Instance, wideToNarrow: number, anthroPercent: number, partType: string, baseType: string) {
	let scale = new Vector3(1.0,1.0,1.0)
	if (!part) {
		return scale
    }

	const partName = part.Prop("Name") as string

	let wideScale = scalingWideValues[partName]
	let narrowScale = scalingNarrowValues[partName]

	if (partType === "ProportionsNormal" || partType == "ProportionsSlender") {
		wideScale = scalingNativeR15ToWide[partName]
		narrowScale = scalingNativeR15ToNarrow[partName]
    }

	if (!wideScale) { wideScale = Vector3.new(1.0,1.0,1.0) }
	if (!narrowScale) { narrowScale = Vector3.new(1.0,1.0,1.0) }

	const anthroScale = lerpVec3(wideScale, narrowScale, wideToNarrow)
	scale = lerpVec3(scale, anthroScale, anthroPercent)

	let base = Vector3.new(1.0,1.0,1.0)
	if (baseType == "ProportionsNormal") {
		base = wideScale
    } else if (baseType == "ProportionsSlender") {
		base = narrowScale
    }

	scale = scale.divide(base)
	return scale
}

//Returns the original size of the part or will create one if it cannot find one
function getOriginalSize(part: Instance) {
	let originalSize = part.Prop("Size") as Vector3
	const originalSizeValue = part.FindFirstChild(originalSizeName)
	if (originalSizeValue) {
		originalSize = originalSizeValue.Prop("Value") as Vector3
    } else {
		const partSizeValue = new Instance("Vector3Value")
        partSizeValue.addProperty(new Property("Name", DataType.String), originalSizeName)
        partSizeValue.addProperty(new Property("Value", DataType.Vector3), part.Prop("Size"))
		partSizeValue.setParent(part)
    }
	return originalSize
}

//Scales the attachment or special mesh child found on a part
function scaleChildrenOfPart(part: Instance, scaleVector: Vector3, scaleAttachment: boolean = true) {
	for (const child of part.GetChildren()) {
		if (child.className === "Attachment" && scaleAttachment) {
			let originalPosition: Vector3 = child.Prop("Position") as Vector3
            //originalPosition = new Vector3(originalPosition[0], originalPosition[1], originalPosition[2])
            originalPosition = originalPosition.multiply(scaleVector)

            const newCF = (child.Prop("CFrame") as CFrame).clone()
            newCF.Position = [originalPosition.X, originalPosition.Y, originalPosition.Z]
			child.setProperty("CFrame", newCF)
        } else if (child.className === "SpecialMesh") {
			if (child.Prop("MeshType") !== MeshType.Head) {
				const orignalScale = child.Prop("Scale") as Vector3
				child.setProperty("Scale", orignalScale.multiply(scaleVector))
            }
        }
    }
}

//Returns the scale/position of the children back to origianal
function originalChildrenOfPart(part: Instance) {
	for (const child of part.GetChildren()) {
		if (child.className === "Attachment") {
			const originalPosition: Vector3 = getOriginalAttachmentPosition(child)
			const originalOrientation: Vector3 = getOriginalAttachmentOrientation(child)

            const newCF = (child.Prop("CFrame") as CFrame).clone()
            newCF.Position = [originalPosition.X, originalPosition.Y, originalPosition.Z]
			newCF.Orientation = [originalOrientation.X, originalOrientation.Y, originalOrientation.Z]
			child.setProperty("CFrame", newCF)
        } else if (child.className === "SpecialMesh") {
			if (child.Prop("MeshType") !== MeshType.Head) {
				const orignalScale = getOriginalMeshScale(child)
				child.setProperty("Scale", orignalScale)
            }
        }
    }
}

//Adjusts accessory attachment based on adjustment (position, rotation, scale) and scale
function adjustAttachment(attachment: Instance, adjustPosition: Vector3, adjustRotation: Vector3, adjustScale: Vector3, scale: Vector3) {
	//get original attachment pos/rot
	const ogRot: Vector3 = new Vector3().fromVec3((attachment.Prop("CFrame") as CFrame).Orientation)
	const ogPos: Vector3 = new Vector3().fromVec3((attachment.Prop("CFrame") as CFrame).Position)

	//avatar scale * adjustScale
	const totalScale = scale.multiply(adjustScale)

	//create original rotation cframe
	const ogRotCFrame = new CFrame()
	ogRotCFrame.Orientation = ogRot.toVec3()

	//position, scaled original offset AND scaled adjust offset
	let newCFrame = new CFrame(ogPos.X * totalScale.X, ogPos.Y * totalScale.Y, ogPos.Z * totalScale.Z)
	newCFrame = newCFrame.multiply(ogRotCFrame)
	newCFrame = newCFrame.multiply(new CFrame(adjustPosition.X * scale.X, adjustPosition.Y * scale.Y, adjustPosition.Z * scale.Z).inverse())

	//create adjusted rotation cframe
	let adjustRotCFrame = new CFrame()
	adjustRotCFrame.Orientation = adjustRotation.toVec3()
	adjustRotCFrame = adjustRotCFrame.inverse()

	//adjusted rotation is applied in (world space WITH originalRotation considered)
	newCFrame = ogRotCFrame.multiply(adjustRotCFrame).multiply(ogRotCFrame.inverse()).multiply(newCFrame)

	//finally change the attachment cframe
	attachment.setProperty("CFrame", newCFrame)
}

//This is the only working accessory scaling function, all the other ones are incorrect
export function ScaleAccessory(accessory: Instance, bodyScaleVector: Vector3, headScaleVector: Vector3, bodyTypeScale: number | null, bodyProportionScale: number | null, rig: Instance, humanoidDescription: Instance) {
	const handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }

	const attachedPart = GetAttachedPart(accessory, rig)

    let resultScale = Vector3.new(1,1,1)

    //head vs width,depth,height
	let regularScaleVector = bodyScaleVector
	if (attachedPart && attachedPart.Prop("Name") === "Head") {
		regularScaleVector = headScaleVector
    }
    resultScale = resultScale.multiply(regularScaleVector)

	//find appropriate relative scaling with attached part
	if (attachedPart) {
        const bodyPartName = attachedPart.Prop("Name") as string
        if (SCALE_Wide_R15[bodyPartName] !== undefined) {
            let accessoryScaleType = "Classic"
			const accessoryScaleTypeValue = accessory.FindFirstDescendant("AvatarPartScaleType")
			if (accessoryScaleTypeValue) {
				accessoryScaleType = accessoryScaleTypeValue.Prop("Value") as string
			}

			let attachedPartScaleType = "Classic"
			const attachedPartScaleTypeValue = attachedPart.FindFirstDescendant("AvatarPartScaleType")
			if (attachedPartScaleTypeValue) {
				attachedPartScaleType = attachedPartScaleTypeValue.Prop("Value") as string
			}

			let relativeScaleVector = Vector3.new(1,1,1)
			if (accessoryScaleType !== attachedPartScaleType) {
				if (accessoryScaleType === "Classic" && (attachedPartScaleType === "ProportionsNormal" || attachedPartScaleType === "ProportionsSlender")) {
					//match part
					relativeScaleVector = relativeScaleVector.divide(SCALE_Wide_R15[bodyPartName])
				} else if (accessoryScaleType === "ProportionsNormal" && attachedPartScaleType === "Classic") {
					//match part
					relativeScaleVector = relativeScaleVector.multiply(SCALE_Wide_R15[bodyPartName])
				} else if (accessoryScaleType === "ProportionsNormal" && attachedPartScaleType === "ProportionsSlender") {
					//match part
					relativeScaleVector = relativeScaleVector.multiply(SCALE_R15_Proportions[bodyPartName])
				} else if (accessoryScaleType === "ProportionsSlender" && attachedPartScaleType === "Classic") {
					//match part
					relativeScaleVector = relativeScaleVector.multiply(SCALE_Wide_R15[bodyPartName]).divide(SCALE_R15_Proportions[bodyPartName])
				} else if (accessoryScaleType === "ProportionsSlender" && attachedPartScaleType === "ProportionsNormal") {
					//match part
					relativeScaleVector = relativeScaleVector.divide(SCALE_R15_Proportions[bodyPartName])
				}
			}

			if (bodyTypeScale !== null && bodyProportionScale !== null) { //IF R15, very hacky of me
				switch (attachedPartScaleType) {
					case "Classic":
						{
							//apply scale as Classic
							const bodyTypeScaleVector = SCALE_R15_Wide[bodyPartName]
							const bodyProportionScaleVector = lerpVec3(Vector3.new(1,1,1), SCALE_R15_Proportions[bodyPartName], bodyProportionScale)
							const finalVector = lerpVec3(Vector3.new(1,1,1), bodyTypeScaleVector.multiply(bodyProportionScaleVector), bodyTypeScale).multiply(relativeScaleVector)
							resultScale = resultScale.multiply(finalVector)
							break
						}
					case "ProportionsNormal":
						{
							//apply scale as ProportionsNormal
							const bodyTypeScaleVector = SCALE_Wide_R15[bodyPartName]
							const bodyProportionScaleVector = lerpVec3(Vector3.new(1,1,1), SCALE_R15_Proportions[bodyPartName], bodyProportionScale)
							const finalVector = lerpVec3(bodyTypeScaleVector, bodyProportionScaleVector, bodyTypeScale).multiply(relativeScaleVector)
							resultScale = resultScale.multiply(finalVector)
							break
						}
					case "ProportionsSlender":
						{
							//apply scale as ProportionsSlender
							const bodyTypeScaleVector = SCALE_Wide_R15[bodyPartName]
							const bodyProportionScaleVector = lerpVec3(Vector3.new(1,1,1).divide(SCALE_R15_Proportions[bodyPartName]), Vector3.new(1,1,1), bodyProportionScale)
							const finalVector = lerpVec3(bodyTypeScaleVector, bodyProportionScaleVector, bodyTypeScale).multiply(relativeScaleVector)
							resultScale = resultScale.multiply(finalVector)
							break
						}
				}
			} else { //If R6, BUG: Applies scale to R6 sometimes avatar... I'm doing this because it's more frequent for it to mess up and scale accessories rather than not
				resultScale = resultScale.multiply(relativeScaleVector)
			}
        }
    } else {
        console.warn("Failed to find attached part for accessory:", accessory)
    }

	originalChildrenOfPart(handle)

	const originalSize = getOriginalSize(handle)
    //used to double check
    //console.log(accessory.Prop("Name"))
    //console.log("SCALE HERE \n HERE\nHERE\nHERE\nHERE")
    //console.log(resultScale.multiply(originalSize))
    //throw "check the scale"
	//const currentScaleVector = (handle.Prop("Size") as Vector3).divide(originalSize)
    //const relativeScaleVector = resultScale.divide(currentScaleVector);

	//accessory adjustment
	let hasAdjusted = false

	const accessoryDescs = humanoidDescription.GetChildren()
	for (const accessoryDesc of accessoryDescs) {
		if (accessoryDesc.className === "AccessoryDescription") {
			if (accessoryDesc.Prop("Instance") === accessory) {
				//rotation and position (its okay to do this here because scale isnt applied before later)
				const attachment = handle.FindFirstChildOfClass("Attachment")
				if (attachment) {
					hasAdjusted = true
					adjustAttachment(attachment, accessoryDesc.Prop("Position") as Vector3, accessoryDesc.Prop("Rotation") as Vector3, accessoryDesc.Prop("Scale") as Vector3, resultScale)
				}

				//scale
				const adjustScale = accessoryDesc.Prop("Scale") as Vector3
				resultScale = resultScale.multiply(adjustScale)
			}
		}
	}

	//scale accessory and as well as its welds and attachments
    scaleChildrenOfPart(handle, resultScale, !hasAdjusted)

	handle.setProperty("Size", originalSize.multiply(resultScale))
	accessory.AccessoryBuildWeld()
}

//Returns the original mesh scale of the part or will create one if it cannot find one
function getOriginalMeshScale(mesh: Instance) {
	let originalScale = mesh.Prop("Scale") as Vector3
	const originalScaleValue = mesh.FindFirstChild(originalSizeName)
	if (originalScaleValue) {
		originalScale = originalScaleValue.Prop("Value") as Vector3
    } else {
		const partScaleValue = new Instance("Vector3Value")
        partScaleValue.addProperty(new Property("Name", DataType.String), originalSizeName)
        partScaleValue.addProperty(new Property("Value", DataType.Vector3), mesh.Prop("Scale"))
		partScaleValue.setParent(mesh)
    }
	return originalScale
}

//Returns the original attachment position or will create one if it cannot find one
function getOriginalAttachmentPosition(attachment: Instance) {
	const originalPosition = attachment.FindFirstChild(originalPositionName)
	if (originalPosition) {
		return (originalPosition.Prop("Value") as Vector3)
    }

	const position = attachment.Prop("Position") as Vector3

	const attachmentLocationValue = new Instance("Vector3Value")
    attachmentLocationValue.addProperty(new Property("Name", DataType.String), originalPositionName)
	attachmentLocationValue.addProperty(new Property("Value", DataType.Vector3), position)
	attachmentLocationValue.setParent(attachment)

	return position
}

function getOriginalAttachmentOrientation(attachment: Instance) {
	const originalOrientation = attachment.FindFirstChild(originalOrientationName)
	if (originalOrientation) {
		return (originalOrientation.Prop("Value") as Vector3)
    }

	const orientation = new Vector3().fromVec3((attachment.Prop("CFrame") as CFrame).Orientation)

	const attachmentLocationValue = new Instance("Vector3Value")
    attachmentLocationValue.addProperty(new Property("Name", DataType.String), originalOrientationName)
	attachmentLocationValue.addProperty(new Property("Value", DataType.Vector3), orientation)
	attachmentLocationValue.setParent(attachment)

	return orientation
}


//Scale character part and any attachments using values found in the configurations folder
function ScaleCharacterPart(part: Instance, bodyScaleVector: Vector3, headScaleVector: Vector3, anthroPercent: number, wideToNarrow: number) {
	const partName = part.Prop("Name")
	const originalSize = getOriginalSize(part)

	let newScaleVector = bodyScaleVector
	if (partName == "Head") {
		newScaleVector = headScaleVector
    }

	//check for native part information on special mesh in the Head Part
	if (part && partName == "Head") {
		const mesh = part.FindFirstChildOfClass("SpecialMesh")
		if (mesh) {
			const nameNative = "AvatarPartScaleType"
			const meshScaleTypeValue = mesh.FindFirstChild(nameNative)
			if (meshScaleTypeValue) {
				let headScaleTypeValue = part.FindFirstChild(nameNative)
				if (!headScaleTypeValue) {
					headScaleTypeValue = new Instance("StringValue")
					if (headScaleTypeValue) {
                        headScaleTypeValue.addProperty(new Property("Value", DataType.String), "")
						headScaleTypeValue.addProperty(new Property("Name", DataType.String), nameNative)
						headScaleTypeValue.setParent(part)
                    }
                }
				if (headScaleTypeValue) {
					headScaleTypeValue.setProperty("Value", meshScaleTypeValue.Prop("Value"))
                }
            } else if (part.className !== "MeshPart") {
				const headScaleTypeValue = part.FindFirstChild(nameNative)
				if (headScaleTypeValue) {
					headScaleTypeValue.Destroy()
                }
            }
        } else if (part.className !== "MeshPart") {
			const nameNative = "AvatarPartScaleType";
			const headScaleTypeValue = part.FindFirstChild(nameNative)
			if (headScaleTypeValue) {
				headScaleTypeValue.Destroy();
            }
        }
    }

	//find the appropriate scale for the part
	let humanoidPropType = "Classic"
	const avatarPartScaleType = part.FindFirstChild("AvatarPartScaleType")
	if (avatarPartScaleType) {
		humanoidPropType = avatarPartScaleType.Prop("Value") as string
    }
	const scale = getPartScale(part, wideToNarrow, anthroPercent, humanoidPropType, humanoidPropType)

	//scale head mesh and attachments
	if (part && partName == "Head") {
		const mesh = part.FindFirstChildOfClass("SpecialMesh")
		if (mesh) {
			let headScale = newScaleVector
			if (mesh.Prop("MeshType") == MeshType.Head) {
				headScale = Vector3.new(1.0,1.0,1.0)
            }
			const originalScale = getOriginalMeshScale(mesh)

			if (mesh.Prop("MeshType") !== MeshType.Head) {
				mesh.setProperty("Scale", originalScale.multiply(scale).multiply(headScale))
            }

			const attachmentNames = ["FaceCenterAttachment", "FaceFrontAttachment", "HairAttachment",
				"HatAttachment", "NeckRigAttachment"]

            for (const aname of attachmentNames) {
				const originalPosValue = mesh.FindFirstChild(aname)
				const headAttachment = part.FindFirstChild(aname)
				if (headAttachment) {
					const originalPosition = headAttachment.FindFirstChild(originalPositionName)
					if (originalPosition) {
						if (originalPosValue) {
							originalPosition.setProperty("Value", originalPosValue)
						} else {
							originalPosition.setProperty("Value", headAttachmentMap[aname])
						}
					}
                }
            }
        }
    }

	//scale the part
	part.setProperty("Size", originalSize.multiply(scale).multiply(newScaleVector))

	//scale attachments
    for (const child of part.GetChildren()) {
		if (child.className === "Attachment") {
			const originalAttachment = getOriginalAttachmentPosition(child)
            const ogCF = (child.Prop("CFrame") as CFrame).clone()
            const newPos = originalAttachment.multiply(scale).multiply(newScaleVector)
            ogCF.Position = [newPos.X, newPos.Y, newPos.Z]
			child.setProperty("CFrame", ogCF)
        }
    }
}

//Updates the step height
function SetStepHeight(self: RigData, value: number) {
	if (!value) {
		return
    }

	const stepHeight = self.stepHeight

	value = specialClamp(value, -100.0, 100.0)

	if (value !== stepHeight) {
		self.stepHeight = value
    }
}

//Scale accessories using values found in the configurations folder
function ScaleAccessories(bodyScaleVector: Vector3, headScaleVector: Vector3, anthroPercent: number, wideToNarrow: number, rig: Instance, humanoidDescription: Instance) {
    for (const item of rig.GetChildren()) {
		if (item.className === "Accessory") {
			ScaleAccessory(item,bodyScaleVector,headScaleVector,anthroPercent,wideToNarrow, rig, humanoidDescription)
        }
    }
}

//Adjusts any rig attachments as needed
function AdjustRootRigAttachmentPosition(_self: RigData, rootPart: Instance, matchingPart: Instance, rootAttachment: Instance, matchingAttachment: Instance) {
	const rightHipAttachment = matchingPart.FindFirstChild("RightHipAttachment")
	const leftHipAttachment = matchingPart.FindFirstChild("LeftHipAttachment")

	if (leftHipAttachment || rightHipAttachment) {
		let rightHipDistance = 9999999999
		let leftHipDistance = 9999999999
		if (rightHipAttachment) {
			rightHipDistance = (rightHipAttachment.Prop("Position") as Vector3).Y
        }
		if (leftHipAttachment) {
			leftHipDistance = (leftHipAttachment.Prop("Position") as Vector3).Y
        }

		const hipDistance = Math.min(leftHipDistance, rightHipDistance)

		const rootAttachmentToHipDistance = (matchingAttachment.Prop("Position") as Vector3).Y - hipDistance
		const halfRootPartHeight = (rootPart.Prop("Size") as Vector3).Y / 2.0

		const currentPivot = rootAttachment.Prop("Position") as Vector3
		const newYPivot = rootAttachmentToHipDistance - halfRootPartHeight

        const ogCF = (rootAttachment.Prop("CFrame") as CFrame).clone()
        ogCF.Position = [currentPivot.X, newYPivot, currentPivot.Z]
		rootAttachment.setProperty("CFrame", ogCF)
    }
}

//Creates a joint between two attachments
function createJoint(jointName: string, att0: Instance, att1: Instance) {
	const part0 = att0.parent
    const part1 = att1.parent

	if (!part0 || !part1) {
		console.log(att0)
		console.log(att1)
		throw new Error("Missing at least one parent")
	}

	let newMotor = part1.FindFirstChild(jointName)

	if (!(newMotor && newMotor.className === "Motor6D")) {
		newMotor = new Instance("Motor6D")
    }

    newMotor.addProperty(new Property("Name", DataType.String), jointName)
    newMotor.addProperty(new Property("Archivable", DataType.Bool), true)
    newMotor.addProperty(new Property("C0", DataType.CFrame), att0.Prop("CFrame"))
	newMotor.addProperty(new Property("C1", DataType.CFrame), att1.Prop("CFrame"))
    newMotor.addProperty(new Property("Part0", DataType.Referent), part0)
	newMotor.addProperty(new Property("Part1", DataType.Referent), part1)
    newMotor.addProperty(new Property("Active", DataType.Bool), true)
    newMotor.addProperty(new Property("Enabled", DataType.Bool), true)

	newMotor.setParent(part1)
}

//Updates the cumulative step heights with any new scaling
function UpdateCumulativeStepHeight(self: RigData, part: Instance) {
	if (!part) {
		return
    }

	const partName = part.Prop("Name")

	if (partName == "HumanoidRootPart") {
		const rigAttach = part.FindFirstChild("RootRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - (rigAttach.Prop("Position") as Vector3).Y;
        }
		self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - ((part.Prop("Size") as Vector3).Y / 2.0)
		self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - ((part.Prop("Size") as Vector3).Y / 2.0)

    } else if (partName == "LowerTorso") {
		let rigAttach = part.FindFirstChild("RootRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + (rigAttach.Prop("Position") as Vector3).Y
        }
		rigAttach = part.FindFirstChild("RightHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - (rigAttach.Prop("Position") as Vector3).Y
        }
		rigAttach = part.FindFirstChild("LeftHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - (rigAttach.Prop("Position") as Vector3).Y
        }

    } else if (partName == "LeftUpperLeg") {
		let rigAttach = part.FindFirstChild("LeftHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + (rigAttach.Prop("Position") as Vector3).Y
        }
		rigAttach = part.FindFirstChild("LeftKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeLegLeft = self.cumulativeLegLeft - (rigAttach.Prop("Position") as Vector3).Y
        }
    } else if (partName == "LeftLowerLeg") {
		let rigAttach = part.FindFirstChild("LeftKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + (rigAttach.Prop("Position") as Vector3).Y
        }
		rigAttach = part.FindFirstChild("LeftAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeLegLeft = self.cumulativeLegLeft - (rigAttach.Prop("Position") as Vector3).Y
        }

    } else if (partName == "LeftFoot") {
		const rigAttach = part.FindFirstChild("LeftAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + (rigAttach.Prop("Position") as Vector3).Y
        }
		self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + ((part.Prop("Size") as Vector3).Y / 2.0)
		self.cumulativeLegLeft = self.cumulativeLegLeft + ((part.Prop("Size") as Vector3).Y / 2.0)

    } else if (partName == "RightUpperLeg") {
		let rigAttach = part.FindFirstChild("RightHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeLegRight = self.cumulativeLegRight + (rigAttach.Prop("Position") as Vector3).Y
        }
		rigAttach = part.FindFirstChild("RightKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeLegRight = self.cumulativeLegRight - (rigAttach.Prop("Position") as Vector3).Y
        }

    } else if (partName == "RightLowerLeg") {
		let rigAttach = part.FindFirstChild("RightKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeLegRight = self.cumulativeLegRight + (rigAttach.Prop("Position") as Vector3).Y
        }
		rigAttach = part.FindFirstChild("RightAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeLegRight = self.cumulativeLegRight - (rigAttach.Prop("Position") as Vector3).Y
        }
    } else if (partName == "RightFoot") {
		const rigAttach = part.FindFirstChild("RightAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + (rigAttach.Prop("Position") as Vector3).Y
			self.cumulativeLegRight = self.cumulativeLegRight + (rigAttach.Prop("Position") as Vector3).Y
        }
		self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + ((part.Prop("Size") as Vector3).Y / 2.0);
		self.cumulativeLegRight = self.cumulativeLegRight + ((part.Prop("Size") as Vector3).Y / 2.0);
    }
}

//Traverses joints between parts by using the attachments on the character and updates or creates joints accordingly
function TraverseRigFromAttachmentsInternal(self: RigData, part: Instance, characterParts: Instance[], buildJoints: boolean) {
	if (!part) {
        console.log("nevermind!")
		return
    }

	// first, loop thru all of the part's children to find attachments
	for (const attachment of part.GetChildren()) {
		if (attachment.className === "Attachment") {
			// only do joint build from "RigAttachments"
			const attachmentName = attachment.Prop("Name") as string
			const findPos = attachmentName.indexOf(rigAttachmentName)

			if (findPos) {
				// also don't make double joints (there is the same named
                // rigattachment under two parts)
				const jointName = attachmentName.substring(0,findPos)
				const joint = part.FindFirstChild(jointName)
				if (!joint || joint.className !== "Motor6D") {

					// try to find other part with same rig attachment name
					for (const characterPart of characterParts) {
						if (part !== characterPart) {
							const matchingAttachment = characterPart.FindFirstChild(attachmentName)
							if (matchingAttachment && matchingAttachment.className === "Attachment") {
								AdjustRootRigAttachmentPosition(self, part, characterPart, attachment, matchingAttachment)
								if (buildJoints) {
									createJoint(jointName,attachment,matchingAttachment)
                                }
								TraverseRigFromAttachmentsInternal(self, characterPart, characterParts, buildJoints)
								break
                            }
                        }
                    }
                }
            }
        }
    }

	UpdateCumulativeStepHeight(self, part)
}

//Builds the joints from the attachment and scales accordingly
//This function also adjusts for assymetrical legs
function BuildJointsFromAttachments(self: RigData, rootPart: Instance, characterParts: Instance[]) {

	// rig the character to get initial leg parts
	TraverseRigFromAttachmentsInternal(self, rootPart, characterParts, true)

	if (self.cumulativeLegLeft > 0.1 && self.cumulativeLegRight > 0.1) {
		let legParts = []

		//Find which leg and which part require scaling
		let yScale = self.cumulativeLegRight / self.cumulativeLegLeft;

		if (self.cumulativeLegLeft > self.cumulativeLegRight) {
			yScale = self.cumulativeLegLeft / self.cumulativeLegRight
			legParts = []
			for (const part of characterParts) {
				if (part.Prop("Name") == "RightUpperLeg" || part.Prop("Name") == "RightLowerLeg" || part.Prop("Name") == "RightFoot") {
					legParts.push(part)
                }
            }
        } else {
			for (const part of characterParts) {
				if (part.Prop("Name") == "LeftUpperLeg" || part.Prop("Name") == "LeftLowerLeg" || part.Prop("Name") == "LeftFoot") {
					legParts.push(part)
                }
            }
        }

		//scale parts
		const adjustScale = Vector3.new(1.0, yScale, 1.0)
		for (const part of legParts) {
			const originalSize = getOriginalSize(part)
			const currentScale = (part.Prop("Size") as Vector3).divide(originalSize)
			const totalScale = currentScale.multiply(adjustScale)
			part.setProperty("Size", originalSize.multiply(totalScale))
			
			//scale attachments
			for (const child of part.GetChildren()) {
				//const attachment = child.FindFirstChildOfClass("Attachment")
				const attachment = child
				if (attachment && attachment.className === "Attachment") {
					const originalPosition = attachment.FindFirstChild(originalPositionName)
					if (originalPosition) {
						const originalP = originalPosition.Prop("Value") as Vector3

                        const ogCF = (attachment.Prop("CFrame") as CFrame).clone()
                        const newPos = originalP.multiply(totalScale)
                        ogCF.Position = [newPos.X, newPos.Y, newPos.Z]
						attachment.setProperty("CFrame", ogCF)
                    }
                }
            }
        }
    }

	self.cumulativeStepHeightLeft = 0.0
	self.cumulativeStepHeightRight = 0.0
	self.cumulativeLegLeft = 0.0
	self.cumulativeLegRight = 0.0

	//build the character joints after scaling
	TraverseRigFromAttachmentsInternal(self, rootPart, characterParts, true)

	let stepHeight = Math.max(self.cumulativeStepHeightLeft, self.cumulativeStepHeightRight)
	if (Math.abs(self.cumulativeStepHeightLeft - self.cumulativeStepHeightRight) < stepHeight) {
		stepHeight = Math.min(self.cumulativeStepHeightLeft, self.cumulativeStepHeightRight)
    }
	if (stepHeight < 0.0) {
		stepHeight = ((rootPart.Prop("Size") as Vector3).Y / 2)
    }
	SetStepHeight(self, stepHeight)

	//build the character joints after step height has been set
	TraverseRigFromAttachmentsInternal(self, rootPart, characterParts, true)
}

//Builds the joints on a character
export function BuildJoints(self: RigData) {
	const character = self.rig
	const characterParts = GetCharacterParts(character)

	const hrp = character.FindFirstChild("HumanoidRootPart")
	if (hrp) {
		BuildJointsFromAttachments(self, hrp, characterParts)
	} else {
		console.log(self)
		throw new Error("Rig is missing HumanoidRootPart")
	}
}

//Scales the character including any accessories and attachments
//NOTE: Scaling is supported only for R15 Characters
export function ScaleCharacter(rig: Instance, outfit: Outfit, humanoidDescription: Instance) {
	if (outfit.playerAvatarType === AvatarType.R6) {
		return
	}

	//scale parts
	const bodyScaleVector = Vector3.new(
        outfit.scale.width,
		outfit.scale.height,
		outfit.scale.depth
    )
	const headScaleVector = Vector3.new(outfit.scale.head,outfit.scale.head,outfit.scale.head)
	const anthroPercent = outfit.scale.bodyType
	const wideToNarrow = outfit.scale.proportion
	const characterParts = GetCharacterParts(rig)

	for (const part of characterParts) {
		if (part) {
			ScaleCharacterPart(part, bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow)
        }
    }

	//scale step height
	const stepHeight = lerp(stepHeightWide, stepHeightNarrow, wideToNarrow)
	const newStepHeight = lerp(2.0, stepHeight, anthroPercent)

    const self: RigData = {
        "outfit": outfit,
        "rig": rig,
		"cumulativeStepHeightLeft": 0.0,
		"cumulativeStepHeightRight": 0.0,
		"cumulativeLegLeft": 0.0,
		"cumulativeLegRight": 0.0,
		"stepHeight": 0.0,
		"bodyScale": bodyScaleVector,
		"headScale": headScaleVector.X
    }

	SetStepHeight(self, newStepHeight * bodyScaleVector.Y)

	//scale accessories
	ScaleAccessories(bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow, rig, humanoidDescription)

	self.bodyScale = bodyScaleVector
	self.headScale = headScaleVector.X

	//build up joints
	BuildJoints(self)

    return self
}

export function ScaleAccessoryForRig(accessory: Instance, rig: Instance, outfit: Outfit, humanoidDescription: Instance) {
    const scale = outfit.scale

    if (outfit.playerAvatarType === AvatarType.R6) {
        //console.log("SCALING FOR R6")
		ScaleAccessory(accessory, new Vector3(1,1,1), new Vector3(1,1,1), null, null, rig, humanoidDescription)
	} else {
        //console.log("SCALING FOR R15")
        //scale parts
        const bodyScaleVector = Vector3.new(
            scale.width,
            scale.height,
            scale.depth
        )
        const headScaleVector = Vector3.new(scale.head, scale.head, scale.head)

        //scale accessories
        ScaleAccessory(accessory, bodyScaleVector, headScaleVector, scale.bodyType, scale.proportion, rig, humanoidDescription)
    }
}

export function replaceBodyPart(rig: Instance, child: Instance) {
	const childName = child.Prop("Name") as string
	const oldBodyPart = rig.FindFirstChild(childName)
	if (oldBodyPart) {
		const motor6ds = rig.GetDescendants()
		for (const motor of motor6ds) {
			if (motor.className === "Motor6D" || motor.className === "Weld") {
				const part0 = motor.Prop("Part0")
				const part1 = motor.Prop("Part1")
				if (part0 && oldBodyPart === part0) {
					motor.setProperty("Part0", child)
				}
				if (part1 && oldBodyPart === part1) {
					motor.setProperty("Part1", child)
				}
			}
		}

		const oldMotor6ds = oldBodyPart.GetChildren()
		for (const motor of oldMotor6ds) {
			if (motor.className === "Motor6D") {
				const motorName = motor.Prop("Name") as string

				const selfMotor = child.FindFirstChild(motorName)
				if (selfMotor) {
					//if (!selfMotor.Prop("Part0")) {
					//    selfMotor.setProperty("Part0", motor.Prop("Part0"))
					//}
				}
			}
		}
		
		const face = oldBodyPart.FindFirstChildOfClass("Decal")
		if (face) {
			const childFace = child.FindFirstChildOfClass("Decal")
			if (childFace) {
				childFace.Destroy()
			}
			//if (!child.FindFirstChildOfClass("FaceControls")) {
				face.setParent(child)
			//} else {
			//	face.Destroy()
			//}
		}

		oldBodyPart.Destroy()
	}
	child.setParent(rig)
}

export function calculateMotor6Doffset(motor: Instance, includeTransform = false) {
	const C0 = motor.Prop("C0") as CFrame
	const C1 = motor.Prop("C1") as CFrame
	let transform = new CFrame()
	if (includeTransform) {
		transform = motor.Prop("Transform") as CFrame
	}

	const offset1 = C1.multiply(transform).inverse()
	const finalCF = C0.multiply(offset1)

	return finalCF
}

export function traverseRigCFrame(instance: Instance) {
	const motors: Instance[] = []

	let lastMotor6D = instance.FindFirstChildOfClass("Motor6D")
	while (lastMotor6D) {
		motors.push(lastMotor6D)
		const ogLastMotor6D = lastMotor6D
		lastMotor6D = (ogLastMotor6D.Prop("Part0") as Instance | undefined)?.FindFirstChildOfClass("Motor6D")
		if (!lastMotor6D) {
			lastMotor6D = (ogLastMotor6D.Prop("Part0") as Instance | undefined)?.FindFirstChildOfClass("Weld")
		}
	}

	motors.reverse()

	let finalCF = new CFrame()
	for (const motor of motors) {
		finalCF = finalCF.multiply(calculateMotor6Doffset(motor))
	}

	return finalCF
}
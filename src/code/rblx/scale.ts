//scaling notes
/*
R15 --> Slim = R15_Wide * R15_Proportions

*/
//scaling data
let originalPositionName = "OriginalPosition"
let originalSizeName = "OriginalSize"
let rigAttachmentName = "RigAttachment"

let stepHeightNarrow = 2.4
let stepHeightWide = 2.7

//Default positions of the attachments related to the Head part
let headAttachmentMap = {
	FaceCenterAttachment: Vector3.new(0, 0, 0),
	FaceFrontAttachment: Vector3.new(0, 0, -0.6),
	HairAttachment: Vector3.new(0, 0.6, 0),
	HatAttachment: Vector3.new(0, 0.6, 0),
	NeckRigAttachment: Vector3.new(0, -0.5, 0)
}

//Default scaling values for character with classic proportions (used in lerp calcuations with desired scaling factor)
let scalingWideValues = {
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
let scalingNarrowValues = {
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
let scalingNativeR15ToWide = {
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
let scalingNativeR15ToNarrow = {
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

const SCALE_R15_Wide = {
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

const SCALE_R15_Proportions = {
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

const SCALE_Wide_R15 = {
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

//Linear interpolation function
function lerp(a,b,t) {
	return a + (b - a) * t
}

function lerpVec3(a,b,t) {
	return a.add((b.minus(a)).multiply(new Vector3(t,t,t)))
}

//Returns an array of the character parts
function GetCharacterParts(rig) {
	let characterParts = []
	for (let item of rig.GetChildren()) {
		if (item.className === "MeshPart" || item.className === "Part") {
		    characterParts.push(item)	
        }
    }
	return characterParts
}

//Returns the matching attachment found on the character
function FindFirstMatchingAttachment(attachmentName, rig) {
	let characterParts = GetCharacterParts(rig)
	for (let part of characterParts) {
		for (let child of part.GetChildren()) {
			if (child.Prop("Name") == attachmentName) {
				return child
            }
        }
    }
	return null
}

//Returns the character part the accessory is attached to
function GetAttachedPart(accessory, rig) {
	let handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }

	let accessoryWeld = handle.FindFirstChild("AccessoryWeld")
	if (accessoryWeld) {
		let attachedPart
		if (accessoryWeld.Prop("Part0") !== handle) {
			attachedPart = accessoryWeld.Prop("Part0")
        } else {
			attachedPart = accessoryWeld.Prop("Part1")
        }
		return attachedPart
    }

	let accessoryAttachment = handle.FindFirstChildOfClass("Attachment")
	if (accessoryAttachment) {
		let matchingAttachment = FindFirstMatchingAttachment(accessoryAttachment.Prop("Name"), rig)
		if (matchingAttachment && matchingAttachment.parent) {
			return matchingAttachment.parent
        }
    }

	return rig.Child("Head")
}

//Returns the scale of a part with consideration for proportion type
function getPartScale(part, wideToNarrow, anthroPercent, partType, baseType) {
	let scale = new Vector3(1.0,1.0,1.0)
	if (!part) {
		return scale
    }

	let partName = part.Prop("Name")

	let wideScale = scalingWideValues[partName]
	let narrowScale = scalingNarrowValues[partName]

	if (partType === "ProportionsNormal" || partType == "ProportionsSlender") {
		wideScale = scalingNativeR15ToWide[partName]
		narrowScale = scalingNativeR15ToNarrow[partName]
    }

	if (!wideScale) { wideScale = Vector3.new(1.0,1.0,1.0) }
	if (!narrowScale) { narrowScale = Vector3.new(1.0,1.0,1.0) }

	let anthroScale = lerpVec3(wideScale, narrowScale, wideToNarrow)
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
function getOriginalSize(part) {
	let originalSize = part.Prop("Size")
	let originalSizeValue = part.FindFirstChild(originalSizeName)
	if (originalSizeValue) {
		originalSize = originalSizeValue.Prop("Value")
    } else {
		let partSizeValue = new Instance("Vector3Value")
        partSizeValue.addProperty(new Property("Name", DataType.String), originalSizeName)
        partSizeValue.addProperty(new Property("Value", DataType.Vector3), part.Prop("Size"))
		partSizeValue.setParent(part)
    }
	return originalSize
}

//Scales the attachment or special mesh child found on a part
function scaleChildrenOfPart(part, scaleVector) {
	for (let child of part.GetChildren()) {
		if (child.className === "Attachment") {
			let originalPosition = child.Prop("CFrame").Position
            originalPosition = new Vector3(originalPosition[0], originalPosition[1], originalPosition[2])
            originalPosition = originalPosition.multiply(scaleVector)

            let newCF = child.Prop("CFrame").clone()
            newCF.Position = [originalPosition.X, originalPosition.Y, originalPosition.Z]
			child.setProperty("CFrame", newCF)
        } else if (child.className === "SpecialMesh") {
			if (child.Prop("MeshType") !== MeshType.Head) {
				let orignalScale = child.Prop("Scale")
				child.setProperty("Scale", orignalScale.multiply(scaleVector))
            }
        }
    }
}

function getAvatarPartScaleType(bodyPart) {
    let avatarPartScaleTypeVal = bodyPart.FindFirstDescendant("AvatarPartScaleType")
    if (avatarPartScaleTypeVal) {
        return avatarPartScaleTypeVal.Prop("Value")
    }

    return "Classic"
}

//SOURCE: https://devforum.roblox.com/t/rthro-scaling-specification/199611
function sampleScaleTables(bodyPart, scaleType) {
	// Determine the scale type for this body part.
	if (!scaleType) {
		scaleType = getAvatarPartScaleType(bodyPart)
    }
	
	// Sample the scaling tables
	let limbName = bodyPart.Prop("Name")
	let sampleNoChange = Vector3.new(1, 1, 1)
	
	let sampleR15ToNormal = scalingWideValues[limbName]
	let sampleNormalToR15 = scalingNativeR15ToWide[limbName]

	let sampleR15ToSlender = scalingNarrowValues[limbName]
	let sampleSlenderToR15 = scalingNativeR15ToNarrow[limbName]

	let sampleNormalToSlender = (sampleR15ToNormal.divide(sampleR15ToSlender))
	let sampleSlenderToNormal = (sampleR15ToSlender.divide(sampleR15ToNormal))
	
	// Select the scales that will be interpolated
	let scaleR15, scaleNormal, scaleSlender
	
	if (scaleType == "ProportionsNormal") {
        scaleR15 = sampleNormalToR15
        scaleNormal = sampleNoChange
        scaleSlender = sampleNormalToSlender
    } else if (scaleType == "ProportionsSlender") {
        scaleR15 = sampleSlenderToR15
        scaleNormal = sampleSlenderToNormal
        scaleSlender = sampleNoChange
    } else {
        scaleR15 = sampleNoChange
        scaleNormal = sampleR15ToNormal
        scaleSlender = sampleR15ToSlender
    }
	
	return [scaleR15, scaleNormal, scaleSlender]
}

function computeLimbScale(bodyPart, bodyScaleVector, headScaleVector, bodyTypeScale, bodyProportionScale) {
	// Determine the scale type for this body part.
	let scaleType = getAvatarPartScaleType(bodyPart)
	
	// Select the scales we will interpolate
	let [scaleR15, scaleNormal, scaleSlender] = sampleScaleTables(bodyPart)
	
	// Compute the Rthro scaling based on the current proportions and body-type.
	let bodyType = bodyTypeScale
	let proportions = bodyProportionScale
	
	let scaleProportions = lerpVec3(scaleNormal, scaleSlender, proportions)
	let scaleBodyType = lerpVec3(scaleR15, scaleProportions, bodyType)
	
	// Handle the rest of the scale values.
	if (bodyPart.Prop("Name") == "Head") {
		return scaleBodyType.multiply(headScaleVector)
    } else {
		let baseScale = bodyScaleVector
		return scaleBodyType.multiply(baseScale)
    }
}

function OLDALTScaleAccessory(accessory, bodyScaleVector, headScaleVector, bodyTypeScale, bodyProportionScale, rig) {
    let handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }
    let limb = GetAttachedPart(accessory, rig)
    if (!limb) {
        return
    }

    let limbScaleType = getAvatarPartScaleType(limb)
	let handleScaleType = getAvatarPartScaleType(handle)

    let limbScale = computeLimbScale(limb, bodyScaleVector, headScaleVector, bodyTypeScale, bodyProportionScale)
	if (limbScaleType === handleScaleType) {
		return limbScale
    }
	
	let [limbR15, limbNormal, limbSlender] = sampleScaleTables(limb, limbScaleType)
	let [handleR15, handleNormal, handleSlender] = sampleScaleTables(limb, handleScaleType)
	
	let originScale
	
	if (handleScaleType == "ProportionsNormal") {
		originScale = handleNormal.divide(limbNormal)
    } else if (handleScaleType == "ProportionsSlender") {
		originScale = handleSlender.divide(limbSlender)
    } else {
		originScale = handleR15.divide(limbR15)
    }

	let newScaleVector = originScale.multiply(limbScale)

    let originalSize = getOriginalSize(handle)
	let currentScaleVector = handle.Prop("Size").divide(originalSize)
    let relativeScaleVector = newScaleVector.divide(currentScaleVector);

	//scale accessory and as well as its welds and attachments
    scaleChildrenOfPart(handle, relativeScaleVector)
	handle.setProperty("Size", originalSize.multiply(newScaleVector))
	accessory.AccessoryBuildWeld()
}

//This is the only working accessory scaling function, all the other ones are incorrect
function ScaleAccessory(accessory, bodyScaleVector, headScaleVector, bodyTypeScale, bodyProportionScale, rig) {
	let handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }

	let attachedPart = GetAttachedPart(accessory, rig)

    let resultScale = Vector3.new(1,1,1)

    //head vs width,depth,height
	let regularScaleVector = bodyScaleVector
	if (attachedPart.Prop("Name") === "Head") {
		regularScaleVector = headScaleVector
    }
    resultScale = resultScale.multiply(regularScaleVector)

	//find appropriate relative scaling with attached part
	if (attachedPart) {
        let bodyPartName = attachedPart.Prop("Name")
        if (SCALE_Wide_R15[bodyPartName] === undefined) {
            return
        }

	    let accessoryScaleType = "Classic"
        let accessoryScaleTypeValue = accessory.FindFirstDescendant("AvatarPartScaleType")
		if (accessoryScaleTypeValue) {
			accessoryScaleType = accessoryScaleTypeValue.Prop("Value")
        }

	    let attachedPartScaleType = "Classic"
        let attachedPartScaleTypeValue = attachedPart.FindFirstDescendant("AvatarPartScaleType")
		if (attachedPartScaleTypeValue) {
			attachedPartScaleType = attachedPartScaleTypeValue.Prop("Value")
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
                        let bodyTypeScaleVector = SCALE_R15_Wide[bodyPartName]
                        let bodyProportionScaleVector = lerpVec3(Vector3.new(1,1,1), SCALE_R15_Proportions[bodyPartName], bodyProportionScale)
                        let finalVector = lerpVec3(Vector3.new(1,1,1), bodyTypeScaleVector.multiply(bodyProportionScaleVector), bodyTypeScale).multiply(relativeScaleVector)
                        resultScale = resultScale.multiply(finalVector)
                        break
                    }
                case "ProportionsNormal":
                    {
                        //apply scale as ProportionsNormal
                        let bodyTypeScaleVector = SCALE_Wide_R15[bodyPartName]
                        let bodyProportionScaleVector = lerpVec3(Vector3.new(1,1,1), SCALE_R15_Proportions[bodyPartName], bodyProportionScale)
                        let finalVector = lerpVec3(bodyTypeScaleVector, bodyProportionScaleVector, bodyTypeScale).multiply(relativeScaleVector)
                        resultScale = resultScale.multiply(finalVector)
                        break
                    }
                case "ProportionsSlender":
                    {
                        //apply scale as ProportionsSlender
                        let bodyTypeScaleVector = SCALE_Wide_R15[bodyPartName]
                        let bodyProportionScaleVector = lerpVec3(Vector3.new(1,1,1).divide(SCALE_R15_Proportions[bodyPartName]), Vector3.new(1,1,1), bodyProportionScale)
                        let finalVector = lerpVec3(bodyTypeScaleVector, bodyProportionScaleVector, bodyTypeScale).multiply(relativeScaleVector)
                        resultScale = resultScale.multiply(finalVector)
                        break
                    }
            }
        } else { //If R6, BUG: Applies scale to R6 sometimes avatar... I'm doing this because it's more frequent for it to mess up and scale accessories rather than not
            resultScale = resultScale.multiply(relativeScaleVector)
        }
    } else {
        console.warn("Failed to find attached part for accessory:", accessory)
    }

	let originalSize = getOriginalSize(handle)
    //used to double check
    console.log(accessory.Prop("Name"))
    console.log("SCALE HERE \n HERE\nHERE\nHERE\nHERE")
    console.log(resultScale.multiply(originalSize))
    //throw "check the scale"
	let currentScaleVector = handle.Prop("Size").divide(originalSize)
    let relativeScaleVector = resultScale.divide(currentScaleVector);

	//scale accessory and as well as its welds and attachments
    scaleChildrenOfPart(handle, relativeScaleVector)
	handle.setProperty("Size", originalSize.multiply(resultScale))
	accessory.AccessoryBuildWeld()
}

function OLDScaleAccessory(accessory, bodyScaleVector, headScaleVector, bodyTypeScale, bodyProportionScale, rig) {
	let handle = accessory.FindFirstChild("Handle")
	if (!handle) {
		return
    }

	let attachedPart = GetAttachedPart(accessory, rig)

	let newScaleVector = bodyScaleVector
	if (attachedPart.Prop("Name") === "Head") {
		newScaleVector = headScaleVector
    }

	//find appropriate relative scaling with attached part
	if (attachedPart) {
		let scale = new Vector3(1,1,1)

	    let accessoryProportion = "Classic"
		if (accessory.FindFirstChild("AvatarPartScaleType")) {
			accessoryProportion = accessory.Child("AvatarPartScaleType").Prop("Value")
        }

	    if (accessoryProportion !== "Classic") {
	        scale = getPartScale(attachedPart, 0.0, 0.0, accessoryProportion, accessoryProportion);
        }
        console.log(accessoryProportion)

	    let attachedPartProportion = "Classic"
        let attachedPartScaleType = attachedPart.FindFirstChild("AvatarPartScaleType")
		if (attachedPartScaleType) {
			attachedPartProportion = attachedPartScaleType.Prop("Value")
        }

        //TODO: why is this needed?
        if (accessoryProportion === "Classic") {
            attachedPartProportion = "Classic"
        }

        //Support for how roblox scales R6
        if (!bodyTypeScale) {
            if (attachedPartProportion.startsWith("Proportions")) {
                bodyTypeScale = 1
            } else {
                bodyTypeScale = 0
            }
        }
        if (!bodyProportionScale) {
            if (attachedPartProportion === "ProportionsSlender") {
                bodyProportionScale = 1
            } else {
                bodyProportionScale = 0
            }
        }

		scale = scale.multiply(getPartScale(attachedPart, bodyProportionScale, bodyTypeScale, attachedPartProportion, "Classic"));
		newScaleVector = newScaleVector.multiply(scale)
    } else {
        console.warn("Failed to find attached part for accessory:", accessory)
    }

	let originalSize = getOriginalSize(handle)
	let currentScaleVector = handle.Prop("Size").divide(originalSize)
    let relativeScaleVector = newScaleVector.divide(currentScaleVector);

	//scale accessory and as well as its welds and attachments
    scaleChildrenOfPart(handle, relativeScaleVector)
	handle.setProperty("Size", originalSize.multiply(newScaleVector))
	accessory.AccessoryBuildWeld()
}

//Returns the original mesh scale of the part or will create one if it cannot find one
function getOriginalMeshScale(mesh) {
	let originalScale = mesh.Prop("Scale")
	let originalScaleValue = mesh.FindFirstChild(originalSizeName)
	if (originalScaleValue) {
		originalScale = originalScaleValue.Prop("Value")
    } else {
		let partScaleValue = new Instance("Vector3Value")
        partScaleValue.addProperty(new Property("Name", DataType.String), originalSizeName)
        partScaleValue.addProperty(new Property("Value", DataType.Vector3), mesh.Scale)
		partScaleValue.setParent(mesh)
    }
	return originalScale
}

//Returns the original attachment position or will create one if it cannot find one
function getOriginalAttachmentPosition(attachment) {
	let originalPosition = attachment.FindFirstChild(originalPositionName)
	if (originalPosition) {
		return originalPosition.Prop("Value")
    }

	let position = attachment.Prop("Position")

	let attachmentLocationValue = new Instance("Vector3Value")
    attachmentLocationValue.addProperty(new Property("Name", DataType.String), originalPositionName)
	attachmentLocationValue.addProperty(new Property("Value", DataType.Vector3), position)
	attachmentLocationValue.setParent(attachment)

	return position
}

//Scale character part and any attachments using values found in the configurations folder
function ScaleCharacterPart(part, bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow) {
	let partName = part.Prop("Name")
	let originalSize = getOriginalSize(part)

	let newScaleVector = bodyScaleVector
	if (partName == "Head") {
		newScaleVector = headScaleVector
    }

	//check for native part information on special mesh in the Head Part
	if (part && partName == "Head") {
		let mesh = part.FindFirstChildOfClass("SpecialMesh")
		if (mesh) {
			let nameNative = "AvatarPartScaleType"
			let meshScaleTypeValue = mesh.FindFirstChild(nameNative)
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
            } else if (!part.className === "MeshPart") {
				let headScaleTypeValue = part.FindFirstChild(nameNative)
				if (headScaleTypeValue) {
					headScaleTypeValue.Destroy()
                }
            }
        } else if (!part.className === "MeshPart") {
			let nameNative = "AvatarPartScaleType";
			let headScaleTypeValue = part.FindFirstChild(nameNative)
			if (headScaleTypeValue) {
				headScaleTypeValue.Destroy();
            }
        }
    }

	//find the appropriate scale for the part
	let humanoidPropType = "Classic"
	if (part.FindFirstChild("AvatarPartScaleType")) {
		humanoidPropType = part.Child("AvatarPartScaleType").Prop("Value")
    }
	let scale = getPartScale(part, wideToNarrow, anthroPercent, humanoidPropType, humanoidPropType)

	//scale head mesh and attachments
	if (part && partName == "Head") {
		let mesh = part.FindFirstChildOfClass("SpecialMesh")
		if (mesh) {
			let headScale = newScaleVector
			if (mesh.Prop("MeshType") == MeshType.Head) {
				headScale = Vector3.new(1.0,1.0,1.0)
            }
			let originalScale = getOriginalMeshScale(mesh)

			if (mesh.Prop("MeshType") !== MeshType.Head) {
				mesh.setProperty("Scale", originalScale.multiply(scale).multiply(headScale))
            }

			let attachmentNames = ["FaceCenterAttachment", "FaceFrontAttachment", "HairAttachment",
				"HatAttachment", "NeckRigAttachment"]

            for (aname of attachmentNames) {
				let originalPosValue = mesh.FindFirstChild(aname)
				let headAttachment = part.FindFirstChild(aname)
				let originalPosition = headAttachment.FindFirstChild(originalPositionName)
				if (headAttachment && originalPosition) {
					if (originalPosValue) {
						originalPosition.setProperty("Value", originalPosValue)
                    } else {
						originalPosition.setProperty("Value", headAttachmentMap[aname])
                    }
                }
            }
        }
    }

	//scale the part
	part.setProperty("Size", originalSize.multiply(scale).multiply(newScaleVector))

	//scale attachments
    for (let child of part.GetChildren()) {
		if (child.className === "Attachment") {
			let originalAttachment = getOriginalAttachmentPosition(child)
            let ogCF = child.Prop("CFrame").clone()
            let newPos = originalAttachment.multiply(scale).multiply(newScaleVector)
            ogCF.Position = [newPos.X, newPos.Y, newPos.Z]
			child.setProperty("CFrame", ogCF)
        }
    }
}

//Updates the step height
function SetStepHeight(self, value) {
	if (!value) {
		return
    }

	let stepHeight = self.stepHeight

	value = specialClamp(value, -100.0, 100.0)

	if (value !== stepHeight) {
		self.stepHeight = value
    }
}

//Scale accessories using values found in the configurations folder
function ScaleAccessories(bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow, rig) {
    for (let item of rig.GetChildren()) {
		if (item.className === "Accessory") {
			ScaleAccessory(item,bodyScaleVector,headScaleVector,anthroPercent,wideToNarrow, rig)
        }
    }
}

//Adjusts any rig attachments as needed
function AdjustRootRigAttachmentPosition(self, rootPart, matchingPart, rootAttachment, matchingAttachment) {
	let rightHipAttachment = matchingPart.FindFirstChild("RightHipAttachment")
	let leftHipAttachment = matchingPart.FindFirstChild("LeftHipAttachment")

	if (leftHipAttachment || rightHipAttachment) {
		let rightHipDistance = 9999999999
		let leftHipDistance = 9999999999
		if (rightHipAttachment) {
			rightHipDistance = rightHipAttachment.Prop("Position").Y
        }
		if (leftHipAttachment) {
			leftHipDistance = leftHipAttachment.Prop("Position").Y
        }

		let hipDistance = Math.min(leftHipDistance, rightHipDistance)

		let rootAttachmentToHipDistance = matchingAttachment.Prop("Position").Y - hipDistance
		let halfRootPartHeight = rootPart.Prop("Size").Y / 2.0

		let currentPivot = rootAttachment.Prop("Position")
		let newYPivot = rootAttachmentToHipDistance - halfRootPartHeight

        let ogCF = rootAttachment.Prop("CFrame").clone()
        ogCF.Position = [currentPivot.X, newYPivot, currentPivot.Z]
		rootAttachment.setProperty("CFrame", ogCF)
    }
}

//Creates a joint between two attachments
function createJoint(jointName,att0,att1) {
	let part0 = att0.parent
    let part1 = att1.parent
	let newMotor = part1.FindFirstChild(jointName)

	if (!(newMotor && newMotor.className === "Motor6D")) {
		newMotor = new Instance("Motor6D")
    }

    newMotor.addProperty(new Property("Name", DataType.String), jointName)
    newMotor.addProperty(new Property("Archivable", DataType.Bool), true)
    newMotor.addProperty(new Property("C1", DataType.CFrame), att1.Prop("CFrame"))
    newMotor.addProperty(new Property("C0", DataType.CFrame), att0.Prop("CFrame"))
    newMotor.addProperty(new Property("Part1", DataType.Referent), part1)
    newMotor.addProperty(new Property("Part0", DataType.Referent), part0)
    newMotor.addProperty(new Property("Active", DataType.Bool), true)
    newMotor.addProperty(new Property("Enabled", DataType.Bool), true)

	newMotor.setParent(part1)
}

//Updates the cumulative step heights with any new scaling
function UpdateCumulativeStepHeight(self, part) {
	if (!part) {
		return
    }

	let partName = part.Prop("Name")

	if (partName == "HumanoidRootPart") {
		let rigAttach = part.FindFirstChild("RootRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y;
        }
		self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - (part.Prop("Size").Y / 2.0)
		self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - (part.Prop("Size").Y / 2.0)

    } else if (partName == "LowerTorso") {
		let rigAttach = part.FindFirstChild("RootRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("RightHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("LeftHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y
        }

    } else if (partName == "LeftUpperLeg") {
		let rigAttach = part.FindFirstChild("LeftHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("LeftKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft - rigAttach.Prop("Position").Y
        }
    } else if (partName == "LeftLowerLeg") {
		let rigAttach = part.FindFirstChild("LeftKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("LeftAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft - rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft - rigAttach.Prop("Position").Y
        }

    } else if (partName == "LeftFoot") {
		let rigAttach = part.FindFirstChild("LeftAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + rigAttach.Prop("Position").Y
			self.cumulativeLegLeft = self.cumulativeLegLeft + rigAttach.Prop("Position").Y
        }
		self.cumulativeStepHeightLeft = self.cumulativeStepHeightLeft + (part.Prop("Size").Y / 2.0)
		self.cumulativeLegLeft = self.cumulativeLegLeft + (part.Prop("Size").Y / 2.0)

    } else if (partName == "RightUpperLeg") {
		let rigAttach = part.FindFirstChild("RightHipRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("RightKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight - rigAttach.Prop("Position").Y
        }

    } else if (partName == "RightLowerLeg") {
		let rigAttach = part.FindFirstChild("RightKneeRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight + rigAttach.Prop("Position").Y
        }
		rigAttach = part.FindFirstChild("RightAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight - rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight - rigAttach.Prop("Position").Y
        }
    } else if (partName == "RightFoot") {
		let rigAttach = part.FindFirstChild("RightAnkleRigAttachment")
		if (rigAttach) {
			self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + rigAttach.Prop("Position").Y
			self.cumulativeLegRight = self.cumulativeLegRight + rigAttach.Prop("Position").Y
        }
		self.cumulativeStepHeightRight = self.cumulativeStepHeightRight + (part.Prop("Size").Y / 2.0);
		self.cumulativeLegRight = self.cumulativeLegRight + (part.Prop("Size").Y / 2.0);
    }
}

//Traverses joints between parts by using the attachments on the character and updates or creates joints accordingly
function TraverseRigFromAttachmentsInternal(self, part, characterParts, buildJoints) {
	if (!part) {
        console.log("nevermind!")
		return
    }

	// first, loop thru all of the part's children to find attachments
	for (let attachment of part.GetChildren()) {
		if (attachment.className === "Attachment") {
			// only do joint build from "RigAttachments"
			let attachmentName = attachment.Prop("Name")
			let findPos = attachmentName.indexOf(rigAttachmentName)

			if (findPos) {
				// also don't make double joints (there is the same named
                // rigattachment under two parts)
				let jointName = attachmentName.substring(0,findPos)
				let joint = part.FindFirstChild(jointName)
				if (!joint || joint.className !== "Motor6D") {

					// try to find other part with same rig attachment name
					for (let characterPart of characterParts) {
						if (part !== characterPart) {
							let matchingAttachment = characterPart.FindFirstChild(attachmentName)
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
function BuildJointsFromAttachments(self, rootPart, characterParts) {

	// rig the character to get initial leg parts
	TraverseRigFromAttachmentsInternal(self, rootPart, characterParts, true)

	if (self.cumulativeLegLeft > 0.1 && self.cumulativeLegRight > 0.1) {
		let legParts = []

		//Find which leg and which part require scaling
		let yScale = self.cumulativeLegRight / self.cumulativeLegLeft;

		if (self.cumulativeLegLeft > self.cumulativeLegRight) {
			yScale = self.cumulativeLegLeft / self.cumulativeLegRight
			legParts = []
			for (let part of characterParts) {
				if (part.Prop("Name") == "RightUpperLeg" || part.Prop("Name") == "RightLowerLeg" || part.Prop("Name") == "RightFoot") {
					legParts.push(part)
                }
            }
        } else {
			for (let part of characterParts) {
				if (part.Prop("Name") == "LeftUpperLeg" || part.Prop("Name") == "LeftLowerLeg" || part.Prop("Name") == "LeftFoot") {
					legParts.push(part)
                }
            }
        }

		//scale parts
		let adjustScale = Vector3.new(1.0, yScale, 1.0)
		for (let part of legParts) {
			let originalSize = getOriginalSize(part)
			let currentScale = part.Prop("Size").divide(originalSize)
			let totalScale = currentScale.multiply(adjustScale)
			part.setProperty("Size", originalSize.multiply(totalScale))

			//scale attachments
			for (let child of part.GetChildren()) {
				let attachment = child.FindFirstChildOfClass("Attachment")
				if (attachment) {
					let originalPosition = attachment.FindFirstChild(originalPositionName)
					if (originalPosition) {
						let originalP = originalPosition.Prop("Value")

                        let ogCF = attachment.Prop("CFrame").clone()
                        let newPos = originalP.multiply(totalScale)
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
		stepHeight = (rootPart.Prop("Size").Y / 2)
    }
	SetStepHeight(self, stepHeight)
}

//Builds the joints on a character
function BuildJoints(self) {
	let character = self.rig
	let characterParts = GetCharacterParts(character)

	BuildJointsFromAttachments(self, character.Child("HumanoidRootPart"), characterParts)
}

//Scales the character including any accessories and attachments
//NOTE: Scaling is supported only for R15 Characters
function ScaleCharacter(rig, outfit) {
	if (outfit.playerAvatarType === AvatarType.R6) {
		return
	}

	//scale parts
	let bodyScaleVector = Vector3.new(
        outfit.scale.width,
		outfit.scale.height,
		outfit.scale.depth
    )
	let headScaleVector = Vector3.new(outfit.scale.head,outfit.scale.head,outfit.scale.head)
	let anthroPercent = outfit.scale.bodyType
	let wideToNarrow = outfit.scale.proportion
	let characterParts = GetCharacterParts(rig)

	for (let part of characterParts) {
		if (part) {
			ScaleCharacterPart(part, bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow)
        }
    }

	//scale step height
	let stepHeight = lerp(stepHeightWide, stepHeightNarrow, wideToNarrow)
	let newStepHeight = lerp(2.0, stepHeight, anthroPercent)

    let self = {
        "outfit": outfit,
        "rig": rig,
    }

    self.cumulativeStepHeightLeft = 0.0
    self.cumulativeStepHeightRight = 0.0
    self.cumulativeLegLeft = 0.0
    self.cumulativeLegRight = 0.0

	SetStepHeight(self, newStepHeight * bodyScaleVector.Y)

	//scale accessories
	ScaleAccessories(bodyScaleVector, headScaleVector, anthroPercent, wideToNarrow, rig)

	self.bodyScale = bodyScaleVector
	self.headScale = headScaleVector.X

	//build up joints
	BuildJoints(self)

    return self
}

function ScaleAccessoryForRig(accessory, rig, outfit) {
    let scale = outfit.scale

    if (outfit.playerAvatarType === AvatarType.R6) {
        console.log("SCALING FOR R6")
		ScaleAccessory(accessory, new Vector3(1,1,1), new Vector3(1,1,1), null, null, rig)
	} else {
        console.log("SCALING FOR R15")
        //scale parts
        let bodyScaleVector = Vector3.new(
            scale.width,
            scale.height,
            scale.depth
        )
        let headScaleVector = Vector3.new(scale.head, scale.head, scale.head)

        //scale accessories
        ScaleAccessory(accessory, bodyScaleVector, headScaleVector, scale.bodyType, scale.proportion, rig)
    }
}
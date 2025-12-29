import * as THREE from 'three';
import { CFrame, Instance } from '../rblx/rbx';
import { deg, lerp, mapNum, rad } from '../misc/misc';
import type { Vec3 } from '../rblx/mesh';
import SimpleView from '../lib/simple-view';
import FaceControlsWrapper from './instance/FaceControls';
import { FaceControlNames } from './constant';

//ENUMS
type AnimationPriorityName = "Idle" | "Movement" | "Action" | "Action2" | "Action3" | "Action4" | "Core"
const AnimationPriority: {[K in AnimationPriorityName]: number} = {
    "Idle": 0,
    "Movement": 1,
    "Action": 2,
    "Action2": 3,
    "Action3": 4,
    "Action4": 5,
    "Core": 1000
}

type EasingDirectionName = "In" | "Out" | "InOut"
const EasingDirection: {[K in EasingDirectionName]: number} = {
    "In": 0,
    "Out": 1,
    "InOut": 2,
}

type PoseEasingStyleName = "Linear" | "Constant" | "Elastic" | "Cubic" | "Bounce" | "CubicV2"
const PoseEasingStyle: {[K in PoseEasingStyleName]: number} = {
    "Linear": 0,
    "Constant": 1,
    "Elastic": 2,
    "Cubic": 3,
    "Bounce": 4,
    "CubicV2": 5,
}

type KeyInterpolationModeName = "Constant" | "Linear" | "Cubic"
const KeyInterpolationMode: {[K in KeyInterpolationModeName]: number} = {
    "Constant": 0,
    "Linear": 1,
    "Cubic": 2,
}

type RotationOrderName = "XYZ" | "XZY" | "YZX" | "YXZ" | "ZXY" | "ZYX"
const RotationOrder: {[K in RotationOrderName]: number} = {
    "XYZ": 0,
    "XZY": 1,
    "YZX": 2,
    "YXZ": 3,
    "ZXY": 4,
    "ZYX": 5,
}

const RotationOrderToRotationOrderName: {[K in number]: RotationOrderName} = {
    0: "XYZ",
    1: "XZY",
    2: "YZX",
    3: "YXZ",
    4: "ZXY",
    5: "ZYX",
}

type AnimationTrackType = "Sequence" | "Curve"

//FUNCTIONS FOR EASING (https://easings.net/)
//linear
function easeLinear(x: number) {
    return x
}

//constant
function easeConstant(x: number) {
    return x * 0 //I cant just return 0 because the linter gets angry
}

//elastic
function easeInElastic(x: number) {
    const c4 = (2 * Math.PI) / 3;

    return x === 0
    ? 0
    : x === 1
    ? 1
    : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}

function easeOutElastic(x: number) {
    const c4 = (2 * Math.PI) / 3;

    return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function easeInOutElastic(x: number) {
    const c5 = (2 * Math.PI) / 4.5;

    return x === 0
    ? 0
    : x === 1
    ? 1
    : x < 0.5
    ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}

//cubic
function easeInCubic(x: number) {
    return x * x * x;
}

function easeOutCubic(x: number) {
    return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(x: number) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

//bounce
function easeOutBounce(x: number) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
}

function easeInBounce(x: number) {
    return 1 - easeOutBounce(1 - x);
}

function easeInOutBounce(x: number) {
    return x < 0.5
    ? (1 - easeOutBounce(1 - 2 * x)) / 2
    : (1 + easeOutBounce(2 * x - 1)) / 2;
}

//table for motor names in case motors arent available
const PartToMotorName: {[K in string]: string} = {
    "Head": "Neck",

    "UpperTorso": "Waist",
    "LowerTorso": "Root",

    "RightFoot": "RightAnkle",
    "RightLowerLeg": "RightKnee",
    "RightUpperLeg": "RightHip",

    "LeftFoot": "LeftAnkle",
    "LeftLowerLeg": "LeftKnee",
    "LeftUpperLeg": "LeftHip",

    "RightHand": "RightWrist",
    "RightLowerArm": "RightElbow",
    "RightUpperArm": "RightShoulder",

    "LeftHand": "LeftWrist",
    "LeftLowerArm": "LeftElbow",
    "LeftUpperArm": "LeftShoulder",
}

//map for easing function
const EasingFunctionMap = {
    [EasingDirection.In]: {
        [PoseEasingStyle.Linear]: easeLinear,
        [PoseEasingStyle.Constant]: easeConstant,
        [PoseEasingStyle.Elastic]: easeInElastic,
        [PoseEasingStyle.Cubic]: easeInCubic,
        [PoseEasingStyle.Bounce]: easeInBounce,
        [PoseEasingStyle.CubicV2]: easeInCubic,
    },
    [EasingDirection.Out]: {
        [PoseEasingStyle.Linear]: easeLinear,
        [PoseEasingStyle.Constant]: easeConstant,
        [PoseEasingStyle.Elastic]: easeOutElastic,
        [PoseEasingStyle.Cubic]: easeOutCubic,
        [PoseEasingStyle.Bounce]: easeOutBounce,
        [PoseEasingStyle.CubicV2]: easeOutCubic,
    },
    [EasingDirection.InOut]: {
        [PoseEasingStyle.Linear]: easeLinear,
        [PoseEasingStyle.Constant]: easeConstant,
        [PoseEasingStyle.Elastic]: easeInOutElastic,
        [PoseEasingStyle.Cubic]: easeInOutCubic,
        [PoseEasingStyle.Bounce]: easeInOutBounce,
        [PoseEasingStyle.CubicV2]: easeInOutCubic,
    }
}

//HELPER FUNCTIONS
function getEasingFunction(easingDirection: number, easingStyle: number) {
    const func = EasingFunctionMap[easingDirection][easingStyle]
    if (!func) {
        throw new Error(`No function equivalent for easingStyle: ${easingStyle}`)
    }

    return func
}

//Cubic Hermite spline helper functions
function h00(t: number) {
    return 2*Math.pow(t,3) - 3*Math.pow(t,2) + 1
}

function h10(t: number) {
    return Math.pow(t,3) - 2*Math.pow(t,2) + t
}

function h01(t: number) {
    return -2*Math.pow(t,3) + 3*Math.pow(t,2)
}

function h11(t: number) {
    return Math.pow(t,3) - Math.pow(t,2)
}

/**
 * Cubic Hermite Spline
 * @param t time (normalized)
 * @param p0 startValue
 * @param p1 endValue
 * @param m0 startTangent
 * @param m1 endTangent
 * @param xk startTime
 * @param xk1 endTime
 * @returns 
 */
function p(t: number, p0: number, p1: number, m0: number, m1:number, xk: number, xk1: number) {
    return h00(t)*p0 + h10(t)*(xk1-xk)*m0 + h01(t)*p1+h11(t)*(xk1-xk)*m1
}

/*function animPriorityToNum(animationPriority: number) { //larger number has larger priority, unlike the enums
    if (animationPriority === 1000) {
        return -1
    }

    return animationPriority
}*/

function lerpCFrame(oldCFrame: CFrame, newCFrame: CFrame, easedTime: number) {
    const oldPos = oldCFrame.Position
    const oldRot = oldCFrame.Orientation

    const newPos = newCFrame.Position
    const newRot = newCFrame.Orientation

    const oldEuler = new THREE.Euler(rad(oldRot[0]), rad(oldRot[1]), rad(oldRot[2]), "YXZ")
    const oldQuat = new THREE.Quaternion().setFromEuler(oldEuler)

    const newEuler = new THREE.Euler(rad(newRot[0]), rad(newRot[1]), rad(newRot[2]), "YXZ")
    const newQuat = new THREE.Quaternion().setFromEuler(newEuler)
    
    const resultQuat = oldQuat.slerp(newQuat, easedTime)
    const resultEuler = new THREE.Euler().setFromQuaternion(resultQuat, "YXZ")
    const resultOrientation: Vec3 = [deg(resultEuler.x), deg(resultEuler.y), deg(resultEuler.z)]

    const resultX = lerp(oldPos[0], newPos[0], easedTime)
    const resultY = lerp(oldPos[1], newPos[1], easedTime)
    const resultZ = lerp(oldPos[2], newPos[2], easedTime)

    const resultCFrame = new CFrame(resultX, resultY, resultZ)
    resultCFrame.Orientation = resultOrientation

    return resultCFrame
}

/*function weightCFrame(cf: CFrame, weight: number) {
    cf = cf.clone()
    cf.Position = [cf.Position[0] * weight, cf.Position[1] * weight, cf.Position[2] * weight]
    cf.Orientation = [cf.Orientation[0] * weight, cf.Orientation[1] * weight, cf.Orientation[2] * weight]

    return cf
}*/

class BaseKeyframe {
    time: number
    easingDirection = EasingDirection.In
    easingStyle = PoseEasingStyle.Linear

    constructor(time: number) {
        this.time = time
    }
}

class PartKeyframe extends BaseKeyframe {
    cframe: CFrame

    constructor(time: number, cframe: CFrame) {
        super(time)
        this.cframe = cframe
    }
}

class FaceKeyframe extends BaseKeyframe {
    value: number
    
    constructor(time: number, value: number) {
        super(time)
        this.value = value
    }
}

class BaseKeyframeGroup {
    keyframes: BaseKeyframe[] = []

    getLowerKeyframe(time: number) {
        let resultKeyframe = null

        for (const keyframe of this.keyframes) {
            if (keyframe.time <= time) {
                resultKeyframe = keyframe
            } else {
                break
            }
        }

        return resultKeyframe
    }

    getHigherKeyframe(time: number) {
        for (const keyframe of this.keyframes) {
            if (keyframe.time > time) {
                return keyframe
            }
        }

        return null
    }
}

class PartKeyframeGroup extends BaseKeyframeGroup {
    motorParent = "LowerTorso"
    motorName = "Root"

    keyframes: PartKeyframe[] = []

    getHigherKeyframe(time: number): PartKeyframe | null {
        const keyframe = super.getHigherKeyframe(time)
        return keyframe ? keyframe as PartKeyframe : null
    }

    getLowerKeyframe(time: number): PartKeyframe | null {
        const keyframe = super.getLowerKeyframe(time)
        return keyframe ? keyframe as PartKeyframe : null
    }
}

class FaceKeyframeGroup extends BaseKeyframeGroup {
    controlName: string = "Corrugator"
    parentName: string = "Head"

    keyframes: FaceKeyframe[] = []

    getHigherKeyframe(time: number): FaceKeyframe | null {
        const keyframe = super.getHigherKeyframe(time)
        return keyframe ? keyframe as FaceKeyframe : null
    }

    getLowerKeyframe(time: number): FaceKeyframe | null {
        const keyframe = super.getLowerKeyframe(time)
        return keyframe ? keyframe as FaceKeyframe : null
    }
}

class FloatCurveKey {
    time: number = 0
    value: number = 0
    interpolation: number = KeyInterpolationMode.Cubic

    leftTangent?: number = undefined
    rightTangent?: number = undefined
}

class FloatCurve {
    keys: FloatCurveKey[] = []
    maxTime: number = 0

    fromBuffer(arrayBuffer: ArrayBuffer) {
        /*
        struct FloatCurve {
            uint32 unk0 (always 20 00 00 00)
            uint32 length (amount of keys)
            keys[length] {
                uint8 keyInterpolationMode (same as enum)
                uint8 hasLeftAndRightTangent (bit 0 (+1) = left tangent, bit 1 (+2) = right tangent)
                float value
                float leftTangent
                float rightTangent
            }
            uint32 unk1 (always 10 00 00 00)
            uint16 length (amount of keys)
            uint8 unk2 (maybe length is 24 bit, but thats a bit weird...)
            uint32 times[length] (num / 65536 / 9,375 = time as float!)
        }
        */

        const view = new SimpleView(arrayBuffer)
        view.readUint32()
        const length = view.readUint32()

        for (let i = 0; i < length; i++) {
            const key = new FloatCurveKey()

            key.interpolation = view.readUint8()

            let hasLeftAndRightTangent = view.readUint8()
            let hasRightTangent = false
            let hasLeftTangent = false
            if (hasLeftAndRightTangent - 2 >= 0) {
                hasRightTangent = true
                hasLeftAndRightTangent -= 2
            }
            if (hasLeftAndRightTangent - 1 >= 0) {
                hasLeftTangent = true
                hasLeftAndRightTangent -= 1
            }

            key.value = view.readFloat32()

            if (hasLeftTangent) {
                key.leftTangent = view.readFloat32()
            } else {
                view.readFloat32()
            }
            if (hasRightTangent) {
                key.rightTangent = view.readFloat32()
            } else {
                view.readFloat32()
            }

            this.keys.push(key)
        }

        view.readUint32()
        view.readUint16()
        view.readUint8()

        for (let i = 0; i < length; i++) {
            this.keys[i].time = view.readUint32() / 65536 / 9.375
            if (this.keys[i].time > this.maxTime) {
                this.maxTime = this.keys[i].time
            }
        }

        return this
    }

    getLowerKey(time: number) {
        let resultKey = null

        for (const key of this.keys) {
            if (key.time <= time) {
                if (resultKey && resultKey.time > key.time) {
                    continue
                }
                resultKey = key
            }
        }

        return resultKey
    }

    getHigherKey(time: number) {
        let resultKey = null

        for (const key of this.keys) {
            if (key.time > time) {
                if (resultKey && resultKey.time < key.time) {
                    continue
                }
                resultKey = key
            }
        }

        return resultKey
    }
}

type FloatCurve3 = [FloatCurve, FloatCurve, FloatCurve]

class PartCurve {
    motorParent = "LowerTorso"
    motorName = "Root"

    position?: FloatCurve3
    rotationOrder: number = RotationOrder.XYZ
    rotation?: FloatCurve3
}

class FaceCruve {
    controlName = "Corrugator"
    parentName = "Head"

    value?: FloatCurve
}

function getCurveValue(time: number, lowerKey: FloatCurveKey, higherKey: FloatCurveKey) {
    const lowerX = lowerKey
    const higherX = higherKey

    const keyframeTime = mapNum(time, lowerX.time, higherX.time, 0, 1)

    if (lowerX.interpolation === KeyInterpolationMode.Constant) {
        return lowerX.value
    } else if (lowerX.interpolation === KeyInterpolationMode.Linear) {
        return (higherX.value - lowerX.value) * keyframeTime + lowerX.value
    } else if (lowerX.interpolation === KeyInterpolationMode.Cubic) {
        const p0 = lowerX.value
        const p1 = higherX.value

        const m0 = lowerX.rightTangent || 0
        const m1 = higherX.leftTangent || 0

        const xk = lowerX.time
        const xk1 = higherX.time

        return p(mapNum(time, lowerX.time, higherX.time, 0, 1), p0, p1, m0, m1, xk, xk1)
    }

    throw new Error(`Invalid interpolation type: ${lowerX.interpolation}`)
}

class AnimationTrack {
    //data
    trackType: AnimationTrackType = "Sequence"
    keyframeGroups: (PartKeyframeGroup | FaceKeyframeGroup)[] = [] //one group per motor6D, only if trackType = "Sequence"
    curves: (PartCurve | FaceCruve)[] = [] //only if trackType = "Curve"
    
    //playing info
    isPlaying = false
    speed = 1
    timePosition = 0
    weight = 1
    finished = true

    //static info
    rig?: Instance = undefined
    length = 0
    looped = false
    priority = AnimationPriority.Core

    getNamedMotor(motorName: string, parentName: string): Instance | undefined {
        if (!this.rig) {
            return undefined
        }

        const parent = this.rig.FindFirstChild(parentName)
        if (parent) {
            return parent.FindFirstChild(motorName)
        }

        return undefined
    }

    findMotor6D(part0: Instance, part1: Instance): Instance | undefined {
        if (!this.rig) {
            return undefined
        }

        const descendants = this.rig.GetDescendants()

        for (const child of descendants) {
            if (child.className === "Motor6D") {
                if (child.Prop("Part0") === part0 && child.Prop("Part1") === part1) {
                    return child
                }
            }
        }

        return undefined
    }

    findPartKeyframeGroup(motorName: string, motorParentName: string) {
        for (const group of this.keyframeGroups) {
            if (group instanceof PartKeyframeGroup && group.motorParent === motorParentName && group.motorName === motorName) {
                return group
            }
        }

        return undefined
    }

    findFaceKeyframeGroup(controlName: string) {
        for (const group of this.keyframeGroups) {
            if (group instanceof FaceKeyframeGroup && group.controlName === controlName) {
                return group
            }
        }

        return undefined
    }

    addPartKeyframe(motorName: string, motorParentName: string, keyframe: PartKeyframe) {
        if (!keyframe) {
            return
        }

        let group = this.findPartKeyframeGroup(motorName, motorParentName)
        if (!group) {
            group = new PartKeyframeGroup()
            group.motorParent = motorParentName
            group.motorName = motorName
            this.keyframeGroups.push(group)
        }

        group.keyframes.push(keyframe)
    }

    createPartKeyframe(keyframe: Instance, pose: Instance): [string, string, PartKeyframe] | [undefined, undefined, undefined] {
        if (!pose.parent || !this.rig) {
            return [undefined, undefined, undefined]
        }

        const part0Name = pose.parent.Prop("Name") as string
        const part1Name = pose.Prop("Name") as string

        const part0 = this.rig.FindFirstChild(part0Name)
        const part1 = this.rig.FindFirstChild(part1Name)

        let partKeyframe = undefined

        let motorName = undefined
        let motorParentName = undefined

        if (part0 && part1) {
            const motor = this.findMotor6D(part0, part1)
            if (motor) {
                motorName = motor.Prop("Name") as string
                if (motor.parent) {
                    motorParentName = motor.parent.Prop("Name") as string
                }
            } else { //attempt saving by using predefined table
                motorName = PartToMotorName[part1.Prop("Name") as string]
                motorParentName = part1.Prop("Name") as string
            }

            if (!keyframe.HasProperty("Time")) {
                console.warn(`Invalid animation keyframe, missing property Time`, keyframe)
                return [undefined, undefined, undefined]
            }

            const time = keyframe.Prop("Time") as number
            const cf = pose.Prop("CFrame") as CFrame
            partKeyframe = new PartKeyframe(time, cf)
            if (pose.HasProperty("EasingDirection")) {
                partKeyframe.easingDirection = pose.Prop("EasingDirection") as number
            }
            if (pose.HasProperty("EasingStyle")) {
                partKeyframe.easingStyle = pose.Prop("EasingStyle") as number
            }
        } else {
            console.warn(`Missing either part0 or part1 with names: ${part0Name} ${part1Name}`)
            return [undefined, undefined, undefined]
        }

        if (!motorName || !motorParentName || !partKeyframe) {
            console.warn(`Missing either motor or partKeyFrame for parts: ${part0Name} ${part1Name}`)
            return [undefined, undefined, undefined]
        }

        return [motorName, motorParentName, partKeyframe]
    }

    addFaceKeyframe(controlName: string, parentName: string, keyframe: FaceKeyframe) {
        if (!keyframe) {
            return
        }

        let group = this.findFaceKeyframeGroup(controlName)
        if (!group) {
            group = new FaceKeyframeGroup()
            group.controlName = controlName
            group.parentName = parentName
            this.keyframeGroups.push(group)
        }

        group.keyframes.push(keyframe)
    }

    createFaceKeyframe(keyframe: Instance, pose: Instance): FaceKeyframe | undefined {
        if (!pose.HasProperty("Value") || !keyframe.HasProperty("Time")) return

        const time = keyframe.Prop("Time") as number
        const value = pose.Prop("Value") as number

        const faceKeyframe = new FaceKeyframe(time, value)
        if (pose.HasProperty("EasingDirection")) {
            faceKeyframe.easingDirection = pose.Prop("EasingDirection") as number
        }
        if (pose.HasProperty("EasingStyle")) {
            faceKeyframe.easingStyle = pose.Prop("EasingStyle") as number
        }

        return faceKeyframe
    }

    createPartCurve(motor: string, motorParent: string, child: Instance) {
        const partCurve = new PartCurve()
        partCurve.motorName = motor
        partCurve.motorParent = motorParent
        
        const positionCurve = child.FindFirstChild("Position")
        const rotationCurve = child.FindFirstChild("Rotation")

        if (positionCurve) {
            const positionCurveX = positionCurve.FindFirstChild("X")
            const positionCurveY = positionCurve.FindFirstChild("Y")
            const positionCurveZ = positionCurve.FindFirstChild("Z")

            if (positionCurveX && positionCurveX.HasProperty("ValuesAndTimes") &&
                positionCurveY && positionCurveY.HasProperty("ValuesAndTimes") &&
                positionCurveZ && positionCurveZ.HasProperty("ValuesAndTimes")
            ) {
                const floatCurveBufferX = positionCurveX.Prop("ValuesAndTimes") as ArrayBuffer
                const floatCurveBufferY = positionCurveY.Prop("ValuesAndTimes") as ArrayBuffer
                const floatCurveBufferZ = positionCurveZ.Prop("ValuesAndTimes") as ArrayBuffer

                const floatCurveX = new FloatCurve().fromBuffer(floatCurveBufferX)
                const floatCurveY = new FloatCurve().fromBuffer(floatCurveBufferY)
                const floatCurveZ = new FloatCurve().fromBuffer(floatCurveBufferZ)

                this.length = Math.max(this.length, floatCurveX.maxTime, floatCurveY.maxTime, floatCurveZ.maxTime)

                partCurve.position = [floatCurveX, floatCurveY, floatCurveZ]
            }
        }

        if (rotationCurve) {
            const rotationCurveX = rotationCurve.FindFirstChild("X")
            const rotationCurveY = rotationCurve.FindFirstChild("Y")
            const rotationCurveZ = rotationCurve.FindFirstChild("Z")

            if (rotationCurveX && rotationCurveX.HasProperty("ValuesAndTimes") &&
                rotationCurveY && rotationCurveY.HasProperty("ValuesAndTimes") &&
                rotationCurveZ && rotationCurveZ.HasProperty("ValuesAndTimes")
            ) {
                const floatCurveBufferX = rotationCurveX.Prop("ValuesAndTimes") as ArrayBuffer
                const floatCurveBufferY = rotationCurveY.Prop("ValuesAndTimes") as ArrayBuffer
                const floatCurveBufferZ = rotationCurveZ.Prop("ValuesAndTimes") as ArrayBuffer

                const floatCurveX = new FloatCurve().fromBuffer(floatCurveBufferX)
                const floatCurveY = new FloatCurve().fromBuffer(floatCurveBufferY)
                const floatCurveZ = new FloatCurve().fromBuffer(floatCurveBufferZ)

                this.length = Math.max(this.length, floatCurveX.maxTime, floatCurveY.maxTime, floatCurveZ.maxTime)

                partCurve.rotation = [floatCurveX, floatCurveY, floatCurveZ]
            }
        }

        return partCurve
    }

    createFaceCurve(controlName: string, parentName: string, control: Instance) {
        const faceCurve = new FaceCruve()
        faceCurve.controlName = controlName
        faceCurve.parentName = parentName

        const floatCurveBuffer = control.Prop("ValuesAndTimes") as ArrayBuffer
        faceCurve.value = new FloatCurve().fromBuffer(floatCurveBuffer)

        return faceCurve
    }

    addKeyframe(keyframe: Instance) {
        //traverse keyframe tree
        let children = keyframe.GetChildren()

        while (children.length > 0) {
            const validChildren = []

            for (const child of children) {
                if (child.className === "Pose" || child.className === "NumberPose") { //its a valid keyframe
                    validChildren.push(child)

                    if (child.Prop("Weight") as number >= 0.999) {//if this is actually a keyframe that affects the current part
                        if (child.className === "Pose") {
                            const [motorName, motorParentName, partKeyframe] = this.createPartKeyframe(keyframe, child)
                            if (motorName && motorParentName && partKeyframe) {
                                this.addPartKeyframe(motorName, motorParentName, partKeyframe)
                            }
                        } else {
                            const faceKeyframe = this.createFaceKeyframe(keyframe, child)
                            if (faceKeyframe && child.parent && child.parent.parent) {
                                this.addFaceKeyframe(child.Prop("Name") as string, child.parent.parent.Prop("Name") as string, faceKeyframe)
                            } else {
                                console.warn(`Missing something required to add FaceKeyframe:`, faceKeyframe, child.parent, child.parent?.parent)
                            }
                        }
                    }
                } else if (child.className === "Folder" && child.Prop("Name") === "FaceControls") {
                    validChildren.push(child)
                } else {
                    console.warn(`Unknown animation child with className: ${child.className}`, child)
                }
            }

            //update list of children
            let newChildren: Instance[] = []
            for (const child of validChildren) {
                newChildren = newChildren.concat(child.GetChildren())
            }
            children = newChildren
        }
    }

    loadAnimation(rig: Instance, animation: Instance) {
        if (animation.className === "KeyframeSequence") {
            //set animation details
            this.trackType = "Sequence"
            this.looped = animation.Prop("Loop") as boolean
            this.priority = animation.Prop("Priority") as number
            this.length = 0
            this.rig = rig

            //sort keyframes based on time
            const keyframeInstances: Instance[] = []

            const animationChildren = animation.GetChildren()
            for (const child of animationChildren) {
                if (child.className === "Keyframe") {
                    if (child.GetChildren().length > 0) {
                        if (!child.HasProperty("Time")) {
                            console.warn("Invalid animation, keyframe is missing property Time", child)
                            return this
                        }
                        this.length = Math.max(this.length, child.Prop("Time") as number)
                        keyframeInstances.push(child)
                    }
                }
            }

            keyframeInstances.sort((a, b) => {
                return a.Prop("Time") as number - (b.Prop("Time") as number)
            })

            //add keyframes
            for (const child of keyframeInstances) {
                this.addKeyframe(child)
            }
        } else if (animation.className === "CurveAnimation") {
            //set animation details
            this.trackType = "Curve"
            this.looped = animation.Prop("Loop") as boolean
            this.priority = animation.Prop("Priority") as number
            this.length = 0
            this.rig = rig

            for (const child of animation.GetDescendants()) {
                if (child.className === "Folder") {
                    if (child.Prop("Name") === "FaceControls") {
                        if (child.parent) {
                            for (const control of child.GetChildren()) {
                                this.curves.push(this.createFaceCurve(control.Prop("Name") as string, child.parent.Prop("Name") as string, control))
                            }
                        }
                    } else {
                        const motorParent = child.Prop("Name") as string
                        const motor = PartToMotorName[motorParent]
                        if (motor) {
                            const partCurve = this.createPartCurve(motor, motorParent, child)

                            this.curves.push(partCurve)
                        }
                    }
                }
            }
        } else {
            throw new Error(`Unknown animation className: ${animation.className}`)
        }

        return this
    }

    resetMotorTransforms() {
        if (!this.rig) {
            return
        }

        const descendants = this.rig.GetDescendants()

        for (const child of descendants) {
            if (child.className === "Motor6D") {
                child.setProperty("Transform", new CFrame(0,0,0))
            } else if (child.className === "FaceControls") {
                const propertyNames = child.getPropertyNames()
                for (const propertyName of propertyNames) {
                    if (FaceControlNames.includes(propertyName)) {
                        child.setProperty(propertyName, 0)
                    }
                }
            }
        }
    }

    renderPose() {
        //console.log("-- rendering pose")
        const time = this.timePosition

        if (this.trackType === "Sequence") {
            for (const group of this.keyframeGroups) {
                if (group instanceof PartKeyframeGroup) {
                    const motor = this.getNamedMotor(group.motorName, group.motorParent)
                    if (motor) {
                        //console.log(group.motorParent, "updating")

                        const lowerKeyframe = group.getLowerKeyframe(time)
                        const higherKeyframe = group.getHigherKeyframe(time)

                        if (lowerKeyframe && higherKeyframe) {
                            const higherTime = higherKeyframe.time - lowerKeyframe.time
                            const fromLowerTime = time - lowerKeyframe.time
                            const keyframeTime = fromLowerTime / higherTime

                            const easedTime = getEasingFunction(lowerKeyframe.easingDirection, lowerKeyframe.easingStyle)(keyframeTime)

                            const oldTransformCF = (motor.Prop("Transform") as CFrame).clone()
                            const transformCF = lerpCFrame(oldTransformCF, lerpCFrame(lowerKeyframe.cframe, higherKeyframe.cframe, easedTime).inverse(), this.weight)
                            motor.setProperty("Transform", transformCF)
                        } else if (lowerKeyframe) {
                            const oldTransformCF = (motor.Prop("Transform") as CFrame).clone()
                            const transformCF = lerpCFrame(oldTransformCF, (lowerKeyframe.cframe).inverse(), this.weight)
                            motor.setProperty("Transform", transformCF)
                        }
                    }
                } else if (group instanceof FaceKeyframeGroup && this.rig) {
                    const part = this.rig.FindFirstChild(group.parentName)
                    if (part) {
                        const faceControls = part.FindFirstChildOfClass("FaceControls")
                        if (faceControls) {
                            new FaceControlsWrapper(faceControls)

                            const lowerKeyframe = group.getLowerKeyframe(time)
                            const higherKeyframe = group.getHigherKeyframe(time)

                            if (lowerKeyframe && higherKeyframe) {
                                const higherTime = higherKeyframe.time - lowerKeyframe.time
                                const fromLowerTime = time - lowerKeyframe.time
                                const keyframeTime = fromLowerTime / higherTime

                                const easedTime = getEasingFunction(lowerKeyframe.easingDirection, lowerKeyframe.easingStyle)(keyframeTime)

                                const oldValue = faceControls.Prop(group.controlName) as number
                                const value = lerp(oldValue, lerp(lowerKeyframe.value, higherKeyframe.value, easedTime), this.weight)
                                
                                faceControls.setProperty(group.controlName, value)
                            } else if (lowerKeyframe) {
                                const oldValue = faceControls.Prop(group.controlName) as number
                                const value = lerp(oldValue, (lowerKeyframe.value), this.weight)
                                
                                faceControls.setProperty(group.controlName, value)
                            }
                        }
                    }
                }
            }
        } else if (this.trackType === "Curve") {
            for (const curve of this.curves) {
                if (curve instanceof PartCurve) {
                    const motor = this.getNamedMotor(curve.motorName, curve.motorParent)
                    if (motor) {
                        const cf = new CFrame()

                        if (curve.position) {
                            const lowerX = curve.position[0].getLowerKey(time)
                            const higherX = curve.position[0].getHigherKey(time)
                            if (lowerX) cf.Position[0] = lowerX.value
                            if (lowerX && higherX) cf.Position[0] = getCurveValue(time, lowerX, higherX)

                            const lowerY = curve.position[1].getLowerKey(time)
                            const higherY = curve.position[1].getHigherKey(time)
                            if (lowerY) cf.Position[1] = lowerY.value
                            if (lowerY && higherY) cf.Position[1] = getCurveValue(time, lowerY, higherY)

                            const lowerZ = curve.position[2].getLowerKey(time)
                            const higherZ = curve.position[2].getHigherKey(time)
                            if (lowerZ) cf.Position[2] = lowerZ.value
                            if (lowerZ && higherZ) cf.Position[2] = getCurveValue(time, lowerZ, higherZ)
                        }

                        if (curve.rotation) {
                            const euler = new THREE.Euler(0,0,0, RotationOrderToRotationOrderName[curve.rotationOrder])

                            const lowerX = curve.rotation[0].getLowerKey(time)
                            const higherX = curve.rotation[0].getHigherKey(time)
                            if (lowerX) euler.x = lowerX.value
                            if (lowerX && higherX) euler.x = getCurveValue(time, lowerX, higherX)

                            const lowerY = curve.rotation[1].getLowerKey(time)
                            const higherY = curve.rotation[1].getHigherKey(time)
                            if (lowerY) euler.y = lowerY.value
                            if (lowerY && higherY) euler.y = getCurveValue(time, lowerY, higherY)

                            const lowerZ = curve.rotation[2].getLowerKey(time)
                            const higherZ = curve.rotation[2].getHigherKey(time)
                            if (lowerZ) euler.z = lowerZ.value
                            if (lowerZ && higherZ) euler.z = getCurveValue(time, lowerZ, higherZ)

                            const newEuler = euler.reorder("YXZ")
                            cf.Orientation = [deg(newEuler.x), deg(newEuler.y), deg(newEuler.z)]
                        }

                        const oldTransformCF = (motor.Prop("Transform") as CFrame).clone()
                        const transformCF = lerpCFrame(oldTransformCF, (cf).inverse(), this.weight)
                        motor.setProperty("Transform", transformCF)
                    }
                } else if (curve instanceof FaceCruve && this.rig && curve.value) {
                    const part = this.rig.FindFirstChild(curve.parentName)
                    if (part) {
                        const faceControls = part.FindFirstChildOfClass("FaceControls")

                        if (faceControls) {
                            new FaceControlsWrapper(faceControls)

                            let value = 0

                            const lowerValue = curve.value.getLowerKey(time)
                            const higherValue = curve.value.getHigherKey(time)
                            if (lowerValue) value = lowerValue.value
                            if (lowerValue && higherValue) value = getCurveValue(time, lowerValue, higherValue)

                            const oldValue = faceControls.Prop(curve.controlName) as number
                            const newValue = lerp(oldValue, (value), this.weight)
                            faceControls.setProperty(curve.controlName, newValue)
                        }
                    }
                }
            }
        }
    }

    setTime(time: number) {
        if (this.looped) {
            time = time % this.length
        }

        if (isNaN(time)) {
            time = 0
        }

        this.timePosition = time
        this.finished = time >= this.length

        this.renderPose()
    }
}

export { AnimationTrack }
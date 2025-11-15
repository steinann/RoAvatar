import * as THREE from 'three';
import { CFrame, Instance } from '../rblx/rbx';
import { deg, lerp, rad } from '../misc/misc';
import type { Vec3 } from '../rblx/mesh';

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

class PartKeyframe {
    time: number
    cframe: CFrame
    easingDirection = EasingDirection.In
    easingStyle = PoseEasingStyle.Linear

    constructor(time: number, cframe: CFrame) {
        this.time = time
        this.cframe = cframe
    }
}

class PartKeyframeGroup {
    motorParent = "LowerTorso"
    motorName = "Root"

    keyframes: PartKeyframe[] = []

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

class AnimationTrack {
    //data
    keyframeGroups: PartKeyframeGroup[] = [] //one group per motor6D
    
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

    findKeyframeGroup(motorName: string, motorParentName: string) {
        for (const group of this.keyframeGroups) {
            if (group.motorParent === motorParentName && group.motorName === motorName) {
                return group
            }
        }

        return undefined
    }

    addPartKeyframe(motorName: string, motorParentName: string, keyframe: PartKeyframe) {
        if (!keyframe) {
            return
        }

        let group = this.findKeyframeGroup(motorName, motorParentName)
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

    addKeyframe(keyframe: Instance) {
        //traverse keyframe tree
        let children = keyframe.GetChildren()

        while (children.length > 0) {
            const validChildren = []

            for (const child of children) {
                if (child.className === "Pose") { //its a valid keyframe
                    validChildren.push(child)

                    if (child.Prop("Weight") as number >= 0.999) {//if this is actually a keyframe that affects the current part
                        const [motorName, motorParentName, partKeyframe] = this.createPartKeyframe(keyframe, child)
                        if (motorName && motorParentName && partKeyframe) {
                            this.addPartKeyframe(motorName, motorParentName, partKeyframe)
                        }
                    }
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
        if (animation.className !== "KeyframeSequence") {
            throw new Error("Animation is not a KeyframeSequence")
        }

        //set animation details
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

        return this
    }

    resetMotorTransforms() {
        if (!this.rig) {
            return
        }

        const descendants = this.rig.GetDescendants()

        for (const motor of descendants) {
            if (motor.className === "Motor6D") {
                motor.setProperty("Transform", new CFrame(0,0,0))
            }
        }
    }

    renderPose() {
        //console.log("-- rendering pose")
        const time = this.timePosition

        for (const group of this.keyframeGroups) {
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
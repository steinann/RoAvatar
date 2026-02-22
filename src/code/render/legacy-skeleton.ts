import * as THREE from 'three';
import { deg, rad, rotationMatrixToEulerAngles } from "../misc/misc"
import { CFrame, Connection, Instance, Vector3 } from "../rblx/rbx"
import { calculateMotor6Doffset } from "../rblx/scale"
import { removeInstance } from './renderer';
import { AbbreviationToFaceControlProperty, FaceBoneNames } from '../rblx/constant';
import FaceControlsWrapper from '../rblx/instance/FaceControls';
import type { FileMesh } from '../mesh/mesh';
import { SHOW_SKELETON_HELPER } from '../misc/flags';

export const BoneNameToIndex: {[K in string]: number} = {
    "Root": 0,
    "HumanoidRootNode": 1,
    "LowerTorso": 2,
    "UpperTorso": 3,
    "RightUpperArm": 4,
    "RightLowerArm": 5,
    "RightHand": 6,
    "LeftUpperArm": 7,
    "LeftLowerArm": 8,
    "LeftHand": 9,
    "RightUpperLeg": 10,
    "RightLowerLeg": 11,
    "RightFoot": 12,
    "LeftUpperLeg": 13,
    "LeftLowerLeg": 14,
    "LeftFoot": 15,
    "Head": 16,
    "DynamicHead": 17,
}

const HumanoidToFACSMesh = new Map<Instance, FileMesh>()

let i = 18
for (const faceBoneName of FaceBoneNames) {
    BoneNameToIndex[faceBoneName] = i;
    i += 1
}

function setBoneToCFrame(bone: THREE.Bone, cf: CFrame) {
    bone.position.set(cf.Position[0], cf.Position[1], cf.Position[2])
    bone.rotation.order = "YXZ"
    bone.rotation.x = rad(cf.Orientation[0])
    bone.rotation.y = rad(cf.Orientation[1])
    bone.rotation.z = rad(cf.Orientation[2])
}

function getCFrameForBone(humanoid: Instance, name: string, includeTransform: boolean = false): CFrame {
    if (name === "DynamicHead") {
        return new CFrame()
    }

    const rig = humanoid.parent
    if (rig) {
        const head = rig.FindFirstChild("Head")
        const facsMesh = HumanoidToFACSMesh.get(humanoid)

        const child = rig.FindFirstChild(name)
        if (child && (child.className === "MeshPart" || child.className === "Part")) {
            const motor = child.FindFirstChildOfClass("Motor6D")
            if (motor) {
                return calculateMotor6Doffset(motor, includeTransform)
            } else {
                //return new CFrame()
                return child.Prop("CFrame") as CFrame
            }
        }

        if (!child && FaceBoneNames.includes(name)) {
            if (head && facsMesh) {
                const facs = facsMesh.facs
                let faceControls = head.FindFirstChildOfClass("FaceControls")
                if (!faceControls) {
                    faceControls = new Instance("FaceControls")
                    faceControls.setParent(head)
                }
                
                if (faceControls && facs && facs.quantizedTransforms) {
                    new FaceControlsWrapper(faceControls)

                    for (let j = 0; j < facs.faceBoneNames.length; j++) {
                        const boneName = facs.faceBoneNames[j]

                        if (boneName === name) {
                            const jointCF = new CFrame()
                            for (let k = 0; k < facsMesh.skinning.bones.length; k++) {
                                const meshBone = facsMesh.skinning.bones[k]
                                if (facsMesh.skinning.nameTable[k] === boneName) {
                                    const m = meshBone.rotationMatrix
                                    jointCF.Orientation = rotationMatrixToEulerAngles([
                                        m[0],m[1],m[2],
                                        m[3],m[4],m[5],
                                        m[6],m[7],m[8]
                                    ])
                                    jointCF.Position = [...meshBone.position]
                                }
                            }

                            if (includeTransform) {
                                let totalPosition = new Vector3()
                                let totalRotation = new Vector3()

                                for (let i = 0; i < facs.faceControlNames.length; i++) {
                                    const faceControlName = facs.faceControlNames[i]

                                    const col = i
                                    const row = j
                                    //const rows = facs.faceBoneNames.length
                                    const cols = facs.faceControlNames.length

                                    const index = row * cols + col

                                    //const index = i * facs.faceBoneNames.length + j

                                    const posX = facs.quantizedTransforms.px.matrix[index]
                                    const posY = facs.quantizedTransforms.py.matrix[index]
                                    const posZ = facs.quantizedTransforms.pz.matrix[index]

                                    const rotX = facs.quantizedTransforms.rx.matrix[index]
                                    const rotY = facs.quantizedTransforms.ry.matrix[index]
                                    const rotZ = facs.quantizedTransforms.rz.matrix[index]

                                    const pos = new Vector3(posX, posY, posZ)
                                    const rot = new Vector3(rotX, rotY, rotZ)

                                    let weight = 0

                                    if (faceControlName.includes(" ")) { //if it is a corrective pose
                                        weight = 1
                                        for (const faceControlSubname of faceControlName.split(" ")) {
                                            const propertyName = AbbreviationToFaceControlProperty[faceControlSubname]
                                            weight *= faceControls.Prop(propertyName) as number
                                        }
                                    } else {
                                        const propertyName = AbbreviationToFaceControlProperty[faceControlName]
                                        if (propertyName === undefined) {
                                            console.log(faceControlName)
                                        }
                                        weight = faceControls.Prop(propertyName) as number
                                    }

                                    totalPosition = totalPosition.add(pos.multiply(new Vector3(weight,weight,weight)))
                                    totalRotation = totalRotation.add(rot.multiply(new Vector3(weight,weight,weight)))
                                }

                                const resultCF = new CFrame()

                                const euler = new THREE.Euler(rad(totalRotation.X), rad(totalRotation.Y), rad(totalRotation.Z), "XYZ")
                                euler.reorder("YXZ")

                                resultCF.Orientation = [deg(euler.x), deg(euler.y), deg(euler.z)]
                                resultCF.Position = totalPosition.toVec3()

                                return jointCF.multiply(resultCF)
                            }

                            return jointCF
                        }
                    }
                }
            }
        }
    }

    return new CFrame()
}


/*export function getBoneMatrix(humanoid: Instance, name: string) {
    const rig = humanoid.parent
    if (rig) {
        const child = rig.FindFirstChild(name)
        if (child && (child.className === "MeshPart" || child.className === "Part")) {
            //const motor = child.FindFirstChildOfClass("Motor6D")
            //if (motor) {
            //    return new THREE.Matrix4().fromArray(calculateMotor6Doffset(motor, false).getMatrix()).invert()
            //} else {
            //    return new THREE.Matrix4().fromArray(new CFrame().getMatrix()).invert()
            //    //return child.Prop("CFrame") as CFrame
            //}
           return new THREE.Matrix4().fromArray(traverseRigCFrame(child).getMatrix())
        }
    }

    return new THREE.Matrix4().fromArray(new CFrame().getMatrix()).invert()
}*/

export function updateSkeletonFromHumanoid(instance: Instance, skeleton: THREE.Skeleton) {
    const boneNames = ["LowerTorso", "UpperTorso", "RightUpperArm", "RightLowerArm", "RightHand", "LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperLeg", "RightLowerLeg", "RightFoot", "LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "Head", "DynamicHead", ...FaceBoneNames]
    
    //update rest position
    const bone = skeleton.getBoneByName("HumanoidRootNode")
    if (bone) {
        setBoneToCFrame(bone, getCFrameForBone(instance, "HumanoidRootPart", false))
        bone.updateMatrixWorld()
        const boneIndex = skeleton.bones.indexOf(bone);
        skeleton.boneInverses[ boneIndex ].copy(bone.matrixWorld).invert();
    }

    for (const boneName of boneNames) {
        const bone = skeleton.getBoneByName(boneName)
        if (bone) {
            setBoneToCFrame(bone, getCFrameForBone(instance, boneName, false))
            bone.updateMatrixWorld()
            const boneIndex = skeleton.bones.indexOf(bone);
            skeleton.boneInverses[ boneIndex ].copy(bone.matrixWorld).invert();
        }
    }

    skeleton.pose();

    //update position
    for (const boneName of boneNames) {
        const bone = skeleton.getBoneByName(boneName)
        if (bone) {
            setBoneToCFrame(bone, getCFrameForBone(instance, boneName, true))
            bone.updateMatrixWorld()
        }
    }
}

export function setFACSMeshForHumanoid(humanoid: Instance, mesh: FileMesh) {
    HumanoidToFACSMesh.set(humanoid, mesh)
}

export function getSkeletonFromHumanoid(instance: Instance, skeletons: Map<Instance,THREE.Skeleton>, scene: THREE.Scene, destroyConnections: Map<Instance,Connection>): THREE.Skeleton {
    if (!destroyConnections.get(instance)) {
        destroyConnections.set(instance, instance.Destroying.Connect(() => {
            removeInstance(instance)
            const connection = destroyConnections.get(instance)
            connection?.Disconnect()
            destroyConnections.delete(instance)
        }))
    }

    let skeleton = skeletons.get(instance)

    if (!skeleton) {
        //root
        const RootBone = new THREE.Bone()
        RootBone.name = "Root"
        RootBone.position.set(0,0,0)

        const HumanoidRootNodeBone = new THREE.Bone()
        HumanoidRootNodeBone.name = "HumanoidRootNode"
        setBoneToCFrame(HumanoidRootNodeBone, getCFrameForBone(instance, "HumanoidRootPart"))
        RootBone.add(HumanoidRootNodeBone)

        //torso
        const LowerTorsoBone = new THREE.Bone()
        LowerTorsoBone.name = "LowerTorso"
        setBoneToCFrame(LowerTorsoBone, getCFrameForBone(instance, "LowerTorso"))
        HumanoidRootNodeBone.add(LowerTorsoBone)

        const UpperTorsoBone = new THREE.Bone()
        UpperTorsoBone.name = "UpperTorso"
        setBoneToCFrame(UpperTorsoBone, getCFrameForBone(instance, "UpperTorso"))
        LowerTorsoBone.add(UpperTorsoBone)

        //head
        const HeadBone = new THREE.Bone()
        HeadBone.name = "Head"
        setBoneToCFrame(HeadBone, getCFrameForBone(instance, "Head"))
        UpperTorsoBone.add(HeadBone)
        
        const DynamicHeadBone = new THREE.Bone()
        DynamicHeadBone.name = "DynamicHead"
        setBoneToCFrame(DynamicHeadBone, getCFrameForBone(instance, "DynamicHead"))
        HeadBone.add(DynamicHeadBone)

        //right arm
        const RightUpperArmBone = new THREE.Bone()
        RightUpperArmBone.name = "RightUpperArm"
        setBoneToCFrame(RightUpperArmBone, getCFrameForBone(instance, "RightUpperArm"))
        UpperTorsoBone.add(RightUpperArmBone)

        const RightLowerArmBone = new THREE.Bone()
        RightLowerArmBone.name = "RightLowerArm"
        setBoneToCFrame(RightLowerArmBone, getCFrameForBone(instance, "RightLowerArm"))
        RightUpperArmBone.add(RightLowerArmBone)

        const RightHandBone = new THREE.Bone()
        RightHandBone.name = "RightHand"
        setBoneToCFrame(RightHandBone, getCFrameForBone(instance, "RightHand"))
        RightLowerArmBone.add(RightHandBone)

        //left arm
        const LeftUpperArmBone = new THREE.Bone()
        LeftUpperArmBone.name = "LeftUpperArm"
        setBoneToCFrame(LeftUpperArmBone, getCFrameForBone(instance, "LeftUpperArm"))
        UpperTorsoBone.add(LeftUpperArmBone)

        const LeftLowerArmBone = new THREE.Bone()
        LeftLowerArmBone.name = "LeftLowerArm"
        setBoneToCFrame(LeftLowerArmBone, getCFrameForBone(instance, "LeftLowerArm"))
        LeftUpperArmBone.add(LeftLowerArmBone)

        const LeftHandBone = new THREE.Bone()
        LeftHandBone.name = "LeftHand"
        setBoneToCFrame(LeftHandBone, getCFrameForBone(instance, "LeftHand"))
        LeftLowerArmBone.add(LeftHandBone)

        //right leg
        const RightUpperLegBone = new THREE.Bone()
        RightUpperLegBone.name = "RightUpperLeg"
        setBoneToCFrame(RightUpperLegBone, getCFrameForBone(instance, "RightUpperLeg"))
        LowerTorsoBone.add(RightUpperLegBone)

        const RightLowerLegBone = new THREE.Bone()
        RightLowerLegBone.name = "RightLowerLeg"
        setBoneToCFrame(RightLowerLegBone, getCFrameForBone(instance, "RightLowerLeg"))
        RightUpperLegBone.add(RightLowerLegBone)

        const RightFootBone = new THREE.Bone()
        RightFootBone.name = "RightFoot"
        setBoneToCFrame(RightFootBone, getCFrameForBone(instance, "RightFoot"))
        RightLowerLegBone.add(RightFootBone)

        //left leg
        const LeftUpperLegBone = new THREE.Bone()
        LeftUpperLegBone.name = "LeftUpperLeg"
        setBoneToCFrame(LeftUpperLegBone, getCFrameForBone(instance, "LeftUpperLeg"))
        LowerTorsoBone.add(LeftUpperLegBone)

        const LeftLowerLegBone = new THREE.Bone()
        LeftLowerLegBone.name = "LeftLowerLeg"
        setBoneToCFrame(LeftLowerLegBone, getCFrameForBone(instance, "LeftLowerLeg"))
        LeftUpperLegBone.add(LeftLowerLegBone)

        const LeftFootBone = new THREE.Bone()
        LeftFootBone.name = "LeftFoot"
        setBoneToCFrame(LeftFootBone, getCFrameForBone(instance, "LeftFoot"))
        LeftLowerLegBone.add(LeftFootBone)

        //face bones
        const faceBones: THREE.Bone[] = []
        for (const faceBoneName of FaceBoneNames) {
            const bone = new THREE.Bone()
            bone.name = faceBoneName
            setBoneToCFrame(bone, getCFrameForBone(instance, faceBoneName))
            DynamicHeadBone.add(bone)
            faceBones.push(bone)
        }

        skeleton = new THREE.Skeleton([RootBone, HumanoidRootNodeBone, LowerTorsoBone, UpperTorsoBone, RightUpperArmBone, RightLowerArmBone, RightHandBone, LeftUpperArmBone, LeftLowerArmBone, LeftHandBone, RightUpperLegBone, RightLowerLegBone, RightFootBone, LeftUpperLegBone, LeftLowerLegBone, LeftFootBone, HeadBone, DynamicHeadBone, ...faceBones])
        //[getBoneMatrix(instance, "Root"), getBoneMatrix(instance, "HumanoidRootPart"), getBoneMatrix(instance, "LowerTorso"), getBoneMatrix(instance, "UpperTorso"), getBoneMatrix(instance, "RightUpperArm"), getBoneMatrix(instance, "RightLowerArm"), getBoneMatrix(instance, "RightHand"), getBoneMatrix(instance, "LeftUpperArm"), getBoneMatrix(instance, "LeftLowerArm"), getBoneMatrix(instance, "LeftHand"), getBoneMatrix(instance, "RightUpperLeg"), getBoneMatrix(instance, "RightLowerLeg"), getBoneMatrix(instance, "RightFoot"), getBoneMatrix(instance, "LeftUpperLeg"), getBoneMatrix(instance, "LeftLowerLeg"), getBoneMatrix(instance, "LeftFoot")]
        console.log(skeleton)
        if (SHOW_SKELETON_HELPER) {
            const skeletonHelper = new THREE.SkeletonHelper(RootBone)
            scene.add(skeletonHelper)
        }
        scene.add(RootBone)
        skeletons.set(instance, skeleton)
    } else {
        updateSkeletonFromHumanoid(instance, skeleton)
    }

    return skeleton
}
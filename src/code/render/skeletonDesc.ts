import * as THREE from 'three';
import type { MeshDesc } from "./meshDesc";
import { CFrame, Instance } from '../rblx/rbx';
import { rad } from '../misc/misc';
import { calculateMotor6Doffset } from '../rblx/scale';
import { SHOW_SKELETON_HELPER, USE_LEGACY_SKELETON } from '../misc/flags';

//TODO: Update FACS bones based on head CFrame and Size, which shouldnt be that hard because the Head contains OriginalSize, just multiply original bones with the difference
//TODO: Make it so Root bone is the part CFrame
//TODO: FACS
//right now behavior is just as good as legacy-skeleton BUT without FACS

function setBoneToCFrame(bone: THREE.Bone, cf: CFrame) {
    bone.position.set(...cf.Position)
    bone.rotation.set(rad(cf.Orientation[0]), rad(cf.Orientation[1]), rad(cf.Orientation[2]), "YXZ")
}

//IMPORTANT: this gets the CENTER of the target part, instead of the joint connection it and the parent
function getOffsetForInstance(child: Instance, includeTransform: boolean) {
    if (child && (child.className === "MeshPart" || child.className === "Part")) {
        const motor = child.FindFirstChildOfClass("Motor6D")
        if (motor) {
            return calculateMotor6Doffset(motor, includeTransform)
        } else {
            //return new CFrame()
            return child.Prop("CFrame") as CFrame
        }
    }

    return child.Prop("CFrame") as CFrame
}

function getJointForInstances(parent: Instance, child: Instance, includeTransform: boolean) {
    const childMotor = child.FindFirstChildOfClass("Motor6D")
    const parentMotor = parent.FindFirstChildOfClass("Motor6D")

    let transform = new CFrame()

    if (childMotor && parentMotor) {
        if (includeTransform) {
            transform = childMotor.Prop("Transform") as CFrame
        }

        const initalCF = (parentMotor.Prop("C1") as CFrame).inverse()
        const jointCF = initalCF.multiply(childMotor.Prop("C0") as CFrame).multiply(transform.inverse())
        return jointCF
    }
    return new CFrame()
}

//is tied to a compiled meshDesc
export class SkeletonDesc {
    meshDesc: MeshDesc
    skeleton: THREE.Skeleton
    rootBone: THREE.Bone
    skeletonHelper?: THREE.SkeletonHelper

    constructor(meshDesc: MeshDesc, scene: THREE.Scene) {
        if (USE_LEGACY_SKELETON) {
            throw new Error("SkeletonDesc cannot be created while USE_LEGACY_SKELETON is true")
        }

        this.meshDesc = meshDesc

        const mesh = this.meshDesc.fileMesh
        if (!mesh) {
            throw new Error("MeshDesc is not compiled")
        }
        const skinning = mesh.skinning
        
        //create bones
        const boneArr: THREE.Bone[] = []
        for (let i = 0; i < skinning.bones.length; i++) {
            const threeBone = new THREE.Bone()
            threeBone.name = skinning.nameTable[i]
            boneArr.push(threeBone)
        }

        //hierarchy
        let rootBone: THREE.Bone | undefined = undefined
        for (let i = 0; i < skinning.bones.length; i++) {
            const bone = skinning.bones[i]
            const threeBone = boneArr[i]

            if (bone.parentIndex < skinning.bones.length) {
                const parentBone = skinning.bones[bone.parentIndex]
                const parentThreeBone = boneArr[bone.parentIndex]

                const worldParentBoneCF = new CFrame(...parentBone.position)
                worldParentBoneCF.fromRotationMatrix(...parentBone.rotationMatrix)

                const worldBoneCF = new CFrame(...bone.position)
                worldBoneCF.fromRotationMatrix(...bone.rotationMatrix)

                const boneCF = worldBoneCF.multiply(worldParentBoneCF.inverse())
                setBoneToCFrame(threeBone, boneCF)

                parentThreeBone.add(threeBone)
            } else {
                rootBone = threeBone
                threeBone.position.set(0,0,0)
                threeBone.rotation.set(0,0,0, "YXZ")
            }
        }

        if (!rootBone) {
            throw new Error("FileMesh has no root bone")
        } else {
            this.rootBone = rootBone
        }

        this.skeleton = new THREE.Skeleton(boneArr)

        this.setAsRest()

        if (SHOW_SKELETON_HELPER) {
            const skeletonHelper = new THREE.SkeletonHelper(this.rootBone)
            scene.add(skeletonHelper)
            this.skeletonHelper = skeletonHelper
        }

        scene.add(this.rootBone)
    }

    setAsRest() {
        //update rest position
        for (const bone of this.skeleton.bones) {
            const boneIndex = this.skeleton.bones.indexOf(bone);
            this.skeleton.boneInverses[ boneIndex ].copy(bone.matrixWorld).invert();
        }
    }

    getPartEquivalent(selfInstance: Instance, name: string) {
        if (!selfInstance.parent) return

        let partEquivalent = selfInstance.parent.FindFirstChild(name)
        if (partEquivalent === undefined && selfInstance.parent.parent) {
            partEquivalent = selfInstance.parent.parent.FindFirstChild(name)
        }

        return partEquivalent
    }

    resetRestPos(selfInstance: Instance) {
        if (!selfInstance.parent) return

        for (const bone of this.skeleton.bones) {
            const partEquivalent = this.getPartEquivalent(selfInstance, bone.name)
            const parentPartEquivalent = bone.parent ? this.getPartEquivalent(selfInstance, bone.parent.name) : undefined

            if (partEquivalent && parentPartEquivalent) {
                setBoneToCFrame(bone, getJointForInstances(parentPartEquivalent, partEquivalent, false))
            } else if (partEquivalent) {
                const offsetCF = getOffsetForInstance(partEquivalent, false)
                setBoneToCFrame(bone, offsetCF)
            } else if (bone.name === "Root") {
                //setBoneToCFrame(bone, selfInstance.Prop("CFrame") as CFrame)
            } else if (bone.name === "HumanoidRootNode") {
                //const reverseCF = (selfInstance.Prop("CFrame") as CFrame).inverse()

                let rootCF = new CFrame()
                const rootPart = this.getPartEquivalent(selfInstance, "HumanoidRootPart")
                if (rootPart) {
                    rootCF = rootPart.Prop("CFrame") as CFrame
                }

                setBoneToCFrame(bone, rootCF)
            } else if (bone.name === "DynamicHead") {
                /*const headPart = this.getPartEquivalent(selfInstance, "Head")
                if (headPart) {
                    const motor = headPart.FindFirstChildOfClass("Motor6D")
                    if (motor) {
                        setBoneToCFrame(bone, (motor.Prop("C1") as CFrame).inverse())
                    }
                }*/
            }
        }

        this.updateMatrixWorld()
        this.setAsRest()
    }

    updateMatrixWorld() {
        for (const bone of this.skeleton.bones) {
            bone.updateMatrixWorld()
        }
    }

    update(instance: Instance) {
        if (!instance.parent) return

        this.resetRestPos(instance)

        for (const bone of this.skeleton.bones) {
            const partEquivalent = this.getPartEquivalent(instance, bone.name)
            const parentPartEquivalent = bone.parent ? this.getPartEquivalent(instance, bone.parent.name) : undefined

            if (partEquivalent && parentPartEquivalent) {
                setBoneToCFrame(bone, getJointForInstances(parentPartEquivalent, partEquivalent, true))
            } else if (partEquivalent) {
                const transformCF = getOffsetForInstance(partEquivalent, true)
                setBoneToCFrame(bone, transformCF)
            }
        }

        this.updateMatrixWorld()
    }

    dispose(scene: THREE.Scene) {
        if (this.skeletonHelper) {
            scene.remove(this.skeletonHelper)
            this.skeletonHelper.dispose()
            this.skeletonHelper = undefined
        }

        scene.remove(this.rootBone)

        for (let i = 0; i < this.skeleton.bones.length; i++) {
            const bone = this.skeleton.bones[i];
            if (bone.parent) {
                bone.removeFromParent();
            }
        }
    }

    static descNeedsSkeleton(meshDesc: MeshDesc) {
        return meshDesc.canHaveSkinning && meshDesc.fileMesh && meshDesc.fileMesh.skinning && meshDesc.fileMesh.skinning.subsets.length > 0 && meshDesc.fileMesh.skinning.skinnings.length > 0
    }
}
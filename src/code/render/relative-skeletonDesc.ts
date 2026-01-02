import * as THREE from 'three';
import type { MeshDesc } from "./meshDesc";
import { CFrame, Instance } from '../rblx/rbx';
import { rad } from '../misc/misc';
import { ANIMATE_SKELETON, SHOW_SKELETON_HELPER, USE_LEGACY_SKELETON } from '../misc/flags';
import type { RenderableDesc } from './renderableDesc';

//TODO: Update FACS bones based on head CFrame and Size, which shouldnt be that hard because the Head contains OriginalSize, just multiply original bones with the difference
//TODO: Make it so Root bone is the part CFrame
//TODO: FACS
//right now behavior is just as good as legacy-skeleton BUT without FACS

function setBoneToCFrame(bone: THREE.Bone, cf: CFrame) {
    bone.position.set(...cf.Position)
    bone.rotation.set(rad(cf.Orientation[0]), rad(cf.Orientation[1]), rad(cf.Orientation[2]), "YXZ")
}

function getJointForInstances(parent: Instance, child: Instance, includeTransform: boolean) {
    const childMotor = child.FindFirstChildOfClass("Motor6D")
    const parentMotor = parent.FindFirstChildOfClass("Motor6D")

    let transform = new CFrame()

    if (childMotor) {
        if (includeTransform) {
            transform = childMotor.Prop("Transform") as CFrame
        }

        let initalCF = new CFrame()
        if (parentMotor) {
            initalCF = (parentMotor.Prop("C1") as CFrame).inverse()
        }
        const jointCF = initalCF.multiply(childMotor.Prop("C0") as CFrame).multiply(transform.inverse())
        
        return jointCF
    }
    return new CFrame()
}

//is tied to a compiled meshDesc
export class SkeletonDesc {
    renderableDesc: RenderableDesc
    meshDesc: MeshDesc

    skeleton: THREE.Skeleton
    rootBone: THREE.Bone
    bones: THREE.Bone[]
    originalBoneCFrames: CFrame[] = []
    targetWorldBoneCFrames: CFrame[] = []
    skeletonHelper?: THREE.SkeletonHelper

    constructor(renderableDesc: RenderableDesc, meshDesc: MeshDesc, scene: THREE.Scene) {
        if (USE_LEGACY_SKELETON) {
            throw new Error("SkeletonDesc cannot be created while USE_LEGACY_SKELETON is true")
        }

        this.renderableDesc = renderableDesc
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

        this.bones = boneArr

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
                //worldParentBoneCF.Orientation = worldParentBoneCF.inverse().Orientation
                //let euler0 = new THREE.Euler(rad(worldParentBoneCF.Orientation[0]), rad(worldParentBoneCF.Orientation[1]), rad(worldParentBoneCF.Orientation[2]))
                //euler0 = euler0.reorder("YXZ")
                //worldParentBoneCF.Orientation = [deg(euler0.x), deg(euler0.y), deg(euler0.z)]

                const worldBoneCF = new CFrame(...bone.position)
                worldBoneCF.fromRotationMatrix(...bone.rotationMatrix)
                //worldBoneCF.Orientation = worldBoneCF.inverse().Orientation
                //let euler1 = new THREE.Euler(rad(worldBoneCF.Orientation[0]), rad(worldBoneCF.Orientation[1]), rad(worldBoneCF.Orientation[2]))
                //euler1 = euler1.reorder("YXZ")
                //worldBoneCF.Orientation = [deg(euler1.x), deg(euler1.y), deg(euler1.z)]

                const boneCF = worldParentBoneCF.inverse().multiply(worldBoneCF)
                this.originalBoneCFrames.push(boneCF)
                setBoneToCFrame(threeBone, boneCF)

                parentThreeBone.add(threeBone)
            } else {
                rootBone = threeBone
                const worldBoneCF = new CFrame(...bone.position)
                worldBoneCF.fromRotationMatrix(...bone.rotationMatrix)
                setBoneToCFrame(threeBone, worldBoneCF)
                this.originalBoneCFrames.push(worldBoneCF)
            }
        }

        if (!rootBone) {
            throw new Error("FileMesh has no root bone")
        } else {
            this.rootBone = rootBone
        }

        this.skeleton = new THREE.Skeleton(boneArr)

        this.updateMatrixWorld()
        this.setAsRest()

        if (SHOW_SKELETON_HELPER) {
            const skeletonHelper = new THREE.SkeletonHelper(this.rootBone)
            scene.add(skeletonHelper)
            this.skeletonHelper = skeletonHelper
        }

        //scene.add(this.rootBone)
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

    updateMatrixWorld() {
        for (const bone of this.skeleton.bones) {
            bone.updateMatrixWorld(true)
        }
    }

    update(instance: Instance) {
        if (!instance.parent) return

        if (ANIMATE_SKELETON) {
            this.skeleton.pose()
            this.updateMatrixWorld()

            this.targetWorldBoneCFrames = new Array(this.bones.length)
            for (const bone of this.bones) {
                const isFACS = this.meshDesc.fileMesh?.facs?.faceBoneNames.includes(bone.name)

                if (!isFACS) {
                    const partEquivalent = this.getPartEquivalent(instance, bone.name)
                    const parentPartEquivalent = bone.parent ? this.getPartEquivalent(instance, bone.parent.name !== "HumanoidRootNode" ? bone.parent.name : "HumanoidRootPart") : undefined

                    if (partEquivalent && parentPartEquivalent) {
                        this.targetWorldBoneCFrames[this.bones.indexOf(bone)] = getJointForInstances(parentPartEquivalent, partEquivalent, true)
                        this.targetWorldBoneCFrames[this.bones.indexOf(bone)] = partEquivalent.Prop("CFrame") as CFrame
                    } else if (partEquivalent) {
                        this.targetWorldBoneCFrames[this.bones.indexOf(bone)] = partEquivalent.Prop("CFrame") as CFrame
                    }
                }
            }

            if (this.renderableDesc.result) {
                this.rootBone.updateMatrixWorld(true)

                /*let lastBones: THREE.Bone[] = [this.rootBone]
                let lastMatrixs: THREE.Matrix4[] = [this.renderableDesc.result.matrixWorld]

                while (lastBones.length > 0) {
                    const newLastBones: THREE.Bone[] = []
                    const newLastMatrixs: THREE.Matrix4[] = []

                    for (const lastBone of lastBones) {
                        const targetWorldCF = this.targetWorldBoneCFrames[this.bones.indexOf(lastBone)]
                        const lastMatrix = lastMatrixs[lastBones.indexOf(lastBone)]

                        if (targetWorldCF) {
                            const relativeMatrix = lastMatrix.clone().invert().multiply(targetWorldCF.getTHREEMatrix())
                            const newLastMatrix = lastMatrix.clone().multiply(relativeMatrix)

                            const relativePos = new THREE.Vector3()
                            const relativeScale = new THREE.Vector3()
                            const relativeQuat = new THREE.Quaternion()
                            relativeMatrix.decompose(relativePos, relativeQuat, relativeScale)

                            lastBone.position.set(...relativePos.toArray())
                            lastBone.scale.set(...relativeScale.toArray())
                            lastBone.rotation.setFromQuaternion(relativeQuat)

                            for (const child of lastBone.children) {
                                if (child instanceof THREE.Bone) {
                                    newLastBones.push(child)
                                    newLastMatrixs.push(newLastMatrix)
                                }
                            }
                        } else {
                            const newLastMatrix = lastMatrix

                            for (const child of lastBone.children) {
                                if (child instanceof THREE.Bone) {
                                    newLastBones.push(child)
                                    newLastMatrixs.push(newLastMatrix)
                                }
                            }
                        }
                    }

                    lastBones = newLastBones
                    lastMatrixs = newLastMatrixs
                }*/
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

        if (this.rootBone.parent) {
            this.rootBone.parent.remove(this.rootBone)
        }

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
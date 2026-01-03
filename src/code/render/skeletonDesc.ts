import * as THREE from 'three';
import type { MeshDesc } from "./meshDesc";
import { CFrame, Instance, Vector3 } from '../rblx/rbx';
import { deg, rad } from '../misc/misc';
import { GetAttachedPart, getOriginalSize, traverseRigCFrame } from '../rblx/scale';
import { ANIMATE_SKELETON, SHOW_SKELETON_HELPER, USE_LEGACY_SKELETON } from '../misc/flags';
import { divide, multiply } from '../rblx/mesh-deform';
import FaceControlsWrapper from '../rblx/instance/FaceControls';
import { AbbreviationToFaceControlProperty } from '../rblx/constant';
import type { RenderableDesc } from './renderableDesc';

function setBoneToCFrame(bone: THREE.Bone, cf: CFrame) {
    bone.position.set(...cf.Position)
    bone.rotation.set(rad(cf.Orientation[0]), rad(cf.Orientation[1]), rad(cf.Orientation[2]), "YXZ")
}

//IMPORTANT: this gets the CENTER of the target part, instead of the joint connection it and the parent
/*function getOffsetForInstance(child: Instance, includeTransform: boolean) {
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
}*/

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
                threeBone.position.set(0,0,0)
                threeBone.rotation.set(0,0,0, "YXZ")
                this.originalBoneCFrames.push(new CFrame())
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

    getRootCFrame(instance: Instance, includeTransform: boolean) {
        if (includeTransform) {
            return instance.Prop("CFrame") as CFrame
        } else {
            let bodyPart: Instance | undefined = undefined
            if (instance.parent && instance.parent.FindFirstChildOfClass("Humanoid")) {
                bodyPart = instance
            } else if (instance.parent && instance.parent.parent && instance.parent.className === "Accessory") {
                bodyPart = GetAttachedPart(instance.parent, instance.parent.parent)
            }

            const hrp = this.getPartEquivalent(instance, "HumanoidRootPart")
            if (hrp && bodyPart) {
                return (hrp.Prop("CFrame") as CFrame).multiply(traverseRigCFrame(bodyPart))
            }
        }

        return new CFrame()
    }

    resetRestPos(selfInstance: Instance, includeTransform: boolean = false) {
        if (!selfInstance.parent) return

        for (let i = 0; i < this.bones.length; i++) {
            const bone = this.bones[i]

            const partEquivalent = this.getPartEquivalent(selfInstance, bone.name)
            const parentPartEquivalent = bone.parent ? this.getPartEquivalent(selfInstance, bone.parent.name !== "HumanoidRootNode" ? bone.parent.name : "HumanoidRootPart") : undefined

            let rootBoneCF = new CFrame()
            if (bone.name === "Root") {
                rootBoneCF = this.getRootCFrame(selfInstance, includeTransform)
            } else if (bone.parent?.name === "Root") {
                rootBoneCF = this.getRootCFrame(selfInstance, includeTransform).inverse()
            }

            if (partEquivalent && parentPartEquivalent) {
                setBoneToCFrame(bone, rootBoneCF.multiply(getJointForInstances(parentPartEquivalent, partEquivalent, includeTransform)))
            } else if (partEquivalent) {
                if (includeTransform) {
                    setBoneToCFrame(bone, rootBoneCF.multiply(partEquivalent.Prop("CFrame") as CFrame))
                } else {
                    let hrpCF = new CFrame()
                    const hrp = this.getPartEquivalent(selfInstance, "HumanoidRootPart")
                    if (hrp) {
                        hrpCF = hrp.Prop("CFrame") as CFrame
                    }
                    setBoneToCFrame(bone, rootBoneCF.multiply(hrpCF.multiply(traverseRigCFrame(partEquivalent))))
                }
            } else if (bone.name === "Root") {
                setBoneToCFrame(bone, rootBoneCF.multiply(new CFrame()))
            } else if (bone.name === "HumanoidRootNode") {
                let rootCF = new CFrame()
                const rootPart = this.getPartEquivalent(selfInstance, "HumanoidRootPart")
                if (rootPart) {
                    rootCF = rootPart.Prop("CFrame") as CFrame
                }

                setBoneToCFrame(bone, rootBoneCF.multiply(rootCF))
            } else if (bone.name === "DynamicHead" || bone.parent?.name === "DynamicHead" || bone.parent?.parent?.name === "DynamicHead" || bone.parent?.parent?.parent?.name === "DynamicHead") {
                //find scale difference
                const ogCF = this.originalBoneCFrames[i]

                const head = this.getPartEquivalent(selfInstance, "Head")
                if (head) {
                    const headSize = head.Prop("Size") as Vector3
                    const ogHeadSize = getOriginalSize(head)

                    const scale = divide(headSize.toVec3(), ogHeadSize.toVec3())

                    //apply scale
                    const scaledCF = ogCF.clone()
                    scaledCF.Position = multiply(scaledCF.Position, scale)

                    setBoneToCFrame(bone, scaledCF)
                }
            }
            /*if (bone.name === "Head") {

                //find scale difference
                const head = this.getPartEquivalent(selfInstance, "Head")
                if (head) {
                    const headSize = head.Prop("Size") as Vector3
                    const ogHeadSize = getOriginalSize(head)

                    const scale = divide(headSize.toVec3(), ogHeadSize.toVec3())

                    //apply scale
                    //const scaledCF = ogCF.clone()
                    //scaledCF.Position = multiply(scaledCF.Position, scale)

                    
                    bone.scale.set(...scale)
                }
            }*/ /*else if (bone.name === "DynamicHead") {
                const headPart = this.getPartEquivalent(selfInstance, "Head")
                if (headPart) {
                    const motor = headPart.FindFirstChildOfClass("Motor6D")
                    if (motor) {
                        setBoneToCFrame(bone, (motor.Prop("C1") as CFrame).inverse())
                    }
                }
            }*/
        }

        this.updateMatrixWorld()
        if (!includeTransform) {
            this.setAsRest()
            this.updateMatrixWorld()
        }
    }

    updateMatrixWorld() {
        for (const bone of this.skeleton.bones) {
            bone.updateMatrixWorld(true)
        }
    }

    update(instance: Instance) {
        if (!instance.parent) return

        this.resetRestPos(instance)
        
        if (ANIMATE_SKELETON) {
            //non-facs animation is done in here, quite misleading method name
            this.resetRestPos(instance, true)

            for (const bone of this.skeleton.bones) {
                const isFACS = this.meshDesc.fileMesh?.facs?.faceBoneNames.includes(bone.name)

                if (!isFACS) {
                    /*const partEquivalent = this.getPartEquivalent(instance, bone.name)
                    const parentPartEquivalent = bone.parent ? this.getPartEquivalent(instance, bone.parent.name !== "HumanoidRootNode" ? bone.parent.name : "HumanoidRootPart") : undefined

                    if (partEquivalent && parentPartEquivalent) {
                        setBoneToCFrame(bone, getJointForInstances(parentPartEquivalent, partEquivalent, true))
                    } else if (partEquivalent) {
                        setBoneToCFrame(bone, partEquivalent.Prop("CFrame") as CFrame)
                    }*/
                } else {
                    const facsMesh = this.meshDesc.fileMesh
                    const facs = this.meshDesc.fileMesh?.facs
                    const head = this.getPartEquivalent(instance, "Head")

                    if (head && facsMesh && facs && facs.quantizedTransforms) {
                        const headSize = head.Prop("Size") as Vector3
                        const ogHeadSize = getOriginalSize(head)
                        const headScale = divide(headSize.toVec3(), ogHeadSize.toVec3())

                        //create or get face controls
                        let faceControls = head.FindFirstChildOfClass("FaceControls")
                        if (!faceControls) {
                            faceControls = new Instance("FaceControls")
                            faceControls.setParent(head)
                        }
                        new FaceControlsWrapper(faceControls)

                        for (let j = 0; j < facs.faceBoneNames.length; j++) {
                            const boneName = facs.faceBoneNames[j]

                            if (boneName === bone.name) {
                                let jointCF = new CFrame()

                                const ogCF = this.originalBoneCFrames[this.bones.indexOf(bone)]
                                jointCF = ogCF.clone()
                                //find scale difference
                                const head = this.getPartEquivalent(instance, "Head")
                                if (head) {
                                    const headSize = head.Prop("Size") as Vector3
                                    const ogHeadSize = getOriginalSize(head)

                                    const scale = divide(headSize.toVec3(), ogHeadSize.toVec3())

                                    //apply scale
                                    jointCF.Position = multiply(jointCF.Position, scale)
                                }

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

                                let euler = new THREE.Euler(rad(totalRotation.X), rad(totalRotation.Y), rad(totalRotation.Z), "XYZ")
                                euler = euler.reorder("YXZ")

                                resultCF.Orientation = [deg(euler.x), deg(euler.y), deg(euler.z)]
                                resultCF.Position = multiply(totalPosition.toVec3(), headScale)

                                setBoneToCFrame(bone, jointCF.multiply(resultCF))
                                break
                            }
                        }
                    }
                }
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
import * as THREE from 'three';
import type { MeshDesc } from "./meshDesc";
import { CFrame } from '../rblx/rbx';
import { rad } from '../misc/misc';

function setBoneToCFrame(bone: THREE.Bone, cf: CFrame) {
    bone.position.set(...cf.Position)
    bone.rotation.set(rad(cf.Orientation[0]), rad(cf.Orientation[1]), rad(cf.Orientation[2]), "YXZ")
}

//is tied to a compiled meshDesc
export class SkeletonDesc {
    meshDesc: MeshDesc
    skeleton: THREE.Skeleton
    rootBone: THREE.Bone

    constructor(meshDesc: MeshDesc, scene: THREE.Scene) {
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
                parentThreeBone.add(threeBone)

                const worldParentBoneCF = new CFrame(...parentBone.position)
                worldParentBoneCF.fromRotationMatrix(...parentBone.rotationMatrix)

                const worldBoneCF = new CFrame(...bone.position)
                worldBoneCF.fromRotationMatrix(...bone.rotationMatrix)

                const boneCF = worldBoneCF.multiply(worldParentBoneCF.inverse())
                setBoneToCFrame(threeBone, boneCF)
            } else {
                rootBone = threeBone
                threeBone.position.set(0,0,0)
                threeBone.rotation.set(0,0,0)
            }
        }

        if (!rootBone) {
            throw new Error("FileMesh has no root bone")
        } else {
            this.rootBone = rootBone
        }

        console.log(skinning)
        console.log(boneArr)
        this.skeleton = new THREE.Skeleton(boneArr)

        scene.add(this.rootBone)

        //const skeletonHelper = new THREE.SkeletonHelper(this.rootBone)
        //scene.add(skeletonHelper)
    }

    dispose(scene: THREE.Scene) {
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
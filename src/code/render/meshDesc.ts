import * as THREE from 'three'
import { AllBodyParts, BodyPartEnumToNames, BodyPartNameToEnum, HumanoidRigType, MeshType, RenderedClassTypes } from "../rblx/constant"
import { CFrame, Instance, isAffectedByHumanoid, Vector3 } from "../rblx/rbx"
import { API, Authentication } from '../api'

//const CACHE_cage = new Map<Instance, Promise<[MeshDesc, FileMesh]>>()

function arrIsSame<T>(arr0: T[], arr1: T[]) {
    if (arr0.length !== arr1.length) {
        return false
    }

    for (const element of arr0) {
        if (!arr1.includes(element)) {
            return false
        }
    }

    return true
}

function arrIsSameCF(arr0: CFrame[], arr1: CFrame[]) {
    if (arr0.length !== arr1.length) {
        return false
    }

    for (const element of arr0) {
        let found = false
        for (const element1 of arr1) {
            if (element.isSame(element1)) {
                found = true
            }
        }
        if (!found) {
            return found
        }
    }

    return true
}

function arrIsSameVector3(arr0: Vector3[], arr1: Vector3[]) {
    if (arr0.length !== arr1.length) {
        return false
    }

    for (const element of arr0) {
        let found = false
        for (const element1 of arr1) {
            if (element.isSame(element1)) {
                found = true
            }
        }
        if (!found) {
            return found
        }
    }

    return true
}

export class MeshDesc {
    size: Vector3 = new Vector3(1,1,1)
    scaleIsRelative: boolean = false
    mesh?: string
    hasSkinning: boolean = false

    deformationReference?: string
    referenceOrigin: CFrame = new CFrame()
    deformationCage?: string
    cageOrigin: CFrame = new CFrame()

    targetCages?: string[]
    targetOrigins?: CFrame[]
    targetSizes?: Vector3[]

    //result data
    instance?: Instance

    dispose() {
        this.instance = undefined
    }

    isSame(other: MeshDesc) {
        const singularTrue = this.size.isSame(other.size) &&
            this.scaleIsRelative === other.scaleIsRelative &&
            this.mesh === other.mesh &&
            this.deformationReference === other.deformationReference &&
            this.referenceOrigin.isSame(other.referenceOrigin) &&
            this.deformationCage === other.deformationCage &&
            this.cageOrigin.isSame(other.cageOrigin)
        
        if (!singularTrue) {
            return singularTrue
        }

        if ((!this.targetCages && other.targetCages) || (this.targetCages && !other.targetCages)) {
            return false
        }

        if ((!this.targetOrigins && other.targetOrigins) || (this.targetOrigins && !other.targetOrigins)) {
            return false
        }

        if ((!this.targetSizes && other.targetSizes) || (this.targetSizes && !other.targetSizes)) {
            return false
        }

        if (this.targetCages && other.targetCages) {
            if (!arrIsSame(this.targetCages, other.targetCages)) {
                return false
            }
        }

        if (this.targetOrigins && other.targetOrigins) {
            if (!arrIsSameCF(this.targetOrigins, other.targetOrigins)) {
                return false
            }
        }

        if (this.targetSizes && other.targetSizes) {
            if (!arrIsSameVector3(this.targetSizes, other.targetSizes)) {
                return false
            }
        }

        return true
    }

    async compileMesh(auth: Authentication): Promise<THREE.Mesh | Response | undefined> {
        if (!this.mesh) {
            return undefined
        }

        const mesh = await API.Asset.GetMesh(this.mesh, undefined, auth)
        if (mesh instanceof Response) {
            return mesh
        }

        const geometry = new THREE.BufferGeometry()

        //position
        const verts = new Float32Array(mesh.coreMesh.verts.length * 3)
        for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
            verts[i * 3 + 0] = mesh.coreMesh.verts[i].position[0]
            verts[i * 3 + 1] = mesh.coreMesh.verts[i].position[1]
            verts[i * 3 + 2] = mesh.coreMesh.verts[i].position[2]
        }
        geometry.setAttribute("position", new THREE.BufferAttribute(verts, 3))

        //normal
        const normals = new Float32Array(mesh.coreMesh.verts.length * 3)
        for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
            normals[i * 3 + 0] = mesh.coreMesh.verts[i].normal[0]
            normals[i * 3 + 1] = mesh.coreMesh.verts[i].normal[1]
            normals[i * 3 + 2] = mesh.coreMesh.verts[i].normal[2]
        }
        geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3))

        //uv
        const uvs = new Float32Array(mesh.coreMesh.verts.length * 2)
        for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
            uvs[i * 2 + 0] = mesh.coreMesh.verts[i].uv[0]
            uvs[i * 2 + 1] = 1 - mesh.coreMesh.verts[i].uv[1]
        }
        geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))

        //faces
        let facesEnd = mesh.coreMesh.faces.length
        let facesStart = 0
        if (mesh.lods) {
            if (mesh.lods.lodOffsets.length > 2) {
                facesStart = mesh.lods.lodOffsets[0]
                facesEnd = mesh.lods.lodOffsets[1]
            }
        }

        //indices
        const indices = new Uint16Array((facesEnd - facesStart) * 3)
        for (let i = facesStart; i < facesEnd; i++) {
            indices[i * 3 + 0] = mesh.coreMesh.faces[i].a
            indices[i * 3 + 1] = mesh.coreMesh.faces[i].b
            indices[i * 3 + 2] = mesh.coreMesh.faces[i].c
        }
        geometry.setIndex(new THREE.BufferAttribute(indices, 1))

        //skinning
        /*let meshSkinning = mesh.skinning
        if (meshSkinning && meshSkinning.skinnings.length > 0) { //TODO: proper subset support
            this.hasSkinning = true

            //bone weight and indices
            const skinIndices = []
            const skinWeights = []
            for (let subset of meshSkinning.subsets) {
                for (let i = subset.vertsBegin; i < subset.vertsBegin + subset.vertsLength; i++) {
                    let skinning = meshSkinning.skinnings[i]
                    for (let weight of skinning.boneWeights) {
                        skinWeights.push(weight / 255)
                    }
                    for (let index of skinning.subsetIndices) {
                        skinIndices.push(subset.boneIndices[index])
                    }
                }
            }
            geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4))
            geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4))

            //skeleton
            let threeBones = []

            //bone creation
            for (let i = 0; i < meshSkinning.bones.length; i++) {
                let bone = meshSkinning.bones[i]

                let threeBone = new THREE.Bone()
                threeBone.name = meshSkinning.nameTable[i]
                threeBone.position.set(bone.position[0], bone.position[1], bone.position[2])
                //TODO: rotation matrix
                threeBones.push(threeBone)
            }

            //bone hierarchy
            for (let i = 0; i < meshSkinning.bones.length; i++) {
                let bone = meshSkinning.bones[i]

                scene.add(threeBones[i])
                if (bone.parentIndex !== 65535) {
                    //threeBones[bone.parentIndex].add(threeBones[i])
                    
                    //let parentPos = threeBones[bone.parentIndex].position
                    //let parentCF = new CFrame(parentPos.x, parentPos.y, parentPos.x)
                    //let childPos = threeBones[i].position
                    //let childCF = new CFrame(childPos.x, childPos.y, childPos.z)

                    //let newCF = parentCF.inverse().multiply(childCF)
                    //let newPos = newCF.Position
                    //threeBones[i].position.set(newPos[0], newPos[1], newPos[2])
                }
            }

            const skeleton = new THREE.Skeleton(threeBones)

            threeMesh = new THREE.SkinnedMesh()
            threeMesh.castShadow = true
            threeMesh.receiveShadow = true

            instanceToMesh.set(instance, threeMesh)

            //threeMesh.add(threeBones[0])
            for (let bone of threeBones) {
                if (bone !== threeBones[0]) {
                    threeBones[0].add(bone)
                } else {
                    threeMesh.add(bone)
                }
            }
            threeMesh.bind(skeleton)

            meshMaterial.skinning = true

            const helper = new THREE.SkeletonHelper( threeBones[0] );
            scene.add(helper)
        }*/

        //create and add mesh to scene
        const threeMesh = new THREE.Mesh(geometry)
        threeMesh.castShadow = true
        threeMesh.geometry = geometry

        if (!this.scaleIsRelative) {
            threeMesh.scale.set(this.size.X, this.size.Y, this.size.Z)
        } else {
            const oldSize = mesh.size
            threeMesh.scale.set(this.size.X / oldSize[0], this.size.Y / oldSize[1], this.size.Z / oldSize[2])
        }

        return threeMesh
    }

    fromInstance(child: Instance) {
        if (!RenderedClassTypes.includes(child.className)) {
            return
        }

        this.instance = child

        switch (child.className) {
            case "Part": {
                const specialMesh = child.FindFirstChildOfClass("SpecialMesh")
                if (specialMesh) {
                    this.size = specialMesh.Property("Scale") as Vector3
    
                    switch (specialMesh.Property("MeshType")) {
                        case MeshType.FileMesh: {
                            this.mesh = specialMesh.Property("MeshId") as string
                            break
                        }
                        case MeshType.Head: {
                            this.mesh = "rbxasset://avatar/heads/head.mesh"
                            this.size = this.size.multiply(new Vector3(0.8, 0.8, 0.8))
                            break
                        } //TODO: add the rest of the mesh types
                        default: {
                            console.warn(`MeshType ${specialMesh.Property("MeshType")} is not supported`)
                            break
                        }
                    }
                } else {
                    const affectedByHumanoid = isAffectedByHumanoid(child)
                    if (affectedByHumanoid && child.Prop("Name") !== "Head") { //clothing and stuff
                        const parent = child.parent
                        const humanoid = parent?.FindFirstChildOfClass("Humanoid")
    
                        if (parent && humanoid && humanoid.Property("RigType") === HumanoidRigType.R6) {
                            //get mesh of body part based on CharacterMesh
                            let characterMeshStr = null
                            
                            const children2 = parent.GetChildren()
                            for (const child2 of children2) {
                                if (child2.className === "CharacterMesh") {
                                    if (BodyPartNameToEnum[child.Property("Name") as string] === child2.Property("BodyPart")) {
                                        //TODO: check if the other properties are important
                                        characterMeshStr = child2.Property("MeshId") as string
                                    }
                                }
                            }
    
                            if (!characterMeshStr) { //use default blocky meshes
                                characterMeshStr = `rbxasset://avatar/meshes/${["","torso","leftarm","rightarm","leftleg","rightleg"][BodyPartNameToEnum[child.Property("Name") as string]]}.mesh`
                            }
    
                            this.mesh = characterMeshStr
                        } else { //TODO: R15, clothing
    
                        }
                    } else { //TODO: render as regular part (cube, cylinder, sphere, etc.)
    
                    }
                }
    
                break
            }
            case "MeshPart": {
                const meshIdStr = child.Property("MeshId") as string

                this.mesh = meshIdStr
                this.size = child.Property("Size") as Vector3
                this.scaleIsRelative = true
                
                //humanoid layered clothing
                if (isAffectedByHumanoid(child) && child.parent) {
                    const rig = child.parent

                    //wrap layer
                    const wrapLayer = child.FindFirstChildOfClass("WrapLayer")

                    if (wrapLayer) {
                        this.deformationReference = wrapLayer.Prop("ReferenceMeshId") as string
                        this.referenceOrigin = wrapLayer.Prop("ReferenceOrigin") as CFrame
                        this.deformationCage = wrapLayer.Prop("CageMeshId") as string
                        //this.cageOrigin = wrapLayer.Prop("CageOrigin") as CFrame
                    }

                    //wrap targets
                    for (const bodyPartEnum of AllBodyParts) {
                        for (const bodyPartName of BodyPartEnumToNames[bodyPartEnum]) {
                            const bodyPart = rig.FindFirstChild(bodyPartName)
                            if (bodyPart) {
                                const bodyPartWrapTarget = bodyPart.FindFirstChildOfClass("WrapTarget")
                                if (bodyPartWrapTarget) {
                                    
                                }
                            }
                        }
                    }
                }

                break
            }
        }
    }
}
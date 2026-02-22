import * as THREE from 'three'
import { BodyPartNameToEnum, HumanoidRigType, MeshType, RenderedClassTypes, WrapLayerAutoSkin } from "../rblx/constant"
import { CFrame, Color3, Instance, isAffectedByHumanoid, Vector3 } from "../rblx/rbx"
import { API } from '../api'
import { FileMesh } from '../mesh/mesh'
import { layerClothingChunked, layerClothingChunkedNormals2, layerClothingChunkedNormals, offsetMesh, getDistVertArray, minus, magnitude, transferSkeleton, inheritSkeleton } from '../mesh/mesh-deform'
import { AUTO_SKIN_EVERYTHING, LAYERED_CLOTHING_ALGORITHM, USE_LEGACY_SKELETON, USE_VERTEX_COLOR } from '../misc/flags'
import { BoneNameToIndex } from './legacy-skeleton'
import { RBFDeformerPatch } from '../mesh/cage-mesh-deform'
import { getModelLayersDesc, WrapDeformerDesc, WrapLayerDesc, type ModelLayersDesc } from './layersDesc'
//import { OBJExporter } from 'three/examples/jsm/Addons.js'
//import { download } from '../misc/misc'

//const CACHE_cage = new Map<Instance, Promise<[MeshDesc, FileMesh]>>()

/*function arrIsSame<T>(arr0: T[], arr1: T[]) {
    if (arr0.length !== arr1.length) {
        return false
    }

    for (const element of arr0) {
        if (!arr1.includes(element)) {
            return false
        }
    }

    return true
}*/

export function fileMeshToTHREEGeometry(mesh: FileMesh, canIncludeSkinning = true, forceVertexColor?: Vector3) {
    const geometry = new THREE.BufferGeometry()

    //position
    const verts = new Float32Array(mesh.coreMesh.verts.length * 3)
    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        verts[i * 3 + 0] = mesh.coreMesh.verts[i].position[0]
        verts[i * 3 + 1] = mesh.coreMesh.verts[i].position[1]
        verts[i * 3 + 2] = mesh.coreMesh.verts[i].position[2]
        if (isNaN(mesh.coreMesh.verts[i].position[0])) {
            console.log(mesh.coreMesh.verts[i])
        }
        if (isNaN(mesh.coreMesh.verts[i].position[1])) {
            console.log(mesh.coreMesh.verts[i])
        }
        if (isNaN(mesh.coreMesh.verts[i].position[2])) {
            console.log(mesh.coreMesh.verts[i])
        }
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

    //colors
    const colors = new Float32Array(mesh.coreMesh.verts.length * 4)
    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        if (USE_VERTEX_COLOR && !forceVertexColor) {
            colors[i * 4 + 0] = mesh.coreMesh.verts[i].color[0] / 255
            colors[i * 4 + 1] = mesh.coreMesh.verts[i].color[1] / 255
            colors[i * 4 + 2] = mesh.coreMesh.verts[i].color[2] / 255
            colors[i * 4 + 3] = mesh.coreMesh.verts[i].color[3] / 255
        } else if (forceVertexColor) {
            colors[i * 4 + 0] = forceVertexColor.X
            colors[i * 4 + 1] = forceVertexColor.Y
            colors[i * 4 + 2] = forceVertexColor.Z
            colors[i * 4 + 3] = 1
        } else {
            colors[i * 4 + 0] = 1
            colors[i * 4 + 1] = 1
            colors[i * 4 + 2] = 1
            colors[i * 4 + 3] = 1
        }
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4))

    //faces
    let facesEnd = mesh.coreMesh.faces.length
    let facesStart = 0
    if (mesh.lods) {
        if (mesh.lods.lodOffsets.length >= 2) {
            facesStart = mesh.lods.lodOffsets[0]
            facesEnd = mesh.lods.lodOffsets[1]
            if (facesEnd === 0) {
                facesEnd = mesh.coreMesh.faces.length
            }
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
    const meshSkinning = mesh.skinning
    if (meshSkinning && meshSkinning.subsets.length > 0 && canIncludeSkinning) {
        //bone weight and indices
        const skinIndices = new Uint16Array(meshSkinning.skinnings.length * 4)
        const skinWeights = new Float32Array(meshSkinning.skinnings.length * 4)
        
        //const skinIndices = []
        //const skinWeights = []
        
        for (const subset of meshSkinning.subsets) {
            for (let i = subset.vertsBegin; i < subset.vertsBegin + subset.vertsLength; i++) {
                const skinning = meshSkinning.skinnings[i]
                
                skinWeights[i * 4 + 0] = skinning.boneWeights[0] / 255
                skinWeights[i * 4 + 1] = skinning.boneWeights[1] / 255
                skinWeights[i * 4 + 2] = skinning.boneWeights[2] / 255
                skinWeights[i * 4 + 3] = skinning.boneWeights[3] / 255

                if (USE_LEGACY_SKELETON) {
                    skinIndices[i * 4 + 0] = BoneNameToIndex[meshSkinning.nameTable[subset.boneIndices[skinning.subsetIndices[0]]]]
                    skinIndices[i * 4 + 1] = BoneNameToIndex[meshSkinning.nameTable[subset.boneIndices[skinning.subsetIndices[1]]]]
                    skinIndices[i * 4 + 2] = BoneNameToIndex[meshSkinning.nameTable[subset.boneIndices[skinning.subsetIndices[2]]]]
                    skinIndices[i * 4 + 3] = BoneNameToIndex[meshSkinning.nameTable[subset.boneIndices[skinning.subsetIndices[3]]]]

                    if (skinIndices[i * 4 + 0] === 0) {
                        skinIndices[i * 4 + 0] = BoneNameToIndex["Head"]
                    }
                    if (skinIndices[i * 4 + 1] === 0) {
                        skinIndices[i * 4 + 1] = BoneNameToIndex["Head"]
                    }
                    if (skinIndices[i * 4 + 2] === 0) {
                        skinIndices[i * 4 + 2] = BoneNameToIndex["Head"]
                    }
                    if (skinIndices[i * 4 + 3] === 0) {
                        skinIndices[i * 4 + 3] = BoneNameToIndex["Head"]
                    }
                } else {
                    if (subset.boneIndices[skinning.subsetIndices[0]] >= 65535 || subset.boneIndices[skinning.subsetIndices[1]] >= 65535 || subset.boneIndices[skinning.subsetIndices[2]] >= 65535 || subset.boneIndices[skinning.subsetIndices[3]] >= 65535) {
                        console.log(mesh)
                        console.log(subset)
                        console.log(skinning)
                        throw new Error("mesh is invalid")
                    }
                    skinIndices[i * 4 + 0] = subset.boneIndices[skinning.subsetIndices[0]]
                    skinIndices[i * 4 + 1] = subset.boneIndices[skinning.subsetIndices[1]]
                    skinIndices[i * 4 + 2] = subset.boneIndices[skinning.subsetIndices[2]]
                    skinIndices[i * 4 + 3] = subset.boneIndices[skinning.subsetIndices[3]]
                }
                
                /*const resultingIndex = BoneNameToIndex[meshSkinning.nameTable[subset.boneIndices[skinning.subsetIndices[0]]]]
                console.log(resultingIndex)
                if (resultingIndex === 0) {
                    console.log(skinning)

                    console.log(subset.boneIndices)
                    console.log(meshSkinning.nameTable)
                }*/
                /*
                for (const weight of skinning.boneWeights) {
                    skinWeights.push(weight / 255)
                }
                for (const index of skinning.subsetIndices) {
                    const boneName = meshSkinning.nameTable[subset.boneIndices[index]]
                    const boneIndex = BoneNameToIndex[boneName]
                    skinIndices.push(boneIndex)
                }
                */
            }
        }
        geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4))
        geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4))
        //console.log(mesh)
        //console.log(geometry.attributes.skinIndex)
        //console.log(geometry.attributes.skinWeight)
    }

    return geometry
}

export async function promiseForMesh(url: string, readOnly: boolean = false): Promise<[string, Response | FileMesh]> {
    return new Promise((resolve) => {
        API.Asset.GetMesh(url, undefined, readOnly).then(result => {
            resolve([url, result])
        })
    })
}

export class MeshDesc {
    //size: Vector3 = new Vector3(1,1,1)
    scaleIsRelative: boolean = false
    mesh?: string
    canHaveSkinning: boolean = true
    forceVertexColor: Vector3 | undefined

    //layering
    deformerDesc?: WrapDeformerDesc
    layerDesc?: WrapLayerDesc
    modelLayersDesc?: ModelLayersDesc
    
    //faces
    headMesh?: string

    //result data
    compilationTimestamp: number = -1
    instance?: Instance
    fileMesh?: FileMesh
    wasAutoSkinned: boolean = false

    dispose() {
        this.instance = undefined
    }

    isSame(other: MeshDesc) {
        const singularTrue = //this.size.isSame(other.size) &&
            this.scaleIsRelative === other.scaleIsRelative &&
            this.mesh === other.mesh &&
            this.canHaveSkinning === other.canHaveSkinning &&
            this.headMesh === other.headMesh
        
        if (!singularTrue) {
            return singularTrue
        }

        //deformer desc
        if ((this.deformerDesc && !other.deformerDesc) || (!this.deformerDesc && other.deformerDesc)) {
            return false
        }

        if (this.deformerDesc && other.deformerDesc) {
            if (!this.deformerDesc.isSame(other.deformerDesc)) {
                return false
            }
        }

        //layer desc
        if ((this.layerDesc && !other.layerDesc) || (!this.layerDesc && other.layerDesc)) {
            return false
        }

        if (this.layerDesc && other.layerDesc) {
            if (!this.layerDesc.isSame(other.layerDesc)) {
                return false
            }
        }

        //model layer desc
        if ((!this.modelLayersDesc && other.modelLayersDesc) || (this.modelLayersDesc && !other.modelLayersDesc)) {
            return false
        }

        if (this.modelLayersDesc && other.modelLayersDesc) {
            if (!this.modelLayersDesc.isSame(other.modelLayersDesc)) {
                return false
            }
        }

        //vertex color
        if ((!this.forceVertexColor && other.forceVertexColor) || (this.forceVertexColor && !other.forceVertexColor)) {
            return false
        }

        if (this.forceVertexColor && other.forceVertexColor) {
            if (!this.forceVertexColor.isSame(other.forceVertexColor)) {
                return false
            }
        }

        return true
    }

    async compileMesh(): Promise<THREE.Mesh | THREE.SkinnedMesh | Response | undefined> {
        if (!this.mesh) {
            return undefined
        }

        const meshToLoad = this.mesh

        const mesh = await API.Asset.GetMesh(meshToLoad, undefined)
        if (mesh instanceof Response) {
            return mesh
        }

        //inherit facs data from head
        if (!mesh.facs && this.headMesh && mesh.skinning.skinnings.length > 0) {
            const headMesh = await API.Asset.GetMesh(this.headMesh, undefined, true)
            if (headMesh instanceof Response) {
                return headMesh
            }
            if (headMesh.facs) {
                mesh.facs = headMesh.facs.clone()
            }
        }

        let the_ref_mesh = undefined

        //wrapdeformer
        if (this.deformerDesc) {
            //load meshes
            const meshMap = new Map<string,FileMesh>()

            const meshPromises: (Promise<[string, Response | FileMesh]>)[] = []
            meshPromises.push(promiseForMesh(this.deformerDesc.cage))
            meshPromises.push(promiseForMesh(this.deformerDesc.targetCage))

            const values = await Promise.all(meshPromises)
            for (const [url, mesh] of values) {
                if (mesh instanceof FileMesh) {
                    meshMap.set(url, mesh)
                } else {
                    return mesh
                }
            }

            const cage_mesh = meshMap.get(this.deformerDesc.cage)
            if (!cage_mesh) {
                throw new Error("not possible")
            }
            console.log(cage_mesh.coreMesh.verts.length - cage_mesh.removeDuplicateVertices(0.01))

            const targetCage_mesh = meshMap.get(this.deformerDesc.targetCage)
            if (!targetCage_mesh) {
                throw new Error("Should not happen")
            }

            //offset meshes
            offsetMesh(cage_mesh, this.deformerDesc.cageOrigin)
            offsetMesh(targetCage_mesh, this.deformerDesc.targetCageOrigin)

            //deform self cage to match target cage
            const targetDeformer = new RBFDeformerPatch(cage_mesh, targetCage_mesh, mesh)
            await targetDeformer.solveAsync()
            targetDeformer.deformMesh()
        }

        //wraplayer
        if (this.layerDesc && this.modelLayersDesc && this.modelLayersDesc.targetCages && this.modelLayersDesc.targetCages.length > 0 && this.modelLayersDesc.targetCFrames && this.modelLayersDesc.targetSizes && this.modelLayersDesc.layers) {
            //load meshes
            const meshMap = new Map<string,FileMesh>()

            const meshPromises: (Promise<[string, Response | FileMesh]>)[] = []
            meshPromises.push(promiseForMesh(this.layerDesc.reference))
            meshPromises.push(promiseForMesh(this.layerDesc.cage, true))

            const values = await Promise.all(meshPromises)
            for (const [url, mesh] of values) {
                if (mesh instanceof FileMesh) {
                    meshMap.set(url, mesh)
                } else {
                    return mesh
                }
            }

            const ref_mesh = meshMap.get(this.layerDesc.reference)
            if (!ref_mesh) {
                throw new Error("not possible")
            }
            ref_mesh.removeDuplicateVertices(0.01)
            console.log(ref_mesh.coreMesh.verts.length - ref_mesh.removeDuplicateVertices(0.01))

            const cage_mesh = meshMap.get(this.layerDesc.cage)
            if (!cage_mesh) {
                throw new Error("Should not happen")
            }
            cage_mesh.removeDuplicateVertices(0.01)

            //compare ref_mesh and cage_mesh, clothing should not be deformed if they are identical
            let referenceAndCageIdentical = true

            const distVertArr = getDistVertArray(ref_mesh, cage_mesh)
            for (let i = 0; i < ref_mesh.coreMesh.verts.length; i++) {
                const distVert = distVertArr[i]
                if (distVert) {
                    const refVert = ref_mesh.coreMesh.verts[i]
                    const diff = magnitude(minus(refVert.position, distVert.position))
                    if (diff > 0.001) {
                        referenceAndCageIdentical = false
                        break
                    }
                }
            }

            if (!referenceAndCageIdentical) {
                //offset ref_mesh
                offsetMesh(ref_mesh, this.layerDesc.referenceOrigin)

                //create destination cage
                let dist_mesh = ref_mesh.clone()
                if (!dist_mesh) {
                    throw new Error("this.layerDesc.reference is missing! That shouldn't be possible...")
                }

                //get target mesh
                const targetMeshes = await this.modelLayersDesc.compileTargetMeshes()
                if (!targetMeshes || (targetMeshes instanceof Response)) {
                    return targetMeshes
                }

                for (let i = 0; i < this.modelLayersDesc.layers.length; i++) {
                    if (this.modelLayersDesc.layers[i].isSame(this.layerDesc)) {
                        dist_mesh = targetMeshes[i]
                        break
                    }
                }

                //layer the clothing
                const layeredClothingCacheId = `${this.mesh}-${this.layerDesc.reference}`

                switch (LAYERED_CLOTHING_ALGORITHM) {
                    case "rbf":
                        { 
                            //autoskin
                            const shouldAutoSkin = this.layerDesc.autoSkin === WrapLayerAutoSkin.EnabledOverride ||
                                                    this.layerDesc.autoSkin === WrapLayerAutoSkin.EnabledPreserve && mesh.skinning.skinnings.length < 1
                            if (AUTO_SKIN_EVERYTHING || shouldAutoSkin) {
                                this.wasAutoSkinned = true
                                const transferTo = ref_mesh.clone() //TODO: fix the issue caused when transferring directly to ref_mesh (rbf deformer fails to deform properly, last equipped body part is ignored or something)
                                transferSkeleton(transferTo, dist_mesh)
                                inheritSkeleton(mesh, transferTo)
                            }

                            //deform the mesh
                            const rbfDeformer = new RBFDeformerPatch(ref_mesh, dist_mesh, mesh)
                            rbfDeformer.affectBones = false
                            await rbfDeformer.solveAsync()
                            rbfDeformer.deformMesh()

                            break
                        }
                    case "linearnormal":
                        layerClothingChunkedNormals(mesh, ref_mesh, dist_mesh, layeredClothingCacheId)
                        break
                    case "linearnormal2":
                        layerClothingChunkedNormals2(mesh, ref_mesh, dist_mesh, layeredClothingCacheId)
                        break
                    case "linear":
                    default:
                        layerClothingChunked(mesh, ref_mesh, dist_mesh, layeredClothingCacheId)
                        break
                }
            }

            the_ref_mesh = undefined
        }

        //let canIncludeSkinning = true
        //if (this.instance?.Prop("Name") === "Head") {
        //    canIncludeSkinning = false
        //}

        this.fileMesh = mesh

        const geometry = fileMeshToTHREEGeometry(the_ref_mesh || mesh, this.canHaveSkinning, this.forceVertexColor)

        //create and add mesh to scene
        let threeMesh = undefined

        if (geometry.attributes.skinWeight) {
            threeMesh = new THREE.SkinnedMesh(geometry)
            threeMesh.frustumCulled = false
        } else {
            threeMesh = new THREE.Mesh(geometry)
        }
        threeMesh.castShadow = true
        threeMesh.geometry = geometry

        threeMesh.scale.set(mesh.size[0], mesh.size[1], mesh.size[2])
        /*
        if (!this.scaleIsRelative) {
            threeMesh.scale.set(this.size.X, this.size.Y, this.size.Z)
        } else {
            const oldSize = mesh.size
            threeMesh.scale.set(this.size.X / oldSize[0], this.size.Y / oldSize[1], this.size.Z / oldSize[2])
        }
        */

        this.compilationTimestamp = Date.now() / 1000

        return threeMesh
    }

    fromInstance(child: Instance) {
        if (!RenderedClassTypes.includes(child.className)) {
            return
        }

        this.instance = child

        switch (child.className) {
            case "Part": {
                this.fromPart(child)
    
                break
            }
            case "MeshPart": {
                this.fromMeshPart(child)

                break
            }
        }
    }

    fromPart(child: Instance) {
        this.canHaveSkinning = false

        const specialMesh = child.FindFirstChildOfClass("SpecialMesh")
        if (specialMesh) {
            //this.size = specialMesh.Property("Scale") as Vector3

            switch (specialMesh.Property("MeshType")) {
                case MeshType.FileMesh: {
                    this.mesh = specialMesh.Property("MeshId") as string
                    break
                }
                case MeshType.Head: {
                    this.mesh = "rbxasset://avatar/heads/head.mesh"
                    //this.size = this.size.multiply(new Vector3(0.8, 0.8, 0.8))
                    break
                } //TODO: add the rest of the mesh types
                default: {
                    console.warn(`MeshType ${specialMesh.Property("MeshType")} is not supported`)
                    break
                }
            }

            const textureId = specialMesh.Prop("TextureId") as string
            if (textureId.length > 0) {
                const vertexColor = specialMesh.Prop("VertexColor") as Vector3
                this.forceVertexColor = vertexColor.clone()
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
                } else { //This should never happen, r15 characters use meshparts

                }
            } else { //TODO: render as regular part (cube, cylinder, sphere, etc.)

            }
        }
    }

    fromMeshPart(child: Instance) {
        this.canHaveSkinning = true

        const meshIdStr = child.Property("MeshId") as string

        this.mesh = meshIdStr
        //this.size = child.Property("Size") as Vector3
        this.scaleIsRelative = true

        //check for surface appearance
        const surfaceAppearance = child.FindFirstChildOfClass("SurfaceAppearance")
        if (surfaceAppearance) {
            const color = surfaceAppearance.HasProperty("Color") ? surfaceAppearance.Prop("Color") as Color3 : new Color3(1,1,1)
            const colorMap = surfaceAppearance.Prop("ColorMap") as string

            if (colorMap.length > 0) {
                this.forceVertexColor = new Vector3(color.R, color.G, color.B)
            }
        }

        //find model
        let model = undefined
        if (child.parent?.className === "Model") {
            model = child.parent
        }
        if (child.parent?.parent?.className === "Model") {
            model = child.parent.parent
        }

        //head mesh
        if (model) {
            const head = model.FindFirstChild("Head")
            if (head && head.className === "MeshPart") {
                this.headMesh = head.Prop("MeshId") as string
            }
        }

        //wrap layer
        const wrapLayer = child.FindFirstChildOfClass("WrapLayer")
        const wrapDeformer = child.FindFirstChildOfClass("WrapDeformer")
        const wrapTarget = child.FindFirstChildOfClass("WrapTarget")

        if (wrapLayer && model) {
            this.scaleIsRelative = false
            //this.size = new Vector3(1,1,1)
            const layerOrder = wrapLayer.Prop("Order") as number
            const deformationReference = wrapLayer.Prop("ReferenceMeshId") as string
            const referenceOrigin = wrapLayer.Prop("ReferenceOrigin") as CFrame
            const deformationCage = wrapLayer.Prop("CageMeshId") as string
            const cageOrigin = wrapLayer.Prop("CageOrigin") as CFrame

            this.layerDesc = new WrapLayerDesc(deformationReference, referenceOrigin, deformationCage, cageOrigin)
            if (wrapLayer.HasProperty("AutoSkin")) {
                this.layerDesc.autoSkin = wrapLayer.Prop("AutoSkin") as number
            }
            this.layerDesc.order = layerOrder
            
            this.modelLayersDesc = getModelLayersDesc(model)
        } else if (wrapDeformer && wrapTarget) {
            this.scaleIsRelative = false

            const cage = wrapTarget.Prop("CageMeshId") as string
            const cageOrigin = wrapTarget.Prop("CageOrigin") as CFrame

            const targetCage = wrapDeformer.Prop("CageMeshId") as string
            const targetCageOrigin = wrapDeformer.Prop("CageOrigin") as CFrame

            this.deformerDesc = new WrapDeformerDesc(cage, cageOrigin, targetCage, targetCageOrigin)
        }
    }
}

declare global {
    interface Window {
        fileMeshToTHREEGeometry: typeof fileMeshToTHREEGeometry;
    }
}
window.fileMeshToTHREEGeometry = fileMeshToTHREEGeometry
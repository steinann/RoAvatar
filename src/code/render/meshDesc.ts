import * as THREE from 'three'
import { BodyPartNameToEnum, HumanoidRigType, MeshType, RenderedClassTypes } from "../rblx/constant"
import { CFrame, Color3, Instance, isAffectedByHumanoid, Vector3 } from "../rblx/rbx"
import { API, Authentication } from '../api'
import { traverseRigCFrame } from '../rblx/scale'
import { FileMesh } from '../rblx/mesh'
import { deformReferenceToBaseBodyParts, layerClothingChunked, layerClothingChunkedNormals2, layerClothingChunkedNormals, offsetMesh, mergeTargetWithReference } from '../rblx/mesh-deform'
import { LAYERED_CLOTHING_ALGORITHM, USE_LEGACY_SKELETON, USE_VERTEX_COLOR } from '../misc/flags'
import { BoneNameToIndex } from './legacy-skeleton'
import { RBFDeformerPatch } from '../rblx/cage-mesh-deform'
//import { OBJExporter } from 'three/examples/jsm/Addons.js'
//import { download } from '../misc/misc'

//const CACHE_cage = new Map<Instance, Promise<[MeshDesc, FileMesh]>>()

function arrIsSameOrder<T>(arr0: T[], arr1: T[]) {
    if (arr0.length !== arr1.length) {
        return false
    }

    for (let i = 0; i < arr0.length; i++) {
        if (arr0[i] !== arr1[i]) {
            return false
        }
    }

    return true
}

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

function arrIsSameWrapLayer(arr0: WrapLayerDesc[], arr1: WrapLayerDesc[]) {
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

function fileMeshToTHREEGeometry(mesh: FileMesh, canIncludeSkinning = true, forceVertexColor?: Vector3) {
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

async function promiseForMesh(url: string, auth: Authentication, readOnly: boolean = false): Promise<[string, Response | FileMesh]> {
    return new Promise((resolve) => {
        API.Asset.GetMesh(url, undefined, auth, readOnly).then(result => {
            resolve([url, result])
        })
    })
}

class WrapLayerDesc {
    reference: string
    referenceOrigin: CFrame
    cage: string
    cageOrigin: CFrame

    //temporary, order of array is used instead
    order?: number

    isSame(other: WrapLayerDesc) {
        return this.reference === other.reference &&
                this.referenceOrigin.isSame(other.referenceOrigin) &&
                this.cage === other.cage &&
                this.cageOrigin.isSame(other.cageOrigin)
    }

    constructor(reference: string, referenceOrigin: CFrame, cage: string, cageOrigin: CFrame) {
        this.reference = reference
        this.referenceOrigin = referenceOrigin
        this.cage = cage
        this.cageOrigin = cageOrigin
    }
}

export class MeshDesc {
    //size: Vector3 = new Vector3(1,1,1)
    scaleIsRelative: boolean = false
    mesh?: string
    canHaveSkinning: boolean = true
    forceVertexColor: Vector3 | undefined

    //layering
    layerDesc?: WrapLayerDesc

    targetCages?: string[]
    targetCFrames?: CFrame[]
    targetSizes?: Vector3[]

    enclosedLayers?: WrapLayerDesc[]

    //result data
    compilationTimestamp: number = -1
    instance?: Instance
    fileMesh?: FileMesh

    dispose() {
        this.instance = undefined
    }

    isSame(other: MeshDesc) {
        const singularTrue = //this.size.isSame(other.size) &&
            this.scaleIsRelative === other.scaleIsRelative &&
            this.mesh === other.mesh &&
            this.canHaveSkinning === other.canHaveSkinning
        
        if (!singularTrue) {
            return singularTrue
        }

        if ((this.layerDesc && !other.layerDesc) || (!this.layerDesc && other.layerDesc)) {
            return false
        }

        if ((!this.targetCages && other.targetCages) || (this.targetCages && !other.targetCages)) {
            return false
        }

        if ((!this.targetCFrames && other.targetCFrames) || (this.targetCFrames && !other.targetCFrames)) {
            return false
        }

        if ((!this.targetSizes && other.targetSizes) || (this.targetSizes && !other.targetSizes)) {
            return false
        }

        if ((!this.enclosedLayers && other.enclosedLayers) || (this.enclosedLayers && !other.enclosedLayers)) {
            return false
        }

        if ((!this.forceVertexColor && other.forceVertexColor) || (this.forceVertexColor && !other.forceVertexColor)) {
            return false
        }

        if (this.layerDesc && other.layerDesc) {
            if (!this.layerDesc.isSame(other.layerDesc)) {
                return false
            }
        }

        if (this.targetCages && other.targetCages) {
            if (!arrIsSameOrder(this.targetCages, other.targetCages)) {
                return false
            }
        }

        if (this.targetCFrames && other.targetCFrames) {
            if (!arrIsSameCF(this.targetCFrames, other.targetCFrames)) {
                return false
            }
        }

        if (this.targetSizes && other.targetSizes) {
            if (!arrIsSameVector3(this.targetSizes, other.targetSizes)) {
                return false
            }
        }

        if (this.enclosedLayers && other.enclosedLayers) {
            if (!arrIsSameWrapLayer(this.enclosedLayers, other.enclosedLayers)) {
                return false
            }
        }

        if (this.forceVertexColor && other.forceVertexColor) {
            if (!this.forceVertexColor.isSame(other.forceVertexColor)) {
                return false
            }
        }

        return true
    }

    async compileMesh(auth: Authentication): Promise<THREE.Mesh | THREE.SkinnedMesh | Response | undefined> {
        if (!this.mesh) {
            return undefined
        }

        const meshToLoad = this.mesh

        const mesh = await API.Asset.GetMesh(meshToLoad, undefined, auth)
        if (mesh instanceof Response) {
            return mesh
        }

        let the_ref_mesh = undefined

        //layered clothing
        if (this.layerDesc && this.targetCages && this.targetCFrames && this.targetSizes && this.enclosedLayers) {
            //load meshes
            const meshMap = new Map<string,FileMesh>()

            const meshPromises: (Promise<[string, Response | FileMesh]>)[] = []
            
            meshPromises.push(promiseForMesh(this.layerDesc.cage, auth, true))
            meshPromises.push(promiseForMesh(this.layerDesc.reference, auth))
            for (const targetCage of this.targetCages) {
                meshPromises.push(promiseForMesh(targetCage, auth, true))
            }
            for (const enclosedLayer of this.enclosedLayers) {
                meshPromises.push(promiseForMesh(enclosedLayer.cage, auth))
                meshPromises.push(promiseForMesh(enclosedLayer.reference, auth))
            }

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
            console.log(ref_mesh.coreMesh.verts.length - ref_mesh.coreMesh.removeDuplicateVertices(0.01))

            //create destination cage
            const dist_mesh = ref_mesh.clone()
            if (!dist_mesh) {
                throw new Error("this.layerDesc.reference is missing! That shouldn't be possible...")
            }

            //deform to body
            const targetCages: FileMesh[] = []
            for (const targetCageUrl of this.targetCages) {
                const targetCage = meshMap.get(targetCageUrl)
                if (!targetCage) {
                    throw new Error("targetCage is missing! not possible...")
                }
                targetCages.push(targetCage)
            }

            deformReferenceToBaseBodyParts(dist_mesh, targetCages, this.targetSizes, this.targetCFrames)

            /*
            // remove the ref_mesh.coreMesh.removeDuplicateVertices(0.01) line and add this back to easily generate inner cage meshes from an avatar body
            const distMeshTHREE = new THREE.Mesh(fileMeshToTHREEGeometry(dist_mesh))
            
            const exporter = new OBJExporter();
            const result = exporter.parse(distMeshTHREE);
            download("cage.obj", result)
            */

            //offset ref_mesh
            offsetMesh(ref_mesh, this.layerDesc.referenceOrigin)

            //deform based on layers under TODO: fix this, i mean it works but its terrible, try compressing inner layers and we should use deformation for this instead of just applying the offset directly (rip performance)
            /*
            for (const enclosedLayer of this.enclosedLayers) {
                const cage = meshMap.get(enclosedLayer.cage)
                const reference = meshMap.get(enclosedLayer.reference)

                if (!cage || !reference) {
                    throw new Error("this isnt possible, shut up typescript")
                }

                offsetMesh(reference, enclosedLayer.referenceOrigin)
                offsetMesh(cage, enclosedLayer.cageOrigin)

                offsetRefMeshLikeInnerAndOuter(dist_mesh, reference, cage)
            }
            */
           //layer clothing, do note that reference meshes are NOT consistent
           for (const enclosedLayer of this.enclosedLayers) {
                const cage = meshMap.get(enclosedLayer.cage)
                const reference = meshMap.get(enclosedLayer.reference)

                if (!cage || !reference) {
                    throw new Error("this isnt possible, shut up typescript")
                }

                offsetMesh(reference, enclosedLayer.referenceOrigin)
                offsetMesh(cage, enclosedLayer.cageOrigin)

                const newReference = reference.clone()
                //deformReferenceToBaseBodyParts(newReference, [dist_mesh], [new Vector3(1,1,1)], [new CFrame()])
                mergeTargetWithReference(newReference, dist_mesh, new Vector3(1,1,1), new CFrame())

                const targetDeformer = new RBFDeformerPatch(reference, newReference, cage)
                await targetDeformer.solveAsync()
                targetDeformer.deformMesh()

                mergeTargetWithReference(dist_mesh, cage, new Vector3(1,1,1), new CFrame())
                /*const rbfDeformer = new RBFDeformerPatch(newReference, cage, dist_mesh)
                await rbfDeformer.solveAsync()
                rbfDeformer.deformMesh()*/
            }

            //layer the clothing
            const layeredClothingCacheId = `${this.mesh}-${this.layerDesc.reference}`

            switch (LAYERED_CLOTHING_ALGORITHM) {
                case "rbf":
                    { 
                        const rbfDeformer = new RBFDeformerPatch(ref_mesh, dist_mesh, mesh)
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

        //wrap layer
        const wrapLayer = child.FindFirstChildOfClass("WrapLayer")

        let model = undefined
        if (child.parent?.className === "Model") {
            model = child.parent
        }
        if (child.parent?.parent?.className === "Model") {
            model = child.parent.parent
        }

        if (wrapLayer && model) {
            this.scaleIsRelative = false
            //this.size = new Vector3(1,1,1)

            const selfLayerOrder = wrapLayer.Prop("Order") as number

            const deformationReference = wrapLayer.Prop("ReferenceMeshId") as string
            const referenceOrigin = wrapLayer.Prop("ReferenceOrigin") as CFrame
            const deformationCage = wrapLayer.Prop("CageMeshId") as string
            const cageOrigin = wrapLayer.Prop("CageOrigin") as CFrame

            this.layerDesc = new WrapLayerDesc(deformationReference, referenceOrigin, deformationCage, cageOrigin)

            this.targetCages = []
            this.targetCFrames = []
            this.targetSizes = []

            //wrap targets
            for (const wrapTarget of model.GetDescendants()) {
                if (wrapTarget.className === "WrapTarget" && wrapTarget.parent && wrapTarget.parent.className === "MeshPart") {
                    const bodyPartCage = wrapTarget.Prop("CageMeshId") as string

                    const bodyPartCageOrigin = wrapTarget.Prop("CageOrigin") as CFrame
                    const bodyPartCFrame = traverseRigCFrame(wrapTarget.parent)
                    const bodyPartTargetCFrame = bodyPartCFrame.multiply(bodyPartCageOrigin)

                    const bodyPartSize = wrapTarget.parent.Prop("Size") as Vector3

                    this.targetCages.push(bodyPartCage)
                    this.targetCFrames.push(bodyPartTargetCFrame)
                    this.targetSizes.push(bodyPartSize)
                }
            }

            //underneath wrap layers
            const underneathLayers: WrapLayerDesc[] = []

            for (const otherWrapLayer of model.GetDescendants()) {
                if (otherWrapLayer.className === "WrapLayer" && otherWrapLayer !== wrapLayer) {
                    const layerOrder = otherWrapLayer.Prop("Order") as number
                    if (layerOrder < selfLayerOrder) {
                        const deformationReference = otherWrapLayer.Prop("ReferenceMeshId") as string
                        const referenceOrigin = otherWrapLayer.Prop("ReferenceOrigin") as CFrame
                        const deformationCage = otherWrapLayer.Prop("CageMeshId") as string
                        const cageOrigin = otherWrapLayer.Prop("CageOrigin") as CFrame

                        const underneathLayer = new WrapLayerDesc(deformationReference, referenceOrigin, deformationCage, cageOrigin)
                        underneathLayer.order = layerOrder
                        underneathLayers.push(underneathLayer)
                    }
                }
            }

            this.enclosedLayers = underneathLayers.sort((a,b) => {return (a.order || 0) - (b.order || 0)})
        }
    }
}

declare global {
    interface Window {
        fileMeshToTHREEGeometry: typeof fileMeshToTHREEGeometry;
    }
}
window.fileMeshToTHREEGeometry = fileMeshToTHREEGeometry
//I FORGOT THAT REFERENCE MESHES ARENT CONSISTENT SO THIS WONT WORK EASILY...

import type { Authentication } from "../api"
import { RBFDeformerPatch } from "../rblx/cage-mesh-deform"
import { FileMesh } from "../rblx/mesh"
import { mergeTargetWithReference, offsetMesh, scaleMesh } from "../rblx/mesh-deform"
import { CFrame, Vector3, type Instance } from "../rblx/rbx"
import { traverseRigCFrame } from "../rblx/scale"
import { promiseForMesh } from "./meshDesc"

const modelLayers = new Map<Instance,ModelLayersDesc>()

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

    for (let i = 0; i < arr0.length; i++) {
        if (arr0[i] && !arr1[i]) {
            return false
        }
        if (!arr0[i].isSame(arr1[i])) {
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

export class WrapLayerDesc {
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

export class ModelLayersDesc {
    targetCages?: string[]
    targetCFrames?: CFrame[]
    targetSizes?: Vector3[]

    layers?: WrapLayerDesc[]

    //requires compilation
    _targetMeshes?: Promise<FileMesh[] | Response | undefined>

    isSame(other: ModelLayersDesc) {
        if ((!this.targetCages && other.targetCages) || (this.targetCages && !other.targetCages)) {
            return false
        }

        if ((!this.targetCFrames && other.targetCFrames) || (this.targetCFrames && !other.targetCFrames)) {
            return false
        }

        if ((!this.targetSizes && other.targetSizes) || (this.targetSizes && !other.targetSizes)) {
            return false
        }

        if ((!this.layers && other.layers) || (this.layers && !other.layers)) {
            return false
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

        if (this.layers && other.layers) {
            if (!arrIsSameWrapLayer(this.layers, other.layers)) {
                return false
            }
        }

        return true
    }

    fromModel(model: Instance) {
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
            if (otherWrapLayer.className === "WrapLayer") {
                const layerOrder = otherWrapLayer.Prop("Order") as number
                const deformationReference = otherWrapLayer.Prop("ReferenceMeshId") as string
                const referenceOrigin = otherWrapLayer.Prop("ReferenceOrigin") as CFrame
                const deformationCage = otherWrapLayer.Prop("CageMeshId") as string
                const cageOrigin = otherWrapLayer.Prop("CageOrigin") as CFrame

                const underneathLayer = new WrapLayerDesc(deformationReference, referenceOrigin, deformationCage, cageOrigin)
                underneathLayer.order = layerOrder
                underneathLayers.push(underneathLayer)
            }
        }

        this.layers = underneathLayers.sort((a,b) => {return (a.order || 0) - (b.order || 0)})
    }

    async createTargetMeshes(auth: Authentication) {
        //load meshes
        const meshMap = new Map<string,FileMesh>()

        const meshPromises: (Promise<[string, Response | FileMesh]>)[] = []
        
        if (!this.layers || !this.targetCages || this.targetCages.length <= 0 || !this.targetSizes || !this.targetCFrames) {
            throw new Error("ModelLayersDesc has not had fromModel() called")
        }
        for (const targetCage of this.targetCages) {
            meshPromises.push(promiseForMesh(targetCage, auth, true))
        }
        for (const enclosedLayer of this.layers) {
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

        //create dist_mesh (body cage)
        const dist_mesh = meshMap.get(this.targetCages[0])!.clone()
        scaleMesh(dist_mesh, this.targetSizes[0].divide(new Vector3().fromVec3(dist_mesh.size)))
        offsetMesh(dist_mesh, this.targetCFrames[0])

        for (let i = 1; i < this.targetCages.length; i++) {
            const targetCage = meshMap.get(this.targetCages[i])!.clone()
            scaleMesh(targetCage, this.targetSizes[i].divide(new Vector3().fromVec3(targetCage.size)))
            offsetMesh(targetCage, this.targetCFrames[i])

            dist_mesh.combine(targetCage)
        }
        dist_mesh.coreMesh.removeDuplicateVertices()

        //create cages for layers
        const targetMeshes: FileMesh[] = []
        targetMeshes.push(dist_mesh.clone())

        for (const layer of this.layers) {
            if (layer === this.layers[this.layers.length - 1]) {
                continue
            }

            const cage = meshMap.get(layer.cage)
            const reference = meshMap.get(layer.reference)

            if (!cage || !reference) {
                throw new Error("this isnt possible, shut up typescript")
            }

            offsetMesh(reference, layer.referenceOrigin)
            offsetMesh(cage, layer.cageOrigin)

            //make layer's inner cage match current inner cage
            const newReference = reference.clone()
            mergeTargetWithReference(newReference, dist_mesh, new Vector3(1,1,1), new CFrame())

            //deform layer's outer cage to match the new inner cage
            const targetDeformer = new RBFDeformerPatch(reference, newReference, cage)
            await targetDeformer.solveAsync()
            targetDeformer.deformMesh()

            //merge outer cage with dist_mesh
            mergeTargetWithReference(dist_mesh, cage, new Vector3(1,1,1), new CFrame())

            targetMeshes.push(dist_mesh.clone())
        }

        return targetMeshes
    }

    async compileTargetMeshes(auth: Authentication) {
        if (!this.layers || !this.targetCages || this.targetCages.length <= 0) {
            throw new Error("ModelLayersDesc has not had fromModel() called")
        }

        if (this._targetMeshes) {
            return this._targetMeshes
        }

        this._targetMeshes = new Promise((resolve) => {
            this.createTargetMeshes(auth).then((result) => {
                resolve(result)
            })
        })
        
        return this._targetMeshes
    }
}

export function getModelLayersDesc(model: Instance) {
    const newLayerDesc = new ModelLayersDesc()
    newLayerDesc.fromModel(model)

    const oldLayerDesc = modelLayers.get(model)
    if (oldLayerDesc && newLayerDesc.isSame(oldLayerDesc)) {
        return oldLayerDesc
    } else {
        modelLayers.set(model, newLayerDesc)
        return newLayerDesc
    }
}
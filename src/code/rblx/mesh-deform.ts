import * as THREE from 'three';
import type { FileMesh, FileMeshVertex, Vec3 } from "./mesh"
import { CFrame, Vector3 } from "./rbx"

export function hashVec2(x: number,y: number) {
    return Math.round(x * 100000) + Math.round(y * 100)
}

export function hashVec3(x: number,y: number,z: number, distance: number) {
    const d = distance
    return Math.floor(x / d) * d * 10000000 + Math.floor(y / d) * d * 10000 + Math.floor(z / d) * d
}

export function calculateMagnitude3D(x: number, y: number, z: number) {
    return Math.sqrt(x * x + y * y + z * z);
}

export function magnitude(v: Vec3): number {
    return calculateMagnitude3D(v[0],v[1],v[2])
}

export function floor(v0: Vec3): Vec3 {
    return [Math.floor(v0[0]), Math.floor(v0[1]), Math.floor(v0[2])]
}

export function divide(v0: Vec3, v1: Vec3): Vec3 {
    return [v0[0] / v1[0], v0[1] / v1[1], v0[2] / v1[2]]
}

export function multiply(v0: Vec3, v1: Vec3): Vec3 {
    return [v0[0] * v1[0], v0[1] * v1[1], v0[2] * v1[2]]
}

export function add(v0: Vec3, v1: Vec3): Vec3 {
    return [v0[0] + v1[0], v0[1] + v1[1], v0[2] + v1[2]]
}

export function minus(v0: Vec3, v1: Vec3): Vec3 {
    return [v0[0] - v1[0], v0[1] - v1[1], v0[2] - v1[2]]
}

export function clamp(v0: Vec3, lower: Vec3, higher: Vec3): Vec3 {
    return [
        Math.min(Math.max(lower[0], v0[0]), higher[0]),
        Math.min(Math.max(lower[1], v0[1]), higher[1]),
        Math.min(Math.max(lower[2], v0[2]), higher[2])
    ]
}

export function distance(v0: Vec3, v1: Vec3): number {
    return magnitude(minus(v1, v0))
}

export function gaussian_rbf(v0: Vec3, v1: Vec3,sigma = 0.04) {
    return Math.exp(-((Math.pow(magnitude(minus(v0,v1)),2))/(2*sigma*sigma)))
}

export function getUVtoVertMap(mesh: FileMesh) {
    const map = new Map<number,FileMeshVertex[]>()

    for (const vert of mesh.coreMesh.verts) {
        const uvhash = hashVec2(vert.uv[0], vert.uv[1])
        const arr = map.get(uvhash)
        if (arr) {
            arr.push(vert)
        } else {
            map.set(uvhash, [vert])
        }
    }

    return map
}

export function mergeTargetWithReference(reference: FileMesh, target: FileMesh, targetSize: Vector3, targetCFrame: CFrame) {
    const referenceHashMap = getUVtoVertMap(reference)
    
    for (const vert of target.coreMesh.verts) {
        const hash = hashVec2(vert.uv[0], vert.uv[1])
        
        const refVerts = referenceHashMap.get(hash)
        if (refVerts) {
            for (const refVert of refVerts) {
                const offsetVec3 = targetCFrame.Position
                refVert.position = [vert.position[0] * targetSize.X + offsetVec3[0], vert.position[1] * targetSize.Y + offsetVec3[1], vert.position[2] * targetSize.Z + offsetVec3[2]]
                refVert.normal = [vert.normal[0], vert.normal[1], vert.normal[2]]
            }
        }
    }
}

export function deformReferenceToBaseBodyParts(reference: FileMesh, targetCages: FileMesh[], targetSizes: Vector3[], targetCFrames: CFrame[]) {
    for (let i = 0; i < targetCages.length; i++) {
        const loadedMesh = targetCages[i]
        if (loadedMesh && targetSizes && targetCFrames) {
            mergeTargetWithReference(reference, loadedMesh, targetSizes[i].divide(new Vector3().fromVec3(loadedMesh.size)), targetCFrames[i])
        }
    }
}

//TODO: use new algorithm that accounts for normals
export function offsetRefMeshLikeInnerAndOuter(ref_mesh: FileMesh, inner: FileMesh, outer: FileMesh) {
    const refMeshVertHashMap = getUVtoVertMap(ref_mesh)
    const outerVertHashMap = getUVtoVertMap(outer)

    for (const vert of inner.coreMesh.verts) {
        const vertHash = hashVec2(vert.uv[0], vert.uv[1])
        const outerVerts = outerVertHashMap.get(vertHash)
        if (outerVerts) {
            const outerVert = outerVerts[0]
            if (outerVert) {
                const offset = minus(outerVert.position, vert.position)
                const refMeshVerts = refMeshVertHashMap.get(vertHash)
                if (refMeshVerts) {
                    for (const refVert of refMeshVerts) {
                        refVert.position = add(refVert.position, offset)
                    }
                }
            }
        }
    }
}

export function offsetMesh(mesh: FileMesh, cframe: CFrame) {
    for (const vert of mesh.coreMesh.verts) {
        vert.position = add(vert.position, cframe.Position)
    }
}

export function scaleMesh(mesh: FileMesh, scale: Vector3) {
    for (const vert of mesh.coreMesh.verts) {
        vert.position = new Vector3().fromVec3(vert.position).multiply(scale).toVec3()
    }
}

export function offsetMeshWithRotation(mesh: FileMesh, cframe: CFrame) {
    for (const vert of mesh.coreMesh.verts) {
        const vertCF = new CFrame(vert.position[0], vert.position[1], vert.position[2])
        vert.position = cframe.multiply(vertCF).Position
    }
}

export function getOffsetMap(inner: FileMesh, outer: FileMesh) {
    const offsetMap = new Map<number,Vec3>()
    const outerVertHashMap = getUVtoVertMap(outer)
    for (const vert of inner.coreMesh.verts) {
        const vertHash = hashVec2(vert.uv[0], vert.uv[1])
        const outerVerts = outerVertHashMap.get(vertHash)
        if (outerVerts) {
            const outerVert = outerVerts[0]
            if (outerVert) {
                const offset = minus(outerVert.position, vert.position)
                offsetMap.set(vertHash, offset)
            }
        }
    }

    return offsetMap
}

export function getOffsetArray(inner: FileMesh, outer: FileMesh) {
    const offsetArray: ([Vec3, THREE.Quaternion, number] | undefined)[] = new Array(inner.coreMesh.verts.length)
    const outerVertHashMap = getUVtoVertMap(outer)
    for (let i = 0; i < inner.coreMesh.verts.length; i++) {
        const vert = inner.coreMesh.verts[i]
        const vertHash = hashVec2(vert.uv[0], vert.uv[1])
        const outerVerts = outerVertHashMap.get(vertHash)
        if (outerVerts) {
            const outerVert = outerVerts[0]
            if (outerVert) {
                const offset = minus(outerVert.position, vert.position)
                const innerNormal = new THREE.Vector3(vert.normal[0], vert.normal[1], vert.normal[2])
                const outerNormal = new THREE.Vector3(outerVert.normal[0], outerVert.normal[1], outerVert.normal[2])

                const quat = new THREE.Quaternion().setFromUnitVectors(innerNormal, outerNormal)

                offsetArray[i] = [offset, quat, outerNormal.length() / innerNormal.length()]
            } else {
                offsetArray[i] = undefined
            }
        } else {
            offsetArray[i] = undefined
        }
    }

    return offsetArray
}

async function Wait(time: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(time)
        }, time*1000)
    })
}

type MeshChunk = {
    pos: Vec3,
    indices: number[],
}

export type WeightChunk = {
    meshChunk: MeshChunk,
    weights: number[]
}


function toChunkPos(v0: Vec3, size: Vec3, widthSplit: number, heightSplit: number, depthSplit: number, lowerBound: Vec3, higherBound: Vec3): Vec3 {
    const offsetV0 = add(v0, multiply(size, [0.5, 0.5, 0.5]))
    //console.log(offsetV0)
    const normalizedV0 = divide(offsetV0, size)
    //console.log(normalizedV0)
    const sizedV0 = multiply(normalizedV0, [widthSplit, heightSplit, depthSplit])
    //console.log(sizedV0)
    const clampedV0 = clamp(sizedV0, lowerBound, higherBound)
    //console.log(clampedV0)
    return clampedV0
}


export function createWeightsForMeshChunked(mesh: FileMesh, ref_mesh: FileMesh) {
    const sigma = ref_mesh.size[2] / 0.838 * 0.04
    
    //create base chunks
    const widthSplit = 14
    const heightSplit = 16
    const depthSplit = 1

    const lowerBound: Vec3 = [0,0,0]
    const higherBound: Vec3 = [widthSplit - 1, heightSplit - 1, depthSplit - 1]

    const baseChunks: MeshChunk[] = new Array(widthSplit * heightSplit * depthSplit)
    let i = 0;
    for (let x = 0; x < widthSplit; x++) {
        for (let y = 0; y < heightSplit; y++) {
            for (let z = 0; z < depthSplit; z++) {
                const baseChunk: MeshChunk = {
                    pos: [x,y,z],
                    indices: [],
                }

                baseChunks[i] = baseChunk
                i++
            }
        }
    }

    let [meshLowerBound, meshHigherBound] = mesh.bounds
    meshLowerBound = toChunkPos(meshLowerBound, mesh.size, widthSplit, heightSplit, depthSplit, lowerBound, higherBound)
    meshHigherBound = toChunkPos(meshHigherBound, mesh.size, widthSplit, heightSplit, depthSplit, lowerBound, higherBound)
    /*meshLowerBound[0] -= 1
    meshLowerBound[1] -= 1
    meshLowerBound[2] -= 1
    meshHigherBound[0] += 1
    meshHigherBound[1] += 1
    meshHigherBound[2] += 1*/

    const usedBaseChunks: MeshChunk[] = []
    for (let i = 0; i < baseChunks.length; i++) {
        const baseChunk = baseChunks[i]
        if (baseChunk.pos[0] >= meshLowerBound[0] && baseChunk.pos[1] >= meshLowerBound[1] && baseChunk.pos[2] >= meshLowerBound[2] &&
            baseChunk.pos[0] <= meshHigherBound[0] && baseChunk.pos[1] <= meshHigherBound[1] && baseChunk.pos[2] <= meshHigherBound[2]
        ) {
            usedBaseChunks.push(baseChunk)
        }
    }
    
    /*
    const vert = ref_mesh.coreMesh.verts[2]
    const chunkPos = clamp(floor(multiply(divide(add(vert.position, multiply(ref_mesh.size,[0.5,0.5,0.5])), ref_mesh.size), [widthSplit, heightSplit, depthSplit])), lowerBound, higherBound)    

    console.log(vert.position, ref_mesh.size)
    console.log(chunkPos)
    console.log("---")
    console.log(toChunkPos(vert.position, ref_mesh.size, widthSplit, heightSplit, depthSplit, lowerBound, higherBound))
    */

    for (let i = 0; i < ref_mesh.coreMesh.verts.length; i++) {
        const vert = ref_mesh.coreMesh.verts[i]
        const chunkPos = clamp(minus(multiply(divide(add(vert.position, multiply(ref_mesh.size,[0.5,0.5,0.5])), ref_mesh.size), [widthSplit, heightSplit, depthSplit]), [0.5,0.5,0.5]), lowerBound, higherBound)

        for (let j = 0; j < usedBaseChunks.length; j++) {
            const baseChunk = usedBaseChunks[j]
            if (distance(baseChunk.pos, chunkPos) <= Math.sqrt(3)) {
                baseChunk.indices.push(i)
            }
        }
    }

    //calculate weights (using parallel worker, WAY slower after testing, probably because it copies data?)
    /*console.log(mesh.size)
    console.log(ref_mesh.size)

    const myWorker = new Worker(new URL("./mesh-deform-weight-worker.ts", import.meta.url), {type: 'module'});
    myWorker.postMessage({id: 0, mesh, ref_mesh, baseChunks, heightSplit, depthSplit, widthSplit, sigma, lowerBound, higherBound, start_i: 0, end_i: Math.floor(mesh.coreMesh.verts.length)})
    myWorker.postMessage({id: 1, mesh, ref_mesh, baseChunks, heightSplit, depthSplit, widthSplit, sigma, lowerBound, higherBound, start_i: Math.floor(mesh.coreMesh.verts.length), end_i: mesh.coreMesh.verts.length})

    const [weightChunks0, weightChunks1] = await new Promise<[WeightChunk[], WeightChunk[]]>(resolve => {
        let weightChunks0: WeightChunk[] | undefined = undefined
        let weightChunks1: WeightChunk[] | undefined

        myWorker.onmessage = (event) => {
            const {id, weightChunks}: {id: number, weightChunks: WeightChunk[]} = event.data
            if (id === 0) {
                weightChunks0 = weightChunks
            } else if (id === 1) {
                weightChunks1 = weightChunks
            }

            if (weightChunks0 && weightChunks1) {
                resolve([weightChunks0, weightChunks1])
            }
        }
    })
    
    const weightChunks = [...weightChunks0, ...weightChunks1]*/

    //calculate weights
    const weightChunks: WeightChunk[] = new Array(mesh.coreMesh.verts.length)

    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        const vert = mesh.coreMesh.verts[i]
        const chunkPos = clamp(floor(multiply(divide(add(vert.position, multiply(ref_mesh.size,[0.5,0.5,0.5])), ref_mesh.size), [widthSplit, heightSplit, depthSplit])), lowerBound, higherBound)
        const [x,y,z] = chunkPos

        const baseChunk = baseChunks[x * (heightSplit * depthSplit) + y * depthSplit + z]
        const weights = new Array(baseChunk.indices.length)
        let weightSum = 0

        for (let i = 0; i < baseChunk.indices.length; i++) {
            const index = baseChunk.indices[i]
            const weight = gaussian_rbf(vert.position, ref_mesh.coreMesh.verts[index].position, sigma)
            weightSum += weight
            weights[i] = weight
        }

        if (weightSum !== 0) {
            for (let i = 0; i < weights.length; i++) {
                weights[i] /= weightSum
            }
        }

        const weightChunk = {
            meshChunk: baseChunk,
            weights: weights,
        }

        weightChunks[i] = weightChunk
    }

    return weightChunks
}

/**THIS FUNCTION IS SO EXPENSIVE IT NEEDS TO BE ASYNC SO JS DOESNT CRASH; TODO: OPTIMIZE!!!
*/
export async function createWeightsForMesh(mesh: FileMesh, ref_mesh: FileMesh) {
    //actual depth / expected depth * a number that worked well for normally sized ref_meshes
    let lastWait = Date.now()
    const sigma = ref_mesh.size[2] / 0.838 * 0.04

    const meshVertWeights: (number[])[] = new Array(mesh.coreMesh.verts.length)
    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        meshVertWeights[i] = new Array(ref_mesh.coreMesh.verts.length)
    }

    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        const v0 = mesh.coreMesh.verts[i].position

        for (let j = 0; j < ref_mesh.coreMesh.verts.length; j++) {
            const v1 = ref_mesh.coreMesh.verts[j].position
            const weight = gaussian_rbf(v0,v1,sigma)
            meshVertWeights[i][j] = weight
        }

        const sum = meshVertWeights[i].reduce((accumulator: number, currentValue: number) => accumulator + currentValue, 0);
        for (let j = 0; j < ref_mesh.coreMesh.verts.length; j++) {
            meshVertWeights[i][j] = meshVertWeights[i][j] / sum
        }

        if (Date.now() - lastWait > 1000 / 20) {
            await Wait(1 / 20)
            lastWait = Date.now()
        }
    }

    return meshVertWeights
}

//TODO: use new algorithm that accounts for normals
export async function layerClothing(mesh: FileMesh, ref_mesh: FileMesh, dist_mesh: FileMesh) {
    console.time("total")

    const offsetMap = getOffsetMap(ref_mesh, dist_mesh)
    const allWeights = await createWeightsForMesh(mesh, ref_mesh)

    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        const vert = mesh.coreMesh.verts[i]

        let totalOffset: Vec3 = [0,0,0]
        const weights = allWeights[i]

        for (let j = 0; j < ref_mesh.coreMesh.verts.length; j++) {
            const ref_vert = ref_mesh.coreMesh.verts[j]
            const ref_vertHash = hashVec2(ref_vert.uv[0], ref_vert.uv[1])
            const weight = weights[j]
            let offset = offsetMap.get(ref_vertHash)
            if (offset) {
                offset = multiply(offset, [weight,weight,weight])
                totalOffset = add(totalOffset, offset)
            }
        }

        vert.position = add(vert.position, totalOffset)
    }
    console.timeEnd("total")
}

//discover new algorithm that works better
export function layerClothingChunked(mesh: FileMesh, ref_mesh: FileMesh, dist_mesh: FileMesh) {
    console.time("total")

    //TODO: actually get a better algorithm instead of cheating like this, (dist_mesh is inflated to avoid clipping)
    console.time("inflation")
    /*
    for (let i = 0; i < ref_mesh.coreMesh.verts.length; i++) {
        const ref_vert = ref_mesh.coreMesh.verts[i]
        const dist_vert = dist_mesh.coreMesh.verts[i]

        const xSim = mapNum(ref_vert.normal[0] * dist_vert.normal[0], -1, 1, 1, 0)
        const ySim = mapNum(ref_vert.normal[1] * dist_vert.normal[1], -1, 1, 1, 0)
        const zSim = mapNum(ref_vert.normal[2] * dist_vert.normal[2], -1, 1, 1, 0)

        dist_vert.position = add(dist_vert.position, multiply(dist_vert.normal, [0.05, 0.05, 0.05]))
        dist_vert.position = add(dist_vert.position, multiply(dist_vert.normal, [0.5 * xSim,0.5 * ySim,0.5 * zSim]))
    }
    */

    for (const vert of dist_mesh.coreMesh.verts) {
        vert.position = add(vert.position, multiply(vert.normal, [0.05,0.05,0.05]))
    }
    console.timeEnd("inflation")

    console.time("offsetArray")
    const offsetArray = getOffsetArray(ref_mesh, dist_mesh)
    console.timeEnd("offsetArray")
    console.time("weights")
    const allWeights = createWeightsForMeshChunked(mesh, ref_mesh)
    console.timeEnd("weights")

    console.time("offset")


    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        const vert = mesh.coreMesh.verts[i]

        let totalOffset: Vec3 = [0,0,0]
        
        const weights = allWeights[i]

        for (let j = 0; j < weights.meshChunk.indices.length; j++) {
            const weight = weights.weights[j]
            const index = weights.meshChunk.indices[j]

            const offsetInfo = offsetArray[index]
            if (offsetInfo) {
                const [offset] = offsetInfo
                totalOffset = add(totalOffset, multiply(offset, [weight,weight,weight]))
            }
        }

        vert.position = add(vert.position, totalOffset)
    }
    console.timeEnd("offset")

    console.timeEnd("total")
}


//ANOTHER experimental algorithm that didnt work well
/*
export function layerClothingChunked(mesh: FileMesh, ref_mesh: FileMesh, dist_mesh: FileMesh) {
    console.time("total")

    console.time("offsetArray")
    const offsetArray = getOffsetArray(ref_mesh, dist_mesh)
    console.timeEnd("offsetArray")
    console.time("weights")
    const allWeights = createWeightsForMeshChunked(mesh, ref_mesh)
    console.timeEnd("weights")

    console.time("offset")

    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        const vert = mesh.coreMesh.verts[i]

        //ref_mesh -> mesh
        let totalFromRefOffset: Vec3 = [0,0,0]
        
        const weights = allWeights[i]

        for (let j = 0; j < weights.meshChunk.indices.length; j++) {
            const weight = weights.weights[j]
            const index = weights.meshChunk.indices[j]
            const ref_vert = ref_mesh.coreMesh.verts[index]

            const offsetInfo = offsetArray[index]

            if (offsetInfo) {
                const offset = offsetInfo[0]
                const quat = offsetInfo[1]

                const toRotateOffset = minus(vert.position, ref_vert.position)
                const rotatedOffsetTHREE = new THREE.Vector3(toRotateOffset[0], toRotateOffset[1], toRotateOffset[2]).applyQuaternion(quat)
                const rotatedOffset: Vec3 = multiply([rotatedOffsetTHREE.x, rotatedOffsetTHREE.y, rotatedOffsetTHREE.z], [weight,weight,weight])

                const toAdd = multiply(add(ref_mesh.coreMesh.verts[index].position,offset), [weight,weight,weight])
                totalFromRefOffset = add(totalFromRefOffset,add(rotatedOffset,toAdd))
            }
        }

        vert.position = totalFromRefOffset
    }

    console.timeEnd("offset")

    console.timeEnd("total")
}
*/
//Experimental algorithm
/*
    offset0 = (ref_mesh -> mesh)
    mesh = (dist_mesh + offset0)
    also try multiplying offset0 by "weightQuality" (only in bottom)

    this did not work well
*/
/*
export function layerClothingChunked(mesh: FileMesh, ref_mesh: FileMesh, dist_mesh: FileMesh) {
    console.time("total")

    console.time("offsetArray")
    const offsetArray = getOffsetArray(ref_mesh, dist_mesh)
    console.timeEnd("offsetArray")
    console.time("weights")
    const allWeights = createWeightsForMeshChunked(mesh, ref_mesh)
    console.timeEnd("weights")

    console.time("offset")

    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        const vert = mesh.coreMesh.verts[i]

        //ref_mesh -> mesh
        let totalFromRefOffset: Vec3 = [0,0,0]
        
        const weights = allWeights[i]

        for (let j = 0; j < weights.meshChunk.indices.length; j++) {
            const weight = weights.weights[j]
            const index = weights.meshChunk.indices[j]
            const ref_vert = ref_mesh.coreMesh.verts[index]

            const offsetInfo = offsetArray[index]

            if (offsetInfo) {
                const quat = offsetInfo[1]

                const toRotateOffset = multiply(minus(vert.position, ref_vert.position), [weight,weight,weight])
                const rotatedOffsetTHREE = new THREE.Vector3(toRotateOffset[0], toRotateOffset[1], toRotateOffset[2]).applyQuaternion(quat)
                const rotatedOffset: Vec3 = [rotatedOffsetTHREE.x, rotatedOffsetTHREE.y, rotatedOffsetTHREE.z]

                totalFromRefOffset = add(totalFromRefOffset, rotatedOffset)
            }
        }

        //used to get dist_vert from ref_vert
        let totalOffset: Vec3 = [0,0,0]

        for (let j = 0; j < weights.meshChunk.indices.length; j++) {
            const weight = weights.weights[j]
            const index = weights.meshChunk.indices[j]

            const offsetInfo = offsetArray[index]
            if (offsetInfo) {
                const [offset] = offsetInfo
                const toAdd = multiply(add(ref_mesh.coreMesh.verts[index].position,offset), [weight,weight,weight])
                totalOffset = add(totalOffset, toAdd)
            }
        }

        vert.position = add(totalOffset, totalFromRefOffset)
    }

    console.timeEnd("offset")

    console.timeEnd("total")
}
*/
/*
export function layerClothingChunked(mesh: FileMesh, ref_mesh: FileMesh, dist_mesh: FileMesh) {
    console.time("total")

    console.time("offsetArray")
    const offsetArray = getOffsetArray(ref_mesh, dist_mesh)
    console.timeEnd("offsetArray")
    console.time("weights")
    const allWeights = createWeightsForMeshChunked(mesh, ref_mesh)
    console.timeEnd("weights")

    console.time("offset")

    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        const vert = mesh.coreMesh.verts[i]

        //ref_mesh -> mesh
        let totalFromRefOffset: Vec3 = [0,0,0]
        
        const weights = allWeights[i]

        for (let j = 0; j < weights.meshChunk.indices.length; j++) {
            const weight = weights.weights[j]
            const index = weights.meshChunk.indices[j]
            const ref_vert = ref_mesh.coreMesh.verts[index]

            const offsetInfo = offsetArray[index]

            if (offsetInfo) {
                const quat = offsetInfo[1]

                const toRotateOffset = multiply(minus(vert.position, ref_vert.position), [weight,weight,weight])
                const rotatedOffsetTHREE = new THREE.Vector3(toRotateOffset[0], toRotateOffset[1], toRotateOffset[2]).applyQuaternion(quat)
                const rotatedOffset: Vec3 = [rotatedOffsetTHREE.x, rotatedOffsetTHREE.y, rotatedOffsetTHREE.z]

                totalFromRefOffset = add(totalFromRefOffset, rotatedOffset)
            }
        }

        //used to get dist_vert from ref_vert
        let totalX = 0
        let totalY = 0
        let totalZ = 0
        let totalOffset: Vec3 = [0,0,0]

        for (let j = 0; j < weights.meshChunk.indices.length; j++) {
            const weight = weights.weights[j]
            const index = weights.meshChunk.indices[j]

            const offsetInfo = offsetArray[index]
            if (offsetInfo) {
                const [offset] = offsetInfo
                const toAdd = multiply(add(ref_mesh.coreMesh.verts[index].position,offset), [weight,weight,weight])
                totalX += Math.abs(toAdd[0])
                totalY += Math.abs(toAdd[1])
                totalZ += Math.abs(toAdd[2])
                totalOffset = add(totalOffset, toAdd)
            }
        }

        const weightQuality = (Math.abs(totalOffset[0]) / totalX + Math.abs(totalOffset[1]) / totalY + Math.abs(totalOffset[2]) / totalZ) / 3

        const mult = Math.min(Math.max(mapNum(weightQuality, 0.5, 1, 10, 1),1),10)
        console.log(weightQuality, mult)

        vert.position = add(totalOffset, multiply(totalFromRefOffset,[mult,mult,mult]))
    }

    console.timeEnd("offset")

    console.timeEnd("total")
}
*/

//Experimental algorithm that uses normals to determine weight (also didnt work well)
/*
export function layerClothingChunked(mesh: FileMesh, ref_mesh: FileMesh, dist_mesh: FileMesh) {
    console.time("total")

    console.time("offsetArray")
    const offsetArray = getOffsetArray(ref_mesh, dist_mesh)
    console.timeEnd("offsetArray")
    console.time("weights")
    const allWeights = createWeightsForMeshChunked(mesh, ref_mesh)
    console.timeEnd("weights")

    console.time("offset")

    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        const vert = mesh.coreMesh.verts[i]

        let totalOffset: Vec3 = [0,0,0]
        
        const weights = allWeights[i]

        let totalWeight = 0.0001

        for (let j = 0; j < weights.meshChunk.indices.length; j++) {
            const weight = weights.weights[j]
            const index = weights.meshChunk.indices[j]
            
            const offsetInfo = offsetArray[index]
            if (offsetInfo) {
                const [offset, quat] = offsetInfo
                const dot = quat.dot(new THREE.Quaternion())
                const offsetMultiplier = Math.max(0,mapNum(dot, 0.5, 1,0,1))
                totalWeight += offsetMultiplier * weight
                totalOffset = add(totalOffset, multiply(multiply(offset, [weight,weight,weight]),[offsetMultiplier, offsetMultiplier, offsetMultiplier]))
            }
        }

        vert.position = add(vert.position, divide(totalOffset,[totalWeight,totalWeight,totalWeight]))
    }
    console.timeEnd("offset")

    console.timeEnd("total")
}
*/

//Experimental algorithm that uses normals (it didnt work well, im not sure why)
/*
export function layerClothingChunked(mesh: FileMesh, ref_mesh: FileMesh, dist_mesh: FileMesh) {
    console.time("total")

    //console.time("normals")
    //ref_mesh.recalculateNormals()
    //dist_mesh.recalculateNormals()
    //console.timeEnd("normals")

    console.time("offsetArray")
    const offsetArray = getOffsetArray(ref_mesh, dist_mesh)
    console.timeEnd("offsetArray")
    console.time("weights")
    const allWeights = createWeightsForMeshChunked(mesh, ref_mesh)
    console.timeEnd("weights")

    console.time("offset")

    for (let i = 0; i < mesh.coreMesh.verts.length; i++) {
        const vert = mesh.coreMesh.verts[i]

        let originalPosition: Vec3 = [0,0,0]
        let totalOffset: Vec3 = [0,0,0]
        let totalNormalOffset: Vec3 = [0,0,0]
        
        const weights = allWeights[i]

        for (let j = 0; j < weights.meshChunk.indices.length; j++) {
            const weight = weights.weights[j]
            const index = weights.meshChunk.indices[j]
            
            const offsetInfo = offsetArray[index]
            if (offsetInfo) {
                const [offset, quat] = offsetInfo

                //innercage -> outercage offset
                originalPosition = add(originalPosition, multiply(add(ref_mesh.coreMesh.verts[index].position,offset), [weight,weight,weight]))
                totalOffset = add(totalOffset, multiply(offset, [weight,weight,weight]))

                //innercage -> mesh offset (rotated)
                const toRotateOffset = minus(vert.position, ref_mesh.coreMesh.verts[index].position)
                const rotatedOffsetTHREE = new THREE.Vector3(toRotateOffset[0], toRotateOffset[1], toRotateOffset[2]).applyQuaternion(quat)
                const rotatedOffset: Vec3 = [rotatedOffsetTHREE.x, rotatedOffsetTHREE.y, rotatedOffsetTHREE.z]
                totalNormalOffset = add(totalNormalOffset, multiply(rotatedOffset, [weight, weight, weight]))
            }
        }

        vert.position = originalPosition
        //vert.position = add(vert.position, totalOffset)
        vert.position = add(vert.position, totalNormalOffset)
    }
    console.timeEnd("offset")

    console.timeEnd("total")
}
*/
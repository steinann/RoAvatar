import type { FileMesh, FileMeshVertex, Vec3 } from "./mesh"
import { CFrame, Vector3 } from "./rbx"

export function hashVec2(x: number,y: number) {
    return Math.round(x * 100000) + Math.round(y * 100)
}

export function hashVec3(x: number,y: number,z: number, distance: number) {
    const d = distance
    return Math.floor(x / d) * d * 10000000 + Math.floor(y / d) * d * 10000 + Math.floor(z / d) * d
}

function calculateMagnitude3D(x: number, y: number, z: number) {
    return Math.sqrt(x * x + y * y + z * z);
}

function magnitude(v: Vec3): number {
    return calculateMagnitude3D(v[0],v[1],v[2])
}

function multiply(v0: Vec3, v1: Vec3): Vec3 {
    return [v0[0] * v1[0], v0[1] * v1[1], v0[2] * v1[2]]
}

function add(v0: Vec3, v1: Vec3): Vec3 {
    return [v0[0] + v1[0], v0[1] + v1[1], v0[2] + v1[2]]
}

function minus(v0: Vec3, v1: Vec3): Vec3 {
    return [v0[0] - v1[0], v0[1] - v1[1], v0[2] - v1[2]]
}

function gaussian_rbf(v0: Vec3, v1: Vec3,sigma = 0.04) {
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

async function Wait(time: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(time)
        }, time*1000)
    })
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
}
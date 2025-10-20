import type { FileMesh } from "./mesh"

export function hashVec2(x: number,y: number) {
    return Math.round(x * 100000) + Math.round(y * 100)
}

export function hashVec3(x: number,y: number,z: number, distance: number) {
    const d = distance
    return Math.floor(x / d) * d * 10000000 + Math.floor(y / d) * d * 10000 + Math.floor(z / d) * d
}

export function getUVtoVertMap(mesh: FileMesh) {
    const map = new Map()

    for (const vert of mesh.coreMesh.verts) {
        const uvhash = hashVec2(vert.uv[0], vert.uv[1])
        if (map.get(uvhash)) {
            map.get(uvhash).push(vert)
        } else {
            map.set(uvhash, [vert])
        }
    }

    return map
}
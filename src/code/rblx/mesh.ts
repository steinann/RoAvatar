//https://devforum.roblox.com/t/roblox-filemesh-format-specification/326114

import SimpleView from "../lib/simple-view"
import { clonePrimitiveArray } from "../misc/misc"
import { hashVec2, hashVec3 } from "./mesh-deform"

export type Vec4 = [number,number,number,number]
export type Vec3 = [number,number,number]
export type Vec2 = [number,number]

export type Mat3x3 = [number,number,number,number,number,number,number,number,number]
export type Mat4x4 = [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number]

type LodType = "None" | "Unknown" | "RbxSimplifier" | "ZeuxMeshOptimizer"
const LodType: {[K in LodType]: number} = {
    "None": 0,
    "Unknown": 1,
    "RbxSimplifier": 2,
    "ZeuxMeshOptimizer": 3,
}

class FileMeshVertex {
    position: Vec3 //Vector3<float>
    normal: Vec3 //Vector3<float>
    uv: Vec2 //Vector2<float>

    tangent: Vec4 //Vector4<sbyte>

    color: Vec4 //Vector4<byte>

    constructor(position: Vec3 = [0,0,0], normal: Vec3 = [0,0,0], uv: Vec2 = [0,0], tangent: Vec4 = [0,0,0,0], color: Vec4 = [255,255,255,255]) {
        this.position = position
        this.normal = normal
        this.uv = uv
        this.tangent = tangent
        this.color = color
    }

    clone() {
        const copy = new FileMeshVertex()
        copy.position = clonePrimitiveArray(this.position) as Vec3
        copy.normal = clonePrimitiveArray(this.normal) as Vec3
        copy.uv = clonePrimitiveArray(this.uv) as Vec2
        copy.tangent = clonePrimitiveArray(this.tangent) as Vec4
        copy.color = clonePrimitiveArray(this.color) as Vec4

        return copy
    }
}

class FileMeshFace {
    a: number //uint
    b: number //uint
    c: number //uint

    constructor(a: number, b: number, c: number) {
        this.a = a
        this.b = b
        this.c = c
    }

    clone() {
        return new FileMeshFace(this.a, this.b, this.c)
    }
}

class COREMESH {
    numverts: number = 0 //uint
    verts: FileMeshVertex[] = [] //FileMeshVertex[]

    numfaces: number = 0 //uint
    faces: FileMeshFace[] = [] //FileMeshFace[]

    clone() {
        const copy = new COREMESH()
        copy.numverts = this.numverts

        for (const vert of this.verts) {
            copy.verts.push(vert.clone())
        }

        copy.numfaces = this.numfaces

        for (const face of this.faces) {
            copy.faces.push(face.clone())
        }

        return copy
    }

    removeDuplicateVertices(distance = 0.0001): number {
        const toRemove = []
        const posToI = new Map()

        for (let i = 0; i < this.verts.length; i++) {
            const vert = this.verts[i]
            const hashedPos = hashVec3(vert.position[0], vert.position[1], vert.position[2], distance) + hashVec2(vert.uv[0], vert.uv[1])
            const otherI = posToI.get(hashedPos)

            if (otherI) { //merge vertex
                //switch faces to other vertex
                for (const face of this.faces) {
                    if (face.a === i) {
                        face.a = otherI
                    }
                    if (face.b === i) {
                        face.b = otherI
                    }
                    if (face.c === i) {
                        face.c = otherI
                    }
                }
                //schedule vertex for removal
                toRemove.push(vert)
            } else {
                posToI.set(hashedPos, i)
            }
        }

        let removedVertices = 0
        for (const vert of toRemove) {
            const i = this.verts.indexOf(vert)
            if (i >= 0) {
                this.verts.splice(i,1)
                this.numverts = this.verts.length
                removedVertices++
            }
        }
        
        return removedVertices
    }
}

class LODS {
    lodType: number = LodType.Unknown //ushort, 0 = None, 1 = Unknown, 2 = RbxSimplifier, 3 = ZeuxMeshOptimizer
    numHighQualityLODs: number = 0 //byte

    numLodOffsets: number = 0 //uint
    lodOffsets: number[] = [] //uint

    clone() {
        const copy = new LODS()
        copy.lodType = this.lodType
        copy.numHighQualityLODs = this.numHighQualityLODs
        copy.numLodOffsets = this.numLodOffsets
        copy.lodOffsets = clonePrimitiveArray(this.lodOffsets)

        return copy
    }
}

class FileMeshBone {
    boneNameIndex: number = 0 //uint

    parentIndex: number = 0 //ushort
    lodParentIndex: number = 0 //ushort

    culling: number = 0 //float

    rotationMatrix: Mat3x3 = [1,0,0, 0,1,0, 0,0,1] //3x3, world space, y up, -z forward

    position: Vec3 = [0,0,0]

    clone() {
        const copy = new FileMeshBone()
        copy.boneNameIndex = this.boneNameIndex
        copy.parentIndex = this.parentIndex
        copy.lodParentIndex = this.lodParentIndex
        copy.culling = this.culling
        copy.rotationMatrix = clonePrimitiveArray(this.rotationMatrix) as Mat3x3
        copy.position = clonePrimitiveArray(this.position) as Vec3

        return copy
    }
}

class FileMeshSubset {
    facesBegin: number = 0 //uint
    facesLength: number = 0 //uint

    vertsBegin: number = 0 //uint
    vertsLength: number = 0 //uint

    numBoneIndices: number = 0 //uint
    boneIndices: number[] = [] //ushort[26]

    clone() {
        const copy = new FileMeshSubset()
        copy.facesBegin = this.facesBegin
        copy.facesLength = this.facesLength
        copy.vertsBegin = this.vertsBegin
        copy.vertsLength = this.vertsLength
        copy.numBoneIndices = this.numBoneIndices
        copy.boneIndices = clonePrimitiveArray(this.boneIndices)

        return copy
    }
}

class FileMeshSkinning {
    subsetIndices: Vec4 = [0,0,0,0] //byte[4]
    boneWeights: Vec4 = [0,0,0,0] //byte[4]

    clone() {
        const copy = new FileMeshSkinning()
        copy.subsetIndices = clonePrimitiveArray(this.subsetIndices) as Vec4
        copy.boneWeights = clonePrimitiveArray(this.boneWeights) as Vec4

        return copy
    }
}

class SKINNING {
    numSkinnings: number = 0 //uint (same as numVerts)
    skinnings: FileMeshSkinning[] = [] //TODO: check if its actually here in the chunk format, im assuming MaximumADHD forgot to note it down because its not always present OR it was merged with vertices

    numBones: number = 0 //uint
    bones: FileMeshBone[] = [] //FileMeshBone[]

    nameTableSize: number = 0 //uint
    nameTable: string[] = [] //string[]

    numSubsets: number = 0 //uint
    subsets: FileMeshSubset[] = [] //FileMeshSubset[]

    clone() {
        const copy = new SKINNING()

        copy.numSkinnings = this.numSkinnings

        for (const skinning of this.skinnings) {
            copy.skinnings.push(skinning.clone())
        }
        
        copy.numBones = this.numBones

        for (const bone of this.bones) {
            copy.bones.push(bone.clone())
        }

        copy.nameTableSize = this.nameTableSize
        copy.nameTable = clonePrimitiveArray(this.nameTable)

        copy.numSubsets = this.numSubsets
        
        for (const subset of this.subsets) {
            copy.subsets.push(subset.clone())
        }

        return copy
    }
}

function readSubset(view: SimpleView) {
    const subset = new FileMeshSubset()

    subset.facesBegin = view.readUint32()
    subset.facesLength = view.readUint32()

    subset.vertsBegin = view.readUint32()
    subset.vertsLength = view.readUint32()

    subset.numBoneIndices = view.readUint32()
    for (let i = 0; i < 26; i++) subset.boneIndices.push(view.readUint16());

    return subset
}

function readBone(view: SimpleView) {
    const bone = new FileMeshBone()

    bone.boneNameIndex = view.readUint32()

    bone.parentIndex = view.readUint16()
    bone.lodParentIndex = view.readUint16()

    bone.culling = view.readFloat32()

    const newMat: number[] = []
    for (let i = 0; i < 9; i++) newMat.push(view.readFloat32());
    bone.rotationMatrix = newMat as Mat3x3

    bone.position = [view.readFloat32(), view.readFloat32(), view.readFloat32()]

    return bone
}

function readSkinning(view: SimpleView) {
    const skinning = new FileMeshSkinning()

    skinning.subsetIndices = [view.readUint8(),view.readUint8(),view.readUint8(),view.readUint8()]
    skinning.boneWeights = [view.readUint8(),view.readUint8(),view.readUint8(),view.readUint8()]

    return skinning
}

function readVert(view: SimpleView, sizeOf_vert = 40) {
    const position: Vec3 = [view.readFloat32(), view.readFloat32(), view.readFloat32()]
    const normal: Vec3 = [view.readFloat32(), view.readFloat32(), view.readFloat32()]
    const uv: Vec2 = [view.readFloat32(), view.readFloat32()]

    const tangent: Vec4 = [view.readInt8(), view.readInt8(), view.readInt8(), view.readInt8()]

    let color: Vec4 = [255,255,255,255]
    if (sizeOf_vert == 40) {
        color = [view.readUint8(),view.readUint8(),view.readUint8(),view.readUint8()]
    }

    return new FileMeshVertex(position, normal, uv, tangent, color)
}

function readFace(view: SimpleView) {
    const a = view.readUint32()
    const b = view.readUint32()
    const c = view.readUint32()

    return new FileMeshFace(a,b,c)
}

export class FileMesh {
    version!: string //version (at start of file, including \n)
    
    coreMesh!: COREMESH //COREMESH
    lods!: LODS //LODS
    skinning!: SKINNING //SKINNING

    _size?: Vec3 = undefined

    get size() {
        if (!this._size) {
            //max mesh size is 2048 i think? so this should be enough
            let minX = 999999
            let maxX = -999999

            let minY = 999999
            let maxY = -999999

            let minZ = 999999
            let maxZ = -999999

            if (this.coreMesh) {
                for (const vert of this.coreMesh.verts) {
                    const pos = vert.position

                    minX = Math.min(minX, pos[0])
                    maxX = Math.max(maxX, pos[0])

                    minY = Math.min(minY, pos[1])
                    maxY = Math.max(maxY, pos[1])

                    minZ = Math.min(minZ, pos[2])
                    maxZ = Math.max(maxZ, pos[2])
                }
            }

            this._size = [maxX - minX, maxY - minY, maxZ - minZ]
        }

        return this._size
    }

    constructor() {
        this.reset()
    }

    clone() {
        const copy = new FileMesh()
        copy.version = this.version
        copy.coreMesh = this.coreMesh.clone()
        copy.lods = this.lods.clone()
        copy.skinning = this.skinning.clone()

        if (this._size) {
            copy._size = clonePrimitiveArray(this._size) as Vec3
        }

        return copy
    }

    reset() {
        this.version = "version 1.0.0\n"
        this.coreMesh = new COREMESH()
        this.lods = new LODS()
        this.skinning = new SKINNING()
    }

    fromBuffer(buffer: ArrayBuffer) {
        this.reset()

        const view = new SimpleView(buffer)
        const version = view.readUtf8String(13)

        this.version = version

        switch (version) {
            case "version 1.00\r":
            case "version 1.00\n":
            case "version 1.01\r":
            case "version 1.01\n":
                {
                const bufferAsLines = new TextDecoder().decode(buffer).split("\n")
                this.coreMesh.numfaces = Number(bufferAsLines[1])
                this.coreMesh.numverts = this.coreMesh.numfaces * 3

                const vertData = bufferAsLines[2].replaceAll("[","").split("]")
                vertData.pop()

                for (let i = 0; i < this.coreMesh.numfaces; i++) {
                    for (let j = 0; j < 3; j++) {
                        const positionString = vertData[i*9 + j*3]
                        const normalString = vertData[i*9 + j*3 + 1]
                        const uvString = vertData[i*9 + j*3 + 2]

                        const readPosition = positionString.split(",").map((val) => {return Number(val)})
                        const position: Vec3 = [readPosition[0] || 0, readPosition[1] || 0, readPosition[2] || 0]
                        if (version.startsWith("version 1.00")) {
                            position[0] *= 0.5
                            position[1] *= 0.5
                            position[2] *= 0.5
                        }
                        const readNormal = normalString.split(",").map((val) => {return Number(val)})
                        const normal: Vec3 = [readNormal[0] || 0, readNormal[1] || 0, readNormal[2] || 0]
                        const readUv = uvString.split(",").map((val) => {return Number(val)})
                        if (readUv.length > 2) {
                            readUv.pop()
                        }
                        if (readUv[1]) {
                            readUv[1] = 1 - readUv[1]
                        }
                        const uv: Vec2 = [readUv[0] || 0, readUv[1] || 0]

                        const vert = new FileMeshVertex(position, normal, uv)
                        this.coreMesh.verts.push(vert)
                        
                    }

                    this.coreMesh.faces.push(new FileMeshFace(i*3 + 0, i*3 + 1, i*3 + 2))
                }

                break
                }
            case "version 2.00\n":
            case "version 3.00\n":
            case "version 3.01\n":
                {
                view.readUint16() //sizeOf_header
                const sizeOf_vert = view.readUint8() //important, 36 or 40 (without or with color)
                view.readUint8() //sizeOf_face

                //let sizeOf_LodOffset = 0
                let numLodOffsets = 0

                if (!version.startsWith("version 2")) { //has LODs
                    view.readUint16() //sizeOf_LodOffset
                    numLodOffsets = view.readUint16()
                    this.lods.numLodOffsets = numLodOffsets
                }

                this.coreMesh.numverts = view.readUint32()
                this.coreMesh.numfaces = view.readUint32()

                //verts
                for (let i = 0; i < this.coreMesh.numverts; i++) {
                    this.coreMesh.verts.push(readVert(view, sizeOf_vert))
                }

                //faces
                for (let i = 0; i < this.coreMesh.numfaces; i++) {
                    this.coreMesh.faces.push(readFace(view))
                }

                //lodOffsets
                for (let i = 0; i < numLodOffsets; i++) {
                    this.lods.lodOffsets.push(view.readUint32())
                }
                
                break
                }
            case "version 4.00\n":
            case "version 4.01\n":
            case "version 5.00\n": //TODO: actually properly parse v5
                {
                //header
                view.readUint16() //sizeOf_header
                this.lods.lodType = view.readUint16()

                this.coreMesh.numverts = view.readUint32()
                this.coreMesh.numfaces = view.readUint32()

                this.lods.numLodOffsets = view.readUint16()
                this.skinning.numBones = view.readUint16()

                this.skinning.nameTableSize = view.readUint32()
                this.skinning.numSubsets = view.readUint16()

                this.lods.numHighQualityLODs = view.readInt8()
                
                view.readInt8() //padding?

                if (version === "version 5.00\n") {
                    view.viewOffset += 8
                }
                
                //verts
                for (let i = 0; i < this.coreMesh.numverts; i++) {
                    this.coreMesh.verts.push(readVert(view))
                }

                //bones
                if (this.skinning.numBones > 0) {
                    for (let i = 0; i < this.coreMesh.numverts; i++) {
                        this.skinning.skinnings.push(readSkinning(view))
                    }
                }

                //faces
                for (let i = 0; i < this.coreMesh.numfaces; i++) {
                    this.coreMesh.faces.push(readFace(view))
                }

                //lodOffsets
                for (let i = 0; i < this.lods.numLodOffsets; i++) {
                    this.lods.lodOffsets.push(view.readUint32())
                }

                //bones
                for (let i = 0; i < this.skinning.numBones; i++) {
                    this.skinning.bones.push(readBone(view))
                }

                //bone names
                let lastString = ""
                for (let i = 0; i < this.skinning.nameTableSize; i++) {
                    if (view.readUint8() !== 0) {
                        view.viewOffset--;
                        lastString += view.readUtf8String(1)
                    } else {
                        this.skinning.nameTable.push(lastString)
                        lastString = ""
                    }
                }

                //subsets
                for (let i = 0; i < this.skinning.numSubsets; i++) {
                    this.skinning.subsets.push(readSubset(view))
                }

                break
                }
            default:
                console.warn(`Failed to read mesh, unknown version: ${version}`)
        }

        console.log(`Bytes left: ${view.view.byteLength - view.viewOffset}`)
    }
}

/*
fetch("https://assetdelivery.roblox.com/v1/asset?id=3039304183").then((response) => {
    return response.arrayBuffer()
}).then(buffer => {
    let mesh = new FileMesh()
    mesh.fromBuffer(buffer)
    console.log(mesh)
})
*/

/*4.01 mesh list
7603177870
*/

/*3.00 mesh list
4827174023
*/

/*2.00 mesh list
3039304183
*/

/*1.00 mesh list
1555971721 (HAS \r INSTEAD OF \n)
227430350 (same as above)
425078435 (same as above)
*/
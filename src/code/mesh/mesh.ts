//https://devforum.roblox.com/t/roblox-filemesh-format-specification/326114

import SimpleView from "../lib/simple-view"
import { clonePrimitiveArray } from "../misc/misc"
import { add, divide, hashVec2, hashVec3, magnitude, minus } from "./mesh-deform"
import { Vector3 } from "../rblx/rbx"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const DracoDecoderModule: any;

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

export class FileMeshVertex {
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

    getTouchingVerts(index: number) {
        const touchingVerts: number[] = []

        for (const face of this.faces) {
            if (face.a === index || face.b === index || face.c === index) {
                if (face.a !== index && !touchingVerts.includes(face.a)) {
                    touchingVerts.push(face.a)
                }
                if (face.b !== index && !touchingVerts.includes(face.b)) {
                    touchingVerts.push(face.b)
                }
                if (face.c !== index && !touchingVerts.includes(face.c)) {
                    touchingVerts.push(face.c)
                }
            }
        }

        return touchingVerts
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

class HSRAVIS {
    bitFlags: boolean[] = []

    clone() {
        const copy = new HSRAVIS()
        copy.bitFlags = new Array(this.bitFlags.length)
        for (let i = 0; i < this.bitFlags.length; i++) {
            copy.bitFlags[i] = this.bitFlags[i]
        }

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

export class FileMeshSubset {
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

export class FileMeshSkinning {
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

    getBone(boneName: string) {
        const boneIndex = this.nameTable.indexOf(boneName)
        if (boneIndex > -1) {
            return this.bones[boneIndex]
        }
    }

    getSubsetIndex(vertIndex: number) {
        for (let i = 0; i < this.subsets.length; i++) {
            const subset = this.subsets[i]
            if (subset.vertsBegin <= vertIndex && vertIndex < subset.vertsBegin + subset.vertsLength) {
                return i
            }
        }

        console.log(this)
        throw new Error(`There is no subset for vert index ${vertIndex}`)
    }
}

class QuantizedMatrix {
    rows: number
    columns: number

    matrix: number[] //always stored as v1 after read

    //only used when reading from file
    version: number
    v2_min?: number
    v2_max?: number

    constructor(version: number, rows: number, columns: number) {
        this.version = version
        this.rows = rows
        this.columns = columns
        this.matrix = new Array(rows * columns)
    }

    clone() {
        const copy = new QuantizedMatrix(this.version, this.rows, this.columns)
        
        for (let i = 0; i < this.matrix.length; i++) {
            copy.matrix[i] = this.matrix[i]
        }

        copy.v2_min = this.v2_min
        copy.v2_max = this.v2_max

        return copy
    }
}

class QuantizedTransform {
    px: QuantizedMatrix
    py: QuantizedMatrix
    pz: QuantizedMatrix

    rx: QuantizedMatrix
    ry: QuantizedMatrix
    rz: QuantizedMatrix

    constructor(px: QuantizedMatrix, py: QuantizedMatrix, pz: QuantizedMatrix, rx: QuantizedMatrix, ry: QuantizedMatrix, rz: QuantizedMatrix) {
        this.px = px
        this.py = py
        this.pz = pz

        this.rx = rx
        this.ry = ry
        this.rz = rz
    }

    clone() {
        return new QuantizedTransform(this.px.clone(), this.py.clone(), this.pz.clone(), this.rx.clone(), this.ry.clone(), this.rz.clone())
    }
}

type TwoPoseCorrective = Vec2
type ThreePoseCorrective = Vec3

class FACS {
    faceBoneNames: string[] = []
    faceControlNames: string[] = []
    quantizedTransforms?: QuantizedTransform

    twoPoseCorrectives: TwoPoseCorrective[] = []
    threePoseCorrectives: ThreePoseCorrective[] = []

    clone() {
        const copy = new FACS()

        for (const name of this.faceBoneNames) {
            copy.faceBoneNames.push(name)
        }

        for (const name of this.faceControlNames) {
            copy.faceControlNames.push(name)
        }

        if (this.quantizedTransforms) {
            copy.quantizedTransforms = this.quantizedTransforms.clone()
        }

        for (const twoPoseCorrective of this.twoPoseCorrectives) {
            copy.twoPoseCorrectives.push([twoPoseCorrective[0], twoPoseCorrective[1]])
        }

        for (const threePoseCorrective of this.threePoseCorrectives) {
            copy.threePoseCorrectives.push([threePoseCorrective[0], threePoseCorrective[1], threePoseCorrective[2]])
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

    const newMat: number[] = new Array(9)
    for (let i = 0; i < 9; i++) {
        newMat[i] = view.readFloat32()
    }
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
    if (isNaN(position[0])) position[0] = 0
    if (isNaN(position[1])) position[1] = 0
    if (isNaN(position[2])) position[2] = 0

    const normal: Vec3 = [view.readFloat32(), view.readFloat32(), view.readFloat32()]
    if (isNaN(normal[0])) normal[0] = 0
    if (isNaN(normal[1])) normal[1] = 0
    if (isNaN(normal[2])) normal[2] = 0

    const uv: Vec2 = [view.readFloat32(), view.readFloat32()]
    if (isNaN(uv[0])) uv[0] = 0
    if (isNaN(uv[1])) uv[1] = 0

    const tangent: Vec4 = [view.readInt8(), view.readInt8(), view.readInt8(), view.readInt8()]
    if (isNaN(tangent[0])) tangent[0] = 0
    if (isNaN(tangent[1])) tangent[1] = 0
    if (isNaN(tangent[2])) tangent[2] = 0
    if (isNaN(tangent[3])) tangent[3] = 0

    let color: Vec4 = [255,255,255,255]
    if (sizeOf_vert == 40) {
        color = [view.readUint8(),view.readUint8(),view.readUint8(),view.readUint8()]
        if (isNaN(color[0])) color[0] = 0
        if (isNaN(color[1])) color[1] = 0
        if (isNaN(color[2])) color[2] = 0
        if (isNaN(color[3])) color[3] = 0
    }

    return new FileMeshVertex(position, normal, uv, tangent, color)
}

function readFace(view: SimpleView) {
    const a = view.readUint32()
    const b = view.readUint32()
    const c = view.readUint32()

    return new FileMeshFace(a,b,c)
}

function readQuantizedMatrix(view: SimpleView) {
    const version = view.readUint16()
    const rows = view.readUint32()
    const cols = view.readUint32()

    const quantizedMatrix = new QuantizedMatrix(version, rows, cols)

    switch (version) {
        case 1:
            for (let i = 0; i < rows * cols; i++) {
                quantizedMatrix.matrix[i] = view.readFloat32()
            }
            break
        case 2:
        {
            const v2_min = view.readFloat32()
            const v2_max = view.readFloat32()

            quantizedMatrix.v2_min = v2_min
            quantizedMatrix.v2_max = v2_max

            const precision = (v2_max - v2_min) / 65535

            for (let i = 0; i < rows * cols; i++) {
                quantizedMatrix.matrix[i] = v2_min + (view.readUint16() * precision)
            }

            break
        }
        default:
            throw new Error(`Unknown QuantizedMatrix version: ${version}`)
    }

    return quantizedMatrix
}

function readQuantizedTransform(view: SimpleView) {
    const px = readQuantizedMatrix(view)
    const py = readQuantizedMatrix(view)
    const pz = readQuantizedMatrix(view)

    const rx = readQuantizedMatrix(view)
    const ry = readQuantizedMatrix(view)
    const rz = readQuantizedMatrix(view)

    return new QuantizedTransform(px, py, pz, rx, ry, rz)
}

function readFACS(view: SimpleView) {
    const facs = new FACS()

    const sizeof_faceBoneNamesBlob = view.readUint32()
    const sizeof_faceControlNamesBlob = view.readUint32()
    /*const sizeof_quantizedTransforms =*/ view.readUint64()

    const sizeof_twoPoseCorrectives = view.readUint32()
    const sizeof_threePoseCorrectives = view.readUint32()

    const faceBoneNamesBlob = view.readUtf8String(sizeof_faceBoneNamesBlob)
    const faceControlNamesBlob = view.readUtf8String(sizeof_faceControlNamesBlob)

    facs.faceBoneNames = faceBoneNamesBlob.split("\0")
    facs.faceControlNames = faceControlNamesBlob.split("\0")
    facs.faceBoneNames.pop()
    facs.faceControlNames.pop()

    facs.quantizedTransforms = readQuantizedTransform(view)

    for (let i = 0; i < sizeof_twoPoseCorrectives / 4; i++) {
        facs.twoPoseCorrectives.push([view.readUint16(), view.readUint16()])
    }

    for (let i = 0; i < sizeof_threePoseCorrectives / 6; i++) {
        facs.threePoseCorrectives.push([view.readUint16(), view.readUint16(), view.readUint16()])
    }

    //add corrective poses to names list
    for (const twoPoseCorrective of facs.twoPoseCorrectives) {
        facs.faceControlNames.push(`${facs.faceControlNames[twoPoseCorrective[0]]} ${facs.faceControlNames[twoPoseCorrective[1]]}`)
    }

    for (const threePoseCorrective of facs.threePoseCorrectives) {
        facs.faceControlNames.push(`${facs.faceControlNames[threePoseCorrective[0]]} ${facs.faceControlNames[threePoseCorrective[1]]} ${facs.faceControlNames[threePoseCorrective[2]]}`)
    }
    
    return facs
}

export class FileMesh {
    version!: string //version (at start of file, including \n)
    facsDataFormat: number = 0
    sizeOfFacsData: number = 0
    
    coreMesh!: COREMESH //COREMESH
    lods!: LODS //LODS
    skinning!: SKINNING //SKINNING
    facs?: FACS
    hsrAvis?: HSRAVIS

    _bounds?: [Vec3,Vec3]
    _size?: Vec3 = undefined

    get bounds(): [Vec3,Vec3] {
        if (!this._bounds) {
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

            this._bounds = [[minX, minY, minZ], [maxX, maxY, maxZ]]
        }

        return this._bounds
    }

    get size() {
        if (!this._size) {
            //max mesh size is 2048 i think? so this should be enough
            const [[minX, minY, minZ], [maxX, maxY, maxZ]] = this.bounds

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

        copy.facsDataFormat = this.facsDataFormat
        copy.sizeOfFacsData = this.sizeOfFacsData

        copy.coreMesh = this.coreMesh.clone()
        copy.lods = this.lods.clone()
        copy.skinning = this.skinning.clone()
        copy.facs = this.facs ? this.facs.clone() : undefined

        if (this._size) {
            copy._size = clonePrimitiveArray(this._size) as Vec3
        }

        return copy
    }

    reset() {
        this.version = "version 1.0.0\n"

        this.facsDataFormat = 0
        this.sizeOfFacsData = 0

        this.coreMesh = new COREMESH()
        this.lods = new LODS()
        this.skinning = new SKINNING()
        this.facs = undefined
    }

    recalculateNormals() {
        const core = this.coreMesh

        for (const vert of core.verts) {
            vert.normal = [0,0,0]
        }

        let faceStart = 0
        let faceEnd = core.faces.length
        if (this.lods) {
            if (this.lods.lodOffsets.length > 1) {
                faceStart = this.lods.lodOffsets[0]
                faceEnd = this.lods.lodOffsets[1]
            }
        }

        for (let i = faceStart; i < faceEnd; i++) {
            const face = core.faces[i]

            const p1 = core.verts[face.a].position
            const p2 = core.verts[face.b].position
            const p3 = core.verts[face.c].position

            const a = minus(p2, p1)
            const b = minus(p3, p1)

            const N: Vec3 = [
                a[1]*b[2] - a[2]*b[1],
                a[2]*b[0] - a[0]*b[2],
                a[0]*b[1] - a[1]*b[0],
            ]

            const magn = magnitude(N)

            const normal = divide(N, [magn,magn,magn])
            core.verts[face.a].normal = add(core.verts[face.a].normal, normal)
            core.verts[face.b].normal = add(core.verts[face.b].normal, normal)
            core.verts[face.c].normal = add(core.verts[face.c].normal, normal)
        }

        for (const vert of core.verts) {
            const magn = magnitude(vert.normal)
            if (magn > 0) {
                vert.normal = divide(vert.normal, [magn, magn, magn])
            } else {
                //console.log(vert)
            }
        }
    }

    async readChunk(view: SimpleView) {
        const chunkType = view.readUtf8String(8)
        const chunkVersion = view.readUint32()

        console.log(`Reading chunk: ${chunkType} version: ${chunkVersion}`)

        const size = view.readUint32()
        const newViewOffset = view.viewOffset + size
        
        switch (chunkType) {
            case "COREMESH":
                await this.readChunkCOREMESH(view, chunkVersion)
                break
            case "SKINNING":
                this.readChunkSKINNING(view, chunkVersion)
                break
            case "LODS\0\0\0\0":
                this.readChunkLODS(view, chunkVersion)
                break
            case "FACS\0\0\0\0":
                this.readChunkFACS(view, chunkVersion)
                break
            case "HSRAVIS\0":
                this.readChunkHSRAVIS(view, chunkVersion)
                break
            default:
                console.warn(`Unknown chunk found in mesh: ${chunkType}`)
                break
        }
        
        view.viewOffset = newViewOffset
    }

    readChunkLODS(view: SimpleView, version: number) {
        if (version !== 1) return

        this.lods.lodType = view.readUint16()
        this.lods.numHighQualityLODs = view.readUint8()

        //lodOffsets
        this.lods.numLodOffsets = view.readUint32()
        for (let i = 0; i < this.lods.numLodOffsets; i++) {
            this.lods.lodOffsets.push(view.readUint32())
        }
    }

    readChunkSKINNING(view: SimpleView, version: number) {
        if (version !== 1) return

        //vertex skinnings
        this.skinning.numSkinnings = view.readUint32()
        for (let i = 0; i < this.skinning.numSkinnings; i++) {
            this.skinning.skinnings.push(readSkinning(view))
        }

        //bones
        this.skinning.numBones = view.readUint32()
        for (let i = 0; i < this.skinning.numBones; i++) {
            this.skinning.bones.push(readBone(view))
        }

        //bone names
        this.skinning.nameTableSize = view.readUint32()
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
        this.skinning.numSubsets = view.readUint32()
        for (let i = 0; i < this.skinning.numSubsets; i++) {
            this.skinning.subsets.push(readSubset(view))
        }

        console.log(this.skinning)
    }

    readChunkHSRAVIS(view: SimpleView, version: number) {
        if (version !== 1) return

        this.hsrAvis = new HSRAVIS()

        const alwaysVisibleBitFlagsCount = view.readUint32()
        const alwaysVisibleBitFlagsLength = Math.floor((alwaysVisibleBitFlagsCount + 7) / 8)

        for (let i = 0; i < alwaysVisibleBitFlagsLength; i++) {
            const byteValue = view.readUint8()

            for (let j = 0; j < 8; j++) {
                this.hsrAvis.bitFlags.push((byteValue & Math.pow(2,j)) > 0)
            }
        }
    }

    async readChunkCOREMESH(view: SimpleView, version: number) {
        if (version === 1) {
            console.log("COREMESH v1")
            this.coreMesh.numverts = view.readUint32()
            for (let i = 0; i < this.coreMesh.numverts; i++) {
                this.coreMesh.verts.push(readVert(view))
            }

            this.coreMesh.numfaces = view.readUint32()
            for (let i = 0; i < this.coreMesh.numfaces; i++) {
                this.coreMesh.faces.push(readFace(view))
            }
        } else if (version === 2) {
            console.log("COREMESH v2")
            const dracoBitStreamSize = view.readUint32()
            const buffer = (view.buffer.slice(view.viewOffset, view.viewOffset + dracoBitStreamSize))
            //console.log(dracoBitStreamSize, DracoDecoderModule)
            /*while (!DracoDecoderModule) {
                await new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(undefined)
                    },100)
                })
            }*/
            const decoderModule = await DracoDecoderModule()
            const decoder = new decoderModule.Decoder()

            const mesh = new decoderModule.Mesh();
            const status = decoder.DecodeArrayToMesh(new Int8Array(buffer), dracoBitStreamSize, mesh);
            if (!status.ok() || mesh.ptr === 0) {
                throw new Error("Draco decode failed");
            }

            this.coreMesh.numfaces = mesh.num_faces();
            this.coreMesh.numverts = mesh.num_points();

            const posAttr = decoder.GetAttributeByUniqueId(mesh, 0)
            if (posAttr.ptr === 0) {
                throw new Error("No position attribute")
            }

            const normalAttr = decoder.GetAttributeByUniqueId(mesh, 1)
            if (normalAttr.ptr === 0) {
                throw new Error("No normal attribute")
            }

            const uvAttr = decoder.GetAttributeByUniqueId(mesh, 2)
            if (uvAttr.ptr === 0) {
                throw new Error("No uv attribute")
            }

            const tangentAttr = decoder.GetAttributeByUniqueId(mesh, 3)
            if (tangentAttr.ptr === 0) {
                throw new Error("No tangent attribute")
            }

            const colorAttr = decoder.GetAttributeByUniqueId(mesh, 4)
            if (colorAttr.ptr === 0) {
                throw new Error("No color attribute")
            }

            const posArray = new decoderModule.DracoFloat32Array()
            const posSuccess = decoder.GetAttributeFloatForAllPoints(mesh, posAttr, posArray)
            const normalArray = new decoderModule.DracoFloat32Array()
            const normalSuccess = decoder.GetAttributeFloatForAllPoints(mesh, normalAttr, normalArray)
            const uvArray = new decoderModule.DracoFloat32Array()
            const uvSuccess = decoder.GetAttributeFloatForAllPoints(mesh, uvAttr, uvArray)
            const tangentArray = new decoderModule.DracoUInt8Array()
            const tangentSuccess = decoder.GetAttributeUInt8ForAllPoints(mesh, tangentAttr, tangentArray)
            const colorArray = new decoderModule.DracoUInt8Array()
            const colorSuccess = decoder.GetAttributeUInt8ForAllPoints(mesh, colorAttr, colorArray)

            if (posSuccess && normalSuccess && uvSuccess && tangentSuccess && colorSuccess) {
                for (let i = 0; i < this.coreMesh.numverts; i++) {
                    const pos: Vec3 = [posArray.GetValue(i * 3 + 0), posArray.GetValue(i * 3 + 1), posArray.GetValue(i * 3 + 2)]
                    const normal: Vec3 = [normalArray.GetValue(i * 3 + 0), normalArray.GetValue(i * 3 + 1), normalArray.GetValue(i * 3 + 2)]
                    const uv: Vec2 = [uvArray.GetValue(i * 2 + 0), uvArray.GetValue(i * 2 + 1)]
                    const tangent: Vec4 = [tangentArray.GetValue(i * 4 + 0) - 127, tangentArray.GetValue(i * 4 + 1) - 127, tangentArray.GetValue(i * 4 + 2) - 127, tangentArray.GetValue(i * 4 + 3) - 127]
                    const color: Vec4 = [colorArray.GetValue(i * 4 + 0), colorArray.GetValue(i * 4 + 1), colorArray.GetValue(i * 4 + 2), colorArray.GetValue(i * 4 + 3)]
                    
                    this.coreMesh.verts.push(new FileMeshVertex(pos, normal, uv, tangent, color))
                }
            }
            decoderModule.destroy(posArray)
            decoderModule.destroy(normalArray)
            decoderModule.destroy(uvArray)
            decoderModule.destroy(tangentArray)
            decoderModule.destroy(colorArray)

            const faceArray = new decoderModule.DracoInt32Array()
            for (let i = 0; i < this.coreMesh.numfaces; i++) {
                /*const faceSuccess =*/ decoder.GetFaceFromMesh(mesh, i, faceArray)
                //if (faceSuccess) {
                    const [a,b,c] = [faceArray.GetValue(0), faceArray.GetValue(1), faceArray.GetValue(2)]
                    this.coreMesh.faces.push(new FileMeshFace(a, b, c))

                    if (a >= this.coreMesh.numverts || b >= this.coreMesh.numverts || c >= this.coreMesh.numverts) {
                        console.warn(`Face ${i} has out-of-range index: ${a}, ${b}, ${c}`);
                        continue; // skip invalid face
                    }
                //}
            }
            decoderModule.destroy(faceArray)

            //console.log(decoder.GetMetadata(mesh))
            //console.log(decoder.GetAttribute(mesh, 0))

            decoderModule.destroy(mesh)
            decoderModule.destroy(decoder)

            /*const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath("../../draco/")
            dracoLoader.setDecoderConfig({ type: 'js' });
            const geometry = await new Promise(resolve => {
                dracoLoader.parse(view.buffer.slice(view.viewOffset, view.viewOffset + dracoBitStreamSize), (geometry) => {
                    resolve(geometry)
                })
            })
            console.log(geometry)*/
            
        }
    }

    readChunkFACS(view: SimpleView, version: number) {
        if (version !== 1) return

        view.readUint32() //size of facs data
        this.facs = readFACS(view)
    }

    async fromBuffer(buffer: ArrayBuffer) {
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
            case "version 5.00\n":
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
                    this.facsDataFormat = view.readUint32()
                    this.sizeOfFacsData = view.readUint32()
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

                //facs
                if (version === "version 5.00\n" && this.facsDataFormat === 1 && this.sizeOfFacsData > 0) {
                    this.facs = readFACS(view)
                }

                break
                }
            case "version 6.00\n":
            case "version 7.00\n":
                while (view.viewOffset < view.buffer.byteLength - 1) {
                    await this.readChunk(view)
                }
                break
            default:
                console.warn(`Failed to read mesh, unknown version: ${version}`)
        }

        if (this.skinning) {
            console.log(this.skinning)
        }

        const issue = this.getValidationIssue()
        if (issue) {
            console.warn(`Issue with parsed mesh: ${issue}`)
        }

        console.log(`Bytes left: ${view.view.byteLength - view.viewOffset}`)
    }

    stripLODS() {
        let facesEnd = this.coreMesh.faces.length
        let facesStart = 0
        if (this.lods) {
            if (this.lods.lodOffsets.length >= 2) {
                facesStart = this.lods.lodOffsets[0]
                facesEnd = this.lods.lodOffsets[1]
                if (facesEnd === 0) {
                    facesEnd = this.coreMesh.faces.length
                }
            }
        }

        this.coreMesh.faces = this.coreMesh.faces.slice(facesStart, facesEnd)

        this.lods.lodOffsets = [0, this.coreMesh.faces.length - 1]
    }

    padSkinnings() {
        const vertsLength = this.coreMesh.verts.length
        const skinningsLength = this.skinning.skinnings.length
        const missingCount = vertsLength - skinningsLength

        for (let i = 0; i < missingCount; i++) {
            this.skinning.skinnings.push(new FileMeshSkinning())
        }

        if (this.skinning.subsets.length === 0) {
            const subset = new FileMeshSubset()
            subset.boneIndices = new Array(26).fill(65535)
            subset.boneIndices[0] = 0
            subset.vertsBegin = 0
            subset.vertsLength = this.coreMesh.verts.length
            subset.facesBegin = 0
            subset.facesLength = this.coreMesh.faces.length
            subset.numBoneIndices = 1
            this.skinning.subsets.push(subset)
        }

        if (this.skinning.nameTable.length === 0) {
            this.skinning.nameTable.push("Root")
            this.skinning.nameTableSize = 4
        }

        if (this.skinning.bones.length === 0) {
            const bone = new FileMeshBone()
            bone.boneNameIndex = 0
            bone.lodParentIndex = 65535
            bone.parentIndex = 65535
            bone.position = [0,0,0]
            bone.rotationMatrix = [1,0,0,0,1,0,0,0,1]
            this.skinning.bones.push(bone)
        }
    }

    combine(other: FileMesh) {
        console.log("combining meshes")
        console.log(this.clone(), other.clone())

        //TODO: take LODS into consideration
        this.stripLODS()
        other = other.clone()
        other.stripLODS()

        if (this.skinning.skinnings.length > 0 || other.skinning.skinnings.length > 0) {
            this.padSkinnings()
            other.padSkinnings()
        }

        const facesLength = this.coreMesh.faces.length
        const vertsLength = this.coreMesh.verts.length
        //const subsetsLength = this.skinning.subsets.length

        //coremesh
        for (const vert of other.coreMesh.verts) {
            this.coreMesh.verts.push(vert.clone())
        }

        for (const face of other.coreMesh.faces) {
            const newFace = face.clone()
            newFace.a += vertsLength
            newFace.b += vertsLength
            newFace.c += vertsLength
            this.coreMesh.faces.push(newFace)
        }

        this.lods.lodOffsets = [0,this.coreMesh.faces.length - 1]

        //facs
        if (other.facs) {
            this.facs = other.facs.clone()
        }

        //skeleton
        const boneIndexMap = new Map<number,number>()

        for (const bone of other.skinning.bones) {
            const boneName = other.skinning.nameTable[other.skinning.bones.indexOf(bone)]
            const foundBone = this.skinning.getBone(boneName)

            //root
            if (bone.parentIndex >= 65535) {
                boneIndexMap.set(other.skinning.bones.indexOf(bone), 0)
                continue
            }

            //not root
            if (foundBone) { //if bone already inside, just map old one to that
                boneIndexMap.set(other.skinning.bones.indexOf(bone), this.skinning.bones.indexOf(foundBone))
            } else { //else copy bone to the original mesh
                const parentBone = other.skinning.bones[bone.parentIndex]
                const parentName = other.skinning.nameTable[other.skinning.bones.indexOf(parentBone)]
                const foundParentBone = this.skinning.getBone(parentName)

                //copy self bone to other
                const boneCopy = bone.clone()
                boneCopy.parentIndex = 65535
                boneCopy.lodParentIndex = 65535

                if (foundParentBone) {
                    const foundParentIndex = this.skinning.bones.indexOf(foundParentBone)
                    boneCopy.parentIndex = foundParentIndex
                    boneCopy.lodParentIndex = foundParentIndex
                }

                this.skinning.nameTable.push(boneName)
                this.skinning.bones.push(boneCopy)
                
                boneIndexMap.set(other.skinning.bones.indexOf(bone), this.skinning.bones.length - 1)
            }
        }

        //console.log(boneIndexMap)
        //console.log(this)

        for (const subset of other.skinning.subsets) {
            const newSubset = subset.clone()
            newSubset.facesBegin += facesLength
            newSubset.vertsBegin += vertsLength
            
            for (let i = 0; i < newSubset.boneIndices.length; i++) {
                const index = newSubset.boneIndices[i]
                const newIndex = boneIndexMap.get(index)

                if (index >= 65535) {
                    continue
                }

                if (newIndex === undefined) {
                    throw new Error(`Bone ${index} is missing mapping`)
                }

                newSubset.boneIndices[i] = newIndex
            }

            this.skinning.subsets.push(newSubset)
        }

        for (const skinning of other.skinning.skinnings) {
            const newSkinning = skinning.clone()
            this.skinning.skinnings.push(newSkinning)
        }

        console.log(this.clone())
    }

    removeDuplicateVertices(distance = 0.0001): number {
        const posToIndex = new Map<number, number>()
        const remap = new Array(this.coreMesh.verts.length).fill(-1)

        //detect duplicates
        for (let i = 0; i < this.coreMesh.verts.length; i++) {
            const v = this.coreMesh.verts[i]
            const hash = hashVec3(v.position[0], v.position[1], v.position[2], distance) + hashVec2(v.uv[0], v.uv[1])

            const existing = posToIndex.get(hash)

            if (existing !== undefined) {
                //duplicate -> map to existing
                remap[i] = existing

                //merge normals
                const a = this.coreMesh.verts[existing]
                const b = v
                const merged = new Vector3().fromVec3(a.normal).add(new Vector3().fromVec3(b.normal)).normalize()
                a.normal = merged.toVec3()

            } else {
                posToIndex.set(hash, i)
                remap[i] = i
            }
        }

        //remap faces
        for (const f of this.coreMesh.faces) {
            f.a = remap[f.a]
            f.b = remap[f.b]
            f.c = remap[f.c]
        }

        //build new compact vertex array
        const newVerts = []
        const newSkinnings = []
        const newIndex = new Map<number, number>()

        for (let i = 0; i < this.coreMesh.verts.length; i++) {
            const canonical = remap[i]
            if (!newIndex.has(canonical)) {
                newIndex.set(canonical, newVerts.length)
                newVerts.push(this.coreMesh.verts[canonical])
                const skinning = this.skinning.skinnings[canonical]
                if (skinning) {
                    newSkinnings.push(skinning)
                }
            }
            remap[i] = newIndex.get(canonical)!
        }

        //Fix faces again to use compact indices
        for (const f of this.coreMesh.faces) {
            f.a = remap[f.a]
            f.b = remap[f.b]
            f.c = remap[f.c]
        }

        this.coreMesh.verts = newVerts
        this.skinning.skinnings = newSkinnings
        return newVerts.length
    }

    getValidationIssue(): "subsetLengthMismatch" | undefined {
        //subsets
        if (this.skinning.skinnings.length > 0) {
            let totalSubsetVerts = 0
            for (const subset of this.skinning.subsets) {
                totalSubsetVerts += subset.vertsLength
            }

            if (totalSubsetVerts !== this.skinning.skinnings.length) {
                return "subsetLengthMismatch"
            }
        }

        return undefined
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
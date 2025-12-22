//https://devforum.roblox.com/t/roblox-filemesh-format-specification/326114

import SimpleView from "../lib/simple-view"
import { clonePrimitiveArray } from "../misc/misc"
import { add, divide, hashVec2, hashVec3, magnitude, minus } from "./mesh-deform"
import { Vector3 } from "./rbx"

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

    removeDuplicateVertices(distance = 0.0001): number {
        const toRemove = []
        const posToI = new Map<number,number>() //posHash: vertIndex

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

                //merge normals
                const otherVert = this.verts[otherI]
                const totalNormal = new Vector3().fromVec3(otherVert.normal).add(new Vector3().fromVec3(vert.normal))
                const resultNormal = totalNormal.normalize()
                otherVert.normal = resultNormal.toVec3()

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

export class FileMesh {
    version!: string //version (at start of file, including \n)
    
    coreMesh!: COREMESH //COREMESH
    lods!: LODS //LODS
    skinning!: SKINNING //SKINNING

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
        }
        console.log(this)
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
    }

    async readChunkCOREMESH(view: SimpleView, version: number) {
        if (version === 1) {
            this.coreMesh.numverts = view.readUint32()
            for (let i = 0; i < this.coreMesh.numverts; i++) {
                this.coreMesh.verts.push(readVert(view))
            }

            this.coreMesh.numfaces = view.readUint32()
            for (let i = 0; i < this.coreMesh.numfaces; i++) {
                this.coreMesh.faces.push(readFace(view))
            }
        } else if (version === 2) {
            const dracoBitStreamSize = view.readUint32()
            const buffer = (view.buffer.slice(view.viewOffset, view.viewOffset + dracoBitStreamSize))
            //console.log(dracoBitStreamSize, DracoDecoderModule)
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
            case "version 6.00\n":
            case "version 7.00\n":
                while (view.viewOffset < view.buffer.byteLength - 1) {
                    await this.readChunk(view)
                }
                break
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
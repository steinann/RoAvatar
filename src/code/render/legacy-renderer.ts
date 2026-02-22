//base link = https://t#.rbxcdn.com/
//avatar 3d thumbnail redirect = https://thumbnails.roblox.com/v1/users/avatar-3d?userId=USERIDHERE
//outfit 3d thumbnail redirect = https://thumbnails.roblox.com/v1/users/outfit-3d?outfitId=OUTFITIDHERE

/* https://avatar.roblox.com/v1/avatar/render */

import * as THREE from 'three';
import { API, parseAssetString } from '../api';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { RBX, type CFrame, type Color3uint8, type Instance, type Vector3 } from '../rblx/rbx';
import { FileMesh, FileMeshVertex, type Vec3 } from '../mesh/mesh';
import { getUVtoVertMap, hashVec2 } from '../mesh/mesh-deform';

const lookAwayVector = [-0.406, 0.406, -0.819]
const lookAwayDistance = 6

const MeshType = {
    "Brick": 6,
    "Cylinder": 4,
    "FileMesh": 5,
    "Head": 0,
    "Sphere": 3,
    "Torso": 1,
    "Wedge": 2,
}

const HumanoidRigType = {
    "R6": 0,
    "R15": 1,
}

const BodyPart = {
    "Head": 0,
    "Torso": 1,
    "LeftArm": 2,
    "RightArm": 3,
    "LeftLeg": 4,
    "RightLeg": 5,
}

const BodyPartNameToEnum: {[K in string]: number} = {
    "Head": BodyPart.Head,
    "Torso": BodyPart.Torso,
    "Left Arm": BodyPart.LeftArm,
    "Right Arm": BodyPart.RightArm,
    "Left Leg": BodyPart.LeftLeg,
    "Right Leg": BodyPart.RightLeg,

    //R15
    "LeftUpperArm": BodyPart.LeftArm,
    "LeftLowerArm": BodyPart.LeftArm,
    "LeftHand": BodyPart.LeftArm,

    "RightUpperArm": BodyPart.RightArm,
    "RightLowerArm": BodyPart.RightArm,
    "RightHand": BodyPart.RightArm,

    "LeftUpperLeg": BodyPart.LeftLeg,
    "LeftLowerLeg": BodyPart.LeftLeg,
    "LeftFoot": BodyPart.LeftLeg,

    "RightUpperLeg": BodyPart.RightLeg,
    "RightLowerLeg": BodyPart.RightLeg,
    "RightFoot": BodyPart.RightLeg,

    "UpperTorso": BodyPart.Torso,
    "LowerTorso": BodyPart.Torso,
}

function rad(degrees: number) {
    return degrees / 180 * Math.PI
}

const clothingToTexture = new Map<string,THREE.Texture>()
const instanceToMesh = new Map()
const instanceToMeshInfo = new Map()
const meshStrToFileMesh = new Map<string,Promise<FileMesh>>()

class MeshInfo {
    cframe
    meshIDStr
    newSize = [1,1,1]
    oldSize: number[] | null = null
    colorMapIDstr = ""
    normalMapIDstr = ""
    roughnessMapIDstr = ""
    metalnessMapIDstr = ""

    constructor(cframe: CFrame, meshIDStr: string, newSize: number[], oldSize: number[] | null, colorMapIDstr: string, normalMapIDstr: string, roughnessMapIDstr: string, metalnessMapIDstr: string) {
        this.cframe = cframe
        this.meshIDStr = meshIDStr
        this.newSize = newSize
        this.oldSize = oldSize
        this.colorMapIDstr = colorMapIDstr
        this.normalMapIDstr = normalMapIDstr
        this.roughnessMapIDstr = roughnessMapIDstr
        this.metalnessMapIDstr = metalnessMapIDstr
    }
}

function setTHREEMeshCF(threeMesh: THREE.Mesh, cframe: CFrame) {
    threeMesh.position.set(cframe.Position[0], cframe.Position[1], cframe.Position[2])
    threeMesh.rotation.order = "YXZ"
    threeMesh.rotation.x = rad(cframe.Orientation[0])
    threeMesh.rotation.y = rad(cframe.Orientation[1])
    threeMesh.rotation.z = rad(cframe.Orientation[2])
}

function mapImg(ctx: CanvasRenderingContext2D, img: HTMLImageElement, sX: number, sY: number, sW: number, sH: number, oX: number, oY: number, oW: number, oH: number, rotation: number) {
    ctx.save()
    ctx.translate(oX,oY)
    ctx.rotate(rad(rotation))
    ctx.translate(-oX,-oY)

    ctx.drawImage(img, sX, sY, sW, sH, oX - 2, oY - 2, oW + 4, oH + 4)
    ctx.drawImage(img, sX, sY, sW, sH, oX, oY, oW, oH)

    ctx.restore()
}

function loadClothing(clothingStr: string[], callback: (a: string | null, b: HTMLImageElement, c: string| null, d: HTMLImageElement, e: string| null, f: HTMLImageElement, g: string| null, h: HTMLImageElement) => void) {
    const clothingSplit = clothingStr
    
    let shirtTemplate: string | null = null
    let pantsTemplate: string | null = null
    let tshirtTemplate: string | null = null
    let overlayTemplate: string | null = null

    for (const clothing of clothingSplit) {
        if (clothing.startsWith("shirt=")) {
            shirtTemplate = clothing.slice(6)
        } else if (clothing.startsWith("pants=")) {
            pantsTemplate = clothing.slice(6)
        } else if (clothing.startsWith("tshirt=")) {
            tshirtTemplate = clothing.slice(7)
        } else if (clothing.startsWith("overlay=")) {
            overlayTemplate = clothing.slice(8)
        }
    }

    //get ready for shirts and pants
    let shirtUrl: string | null = null
    let pantsUrl: string | null = null
    let tshirtUrl: string | null = null
    let overlayUrl: string | null = null

    const shirtImg = new Image()
    const pantsImg = new Image()
    const tshirtImg = new Image()
    const overlayImg = new Image()

    let imagesToLoad = 0
    let loadedImages = 0

    if (shirtTemplate) {
        shirtUrl = parseAssetString(shirtTemplate) || shirtTemplate
        imagesToLoad += 1
    }

    if (pantsTemplate) {
        pantsUrl = parseAssetString(pantsTemplate) || pantsTemplate
        imagesToLoad += 1
    }

    if (tshirtTemplate) {
        tshirtUrl = parseAssetString(tshirtTemplate) || tshirtTemplate
        imagesToLoad += 1
    }

    if (overlayTemplate) {
        overlayUrl = parseAssetString(overlayTemplate) || overlayTemplate
        imagesToLoad += 1
    }

    //actually load them
    const urlsAndImgs: [string | null, HTMLImageElement][] = [[shirtUrl, shirtImg],[pantsUrl,pantsImg],[tshirtUrl,tshirtImg],[overlayUrl,overlayImg]]
    for (const [url, img] of urlsAndImgs) {
        if (url && img) {
            const onload = () => {
                loadedImages += 1
                if (loadedImages >= imagesToLoad) {
                    callback(pantsUrl, pantsImg, shirtUrl, shirtImg, tshirtUrl, tshirtImg, overlayUrl, overlayImg)
                }
            }

            img.addEventListener("load", onload)
            img.addEventListener("error", onload)
            img.crossOrigin = "anonymous"
            img.src = url
        }
    }
}

function drawSkinColor(clothingSplit: string[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    let colorR = 0
    let colorG = 0
    let colorB = 0

    for (const clothing of clothingSplit) {
        if (clothing.startsWith("color=")) {
            const toSplit = clothing.slice(6)
            const colorStrs = toSplit.split(",")
            colorR = Number(colorStrs[0])
            colorG = Number(colorStrs[1])
            colorB = Number(colorStrs[2])
        }
    }

    //draw skin
    ctx.fillStyle = `rgb(${colorR},${colorG},${colorB})`
    ctx.fillRect(0,0,canvas.width,canvas.height)
}

function drawOverlay(_clothingSplit: string[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, overlayUrl: string | null, overlayImg: HTMLImageElement) {
    if (overlayUrl && overlayImg) {
        ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height)
    }
}

function destroyMesh(instance: Instance) {
    const threeMesh = instanceToMesh.get(instance)
    if (threeMesh) {
        console.log(`Destroying mesh for ${instance.GetFullName()}`)
        instanceToMesh.delete(instance)
        instanceToMeshInfo.delete(instance)
        threeMesh.geometry.dispose()
        threeMesh.material.dispose()
        scene.remove(threeMesh)
    }
}

function meshExists(instance: Instance) {
    return !!instanceToMesh.get(instance)
}

function addMesh(instance: Instance, cframe: CFrame, meshIDStr: string, newSize = [1,1,1], oldSize: null | number[] = null, colorMapIDstr = "", normalMapIDstr = "", roughnessMapIDstr = "", metalnessMapIDstr = "") {
    let threeMesh = instanceToMesh.get(instance)
    const lastMeshInfo = instanceToMeshInfo.get(instance)
    instanceToMeshInfo.set(instance, new MeshInfo(cframe, meshIDStr, newSize, oldSize, colorMapIDstr, normalMapIDstr, roughnessMapIDstr, metalnessMapIDstr))

    const fetchStr = parseAssetString(meshIDStr) || meshIDStr

    //update mesh based on new parameters if it already exists
    if (threeMesh) { //TODO: make this more modular and refreshable
        if (lastMeshInfo.newSize !== newSize || lastMeshInfo.oldSize !== oldSize) {
            const resizeFunc = async () => {
                if (!oldSize) {
                    const fileMeshPromise = meshStrToFileMesh.get(fetchStr)
                    if (fileMeshPromise) {
                        const fileMesh = await fileMeshPromise
                        oldSize = fileMesh.size
                    } else {
                        oldSize = [1,1,1]
                        throw new Error("Mesh is not loading this should be done now...")
                    }
                }

                const meshScale = [
                    newSize[0] / oldSize[0],
                    newSize[1] / oldSize[1],
                    newSize[2] / oldSize[2],
                ]
                threeMesh.scale.set(meshScale[0], meshScale[1], meshScale[2])
            }
            resizeFunc()
        }

        if (threeMesh.skeleton) {
            threeMesh.position.set(0,0,0)
            threeMesh.rotation.set(0,0,0)
            threeMesh.rotation.order = "YXZ"

            const bones = threeMesh.skeleton.bones
            for (const bone of bones) {
                const partEquivalent = instance?.parent?.FindFirstChild(bone.name)
                if (partEquivalent) {
                    /*let motor = null

                    for (let child of instance.parent.GetDescendants()) {
                        if (child.className === "Motor6D" && child.Prop("Part1") === partEquivalent) {
                            motor = child
                            break
                        }
                    }*/

                    //if (motor) {
                        /*let C0 = motor.Prop("C0")
                        let C1 = motor.Prop("C1")
                        let transform = motor.Prop("Transform")

                        let offset1 = C1.multiply(transform).inverse()
                        let finalCF = C0.multiply(offset1)*/

                        const cf = (partEquivalent.Prop("CFrame") as CFrame).clone()
                        const pos = cf.Position
                        const rot = cf.Orientation

                        bone.position.set(pos[0],pos[1],pos[2])
                        bone.rotation.set(rad(rot[0]),rad(rot[1]),rad(rot[2]))
                    //}
                } else {
                    bone.position.set(0,0,0)
                    bone.rotation.set(0,0,0)
                }
            }

            threeMesh.skeleton.update()
        } else {
            if (lastMeshInfo.cframe !== cframe) {
                threeMesh.position.set(cframe.Position[0], cframe.Position[1], cframe.Position[2])
                threeMesh.rotation.order = "YXZ"
                threeMesh.rotation.x = rad(cframe.Orientation[0])
                threeMesh.rotation.y = rad(cframe.Orientation[1])
                threeMesh.rotation.z = rad(cframe.Orientation[2])
            }
        }
        
        return
    }

    console.log(`Adding mesh for ${instance.GetFullName()}`)

    let color = new THREE.Color(1,1,1)

    let affectedByPartColor = true //!(instance.className === "MeshPart" && colorMapIDstr.startsWith("clothing://"))
    let partColor = null

    if (instance.HasProperty("Color")) {
        partColor = instance.Property("Color") as Color3uint8
        if (partColor && !colorMapIDstr) {
            color = new THREE.Color(partColor.R / 255, partColor.G / 255, partColor.B / 255)
        }
    }

    //create mesh material
    const meshMaterialDescription: {
        color: THREE.Color;
        transparent: boolean;
        opacity: number;
        visible?: boolean;
        specular?: THREE.Color;
        shininess?: number;
    } = {color: color, transparent: false, opacity: 1}
    
    if (instance.HasProperty("Transparency")) {
        const transparency = instance.Prop("Transparency") as number
        if (transparency > 0.01) {
            if (transparency <= 0.99) {
                meshMaterialDescription.transparent = true
                meshMaterialDescription.opacity = 1 - transparency
            } else {
                meshMaterialDescription.visible = false
            }
        }
    }

    const AlphaMode = {
        "Overlay": 0,
        "Transparency": 1,
        "TintMask": 2,
    }

    const surfaceAppearance = instance.FindFirstChild("SurfaceAppearance")
    if (surfaceAppearance) {
        const alphaMode = surfaceAppearance.Prop("AlphaMode")
        if (alphaMode === AlphaMode.Transparency) {
            meshMaterialDescription.transparent = true
            affectedByPartColor = false
        }
    }

    /* TODO: do this while also allowing meshparts to be viewed through eachother
    if (instance.className === "MeshPart") {
        meshMaterialDescription.transparent = true
        affectedByPartColor = false
    }
    */

    let meshMaterial: THREE.MeshStandardMaterial | THREE.MeshPhongMaterial | null = null
    if (surfaceAppearance) {
        meshMaterial = new THREE.MeshStandardMaterial(meshMaterialDescription)
    } else {
        meshMaterialDescription.specular = new THREE.Color(102 / 255, 102 / 255, 102 / 255)
        meshMaterialDescription.specular = new THREE.Color(1 / 102, 1 / 102, 1 / 102)
        meshMaterialDescription.shininess = 9 //i think r15 should also be less shiny so im doing it here
        const humanoid = instance?.parent?.FindFirstChildOfClass("Humanoid")
        if (humanoid && instance?.parent?.FindFirstChild("Left Arm")) { //body parts look less shiny in r6 (i think) so im doing this VERY HACKY
            meshMaterialDescription.shininess = 9
        }
        meshMaterial = new THREE.MeshPhongMaterial(meshMaterialDescription)
    }
    
    if (instance.HasProperty("DoubleSided")) {
        if (instance.Prop("DoubleSided")) {
            meshMaterial.side = THREE.DoubleSide
        }
    }

    console.log(instance.Prop("Name"))
    console.log(meshMaterialDescription)

    threeMesh = new THREE.Mesh()
    threeMesh.castShadow = true
    threeMesh.receiveShadow = true

    instanceToMesh.set(instance, threeMesh)

    function onMeshLoaded(mesh: FileMesh) {
        if (!meshExists(instance)) return
        
        console.log(`Loaded mesh for ${instance.GetFullName()}`, mesh)

        if (!oldSize) {
            oldSize = mesh.size
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
        threeMesh.geometry = geometry
        threeMesh.material = meshMaterial
        setTHREEMeshCF(threeMesh, cframe)
        if (instance.Prop("Name") === "UpperTorso" || instance.Prop("Name") === "Torso") {
            controls.target.set(cframe.Position[0],cframe.Position[1],cframe.Position[2])
            camera.position.set(cframe.Position[0] + lookAwayVector[0] * lookAwayDistance,cframe.Position[1] + lookAwayVector[1] * lookAwayDistance,cframe.Position[2] + lookAwayVector[2] * lookAwayDistance)
            //camera.position.set(cframe.Position[0],cframe.Position[1],cframe.Position[2] - 5)
            controls.update()
        }

        const meshScale = [
            newSize[0] / oldSize[0],
            newSize[1] / oldSize[1],
            newSize[2] / oldSize[2],
        ]
        threeMesh.scale.set(meshScale[0], meshScale[1], meshScale[2])

        scene.add(threeMesh)
    }

    const cachedFileMesh = meshStrToFileMesh.get(fetchStr)
    if (cachedFileMesh) {
        cachedFileMesh.then((mesh: FileMesh) => {
            onMeshLoaded(mesh)
        })
    } else {
        let shouldCacheMesh = true

        if (instance.FindFirstChildOfClass("WrapLayer")) {
            shouldCacheMesh = false
        }

        const fileMeshPromise: Promise<FileMesh> = new Promise((resolve) => {
            API.Asset.GetAssetBuffer(fetchStr).then(buffer => {
                if (buffer instanceof Response) {
                    throw buffer
                }

                console.log(`Fetched mesh for ${instance.GetFullName()} from ${fetchStr}`)
                const mesh = new FileMesh()
                mesh.fromBuffer(buffer)

                //check for wraplayer
                const wrapLayer = instance.FindFirstChildOfClass("WrapLayer")
                if (wrapLayer) {
                    console.log(wrapLayer)

                    //get reference mesh
                    const wrapreference_fetchStr = parseAssetString(wrapLayer.Prop("ReferenceMeshId") as string) || ""

                    API.Asset.GetAssetBuffer(wrapreference_fetchStr).then(buffer => {
                        if (buffer instanceof Response) {
                            throw buffer
                        }

                        console.log(`Fetched reference mesh for ${wrapLayer.GetFullName()} from ${wrapreference_fetchStr}`)
                        const ref_mesh = new FileMesh()
                        ref_mesh.fromBuffer(buffer)

                        //get cage mesh
                        const wrapcage_fetchStr = parseAssetString(wrapLayer.Prop("CageMeshId") as string) || ""

                        API.Asset.GetAssetBuffer(wrapcage_fetchStr).then(buffer => {
                            if (buffer instanceof Response) {
                                throw buffer
                            }

                            console.log(`Fetched cage mesh for ${wrapLayer.GetFullName()} from ${wrapcage_fetchStr}`)
                            const cage_mesh = new FileMesh()
                            cage_mesh.fromBuffer(buffer)
                            
                            ref_mesh.removeDuplicateVertices()

                            //logic stuff
                            const refMap = getUVtoVertMap(ref_mesh)

                            //actual depth / expected depth * a number that worked well for normally sized ref_meshes
                            const sigma = ref_mesh.size[2] / 0.838 * 0.04
                            
                            console.log(refMap)

                            function calculateMagnitude3D(x: number, y: number, z: number) {
                                return Math.sqrt(x * x + y * y + z * z);
                            }

                            function magnitude(v: number[]) {
                                return calculateMagnitude3D(v[0],v[1],v[2])
                            }

                            function multiply(v0: number[], v1: number[]) {
                                return [v0[0] * v1[0], v0[1] * v1[1], v0[2] * v1[2]]
                            }

                            function add(v0: number[], v1: number[]): Vec3 {
                                return [v0[0] + v1[0], v0[1] + v1[1], v0[2] + v1[2]]
                            }
                            
                            function minus(v0: number[],v1: number[]) {
                                return [v0[0] - v1[0], v0[1] - v1[1], v0[2] - v1[2]]
                            }

                            function gaussian_rbf(v0: number[],v1: number[],sigma = 0.04) {
                                return Math.exp(-((Math.pow(magnitude(minus(v0,v1)),2))/(2*sigma*sigma)))
                            }

                            for (const vert of mesh.coreMesh.verts) {
                                vert.position[0] -= (wrapLayer.Prop("ReferenceOrigin") as CFrame).Position[0]
                                vert.position[1] -= (wrapLayer.Prop("ReferenceOrigin") as CFrame).Position[1]
                                vert.position[2] -= (wrapLayer.Prop("ReferenceOrigin") as CFrame).Position[2]
                            }
                            

                            const meshVertWeights = new Array(mesh.coreMesh.verts.length)
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
                                /*
                                let closestDistance = 99999999
                                let closestVert = null

                                for (let refVert of ref_mesh.coreMesh.verts) {
                                    let distance = distanceBetween(vert, refVert)
                                    if (distance < closestDistance) {
                                        closestDistance = distance
                                        closestVert = refVert
                                    }
                                }

                                meshVertToRefVertAndOffset.set(vert, [closestVert, [vert.position[0] - closestVert.position[0], vert.position[1] + 1 - closestVert.position[1], vert.position[2] - closestVert.position[2]]])
                                */
                            }

                            const targetPromises: Promise<[CFrame, FileMesh, Instance, FileMesh]>[] = []

                            const rig = instance?.parent?.parent
                            if (!rig) {
                                throw "no rig"
                            }

                            for (const bodyPart of rig.GetChildren()) {
                                if (bodyPart.className === "MeshPart") {
                                    const bodyPartWrap = bodyPart.FindFirstChildOfClass("WrapTarget")

                                    if (!bodyPartWrap) {
                                        continue
                                    }
                                    
                                    targetPromises.push(new Promise((resolve) => {
                                        const bodyPartCageFetchStr = parseAssetString(bodyPartWrap.Prop("CageMeshId") as string) || ""

                                        API.Asset.GetAssetBuffer(bodyPartCageFetchStr).then(buffer => {
                                            if (buffer instanceof Response) {
                                                throw buffer
                                            }

                                            console.log(`Fetched cage mesh for ${bodyPartWrap.GetFullName()} from ${bodyPartCageFetchStr}`)
                                            const bodyPartCageMesh = new FileMesh()
                                            bodyPartCageMesh.fromBuffer(buffer)
                                            bodyPartCageMesh.removeDuplicateVertices()

                                            const bodyPartMeshFetchStr = parseAssetString(bodyPart.Prop("MeshId") as string) ||""
                                            API.Asset.GetAssetBuffer(bodyPartMeshFetchStr).then(buffer => {
                                                if (buffer instanceof Response) {
                                                    throw buffer
                                                }

                                                console.log(`Fetched mesh for ${bodyPart.GetFullName()} from ${bodyPartMeshFetchStr}`)
                                                const bodyPartMesh = new FileMesh()
                                                bodyPartMesh.fromBuffer(buffer)
                                                resolve([bodyPart.Prop("CFrame") as CFrame, bodyPartCageMesh, bodyPart, bodyPartMesh])
                                            })
                                        })
                                    }))
                                }
                            }

                            console.log("TARGET PROMISES")
                            console.log(targetPromises)
                            Promise.all(targetPromises).then((bodyDatas) => {
                                for (const bodyData of bodyDatas) {
                                    const bodyMesh = bodyData[1]
                                    const bodyPart = bodyData[2]
                                    const bodyPartMesh = bodyData[3]
                                    let bodyPos = minus(bodyData[0].Position, (instance.Prop("CFrame") as CFrame).Position)
                                    const wraptarget = bodyPart.FindFirstChildOfClass("WrapTarget") as Instance
                                    const targetPos = (wraptarget.Prop("CageOrigin") as CFrame).Position
                                    bodyPos = add(bodyPos, targetPos)

                                    const originalMeshSize = bodyPartMesh.size
                                    let originalSize = [1,1,1]
                                    const ogSizeVal = bodyPart.FindFirstChild("OriginalSize")
                                    if (ogSizeVal) {
                                        const ogSize = ogSizeVal.Prop("Value") as Vector3
                                        originalSize = [ogSize.X, ogSize.Y, ogSize.Z]
                                    }

                                    const bodySize = [(bodyPart.Prop("Size") as Vector3).X / originalMeshSize[0],(bodyPart.Prop("Size") as Vector3).Y / originalMeshSize[1],(bodyPart.Prop("Size") as Vector3).Z / originalMeshSize[2]]

                                    if (bodyPart.Prop("Name") === "RightUpperLeg") {
                                        console.log(originalMeshSize)
                                        console.log(originalSize)
                                        console.log(bodySize)
                                    }

                                    for (const bodyVert of bodyMesh.coreMesh.verts) {
                                        const hashBodyUV = hashVec2(bodyVert.uv[0], bodyVert.uv[1])
                                        let refVerts = refMap.get(hashBodyUV)

                                        if (!refVerts) {
                                            refVerts = []
                                        }

                                        const oldPositionMap = new Map<FileMeshVertex,Vec3>()
                                        const offsetMap = new Map<FileMeshVertex,Vec3>()

                                        for (const refVert of refVerts) {
                                            let oldPos = oldPositionMap.get(refVert)
                                            if (!oldPos) {
                                                oldPos = [refVert.position[0],refVert.position[1],refVert.position[2]]
                                                oldPositionMap.set(refVert, oldPos)
                                            }
                                            const newPosition: Vec3 = [(bodyVert.position[0] * bodySize[0] + bodyPos[0]), (bodyVert.position[1] * bodySize[1] + bodyPos[1]), (bodyVert.position[2] * bodySize[2] + bodyPos[2])]
                                            if (refVert) {
                                                refVert.position = newPosition

                                                let offset = offsetMap.get(refVert)
                                                if (!offset) {
                                                    offset = [0,0,0]
                                                    offsetMap.set(refVert, offset)
                                                }
                                                offsetMap.set(refVert, add(offset, minus(newPosition, oldPos)))
                                                //refVert.moved = true
                                            }
                                        }
                                    }
                                }

                                for (let i = 0; i < mesh.coreMesh.verts.length; i++) { //TODO: figure out how to NOT deform stuff outside the outer cage
                                    const vert = mesh.coreMesh.verts[i]

                                    const offset = [0,0,0]
                                    for (let j = 0; j < ref_mesh.coreMesh.verts.length; j++) {
                                        const refVert = ref_mesh.coreMesh.verts[j]
                                        if (!(refVert as unknown as {[K in string]: Vec3}).oldPosition) {
                                            (refVert as unknown as {[K in string]: Vec3}).oldPosition = [refVert.position[0],refVert.position[1],refVert.position[2]]
                                        }
                                        //console.log(refOffset)
                                        //console.log(minus(refVert.position,refVert.oldPosition))
                                        const weight = meshVertWeights[i][j]
                                        const newOffset = add(offset, multiply(minus(refVert.position, (refVert as unknown as {[K in string]: Vec3}).oldPosition), [weight,weight,weight]))
                                        offset[0] = newOffset[0]
                                        offset[1] = newOffset[1]
                                        offset[2] = newOffset[2]
                                    }

                                    vert.position = add(vert.position, offset) as Vec3
                                }

                                newSize = [1,1,1]
                                oldSize = [1,1,1]

                                resolve(mesh)
                                onMeshLoaded(mesh)
                            })
                        })
                    })
                } else {
                    resolve(mesh)
                    onMeshLoaded(mesh)
                }
            })
        })

        if (shouldCacheMesh) {
            meshStrToFileMesh.set(fetchStr, fileMeshPromise)
        }
    }

    for (const mapStr of [[colorMapIDstr, "map"], [normalMapIDstr, "normalMap"], [roughnessMapIDstr, "roughnessMap"], [metalnessMapIDstr, "metalnessMap"]]) {
        const colorMapIDstr = mapStr[0]
        if (colorMapIDstr.length > 0) {
            if (!colorMapIDstr.includes("clothing")) {
                const colorMapId = parseAssetString(colorMapIDstr) || ""

                console.log(`Fetching ${mapStr[1]} from ${`${colorMapId}`}`)
                if (!affectedByPartColor) { //TODO: make sure there is no transparency by stretching the colors or something?
                    const loader = new THREE.TextureLoader();
                        loader.load(
                            `${colorMapId}`, // Replace with the actual path to your PNG
                            function (texture) {
                                if (!meshExists(instance)) return
                                if (mapStr[1] === "map") {
                                    texture.colorSpace = THREE.SRGBColorSpace
                                }
                                texture.wrapS = THREE.RepeatWrapping
                                texture.wrapT = THREE.RepeatWrapping;
                                (meshMaterial as unknown as {[K in string]: THREE.Texture})[mapStr[1]] = texture
                                texture.needsUpdate = true
                                meshMaterial.needsUpdate = true
                            },
                            undefined, // onProgress callback (optional)
                            function (err) {
                                console.error('An error occurred loading the texture:', err);
                            }
                        );
                } else {
                    const colorMap = new Image()
                    colorMap.addEventListener("load", () => {
                        if (!meshExists(instance)) return
                        const canvas = document.createElement("canvas")
                        const ctx = canvas.getContext("2d")
                        
                        canvas.width = colorMap.width
                        canvas.height = colorMap.height

                        if (ctx) {
                            if (partColor) {
                                ctx.fillStyle = `rgb(${partColor.R},${partColor.G},${partColor.B})`
                            } else {
                                ctx.fillStyle = "#ffffffff"
                            }

                            ctx.fillRect(0,0,canvas.width,canvas.height)
                            ctx.drawImage(colorMap,0,0)
                        }

                        const texture = new THREE.CanvasTexture(canvas)
                        if (mapStr[1] === "map") {
                            texture.colorSpace = THREE.SRGBColorSpace
                        }
                        texture.wrapS = THREE.RepeatWrapping
                        texture.wrapT = THREE.RepeatWrapping;
                        (meshMaterial as unknown as {[K in string]: THREE.Texture})[mapStr[1]] = texture
                        meshMaterial.needsUpdate = true
                    })
                    colorMap.crossOrigin = "anonymous"
                    colorMap.src = colorMapId
                }
            } else { //TODO: also care about body part texture
                let clothingTexture = clothingToTexture.get(colorMapIDstr)

                if (!clothingTexture) { //render clothing texture
                    const canvas = document.createElement("canvas")
                    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D

                    if (colorMapIDstr.startsWith("clothingR15")) { //R15
                        console.log(colorMapIDstr)

                        const limbId = Number(colorMapIDstr.at(12))
                        if (limbId === BodyPart.Torso) {
                            canvas.width = 388
                            canvas.height = 272
                        } else {
                            canvas.width = 264
                            canvas.height = 284
                        }

                        const clothingSplit = colorMapIDstr.slice(16).split(" & ")
                        
                        //create texture
                        clothingTexture = new THREE.CanvasTexture(canvas)
                        clothingTexture.colorSpace = THREE.SRGBColorSpace
                        drawSkinColor(clothingSplit, ctx, canvas)
                        clothingToTexture.set(colorMapIDstr, clothingTexture)

                        function renderClothingToCanvasR15(pantsUrl: string | null, pantsImg: HTMLImageElement, shirtUrl: string| null, shirtImg: HTMLImageElement, tshirtUrl: string| null, tshirtImg: HTMLImageElement, overlayUrl: string| null, overlayImg: HTMLImageElement) {
                            if (!meshExists(instance)) return
                            const isArm = limbId === BodyPart.LeftArm || limbId === BodyPart.RightArm

                            //limbs
                            if (limbId !== BodyPart.Torso) {
                                const isLeft = limbId === BodyPart.LeftArm || limbId === BodyPart.LeftLeg

                                const url = isArm ? shirtImg : pantsImg
                                if (url) {
                                    const img = isArm ? shirtImg : pantsImg

                                    const startX = isLeft ? 308 : 217
                                    let i = isLeft ? 1 : -3

                                    //top
                                    mapImg(ctx, img, startX, 289, 64, 64, 2, 66, 64, 64, -90)

                                    //bottom
                                    mapImg(ctx, img, startX, 485, 64, 64, 198, 218, 64, 64, 0)

                                    //front
                                    mapImg(ctx, img, startX + 66*0, 355, 64, 114, 66 + 64*0, 66, 64, 114, 0)
                                    mapImg(ctx, img, startX + 66*0, 469, 64, 14, 66 + 64*0, 216, 64, 18, 0)
                                        //in betweens (TODO: make this more accurate)
                                        mapImg(ctx, img, startX + 66*0, 417, 64, 3, 0, 198, 36, 18, 0) //top of lower leg
                                        mapImg(ctx, img, startX + 66*0, 465, 64, 3, 160, 254, 36, 18, 0) //top of feet
                                        mapImg(ctx, img, startX + 66*0, 417, 64, 3, 103, 45, 36, 18, 180) //bottom of upper leg
                                        mapImg(ctx, img, startX + 66*0, 465, 64, 3, 71, 197, 36, 18, 180) //bottom of lower leg

                                    //left
                                    mapImg(ctx, img, startX + 66*i, 355, 64, 114, 66 + 64*1, 66, 64, 114, 0)
                                    mapImg(ctx, img, startX + 66*i, 469, 64, 14, 66 + 64*1, 216, 64, 18, 0)
                                    i++

                                    //back
                                    mapImg(ctx, img, startX + 66*i, 355, 64, 114, 66 + 64*2, 66, 64, 114, 0)
                                    mapImg(ctx, img, startX + 66*i, 469, 64, 14, 2, 236, 64, 18, 0)
                                    //in betweens (TODO: make this more accurate)
                                        mapImg(ctx, img, startX + 66*i, 417, 64, 3, 35, 197, 36, 18, 180) //top of lower leg
                                        mapImg(ctx, img, startX + 66*i, 465, 64, 3, 195, 253, 36, 18, 180) //top of feet
                                        mapImg(ctx, img, startX + 66*i, 417, 64, 3, 68, 46, 36, 18, 0) //bottom of upper leg
                                        mapImg(ctx, img, startX + 66*i, 465, 64, 3, 36, 198, 36, 18, 0) //bottom of lower leg
                                    i++

                                    //right
                                    mapImg(ctx, img, startX + 66*i, 355, 64, 114, 66 + 64*-1, 66, 64, 114, 0)
                                    mapImg(ctx, img, startX + 66*i, 469, 64, 14, 66 + 64*-1, 216, 64, 18, 0)
                                    i++
                                }
                            } else { //torso
                                //shirt and pants
                                const imgs = []
                                if (pantsUrl) {
                                    imgs.push(pantsImg)
                                }
                                if (shirtUrl) {
                                    imgs.push(shirtImg)
                                }

                                for (const img of imgs) {
                                    //front
                                    mapImg(ctx, img, 231, 74, 128, 128, 2, 74, 128, 128, 0)

                                    //left
                                    mapImg(ctx, img, 361, 74, 64, 128, 130, 74, 64, 128, 0)

                                    //back
                                    mapImg(ctx, img, 427, 74, 128, 128, 194, 74, 128, 128, 0)

                                    //right
                                    mapImg(ctx, img, 165, 74, 64, 128, 322, 74, 64, 128, 0)

                                    //top
                                    mapImg(ctx, img, 231, 8, 128, 64, 2, 10, 128, 64, 0)

                                    //bottom
                                    mapImg(ctx, img, 231, 204, 128, 64, 2, 202, 128, 64, 0)

                                    //cheap cover for top of lower torso TODO: make this more accurate
                                    mapImg(ctx, img, 231, 169, 128, 2, 134, 222, 64, 16, 0)
                                    mapImg(ctx, img, 427, 169, 128, 2, 134, 206, 64, 16, 0)

                                    //cheap cover for bottom of upper torso TODO: also make this more accurate
                                    mapImg(ctx, img, 231, 170, 128, 2, 134, 38, 64, 16, 0)
                                    mapImg(ctx, img, 427, 170, 128, 2, 134, 54, 64, 16, 0)
                                }

                                if (tshirtUrl) {
                                    //tshirt
                                    mapImg(ctx, tshirtImg, 0, 0, tshirtImg.width, tshirtImg.height, 2, 74, 128, 128, 0)
                                }
                            }

                            drawOverlay(clothingSplit, ctx, canvas, overlayUrl, overlayImg)
                            if (clothingTexture) {
                                clothingTexture.needsUpdate = true
                            }
                        }

                        loadClothing(clothingSplit, renderClothingToCanvasR15)
                    } else { //R6
                        canvas.width = 768
                        canvas.height = 512

                        //ctx.clearRect(0,0,canvas.width,canvas.height)

                        const clothingSplit = colorMapIDstr.slice(11).split(" & ")

                        //create texture
                        clothingTexture = new THREE.CanvasTexture(canvas)
                        clothingTexture.colorSpace = THREE.SRGBColorSpace
                        drawSkinColor(clothingSplit, ctx, canvas)
                        clothingToTexture.set(colorMapIDstr, clothingTexture)

                        function renderClothingToCanvasR6(pantsUrl: string| null, pantsImg: HTMLImageElement, shirtUrl: string| null, shirtImg: HTMLImageElement, tshirtUrl: string| null, tshirtImg: HTMLImageElement, overlayUrl: string| null, overlayImg: HTMLImageElement) {
                            if (!meshExists(instance)) return
                            for (const cloth of [[pantsUrl, pantsImg],[shirtUrl, shirtImg]]) {
                                const url = cloth[0] as string
                                const img = cloth[1] as HTMLImageElement

                                if (url) {
                                    //front
                                    mapImg(ctx, img, 231, 74, 128, 128, 122, 64, 128, 100, 90)
                                    
                                    //back
                                    mapImg(ctx, img, 427, 74, 128, 128, 122, 256, 128, 100, 90)

                                    //left
                                    mapImg(ctx, img, 361, 74, 64, 128, 122, 192, 64, 100, 90)

                                    //right (why did they make 2 spots??, one of them barely even covers anything)
                                    mapImg(ctx, img, 165, 74, 64, 128, 122, 0, 64, 100, 90)
                                    mapImg(ctx, img, 165, 74, 64, 128, 122, 384, 64, 100, 90)

                                    //top
                                    mapImg(ctx, img, 231, 8, 128, 64, 150, 328, 96, 64, 0)
                                
                                    //bottom
                                    mapImg(ctx, img, 231, 204, 128, 64, 252, 328, 96, 64, 0)
                                }
                            }

                            if (pantsUrl) { //render pants
                                //right leg
                                    //front
                                    mapImg(ctx, pantsImg, 217, 355, 64, 128, 272 + 300, 192, 64, 100, 90)

                                    //right
                                    mapImg(ctx, pantsImg, 151, 355, 64, 128, 272 + 300, 128, 64, 100, 90)

                                    //back
                                    mapImg(ctx, pantsImg, 85, 355, 64, 128, 272 + 300, 64, 64, 100, 90)

                                    //left
                                    mapImg(ctx, pantsImg, 19, 355, 64, 128, 272 + 300, 256, 64, 100, 90)
                                    mapImg(ctx, pantsImg, 19, 355, 64, 128, 272 + 300, 0, 64, 100, 90)

                                    //top
                                    mapImg(ctx, pantsImg, 217, 289, 64, 64, 354, 328, 48, 64, 0)

                                    //bottom
                                    mapImg(ctx, pantsImg, 217, 485, 64, 64, 462, 328, 48, 64, 0)
                                //left leg
                                    //front
                                    mapImg(ctx, pantsImg, 308, 355, 64, 128, 422 + 300, 64, 64, 100, 90)

                                    //right
                                    mapImg(ctx, pantsImg, 506, 355, 64, 128, 422 + 300, 0, 64, 100, 90)
                                    mapImg(ctx, pantsImg, 506, 355, 64, 128, 422 + 300, 256, 64, 100, 90)

                                    //back
                                    mapImg(ctx, pantsImg, 440, 355, 64, 128, 422 + 300, 192, 64, 100, 90)

                                    //left
                                    mapImg(ctx, pantsImg, 374, 355, 64, 128, 422 + 300, 128, 64, 100, 90)

                                    //top
                                    mapImg(ctx, pantsImg, 308, 289, 64, 64, 408, 328, 48, 64, 0)

                                    //bottom
                                    mapImg(ctx, pantsImg, 308, 485, 64, 64, 516, 328, 48, 64, 0)
                            }
                            if (shirtUrl) { //render shirt
                                //right arm
                                    //front
                                    mapImg(ctx, shirtImg, 217, 355, 64, 128, 272, 192, 64, 100, 90)

                                    //right
                                    mapImg(ctx, shirtImg, 151, 355, 64, 128, 272, 128, 64, 100, 90)

                                    //back
                                    mapImg(ctx, shirtImg, 85, 355, 64, 128, 272, 64, 64, 100, 90)

                                    //left
                                    mapImg(ctx, shirtImg, 19, 355, 64, 128, 272, 256, 64, 100, 90)
                                    mapImg(ctx, shirtImg, 19, 355, 64, 128, 272, 0, 64, 100, 90)

                                    //top
                                    mapImg(ctx, shirtImg, 217, 289, 64, 64, 678, 328, 48, 64, 0)

                                    //bottom
                                    mapImg(ctx, shirtImg, 217, 485, 64, 64, 570, 328, 48, 64, 0)
                                //left arm
                                    //front
                                    mapImg(ctx, shirtImg, 308, 355, 64, 128, 422, 64, 64, 100, 90)

                                    //right
                                    mapImg(ctx, shirtImg, 506, 355, 64, 128, 422, 0, 64, 100, 90)
                                    mapImg(ctx, shirtImg, 506, 355, 64, 128, 422, 256, 64, 100, 90)

                                    //back
                                    mapImg(ctx, shirtImg, 440, 355, 64, 128, 422, 192, 64, 100, 90)

                                    //left
                                    mapImg(ctx, shirtImg, 374, 355, 64, 128, 422, 128, 64, 100, 90)

                                    //top
                                    mapImg(ctx, shirtImg, 308, 289, 64, 64, 150, 400, 48, 65, 0) //seam fix
                                    mapImg(ctx, shirtImg, 308, 289, 64, 64, 150, 400, 48, 64, 0)

                                    //bottom
                                    mapImg(ctx, shirtImg, 308, 485, 64, 64, 624, 328, 48, 64, 0)
                                    
                            }
                            if (tshirtUrl) {
                                mapImg(ctx, tshirtImg, 0, 0, tshirtImg.width, tshirtImg.height, 120, 64, 128, 96, 90)
                            }

                            drawOverlay(clothingSplit, ctx, canvas, overlayUrl, overlayImg)
                            if (clothingTexture) {
                                clothingTexture.needsUpdate = true
                            }
                        }

                        loadClothing(clothingSplit, renderClothingToCanvasR6)
                    }
                }

                if (!meshExists(instance)) return;

                (meshMaterial as unknown as {[K in string]: THREE.Texture})[mapStr[1]] = clothingTexture
                meshMaterial.needsUpdate = true
            }
        }
    }
}

function isAffectedByHumanoid(child: Instance) {
    const parent = child.parent
    if (!parent) {
        return false
    }
    if (BodyPartNameToEnum[child.Property("Name") as string] && child.name !== "Head") { //check if part is one of the parts inside an R6 rig affected by humanoids
        if (parent) {
            const humanoid = parent.FindFirstChildOfClass("Humanoid")
            if (humanoid) {
                return true
            }
        }
    }

    return false
}

function getClothingStr(rig: Instance, child: Instance) {
    const parent = rig

    let colorMapStr = ""

    const shirt = parent.FindFirstChildOfClass("Shirt")
    const pants = parent.FindFirstChildOfClass("Pants")
    const tshirt = parent.FindFirstChildOfClass("ShirtGraphic")

    let shirtTemplate = null
    let pantsTemplate = null
    let tshirtTemplate = null

    if (shirt) {
        shirtTemplate = "shirt=" + shirt.Property("ShirtTemplate")
    }

    if (pants) {
        pantsTemplate = "pants=" + pants.Property("PantsTemplate")
    }

    if (tshirt) {
        tshirtTemplate = "tshirt=" + tshirt.Property("Graphic")
    }

    const skinColor = child.Property("Color") as Color3uint8

    if (shirtTemplate || pantsTemplate) {
        colorMapStr = "clothing://" + `color=${skinColor.R},${skinColor.G},${skinColor.B}`
        for (const template of [pantsTemplate, shirtTemplate, tshirtTemplate])  {
            if (template) {
                colorMapStr += " & " + template
            }
        }
    }

    return colorMapStr
}

function toMesh(child: Instance) {
    if (!["Part", "MeshPart"].includes(child.className)) {
        return
    }

    const cframe = child.Property("CFrame") as CFrame

    switch (child.className) {
        case "Part": {
            const specialMesh = child.FindFirstChildOfClass("SpecialMesh")
            if (specialMesh) {
                const v3S = specialMesh.Property("Scale") as Vector3
                const scale = [v3S.X, v3S.Y, v3S.Z]
                
                let meshIDStr = ""
                let colorMapIDstr = ""

                switch (specialMesh.Property("MeshType")) {
                    case MeshType.FileMesh: {
                        meshIDStr = specialMesh.Property("MeshId") as string
                        colorMapIDstr = specialMesh.Property("TextureId") as string
                        break
                    }
                    case MeshType.Head: {
                        meshIDStr = "rbxasset://avatar/heads/head.mesh"
                        scale[0] *= 0.8
                        scale[1] *= 0.8
                        scale[2] *= 0.8
                        break
                    } //TODO: add the rest of the mesh types
                    default: {
                        console.warn(`MeshType ${specialMesh.Property("MeshType")} is not supported`)
                        break
                    }
                }

                if (colorMapIDstr.length === 0) { //prioritize mesh texture over decal
                    const decal = child.FindFirstChildOfClass("Decal")
                    if (decal) {
                        colorMapIDstr = decal.Property("Texture") as string
                    }
                }

                if (meshIDStr.length > 0) {
                    addMesh(child, cframe, meshIDStr, scale, [1,1,1], colorMapIDstr)
                }
                
            } else {
                const affectedByHumanoid = isAffectedByHumanoid(child)
                if (affectedByHumanoid) { //clothing and stuff
                    const parent = child.parent
                    const humanoid = parent?.FindFirstChildOfClass("Humanoid")

                    if (parent && humanoid && humanoid.Property("RigType") === HumanoidRigType.R6) {
                        //get mesh of body part based on CharacterMesh
                        let characterMeshStr = null
                        let overlayTextureId = 0
                        const children2 = parent.GetChildren()
                        for (const child2 of children2) {
                            if (child2.className === "CharacterMesh") {
                                if (BodyPartNameToEnum[child.Property("Name") as string] === child2.Property("BodyPart")) {
                                    //TODO: check if the other properties are important
                                    characterMeshStr = child2.Property("MeshId") as string
                                    overlayTextureId = Number(child2.Property("OverlayTextureId") as string)
                                }
                            }
                        }

                        if (!characterMeshStr) { //use default blocky meshes
                            characterMeshStr = `rbxasset://avatar/meshes/${["","torso","leftarm","rightarm","leftleg","rightleg"][BodyPartNameToEnum[child.Property("Name") as string]]}.mesh`
                        }

                        let colorMapStr = getClothingStr(parent, child)

                        if (overlayTextureId && overlayTextureId > 0) {
                            colorMapStr += " & overlay=" + parseAssetString(`${overlayTextureId}`)
                        }

                        addMesh(child, cframe, characterMeshStr, [1,1,1], [1,1,1], colorMapStr)
                    } else { //TODO: R15, clothing

                    }
                } else { //TODO: render as regular part (cube, cylinder, sphere, etc.)

                }
            }

            break
        }
        case "MeshPart": {
            const newSizeVec3 = child.Property("Size") as Vector3
            const newSize = [newSizeVec3.X, newSizeVec3.Y, newSizeVec3.Z]
            const meshIDStr = child.Property("MeshId") as string

            let colorStr = ""
            let normalStr = ""
            let roughnessStr = ""
            let metalnessStr = ""
            
            let affectedByHumanoid = isAffectedByHumanoid(child)

            const surfaceAppearance = child.FindFirstChildOfClass("SurfaceAppearance")
            if (surfaceAppearance) { //TODO: do something with AlphaMode property to stop rthro characters from looking like flesh
                colorStr = surfaceAppearance.Property("ColorMap") as string
                normalStr = surfaceAppearance.Property("NormalMap") as string
                roughnessStr = surfaceAppearance.Property("RoughnessMap") as string
                metalnessStr = surfaceAppearance.Property("MetalnessMap") as string
                affectedByHumanoid = false
            } else {
                colorStr = child.Property("TextureID") as string
            }

            if (colorStr.length === 0) { //prioritize mesh texture over decal
                const decal = child.FindFirstChildOfClass("Decal")
                if (decal) {
                    colorStr = decal.Property("Texture") as string
                }
            }

            if (affectedByHumanoid && child.parent) {
                const oldColorStr = colorStr
                colorStr = getClothingStr(child.parent, child).replace("clothing://", `clothingR15_${BodyPartNameToEnum[child.Prop("Name") as string]}://`)
                if (oldColorStr && oldColorStr.length > 0) {
                    colorStr += " & overlay=" + oldColorStr
                }
            }

            addMesh(child, cframe, meshIDStr, newSize, undefined, colorStr, normalStr, roughnessStr, metalnessStr)
            
            break
        }
    }
}

const instanceToConnectionsMap = new Map()

function removeRBXChild(child: Instance) {
    destroyMesh(child)

    if (instanceToConnectionsMap.get(child)) {
        for (const connection of instanceToConnectionsMap.get(child)) {
            connection.Disconnect()
        }
        instanceToConnectionsMap.delete(child)
    }
}

function removeRBX(rbx: RBX) {
    console.log("removing rbx")

    if (!rbx.treeGenerated) {
        rbx.generateTree()
    }

    const descendants = rbx.dataModel.GetDescendants()
    console.log(rbx.dataModel)
    console.log(descendants)
    for (const child of descendants) {
        /*if (child.className === "Attachment" && child.Prop("Name").includes("RigAttachment")) {
            let cube = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
            setTHREEMeshCF(cube, child.parent.Prop("CFrame").multiply(child.Prop("CFrame")))
            scene.add(cube)
        }
        if (child.className === "Motor6D") {
            let cube = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            setTHREEMeshCF(cube, child.Prop("Part0").Prop("CFrame").multiply(child.Prop("C0")))
            scene.add(cube)

            let cube1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
            setTHREEMeshCF(cube1, child.Prop("Part1").Prop("CFrame").multiply(child.Prop("C1")))
            scene.add(cube1)
        }*/
        removeRBXChild(child)
    }
}

function addRBXChild(child: Instance) {
    toMesh(child)

    const connections = []

    if (instanceToConnectionsMap.get(child)) {
        for (const connection of instanceToConnectionsMap.get(child)) {
            connection.Disconnect()
        }
    }

    connections.push(child.Changed.Connect(() => {
        toMesh(child)
    }))
    connections.push(child.Destroying.Connect(() => {
        removeRBXChild(child)
    }))
    connections.push(child.ChildAdded.Connect((newChild) => {
        for (const child of (newChild as Instance).GetDescendants()) {
            addRBXChild(child)
        }
    }))

    instanceToConnectionsMap.set(child, connections)
}

function addRBX(rbx: RBX) {
    console.log("adding rbx")

    if (!rbx.treeGenerated) {
        rbx.generateTree()
    }

    const descendants = rbx.dataModel.GetDescendants()
    console.log(rbx.dataModel)
    console.log(descendants)
    for (const child of descendants) {
        /*if (child.className === "Attachment" && child.Prop("Name").includes("RigAttachment")) {
            let cube = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
            setTHREEMeshCF(cube, child.parent.Prop("CFrame").multiply(child.Prop("CFrame")))
            scene.add(cube)
        }
        if (child.className === "Motor6D") {
            let cube = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            setTHREEMeshCF(cube, child.Prop("Part0").Prop("CFrame").multiply(child.Prop("C0")))
            scene.add(cube)

            let cube1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
            setTHREEMeshCF(cube1, child.Prop("Part1").Prop("CFrame").multiply(child.Prop("C1")))
            scene.add(cube1)
        }*/
        addRBXChild(child)
    }
}

/*
let currentAvatarRBX: RBX | null = null

export function loadAvatarAssets(outfit, _auth) {
    if (currentAvatarRBX) {
        removeRBX(currentAvatarRBX)
    }

    const rbx = new RBX()
    rbx.fromOutfit(outfit).then(() => {
        const avatarRBX = rbx

        const rig = avatarRBX.dataModel.FindFirstChildOfClass("Model")
        //recalculate motor6ds
        for (const child of rig.GetDescendants()) {
            if (child.className === "Motor6D" || child.className === "Weld") {
                child.setProperty("C0", child.Prop("C0"))
            }
        }

        let currentAnimationIndex = 0

        const stillPoseAnimationIds = [ //realistic idle post
            11600209531,
            11600209531,
        ]

        let animationIds = [
            507766388, //idle long
            913376220, //run
            507772104, //dance
        ]

        //animationIds = stillPoseAnimationIds

        if (outfit.playerAvatarType === AvatarType.R6) {
            animationIds = [
                180435571, //idle long
                180426354, //run
                182435998, //dance1[0] (gangnam style)
            ]
        }

        const animationTracks = []

        const animationPromises = []

        for (const id of animationIds) {
            animationPromises.push(new Promise((resolve, _reject) => {
                GetAsset("https://assetdelivery.roblox.com/v1/asset?id=" + id).then(buffer => {

                    const rbx = new RBX()
                    rbx.fromBuffer(buffer)
                    console.log(rbx.generateTree())

                    const animationTrack = new AnimationTrack()
                    animationTrack.loadAnimation(rig, rbx.dataModel.GetChildren()[0])
                    animationTrack.looped = true
                    animationTracks.push(animationTrack)
                    
                    console.log(animationTrack)

                    resolve()
                })
            }))
        }

        let animationTotalTime = 5
        const animationTransitionTime = 0.5

        Promise.all(animationPromises).then(() => {
            function updateTrack(startTime, lastAnimationSwitch) {
                const nextAnimationIndex = (currentAnimationIndex + 1) % animationIds.length

                const animationTrack = animationTracks[currentAnimationIndex]
                const nextAnimationTrack = animationTracks[nextAnimationIndex]

                const newTime = performance.now() / 1000

                const playedTime = newTime - lastAnimationSwitch
                const firstHalfTime = animationTotalTime - animationTransitionTime

                nextAnimationTrack.weight = Math.max(0, playedTime - firstHalfTime) / animationTransitionTime
                animationTrack.weight = 1 - nextAnimationTrack.weight
                nextAnimationTrack.weight *= 1
                animationTrack.weight *= 1
                
                //console.log("----")
                //console.log(animationTrack.weight)
                animationTrack.resetMotorTransforms()
                animationTrack.setTime((newTime - startTime))
                nextAnimationTrack.setTime((newTime - startTime))

                //recalculate motor6ds
                for (const child of rig.GetDescendants()) {
                    if (child.className === "Motor6D") {
                        child.setProperty("Transform", child.Prop("Transform"))
                    } else if (child.className === "Weld") {
                        child.setProperty("C0", child.Prop("C0"))
                    }
                }

                if (newTime - lastAnimationSwitch > animationTotalTime) {
                    currentAnimationIndex++
                    currentAnimationIndex = currentAnimationIndex % animationIds.length
                    animationTotalTime = 5 + Math.random() * 5
                    lastAnimationSwitch = performance.now() / 1000
                }

                setTimeout(() => {
                    if (rbx === currentAvatarRBX) {
                        updateTrack(startTime, lastAnimationSwitch)
                    } else {
                        console.log("sSTOP ANIMATING!!")
                    }
                }, 1000 / 60 - 1)
            }

            const lastAnimationSwitch = performance.now() / 1000
            animationTotalTime = animationTracks[currentAnimationIndex].length
            if (!outfit.containsLayered() || outfit.playerAvatarType === AvatarType.R6) {
                updateTrack(performance.now() / 1000, lastAnimationSwitch)
            }
        })

        currentAvatarRBX = avatarRBX
        window.currentAvatarRBX = avatarRBX
        addRBX(avatarRBX)
    })
}
*/

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 70, 1 / 1, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setPixelRatio(window.devicePixelRatio * 1)
renderer.setSize( 420, 420 );
renderer.domElement.setAttribute("style","width: 420px; height: 420; border-radius: 0px;")

renderer.domElement.setAttribute("id","OutfitInfo-outfit-image-3d")

scene.background = new THREE.Color( 0x2C2E31 );

const lightingType: string = "WellLit" //"Thumbnail" | "WellLit"

let thumbnailAmbientVal = 138 //138 SHOULD be accurate but its not???, nvm it probably is but there is a second light source, wait i think ambient is more correct to use
thumbnailAmbientVal = 128
//thumbnailAmbientVal = 153 //this is 255 * 0.6
let ambientLightColor = undefined
if (lightingType === "Thumbnail") {
    ambientLightColor = new THREE.Color(thumbnailAmbientVal / 255, thumbnailAmbientVal / 255, thumbnailAmbientVal / 255)
} else if (lightingType === "WellLit") {
    ambientLightColor = new THREE.Color(100 / 255, 100 / 255, 100 / 255)
}
//const ambientLight = new THREE.AmbientLight( 0x7a7a7a );
console.log(ambientLightColor)
const ambientLight = new THREE.AmbientLight( ambientLightColor, Math.PI / 2 );
scene.add( ambientLight );

let directionalLightColor = undefined
const directionalLightVal = 0.7 * 0.9 * 2 * 0.4
if (lightingType === "Thumbnail") {
    directionalLightColor = new THREE.Color(directionalLightVal, directionalLightVal, directionalLightVal)
} else if (lightingType === "WellLit") {
    directionalLightColor = new THREE.Color(1,1,1)
}
let directionalLightIntensity = 1
if (lightingType === "WellLit") {
    directionalLightIntensity = Math.PI / 2
}

const directionalLight = new THREE.DirectionalLight( directionalLightColor, directionalLightIntensity );
//directionalLight.position.set(new THREE.Vector3(1.2,1,1.2))
if (lightingType === "WellLit") {
    directionalLight.position.set(-5,15,-8)
} else if (lightingType === "Thumbnail") {
    directionalLight.position.set(-0.47489210963249207 * 10, 0.8225368857383728 * 10, 0.3129066228866577 * 10)
}

if (lightingType === "WellLit") {
    directionalLight.castShadow = true
}
directionalLight.shadow.mapSize.width = 256;
directionalLight.shadow.mapSize.height = 256;

const bottomOffset = 1.6
const shadowPhysicalSize = 4.2
directionalLight.shadow.camera.left = -shadowPhysicalSize
directionalLight.shadow.camera.right = shadowPhysicalSize
directionalLight.shadow.camera.top = shadowPhysicalSize + bottomOffset
directionalLight.shadow.camera.bottom = -shadowPhysicalSize + bottomOffset

directionalLight.shadow.camera.near = 0.5; // default
directionalLight.shadow.camera.far = 25;

//const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
//scene.add(shadowHelper);

directionalLight.target.position.set(0,0,0)
scene.add( directionalLight );

if (lightingType === "WellLit") {
    const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.3 );
    //directionalLight.position.set(new THREE.Vector3(1.2,1,1.2))
    directionalLight2.position.set(5,-7,5)
    directionalLight2.target.position.set(0,0,0)
    scene.add( directionalLight2 );
} else if (lightingType === "Thumbnail") { //this looks good TODO: disable specular from this light somehow, should exclusively be diffuse
    const directionalLight2 = new THREE.DirectionalLight( directionalLightColor, directionalLightIntensity * 0.5 );
    //directionalLight.position.set(new THREE.Vector3(1.2,1,1.2))
    directionalLight2.position.set(-0.47489210963249207 * -10, 0.8225368857383728 * -10, 0.3129066228866577 * -10)
    directionalLight2.target.position.set(0,0,0)
    scene.add( directionalLight2 );
}

const planeGeometry = new THREE.PlaneGeometry( 20, 20, 32, 32 );
const planeShadowMaterial = new THREE.ShadowMaterial({opacity: 0.5});
const shadowPlane = new THREE.Mesh( planeGeometry, planeShadowMaterial );
shadowPlane.rotation.set(rad(-90),0,0)
shadowPlane.position.set(0,0,0)
shadowPlane.receiveShadow = true;
scene.add( shadowPlane );

const planeSolidColorMaterial = new THREE.MeshBasicMaterial({color: 0x2c2e31})
const plane = new THREE.Mesh( planeGeometry, planeSolidColorMaterial );
plane.rotation.set(rad(-90),0,0)
plane.position.set(0,0,0)
plane.receiveShadow = false;
scene.add( plane );

//orbit controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.maxDistance = 25
controls.zoomSpeed = 2

controls.target.set(0,3,0)
console.log(controls.target)

camera.position.set(lookAwayVector[0] * lookAwayDistance,3 + lookAwayVector[1] * lookAwayDistance,lookAwayVector[2] * lookAwayDistance)
camera.lookAt(new THREE.Vector3(0,3,0))
controls.update()

function animate() {
    /*let dataModel = rbx.dataModel
    let kiri = dataModel.FindFirstChild("Avatar")
    if (kiri) {
        let upperTorso = kiri.FindFirstChild("UpperTorso")
        if (upperTorso) {
            let waistMotor6D = upperTorso.FindFirstChild("Waist")

            let cf = waistMotor6D.Property("Transform").clone()
            //cf.Orientation[0] += 1
            waistMotor6D.setProperty("Transform", cf)
        }

        //recalculate motor6ds
        for (let child of kiri.GetDescendants()) {
            if (child.className === "Motor6D") {
                child.setProperty("Transform", child.Prop("Transform").clone())
            }
        }
    }

    let mzigi = dataModel.FindFirstChild("Avatar")
    if (mzigi) {
        let torso = mzigi.FindFirstChild("Torso")
        if (torso) {
            let neck = torso.FindFirstChild("Neck")

            let cf = neck.Property("Transform").clone()
            //cf.Orientation[0] += 1
            neck.setProperty("Transform", cf)
        }

        //recalculate motor6ds
        for (let child of mzigi.GetDescendants()) {
            if (child.className === "Motor6D") {
                child.setProperty("Transform", child.Prop("Transform").clone())
            }
        }
    }*/

    renderer.render( scene, camera );

    requestAnimationFrame( () => {
        animate()
    } );
};

/*let setDomElementParent = false

function changeParentDomElement() {
    if (document.getElementById("accessory-render-container")) {
        document.getElementById("accessory-render-container").appendChild(renderer.domElement)
        setDomElementParent = true
    }

    if (document.getElementsByClassName("OutfitInfo-outfit-image")[0]) {
        renderer.domElement.setAttribute("style","width: 100%; height: 100%; border-radius: 10px;")
        document.getElementsByClassName("OutfitInfo-outfit-image")[0].insertBefore(renderer.domElement, document.getElementsByClassName("OutfitInfo-outfit-image")[0].querySelectorAll(":scope > *")[1])
        setDomElementParent = true
    }

    if (!setDomElementParent) {
        setTimeout(changeParentDomElement, 100)
    }
}

changeParentDomElement()*/
animate()

/*
var model = new RBX()

GetAsset("/assets/MZigi-tshirt.rbxm").then(buffer => {
    model.fromBuffer(buffer)
    console.log(model)
    addRBX(model)

    animate(model)
})
*/

//addAccessory()
function setRendererSize(width: number, height: number) {
    renderer.setSize(width, height)
}
function getRendererDom() {
    return renderer.domElement
}

function getRendererCamera() {
    return camera
}

function getRendererControls() {
    return controls
}

export function mount( container: HTMLDivElement ) {
    if (container) {
        container.insertBefore(renderer.domElement, container.firstChild)
    } else {
        renderer.domElement.remove()
    }
}

export { removeRBX, addRBX, setRendererSize, getRendererDom, getRendererCamera, getRendererControls }

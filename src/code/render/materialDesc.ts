import * as THREE from 'three'
import { AlphaMode, BodyPart, BodyPartNameToEnum, HumanoidRigType, MeshType, NormalId, RenderedClassTypes } from "../rblx/constant"
import { Color3, Color3uint8, Content, isAffectedByHumanoid, type Instance } from "../rblx/rbx"
import { AvatarType } from '../avatar/constant'
import { API, Authentication } from '../api'
import { TextureComposer } from './textureComposer'
import { Shader_TextureComposer_Flat } from './shaders/textureComposer-flat'
import { Shader_TextureComposer_FullscreenQuad } from './shaders/textureComposer-fullscreenquad'
import { Shader_TextureComposer_FullscreenQuad_Color } from './shaders/textureComposer-fullscreenquad-color'
import { getRenderer } from './renderer'
import { Shader_TextureComposer_Flat_Color } from './shaders/textureComposer-flat-color'
import { fileMeshToTHREEGeometry, type MeshDesc } from './meshDesc'
import { FileMesh } from '../rblx/mesh'
import { Shader_TextureComposer_Decal } from './shaders/textureComposer-decal'

async function renderBodyPartClothingR15(limbId: number, texture: THREE.Texture) {
    let instruction: THREE.Mesh

    //limbs
    if (limbId !== BodyPart.Torso) {
        const isLeft = limbId === BodyPart.LeftArm || limbId === BodyPart.LeftLeg

        instruction = await TextureComposer.simpleMesh(
            isLeft ? "R15CompositLeftArmBase" : "R15CompositRightArmBase",
            Shader_TextureComposer_Flat,
            {
                uTexture: {value: texture}
            }
        )
    } else { //torso
        instruction = await TextureComposer.simpleMesh(
            "R15CompositTorsoBase",
            Shader_TextureComposer_Flat,
            {
                uTexture: {value: texture}
            }
        )
    }

    return instruction
}

async function renderBodyPartClothingR6(texture: THREE.Texture, clothingType: "shirt" | "pants" | "tshirt") {
    let instruction: THREE.Mesh

    switch (clothingType) {
        case "pants":
            instruction = await TextureComposer.simpleMesh(
                "CompositPantsTemplate",
                Shader_TextureComposer_Flat,
                {uTexture: {value: texture}}
            )
            break
        case "shirt":
            instruction = await TextureComposer.simpleMesh(
                "CompositShirtTemplate",
                Shader_TextureComposer_Flat,
                {uTexture: {value: texture}}
            )
            break
        case "tshirt":
            instruction = await TextureComposer.simpleMesh(
                "CompositTShirt",
                Shader_TextureComposer_Flat,
                {uTexture: {value: texture}}
            )
            break
    }

    return instruction
}

class ColorLayer {
    color: Color3
    bodyPart?: number

    constructor(color: Color3, bodyPart?: number) {
        this.color = color
        this.bodyPart = bodyPart
    }

    isSame(other: MaterialLayer) {
        if (other instanceof TextureLayer) {
            return false
        }

        return Math.round(this.color.R * 255) === Math.round(other.color.R * 255) &&
                Math.round(this.color.G * 255) === Math.round(other.color.G * 255) &&
                Math.round(this.color.B * 255) === Math.round(other.color.B * 255) &&
                this.bodyPart === other.bodyPart
    }
}

type TextureLayerUV = "Normal" | "Decal" | "Shirt" | "Pants" | "TShirt"
type TextureType = "color" | "normal" | "roughness" | "metalness" | "emissive"
class TextureLayer {
    uvType: TextureLayerUV = "Normal"
    face?: number //NormalId enum for Decals

    color?: string
    normal?: string
    roughness?: string
    metalness?: string
    emissive?: string

    isSame(other: MaterialLayer) {
        if (other instanceof ColorLayer) {
            return false
        }

        return this.uvType === other.uvType &&
                this.face === other.face &&
                this.color === other.color &&
                this.normal === other.normal &&
                this.roughness === other.roughness &&
                this.metalness === other.metalness &&
                this.emissive === other.emissive
    }
}

type MaterialLayer = ColorLayer | TextureLayer
export class MaterialDesc {
    layers: MaterialLayer[] = []

    transparent: boolean = false
    transparency: number = 0
    doubleSided: boolean = false
    visible: boolean = true

    emissiveStrength: number = 1
    emissiveTint: Color3 = new Color3(1,1,1)

    bodyPart?: number //should only be accounted for if uvType != Normal in TextureLayer
    avatarType?: AvatarType

    createdTextures?: THREE.Texture[] = []

    isSame(other: MaterialDesc) {
        const propertiesSame = this.transparent === other.transparent &&
                                Math.round(this.transparency * 100) === Math.round(other.transparency * 100) &&
                                this.doubleSided === other.doubleSided &&
                                this.visible === other.visible
        
        let layersSame = true
        if (this.layers.length !== other.layers.length) {
            layersSame = false
        } else {
            for (let i = 0; i < this.layers.length; i++) {
                const thisLayer = this.layers[i]
                const otherLayer = other.layers[i]

                layersSame = layersSame && thisLayer.isSame(otherLayer)
            }
        }

        return propertiesSame && layersSame
    }

    async loadTextures(textureType: TextureType): Promise<Map<string,HTMLImageElement>> {
        const textures = new Map<string,HTMLImageElement>()
        const promises: Promise<HTMLImageElement | undefined>[] = []
        const urls: string[] = []

        for (const layer of this.layers) {
            if (layer instanceof TextureLayer) {
                const layerURL = layer[textureType]
                if (layerURL) {
                    urls.push(layerURL)
                    promises.push(API.Generic.LoadImage(layerURL))
                }
            }
        }

        const values = await Promise.all(promises)
        for (let i = 0; i < values.length; i++) {
            const value = values[i]
            const url = urls[i]

            if (value) {
                textures.set(url, value)
            }
        }

        return textures
    }

    async compileTexture(textureType: TextureType, auth: Authentication, meshDesc: MeshDesc): Promise<[THREE.Texture, boolean] | undefined> {
        const layerTextures = await this.loadTextures(textureType)

        let width = 2
        let height = 2
        let camWidth = 2
        let camHeight = 2

        if (this.avatarType) {
            if (this.avatarType === AvatarType.R15) {
                if (this.bodyPart === BodyPart.Torso) {
                    width = 388
                    height = 272
                    camWidth = 388
                    camHeight = 272
                } else {
                    width = 264
                    camWidth = 264
                    height = 284
                    camHeight = 284
                }
            } else if (this.avatarType === AvatarType.R6) {
                width = 768
                height = 512
                camWidth = 1024
                camHeight = 512
            }
        } else {
            let imgWidth = 2
            let imgHeight = 2
            for (const [, img] of layerTextures) {
                imgWidth = Math.max(imgWidth, img.width)
                imgHeight = Math.max(imgHeight, img.height)
            }
            width = imgWidth
            height = imgHeight
            camWidth = imgWidth
            camHeight = imgHeight
        }

        const composeInsts: THREE.Mesh[] = []
        const texturesToDestroy = []

        let noMipmaps = false
        let hasColorLayer = false

        for (const layer of this.layers) {
            if (layer instanceof TextureLayer && layer[textureType]) {
                const layerImage = layerTextures.get(layer[textureType])
                const layerTexture = new THREE.Texture(layerImage)
                layerTexture.colorSpace = textureType === "color" ? THREE.SRGBColorSpace : THREE.NoColorSpace
                layerTexture.needsUpdate = true
                texturesToDestroy.push(layerTexture)

                if (layerImage) {
                    switch (layer.uvType) {
                        case "Normal":
                            composeInsts.push(await TextureComposer.simpleMesh(
                                "CompositQuad",
                                Shader_TextureComposer_FullscreenQuad,
                                {
                                    uTexture: {value: layerTexture},
                                    uOffset: {value: new THREE.Vector2(0, 0)},
                                    uSize: {value: new THREE.Vector2(1, 1)}
                                }
                            ))
                            break
                        case "Pants":
                            noMipmaps = true
                            if (!this.bodyPart) break
                            if (this.avatarType === AvatarType.R15) {
                                if (this.bodyPart !== BodyPart.LeftArm && this.bodyPart !== BodyPart.RightArm) {
                                    composeInsts.push(await renderBodyPartClothingR15(this.bodyPart, layerTexture))
                                }
                            } else {
                                composeInsts.push(await renderBodyPartClothingR6(layerTexture, "pants"))
                            }
                            break
                        case "Shirt":
                            noMipmaps = true
                            if (!this.bodyPart) break
                            if (this.avatarType === AvatarType.R15) {
                                if (this.bodyPart !== BodyPart.LeftLeg && this.bodyPart !== BodyPart.RightLeg) {
                                    composeInsts.push(await renderBodyPartClothingR15(this.bodyPart, layerTexture))
                                }
                            } else {
                                composeInsts.push(await renderBodyPartClothingR6(layerTexture, "shirt"))
                            }
                            break
                        case "TShirt":
                            noMipmaps = true
                            if (!this.bodyPart) break
                            if (this.avatarType === AvatarType.R15 && this.bodyPart === BodyPart.Torso) {
                                composeInsts.push(await TextureComposer.simpleMesh(
                                    "CompositQuad",
                                    Shader_TextureComposer_FullscreenQuad,
                                    {
                                        uTexture: {value: layerTexture},
                                        uOffset: {value: new THREE.Vector2(2 / camWidth, 70 / camHeight)},
                                        uSize: {value: new THREE.Vector2(128 / camWidth, 128 / camHeight)}
                                    }
                                ))
                            } else if (this.avatarType === AvatarType.R6) {
                                composeInsts.push(await renderBodyPartClothingR6(layerTexture, "tshirt"))
                            }
                            break
                        case "Decal":
                            if (meshDesc.mesh && meshDesc.mesh.length > 0) {
                                const result = await API.Asset.GetMesh(meshDesc.mesh, undefined, auth)
                                if (result instanceof FileMesh) {
                                    const size = result.size
                                    const geometry = fileMeshToTHREEGeometry(result)
                                    const threeMesh = new THREE.Mesh(geometry, Shader_TextureComposer_Decal)

                                    //direction of decal
                                    const origin = new THREE.Vector3(0,0,0)
                                    const up = new THREE.Vector3(0,1,0)

                                    let sizeX = size[0]
                                    let sizeY = size[1]
                                    let direction = new THREE.Vector3(0,0,-1)

                                    switch (layer.face) {
                                        case NormalId.Front:
                                            sizeX = -size[0]
                                            sizeY = size[1]
                                            direction = new THREE.Vector3(0,0,-1)
                                            break
                                        case NormalId.Back:
                                            sizeX = -size[0]
                                            sizeY = size[1]
                                            direction = new THREE.Vector3(0,0,1)
                                            break
                                        case NormalId.Right:
                                            sizeX = -size[2]
                                            sizeY = size[1]
                                            direction = new THREE.Vector3(1,0,0)
                                            break
                                        case NormalId.Left:
                                            sizeX = -size[2]
                                            sizeY = size[1]
                                            direction = new THREE.Vector3(-1,0,0)
                                            break
                                        case NormalId.Top:
                                            sizeX = -size[0]
                                            sizeY = size[2]
                                            direction = new THREE.Vector3(0,1,0)
                                            break
                                        case NormalId.Bottom:
                                            sizeX = size[0]
                                            sizeY = -size[2]
                                            direction = new THREE.Vector3(0,-1,0)
                                            break
                                    }

                                    //size and position of texture
                                    const sizeMatrix = new THREE.Matrix4().makeScale(1 / sizeX, 1 / sizeY, 1)
                                    const translationMatrix = new THREE.Matrix4().makeTranslation(sizeX / 2,sizeY / 2, 0)

                                    const lookAt = new THREE.Matrix4().lookAt(origin, direction, up)

                                    //calculate projection matrix
                                    const decalProjMatrix = sizeMatrix.multiply(translationMatrix.multiply(lookAt.invert()))

                                    threeMesh.onBeforeRender = () => {
                                        threeMesh.material.uniforms.uTexture.value = layerTexture
                                        threeMesh.material.uniforms.uTextureProjMat.value = decalProjMatrix
                                        threeMesh.material.uniforms.uDecalNormal.value = direction
                                        threeMesh.material.uniformsNeedUpdate = true
                                    }

                                    composeInsts.push(threeMesh)
                                }
                            }
                            break
                        //TODO: Decal
                        default:
                            composeInsts.push(await TextureComposer.simpleMesh(
                                "CompositQuad",
                                Shader_TextureComposer_FullscreenQuad,
                                {
                                    uTexture: {value: layerTexture},
                                    uOffset: {value: new THREE.Vector2(0, 0)},
                                    uSize: {value: new THREE.Vector2(1, 1)}
                                }
                            ))
                            console.warn(`Unsupported uvType: ${layer.uvType}, treating as Normal`)
                    }
                }
            } else if (layer instanceof ColorLayer && textureType === "color") {
                const color = layer.color
                const colorValue = new THREE.Color(color.R, color.G, color.B).convertSRGBToLinear()

                hasColorLayer = true

                if (this.avatarType === "R15" || this.bodyPart === BodyPart.Head) {
                    composeInsts.push(await TextureComposer.simpleMesh(
                        "CompositQuad",
                        Shader_TextureComposer_FullscreenQuad_Color,
                        {
                            uColor: {value: colorValue}
                        }
                    ))
                } else {
                    let meshName = "CompositQuad"

                    switch (layer.bodyPart) {
                        case BodyPart.LeftArm:
                            meshName = "CompositLeftArmBase"
                            break
                        case BodyPart.LeftLeg:
                            meshName = "CompositLeftLegBase"
                            break
                        case BodyPart.RightArm:
                            meshName = "CompositRightArmBase"
                            break
                        case BodyPart.RightLeg:
                            meshName = "CompositRightLegBase"
                            break
                        case BodyPart.Torso:
                            meshName = "CompositTorsoBase"
                            break
                    }

                    composeInsts.push(await TextureComposer.simpleMesh(
                        meshName,
                        Shader_TextureComposer_Flat_Color,
                        {
                            uColor: {value: colorValue}
                        }
                    ))
                }
            }
        }

        //render texture
        if (composeInsts.length === 0) {
            return undefined
        }

        TextureComposer.new(width, height, textureType === "color" ? THREE.SRGBColorSpace : THREE.NoColorSpace, THREE.RepeatWrapping, !noMipmaps)
        TextureComposer.cameraSize(camWidth, camHeight)
        for (const inst of composeInsts) {
            TextureComposer.add(inst)
        }
        const renderTarget = TextureComposer.render()

        for (const texture of texturesToDestroy) {
            texture.dispose()
        }

        const texture = renderTarget.texture
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping

        //set transparent to false if color layer has no transparent pixels
        let hasTransparency = false

        if (!hasColorLayer) {
            const data = new Uint8Array(width * height * 4)
            await getRenderer().readRenderTargetPixelsAsync(renderTarget, 0, 0, width, height, data)
            
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] < 255) {
                    hasTransparency = true
                    break
                }
            }
        }

        if (!this.transparent) {
            hasTransparency = false
        }

        //document.body.appendChild(canvas)
        texture.needsUpdate = true
        return [texture, hasTransparency]
    }

    async compileMaterial(meshDesc: MeshDesc, auth: Authentication): Promise<THREE.MeshStandardMaterial | THREE.MeshPhongMaterial> {
        const colorTexturePromise = this.compileTexture("color", auth, meshDesc)
        const normalTexturePromise = this.compileTexture("normal", auth, meshDesc)
        const roughnessTexturePromise = this.compileTexture("roughness", auth, meshDesc)
        const metalnessTexturePromise = this.compileTexture("metalness", auth, meshDesc)
        const emissiveTexturePromise = this.compileTexture("emissive", auth, meshDesc)

        const [colorTextureInfo, normalTextureInfo, roughnessTextureInfo, metalnessTextureInfo, emissiveTextureInfo] = await Promise.all([colorTexturePromise, normalTexturePromise, roughnessTexturePromise, metalnessTexturePromise, emissiveTexturePromise])

        let colorTexture = undefined
        let normalTexture = undefined
        let roughnessTexture = undefined
        let metalnessTexture = undefined
        let emissiveTexture = undefined

        let hasEmissive = false
        let hasTransparency = this.transparent

        if (colorTextureInfo) {
            colorTexture = colorTextureInfo[0]
            if (!colorTextureInfo[1]) {
                hasTransparency = false //used to stop material from being transparent if there is no reason to do so
            }
        }
        if (normalTextureInfo) {
            normalTexture = normalTextureInfo[0]
        }
        if (roughnessTextureInfo) {
            roughnessTexture = roughnessTextureInfo[0]
        }
        if (metalnessTextureInfo) {
            metalnessTexture = metalnessTextureInfo[0]
        }
        if (emissiveTextureInfo) {
            emissiveTexture = emissiveTextureInfo[0]
            if (emissiveTexture) {
                hasEmissive = true
            }
        }

        if (this.transparency > 0.01) {
            hasTransparency = true
        }

        let material = undefined

        if (normalTexture || roughnessTexture || metalnessTexture || emissiveTexture) { //PBR
            material = new THREE.MeshStandardMaterial({
                map: colorTexture,
                normalMap: normalTexture,
                roughnessMap: roughnessTexture,
                metalnessMap: metalnessTexture,
                emissiveMap: emissiveTexture,
                emissiveIntensity: hasEmissive ? this.emissiveStrength : 0,
                emissive: hasEmissive ? new THREE.Color(this.emissiveTint.R, this.emissiveTint.G, this.emissiveTint.B) : new THREE.Color(0,0,0),
                transparent: hasTransparency,
                opacity: 1 - this.transparency,
                side: this.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
                visible: this.visible,
                vertexColors: true,
            })
        } else { //NOT PBR
            material = new THREE.MeshPhongMaterial({
                map: colorTexture,
                specular: new THREE.Color(1 / 102, 1 / 102, 1 / 102),
                shininess: 9,
                transparent: hasTransparency,
                opacity: 1 - this.transparency,
                side: this.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
                visible: this.visible,
                vertexColors: true,
            })
        }

        return material
    }

    addClothingLayers(parent: Instance) {
        const pants = parent.FindFirstChildOfClass("Pants")
        if (pants) {
            const pantsLayer = new TextureLayer()
            pantsLayer.color = pants.Prop("PantsTemplate") as string
            pantsLayer.uvType = "Pants"
            this.layers.push(pantsLayer)
        }

        const shirt = parent.FindFirstChildOfClass("Shirt")
        if (shirt) {
            const shirtLayer = new TextureLayer()
            shirtLayer.color = shirt.Prop("ShirtTemplate") as string
            shirtLayer.uvType = "Shirt"
            this.layers.push(shirtLayer)
        }

        const tShirt = parent.FindFirstChildOfClass("ShirtGraphic")
        if (tShirt) {
            const tShirtLayer = new TextureLayer()
            tShirtLayer.color = tShirt.Prop("Graphic") as string
            tShirtLayer.uvType = "TShirt"
            this.layers.push(tShirtLayer)
        }
    }

    fromInstance(child: Instance) {
        if (!RenderedClassTypes.includes(child.className)) {
            return
        }
    
        if (child.HasProperty("Transparency")) {
            const transparency = child.Prop("Transparency") as number
            if (transparency !== 0) {
                if (transparency <= 0.99) {
                    this.transparent = true
                    this.transparency = transparency
                } else {
                    this.visible = false
                }
            }
        }

        if (child.HasProperty("DoubleSided")) {
            if (child.Prop("DoubleSided")) {
                this.doubleSided = true
            }
        }

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
        const specialMesh = child.FindFirstChildOfClass("SpecialMesh")
        if (specialMesh) {
            switch (specialMesh.Property("MeshType")) {
                case MeshType.FileMesh: {
                    if (isAffectedByHumanoid(child)) {
                        const partColor = (child.Prop("Color") as Color3uint8).toColor3()
                        const partcolorLayer = new ColorLayer(partColor)
                        this.layers.push(partcolorLayer)
                    } else {
                        this.transparent = true
                    }
                    const colorLayer = new TextureLayer()
                    colorLayer.color = specialMesh.Property("TextureId") as string
                    this.layers.push(colorLayer)
                    break
                }
                default: {
                    const partColor = (child.Prop("Color") as Color3uint8).toColor3()
                    const colorLayer = new ColorLayer(partColor)
                    this.layers.push(colorLayer)
                    break
                }
            }

            //decal
            if ((specialMesh.Prop("TextureId") as string).length < 1 || !isAffectedByHumanoid(child)) {
                const decalsFound: [number, TextureLayer][] = []

                const decals = child.GetChildren()
                for (const decal of decals) {
                    if (decal.className === "Decal") {
                        const decalTexture = decal.Property("Texture") as string
                        const metallnessMap = decal.HasProperty("MetalnessMap") ? decal.Prop("MetalnessMap") as Content : undefined
                        const normalMap = decal.HasProperty("NormalMap") ? decal.Prop("NormalMap") as Content : undefined
                        const roughnessMap = decal.HasProperty("RoughnessMap") ? decal.Prop("RoughnessMap") as Content : undefined

                        const decalLayer = new TextureLayer()
                        decalLayer.color = decalTexture
                        decalLayer.metalness = metallnessMap?.uri
                        decalLayer.normal = normalMap?.uri
                        decalLayer.roughness = roughnessMap?.uri
                        decalLayer.uvType = "Normal"

                        let ZIndex = 1
                        if (decal.HasProperty("ZIndex")) {
                            ZIndex = decal.Prop("ZIndex") as number
                        }

                        decalsFound.push([ZIndex, decalLayer])
                    }
                }

                decalsFound.sort((a, b) => {
                    return a[0] - b[0]
                })

                for (const decalFound of decalsFound) {
                    this.layers.push(decalFound[1])
                }
            }
        } else {
            const affectedByHumanoid = isAffectedByHumanoid(child)
            if (affectedByHumanoid) { //clothing and stuff
                const parent = child.parent
                const humanoid = parent?.FindFirstChildOfClass("Humanoid")

                const bodyPart = BodyPartNameToEnum[child.Prop("Name") as string]
                if (bodyPart) {
                    this.bodyPart = bodyPart
                    this.avatarType = AvatarType.R6
                }

                if (parent) {
                    const otherBodyParts = parent.GetChildren()
                    for (const otherBodyPart of otherBodyParts) {
                        if (otherBodyPart.className === "Part" && BodyPartNameToEnum[otherBodyPart.Prop("Name") as string]) {
                            const partColor = (otherBodyPart.Prop("Color") as Color3uint8).toColor3()
                            const colorLayer = new ColorLayer(partColor, BodyPartNameToEnum[otherBodyPart.Prop("Name") as string])
                            this.layers.push(colorLayer)
                        }
                    }
                }

                if (parent && humanoid && humanoid.Property("RigType") === HumanoidRigType.R6) {
                    //get texture of body part based on CharacterMesh
                    let overlayTextureId = -1n
                    let baseTextureId = -1n
                    const children2 = parent.GetChildren()
                    for (const child2 of children2) {
                        if (child2.className === "CharacterMesh") {
                            if (BodyPartNameToEnum[child.Property("Name") as string] === child2.Property("BodyPart")) {
                                overlayTextureId = child2.Prop("OverlayTextureId") as bigint
                                baseTextureId = child2.Prop("BaseTextureId") as bigint
                            }
                        }
                    }

                    if (baseTextureId > 0n) {
                        const baseTextureLayer = new TextureLayer()
                        baseTextureLayer.color = `rbxassetid://${baseTextureId}`
                        this.layers.push(baseTextureLayer)
                    }

                    //clothing
                    this.addClothingLayers(parent)

                    //apply overlay
                    if (overlayTextureId > 0n) {
                        const overlayTextureLayer = new TextureLayer()
                        overlayTextureLayer.color = `rbxassetid://${overlayTextureId}`
                        this.layers.push(overlayTextureLayer)
                    }
                }
            } else {
                const partColor = (child.Prop("Color") as Color3uint8).toColor3()
                const colorLayer = new ColorLayer(partColor)
                this.layers.push(colorLayer)
            }
        }
    }

    fromMeshPart(child: Instance) {
        let affectedByHumanoid = isAffectedByHumanoid(child)

        const meshPartTexture = child.Prop("TextureID") as string
        const surfaceAppearance = child.FindFirstChildOfClass("SurfaceAppearance")
        let surfaceAppearanceAlphaMode = AlphaMode.Overlay
        if (surfaceAppearance) {
            surfaceAppearanceAlphaMode = surfaceAppearance.Prop("AlphaMode") as number
        }

        //part color
        if (surfaceAppearance && surfaceAppearanceAlphaMode === AlphaMode.Transparency) {
            this.transparent = true
        } else {
            if (affectedByHumanoid || (meshPartTexture.length < 1 || (surfaceAppearance && surfaceAppearanceAlphaMode === AlphaMode.Overlay))) {
                const partColor = (child.Prop("Color") as Color3uint8).toColor3()
                const colorLayer = new ColorLayer(partColor)
                this.layers.push(colorLayer)
            }
        }

        //surface appearance
        if (surfaceAppearance) { //TODO: do something with AlphaMode property to stop rthro characters from looking like flesh
            const surfaceAppearanceLayer = new TextureLayer()
            surfaceAppearanceLayer.color = surfaceAppearance.Property("ColorMap") as string
            surfaceAppearanceLayer.normal = surfaceAppearance.Property("NormalMap") as string
            surfaceAppearanceLayer.roughness = surfaceAppearance.Property("RoughnessMap") as string
            surfaceAppearanceLayer.metalness = surfaceAppearance.Property("MetalnessMap") as string
            if (surfaceAppearance.HasProperty("EmissiveMaskContent")) {
                surfaceAppearanceLayer.emissive = (surfaceAppearance.Property("EmissiveMaskContent") as Content).uri
                if (surfaceAppearanceLayer.emissive && surfaceAppearanceLayer.emissive.length > 0) {
                    if (surfaceAppearance.HasProperty("EmissiveStrength")) {
                        this.emissiveStrength = surfaceAppearance.Prop("EmissiveStrength") as number
                    }
                    if (surfaceAppearance.HasProperty("EmissiveTint")) {
                        this.emissiveTint = surfaceAppearance.Prop("EmissiveTint") as Color3
                    }
                }
            }
            this.layers.push(surfaceAppearanceLayer)

            if (surfaceAppearance.Prop("AlphaMode") === AlphaMode.Transparency) {
                this.transparent = true
            }

            affectedByHumanoid = false
        }

        //clothing
        if (affectedByHumanoid && child.parent) {
            const bodyPart = BodyPartNameToEnum[child.Prop("Name") as string]
            if (Object.hasOwn(BodyPartNameToEnum, child.Prop("Name") as string)) {
                this.bodyPart = bodyPart
                this.avatarType = AvatarType.R15
            }

            if (bodyPart !== BodyPart.Head) {
                this.addClothingLayers(child.parent)
            }
        }

        //meshpart texture
        if (!surfaceAppearance && meshPartTexture.length > 0) {
            const textureLayer = new TextureLayer()
            textureLayer.color = meshPartTexture
            this.layers.push(textureLayer)
        }

        //decal
        if ((meshPartTexture.length < 1 && !surfaceAppearance) || !isAffectedByHumanoid(child)) {
            const decalsFound: [number, TextureLayer][] = []

            const decals = child.GetChildren()
            for (const decal of decals) {
                if (decal.className === "Decal") {
                    const decalTexture = decal.Property("Texture") as string
                    const metallnessMap = decal.HasProperty("MetalnessMap") ? decal.Prop("MetalnessMap") as Content : undefined
                    const normalMap = decal.HasProperty("NormalMap") ? decal.Prop("NormalMap") as Content : undefined
                    const roughnessMap = decal.HasProperty("RoughnessMap") ? decal.Prop("RoughnessMap") as Content : undefined

                    const decalLayer = new TextureLayer()
                    decalLayer.color = decalTexture
                    decalLayer.metalness = metallnessMap?.uri
                    decalLayer.normal = normalMap?.uri
                    decalLayer.roughness = roughnessMap?.uri

                    if (child.Prop("Name") as string === "Head" && isAffectedByHumanoid(child)) {
                        decalLayer.uvType = "Normal"
                    } else {
                        decalLayer.uvType = "Decal"
                        decalLayer.face = decal.Prop("Face") as number
                    }
                    let ZIndex = 1
                    if (decal.HasProperty("ZIndex")) {
                        ZIndex = decal.Prop("ZIndex") as number
                    }

                    decalsFound.push([ZIndex, decalLayer])
                }
            }

            decalsFound.sort((a, b) => {
                return a[0] - b[0]
            })

            for (const decalFound of decalsFound) {
                this.layers.push(decalFound[1])
            }
        }
    }
}
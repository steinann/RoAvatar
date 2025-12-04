import * as THREE from 'three'
import { AlphaMode, BodyPart, BodyPartNameToEnum, HumanoidRigType, MeshType, RenderedClassTypes } from "../rblx/constant"
import { isAffectedByHumanoid, type Color3, type Color3uint8, type Instance } from "../rblx/rbx"
import { AvatarType } from '../avatar/constant'
import { API } from '../api'
import { rad } from '../misc/misc'

function mapImg(ctx: CanvasRenderingContext2D, img: HTMLImageElement, sX: number, sY: number, sW: number, sH: number, oX: number, oY: number, oW: number, oH: number, rotation: number = 0) {
    ctx.save()
    ctx.translate(oX,oY)
    ctx.rotate(rad(rotation))
    ctx.translate(-oX,-oY)

    //ctx.drawImage(img, sX, sY, sW, sH, oX - 2, oY - 2, oW + 4, oH + 4)
    ctx.drawImage(img, sX, sY, sW, sH, oX, oY, oW, oH)

    ctx.restore()
}

function renderClothingToCanvasR15(ctx: CanvasRenderingContext2D, limbId: number, shirtImg?: HTMLImageElement, pantsImg?: HTMLImageElement) {
    const isArm = limbId === BodyPart.LeftArm || limbId === BodyPart.RightArm

    //limbs
    if (limbId !== BodyPart.Torso) {
        const isLeft = limbId === BodyPart.LeftArm || limbId === BodyPart.LeftLeg

        const img = isArm ? shirtImg : pantsImg
        if (img) {
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
        if (pantsImg) {
            imgs.push(pantsImg)
        }
        if (shirtImg) {
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
    }
}

function renderClothingToCanvasR6(ctx: CanvasRenderingContext2D, pantsImg?: HTMLImageElement, shirtImg?: HTMLImageElement, tshirtImg?: HTMLImageElement) {
    //torso
    for (const cloth of [pantsImg, shirtImg]) {
        const img = cloth as HTMLImageElement

        if (img) {
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

    //legs
    if (pantsImg) { //render pants
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

    //shirt
    if (shirtImg) { //render shirt
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
    if (tshirtImg) {
        mapImg(ctx, tshirtImg, 0, 0, tshirtImg.width, tshirtImg.height, 120, 64, 128, 96, 90)
    }
}

class ColorLayer {
    color: Color3

    constructor(color: Color3) {
        this.color = color
    }

    isSame(other: MaterialLayer) {
        if (other instanceof TextureLayer) {
            return false
        }

        return Math.round(this.color.R * 255) === Math.round(other.color.R * 255) &&
                Math.round(this.color.G * 255) === Math.round(other.color.G * 255) &&
                Math.round(this.color.B * 255) === Math.round(other.color.B * 255)
    }
}

type TextureLayerUV = "Normal" | "Decal" | "Shirt" | "Pants" | "TShirt"
type TextureType = "color" | "normal" | "roughness" | "metalness"
class TextureLayer {
    uvType: TextureLayerUV = "Normal"
    face?: number //NormalId enum for Decals

    color?: string
    normal?: string
    roughness?: string
    metalness?: string

    isSame(other: MaterialLayer) {
        if (other instanceof ColorLayer) {
            return false
        }

        return this.uvType === other.uvType &&
                this.face === other.face &&
                this.color === other.color &&
                this.normal === other.normal &&
                this.roughness === other.roughness &&
                this.metalness === other.metalness
    }
}

type MaterialLayer = ColorLayer | TextureLayer
export class MaterialDesc {
    layers: MaterialLayer[] = []

    transparent: boolean = false
    transparency: number = 0
    doubleSided: boolean = false
    visible: boolean = true

    bodyPart?: number //should only be accounted for if uvType != Normal in TextureLayer
    avatarType?: AvatarType

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

    async loadColorTextures(): Promise<Map<string,HTMLImageElement>> {
        const textures = new Map<string,HTMLImageElement>()
        const promises: Promise<HTMLImageElement | undefined>[] = []
        const urls: string[] = []

        for (const layer of this.layers) {
            if (layer instanceof TextureLayer) {
                const layerColor = layer.color
                if (layerColor) {
                    urls.push(layerColor)
                    promises.push(API.Generic.LoadImage(layerColor))
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

    async compileTexture(textureType: TextureType): Promise<[THREE.Texture, boolean] | undefined> {
        if (textureType === "color") {
            const colorTextures = await this.loadColorTextures()

            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")

            if (this.avatarType) {
                if (this.avatarType === AvatarType.R15) {
                    if (this.bodyPart === BodyPart.Torso) {
                        canvas.width = 388
                        canvas.height = 272
                    } else {
                        canvas.width = 264
                        canvas.height = 284
                    }
                } else if (this.avatarType === AvatarType.R6) {
                    canvas.width = 768
                    canvas.height = 512
                }
            } else {
                let imgWidth = 2
                let imgHeight = 2
                for (const [, img] of colorTextures) {
                    imgWidth = Math.max(imgWidth, img.width)
                    imgHeight = Math.max(imgHeight, img.height)
                }
                canvas.width = imgWidth
                canvas.height = imgHeight
            }

            if (!ctx) {
                throw new Error("Failed to get CanvasContext")
            }

            const texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping

            for (const layer of this.layers) {
                if (layer instanceof TextureLayer && layer.color) {
                    const layerTexture = colorTextures.get(layer.color)

                    if (layerTexture) {
                        switch (layer.uvType) {
                            case "Normal":
                                mapImg(ctx, layerTexture, 0, 0, layerTexture.width, layerTexture.height, 0, 0, canvas.width, canvas.height)
                                break
                            case "Pants":
                                texture.generateMipmaps = false
                                texture.minFilter = THREE.LinearFilter
                                texture.magFilter = THREE.LinearFilter
                                if (!this.bodyPart) break
                                if (this.avatarType === AvatarType.R15) {
                                    renderClothingToCanvasR15(ctx, this.bodyPart, undefined, layerTexture)
                                } else {
                                    renderClothingToCanvasR6(ctx, layerTexture, undefined, undefined)
                                }
                                break
                            case "Shirt":
                                texture.generateMipmaps = false
                                texture.minFilter = THREE.LinearFilter
                                texture.magFilter = THREE.LinearFilter
                                if (!this.bodyPart) break
                                if (this.avatarType === AvatarType.R15) {
                                    renderClothingToCanvasR15(ctx, this.bodyPart, layerTexture, undefined)
                                } else {
                                    renderClothingToCanvasR6(ctx, undefined, layerTexture, undefined)
                                }
                                break
                            case "TShirt":
                                texture.generateMipmaps = false
                                texture.minFilter = THREE.LinearFilter
                                texture.magFilter = THREE.LinearFilter
                                if (!this.bodyPart) break
                                if (this.avatarType === AvatarType.R15 && this.bodyPart === BodyPart.Torso) {
                                    mapImg(ctx, layerTexture, 0, 0, layerTexture.width, layerTexture.height, 2, 74, 128, 128, 0)
                                } else if (this.avatarType === AvatarType.R6) {
                                    renderClothingToCanvasR6(ctx, undefined, undefined, layerTexture)
                                }
                                break
                            //TODO: Decal
                            default:
                                mapImg(ctx, layerTexture, 0, 0, layerTexture.width, layerTexture.height, 0, 0, canvas.width, canvas.height)
                                console.warn(`Unsupported uvType: ${layer.uvType}, treating as Normal`)
                        }
                    }
                } else if (layer instanceof ColorLayer) {
                    const color = layer.color.toColor3uint8()
                    ctx.fillStyle = `rgb(${color.R},${color.G},${color.B})`
                    ctx.fillRect(0,0,canvas.width,canvas.height)
                }
            }

            //set transparent to false if color layer has no transparent pixels
            const imageData = ctx.getImageData(0,0, canvas.width, canvas.height)
            const data = imageData.data
            
            let hasTransparency = false
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] < 255) {
                    hasTransparency = true
                    break
                }
            }

            if (!this.transparent) {
                hasTransparency = false
            }

            //document.body.appendChild(canvas)
            texture.needsUpdate = true
            return [texture, hasTransparency]
        } else {
            let textureUrl: string | undefined = undefined

            for (const layer of this.layers) {
                if (layer instanceof TextureLayer) {
                    if (layer[textureType]) {
                        textureUrl = layer[textureType]
                    }
                }
            }

            if (textureUrl) {
                const image = await API.Generic.LoadImage(textureUrl)
                if (image) {
                    const texture = new THREE.Texture(image)
                    texture.wrapS = THREE.RepeatWrapping
                    texture.wrapT = THREE.RepeatWrapping
                    texture.needsUpdate = true
                    return [texture, false]
                }
            }
        }

        return undefined
    }

    async compileMaterial(): Promise<THREE.MeshStandardMaterial | THREE.MeshPhongMaterial> {
        const colorTexturePromise = this.compileTexture("color")
        const normalTexturePromise = this.compileTexture("normal")
        const roughnessTexturePromise = this.compileTexture("roughness")
        const metalnessTexturePromise = this.compileTexture("metalness")

        const [colorTextureInfo, normalTextureInfo, roughnessTextureInfo, metalnessTextureInfo] = await Promise.all([colorTexturePromise, normalTexturePromise, roughnessTexturePromise, metalnessTexturePromise])

        let colorTexture = undefined
        let normalTexture = undefined
        let roughnessTexture = undefined
        let metalnessTexture = undefined

        let hasTransparency = this.transparent

        if (colorTextureInfo) {
            colorTexture = colorTextureInfo[0]
            hasTransparency = colorTextureInfo[1]
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

        let material = undefined

        if (normalTexture || roughnessTexture || metalnessTexture) { //PBR
            material = new THREE.MeshStandardMaterial({
                map: colorTexture,
                normalMap: normalTexture,
                roughnessMap: roughnessTexture,
                metalnessMap: metalnessTexture,
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
            if (transparency > 0.01) {
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
    
                    const decal = child.FindFirstChildOfClass("Decal")
                    if (decal && ((specialMesh.Prop("TextureId") as string).length < 1 || !isAffectedByHumanoid(child))) {
                        const decalTexture = decal.Property("Texture") as string
                        const colorLayer = new TextureLayer()
                        colorLayer.color = decalTexture
                        this.layers.push(colorLayer)
                    }
                } else {
                    const partColor = (child.Prop("Color") as Color3uint8).toColor3()
                    const colorLayer = new ColorLayer(partColor)
                    this.layers.push(colorLayer)

                    const affectedByHumanoid = isAffectedByHumanoid(child)
                    if (affectedByHumanoid) { //clothing and stuff
                        const parent = child.parent
                        const humanoid = parent?.FindFirstChildOfClass("Humanoid")

                        const bodyPart = BodyPartNameToEnum[child.Prop("Name") as string]
                        if (bodyPart) {
                            this.bodyPart = bodyPart
                            this.avatarType = AvatarType.R6
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
                    }
                }
    
                break
            }
            case "MeshPart": {
                let affectedByHumanoid = isAffectedByHumanoid(child)
    
                const meshPartTexture = child.Prop("TextureID") as string
                const surfaceAppearance = child.FindFirstChildOfClass("SurfaceAppearance")
                let surfaceAppearanceAlphaMode = AlphaMode.Overlay
                if (surfaceAppearance) {
                    surfaceAppearanceAlphaMode = surfaceAppearance.Prop("AlphaMode") as number
                }

                //part color
                if (!(surfaceAppearance && surfaceAppearanceAlphaMode === AlphaMode.Transparency)) {
                    if (affectedByHumanoid || (meshPartTexture.length < 1 || (surfaceAppearance && surfaceAppearanceAlphaMode === AlphaMode.Overlay))) {
                        const partColor = (child.Prop("Color") as Color3uint8).toColor3()
                        const colorLayer = new ColorLayer(partColor)
                        this.layers.push(colorLayer)
                    } else {
                        this.transparent = true
                    }
                }

                //surface appearance
                if (surfaceAppearance) { //TODO: do something with AlphaMode property to stop rthro characters from looking like flesh
                    const surfaceAppearanceLayer = new TextureLayer()
                    surfaceAppearanceLayer.color = surfaceAppearance.Property("ColorMap") as string
                    surfaceAppearanceLayer.normal = surfaceAppearance.Property("NormalMap") as string
                    surfaceAppearanceLayer.roughness = surfaceAppearance.Property("RoughnessMap") as string
                    surfaceAppearanceLayer.metalness = surfaceAppearance.Property("MetalnessMap") as string
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
                const decal = child.FindFirstChildOfClass("Decal")
                if (decal && ((meshPartTexture.length < 1 && !surfaceAppearance) || !isAffectedByHumanoid(child))) {
                    const decalTexture = decal.Property("Texture") as string
                    const decalLayer = new TextureLayer()
                    decalLayer.color = decalTexture
                    decalLayer.uvType = "Decal"
                    decalLayer.face = decal.Prop("Face") as number
                    this.layers.push(decalLayer)
                }
                
                break
            }
        }
    }
}
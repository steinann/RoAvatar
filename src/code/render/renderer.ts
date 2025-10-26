import * as THREE from 'three'
import { BodyPart } from "../rblx/constant"
import type { Color3 } from "../rblx/rbx"

class ColorLayer {
    color: Color3
}

type TextureLayerUV = "Normal" | "Shirt" | "Pants" | "TShirt"
type TextureType = "color" | "normal" | "roughness" | "metalness"
class TextureLayer {
    uvType: TextureLayerUV = "Normal"

    color?: string
    normal?: string
    roughess?: string
    metalness?: string
}

type MaterialLayer = ColorLayer | Text
class Material {
    lists: MaterialLayer[] = []

    transparent: boolean = false
    transparency: number = 0
    doubleSided: boolean = false

    bodyPart?: number //should only be accounted for if uvType != Normal in TextureLayer

    isSame(other: Material) {

    }

    compileTexture(textureType: TextureType): THREE.Texture | undefined {

    }

    compileMaterial(): THREE.MeshStandardMaterial | THREE.MeshPhongMaterial {

    }
}
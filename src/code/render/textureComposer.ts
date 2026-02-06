import * as THREE from 'three'
import { getRenderer } from './renderer'
import { API } from '../api'
import { fileMeshToTHREEGeometry } from './meshDesc'
import type { Shader_TextureComposer_Flat } from './shaders/textureComposer-flat'

const compositMeshPaths = [
    "rbxasset://avatar/compositing/CompositFullAtlasBaseTexture.mesh",
    "rbxasset://avatar/compositing/CompositFullAtlasOverlayTexture.mesh",
    "rbxasset://avatar/compositing/CompositLeftArmBase.mesh",
    "rbxasset://avatar/compositing/CompositLeftLegBase.mesh",
    "rbxasset://avatar/compositing/CompositRightArmBase.mesh",
    "rbxasset://avatar/compositing/CompositRightLegBase.mesh",
    "rbxasset://avatar/compositing/CompositTorsoBase.mesh",
    "rbxasset://avatar/compositing/CompositPantsTemplate.mesh",
    "rbxasset://avatar/compositing/CompositShirtTemplate.mesh",
    "rbxasset://avatar/compositing/CompositTShirt.mesh",
    "rbxasset://avatar/compositing/CompositQuad.mesh",
    "rbxasset://avatar/compositing/R15CompositLeftArmBase.mesh",
    "rbxasset://avatar/compositing/R15CompositRightArmBase.mesh",
    "rbxasset://avatar/compositing/R15CompositTorsoBase.mesh",
]

const compositMeshCache = new Map()

for (const meshPath of compositMeshPaths) {
    compositMeshCache.set(meshPath, new Promise((resolve) => {
        API.Asset.GetMesh(meshPath).then((result) => {
            if (result instanceof Response) {
                throw new Error(`Missing file for composit mesh: ${meshPath}`)
            } else {
                const threeGeometry = fileMeshToTHREEGeometry(result)
                compositMeshCache.set(meshPath, threeGeometry)
                resolve(threeGeometry)
            }
        })
    }))
}

export async function getCompositGeometry(path: string): Promise<THREE.BufferGeometry> {
    return compositMeshCache.get(path)
}

class _TextureComposer {
    width: number
    height: number

    renderTarget: THREE.WebGLRenderTarget

    scene: THREE.Scene
    camera: THREE.OrthographicCamera

    renderOrder: number = 0

    constructor(width: number, height: number) {
        this.width = width
        this.height = height

        this.renderTarget = new THREE.WebGLRenderTarget(width, height)

        this.scene = new THREE.Scene()
        this.camera = new THREE.OrthographicCamera(0, width, height, 0)
        this.camera.position.set(0,0,500)
        this.camera.updateProjectionMatrix()
        //this.camera.lookAt(new THREE.Vector3(0,0,0))
    }

    new(width: number, height: number, colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace, wrapping: THREE.Wrapping = THREE.RepeatWrapping, noMipmaps: boolean = false) {
        this.width = width
        this.height = height

        this.renderOrder = 0

        //you may notice that noMipmaps is doing the opposite of what it should, but this (for some reason) leads to the correct behavior
        this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
            colorSpace: colorSpace,
            wrapS: wrapping,
            wrapT: wrapping,
            generateMipmaps: noMipmaps,
            minFilter: noMipmaps ? THREE.LinearMipMapLinearFilter : THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            type: THREE.UnsignedByteType
        })

        for (const child of this.scene.children.slice()) {
            this.scene.remove(child)
        }

        //console.log(`--- COMPOSING TEXTURE`)
        //console.log(`colorSpace: ${colorSpace}`)
    }

    cameraSize(width: number, height: number) {
        this.camera.right = width
        this.camera.top = height
        this.camera.updateProjectionMatrix()
    }

    add(mesh: THREE.Mesh) {
        mesh.renderOrder = this.renderOrder++
        //console.log("added", mesh)

        this.scene.add(mesh)
    }

    /**
     * @param compositMesh The name of a compositMesh, example "CompositQuad"
     * @param shader The ShaderMaterial, example Shader_TextureComposer_Flat
     * @param uniforms  The uniforms that the material should use, example { uColor: {value: new THREE.Color(0,0,0)} }
     */
    async simpleMesh(compositMesh: string, shader: THREE.ShaderMaterial, uniforms: typeof Shader_TextureComposer_Flat.uniforms) {
        const threeMesh = new THREE.Mesh(await getCompositGeometry(`rbxasset://avatar/compositing/${compositMesh}.mesh`), shader)
        threeMesh.frustumCulled = false
        threeMesh.onBeforeRender = () => {
            for (const key of Object.keys(uniforms)) {
                threeMesh.material.uniforms[key].value = uniforms[key].value
            }
            
            threeMesh.material.uniformsNeedUpdate = true
        }

        return threeMesh
    }

    /**
     * @param compositMesh The name of a compositMesh, example "CompositQuad"
     * @param shader The ShaderMaterial, example Shader_TextureComposer_Flat
     * @param uniforms  The uniforms that the material should use, example { uColor: {value: new THREE.Color(0,0,0)} }
     */
    async simpleAdd(compositMesh: string, shader: THREE.ShaderMaterial, uniforms: typeof Shader_TextureComposer_Flat.uniforms) {
        const threeMesh = await this.simpleMesh(compositMesh, shader, uniforms)

        this.add(threeMesh)
    }

    render(skipRenderTargetSet: boolean = false) {
        if (!skipRenderTargetSet) {
            getRenderer().setRenderTarget(this.renderTarget)
        } else {
            getRenderer().setRenderTarget(null)
        }
        getRenderer().render(this.scene, this.camera)

        //console.log(`--- TEXTURE COMPOSED`)
        return this.renderTarget
    }
}

export const TextureComposer = new _TextureComposer(1,1)
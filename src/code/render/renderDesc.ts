import * as THREE from 'three'
import type { Instance } from "../rblx/rbx"

export class DisposableDesc {
    disposeMesh(scene: THREE.Scene, mesh: THREE.Mesh) {
        if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

            for (const material of materials) {
                for (const key of Object.keys(material)) {
                    const value = (material as unknown as {[K in string]: unknown})[key]
                    if (value instanceof THREE.Texture) {
                        value.dispose()
                    }
                }

                if (material instanceof THREE.ShaderMaterial) {
                    const uniforms = material.uniforms
                    for (const key of Object.keys(uniforms)) {
                        const value = uniforms[key].value
                        if (value instanceof THREE.Texture) {
                            value.dispose()
                        }
                    }
                }
                
                material.dispose()
            }
        }
        if (mesh.geometry) {
            mesh.geometry.dispose()
        }
        scene.remove(mesh)
    }

    disposeMeshes(scene: THREE.Scene, meshes: THREE.Mesh[]) {
        for (const mesh of meshes) {
            this.disposeMesh(scene, mesh)
        }
    }

    disposeRenderLists(renderer: THREE.WebGLRenderer) {
        renderer.renderLists.dispose()
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dispose(_renderer: THREE.WebGLRenderer, _scene: THREE.Scene) {
        throw new Error("Virtual method dispose called")
    }
}

/**
 * Abstract class used to describe all rendered instances
 */
export class RenderDesc extends DisposableDesc {
    results?: THREE.Mesh[]
    instance?: Instance

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isSame(_other: RenderDesc): boolean {
        throw new Error("Virtual method isSame called")
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    needsRegeneration(_other: RenderDesc): boolean {
        throw new Error("Virtual method needsRegeneration called")
    }

    fromRenderDesc(other: RenderDesc) {
        if (this.needsRegeneration(other)) {
            throw new Error("These RenderableDesc objects have differences that require recompilation")
        }

        this.virtualFromRenderDesc(other)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    virtualFromRenderDesc(_other: RenderDesc) {
        throw new Error("Virtual method virtualFromRenderDesc called")
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fromInstance(_child: Instance) {
        throw new Error("Virtual method fromInstance called")
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async compileResults(_renderer: THREE.WebGLRenderer, _scene: THREE.Scene): Promise<THREE.Mesh[] | Response | undefined> {
        throw new Error("Virtual method compileResults called")
    }

    updateResults() {
        throw new Error("Virtual method updateResults called")
    }
}
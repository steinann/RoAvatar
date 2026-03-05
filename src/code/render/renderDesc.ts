import * as THREE from 'three'
import type { Instance } from "../rblx/rbx"

/**
 * Abstract class used to describe all rendered instances
 */
export class RenderDesc {
    result?: THREE.Mesh
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
    dispose(_renderer: THREE.WebGLRenderer, _scene: THREE.Scene) {
        throw new Error("Virtual method dispose called")
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async compileResult(_renderer: THREE.WebGLRenderer, _scene: THREE.Scene): Promise<THREE.Mesh | Response | undefined> {
        throw new Error("Virtual method compileResult called")
    }

    updateResult() {
        throw new Error("Virtual method updateResult called")
    }
}
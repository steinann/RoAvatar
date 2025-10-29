import * as THREE from 'three'
import { CFrame, Instance } from "../rblx/rbx";
import { MaterialDesc } from "./materialDesc";
import { MeshDesc } from "./meshDesc";
import { rad } from '../misc/misc';
import type { Authentication } from '../api';

function setTHREEMeshCF(threeMesh: THREE.Mesh, cframe: CFrame) {
    threeMesh.position.set(cframe.Position[0], cframe.Position[1], cframe.Position[2])
    threeMesh.rotation.order = "YXZ"
    threeMesh.rotation.x = rad(cframe.Orientation[0])
    threeMesh.rotation.y = rad(cframe.Orientation[1])
    threeMesh.rotation.z = rad(cframe.Orientation[2])
}

export class RenderableDesc {
    cframe: CFrame = new CFrame()
    meshDesc: MeshDesc = new MeshDesc()
    materialDesc: MaterialDesc = new MaterialDesc()

    result?: THREE.Mesh

    isSame(other: RenderableDesc) {
        return this.cframe.isSame(other.cframe) &&
                this.meshDesc.isSame(other.meshDesc) &&
                this.materialDesc.isSame(other.materialDesc)
    }

    needsRegeneration(other: RenderableDesc) {
        return (!this.meshDesc.isSame(other.meshDesc) || !this.materialDesc.isSame(other.materialDesc))
    }

    fromRenderableDesc(other: RenderableDesc) {
        if (this.needsRegeneration(other)) {
            throw new Error("These RenderableDesc objects have differences that require recompilation")
        }

        this.cframe = other.cframe
    }

    fromInstance(child: Instance) {
        if (child.HasProperty("CFrame")) {
            this.cframe = child.Prop("CFrame") as CFrame
        }

        this.meshDesc.fromInstance(child)
        this.materialDesc.fromInstance(child)
    }

    dispose(renderer: THREE.WebGLRenderer, scene: THREE.Scene, mesh?: THREE.Mesh) {
        if (mesh) {
            if (mesh.material) {
                (mesh.material as THREE.Material).dispose()
            }
            if (mesh.geometry) {
                mesh.geometry.dispose()
            }
            scene.remove(mesh)

            renderer.renderLists.dispose()
        }
    }

    async compileResult(renderer: THREE.WebGLRenderer, scene: THREE.Scene, auth: Authentication): Promise<THREE.Mesh | Response | undefined> {
        const originalResult = this.result
        this.result = undefined

        const promises: [Promise<THREE.Mesh | Response | undefined>, Promise<THREE.MeshStandardMaterial | THREE.MeshPhongMaterial>] = [
            this.meshDesc.compileMesh(auth),
            this.materialDesc.compileMaterial()
        ]

        const [threeMesh, threeMaterial]: [THREE.Mesh | Response | undefined, THREE.MeshStandardMaterial | THREE.MeshPhongMaterial] = await Promise.all(promises)
        if (!(threeMesh instanceof THREE.Mesh)) {
            return threeMesh
        }

        threeMesh.material = threeMaterial
        threeMaterial.needsUpdate = true

        this.result = threeMesh
        this.dispose(renderer, scene, originalResult)

        return threeMesh
    }

    updateResult() {
        if (this.result) {
            setTHREEMeshCF(this.result, this.cframe)
        }
    }
}
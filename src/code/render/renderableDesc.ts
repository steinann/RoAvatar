import * as THREE from 'three'
import { CFrame, Instance, isAffectedByHumanoid, Vector3 } from "../rblx/rbx";
import { MaterialDesc } from "./materialDesc";
import { MeshDesc } from "./meshDesc";
import { rad } from '../misc/misc';
import { MeshType } from '../rblx/constant';
import { SkeletonDesc } from './skeletonDesc';
import { USE_LEGACY_SKELETON } from '../misc/flags';
import { traverseRigCFrame } from '../rblx/scale';
import { startCurrentlyLoadingAssets, stopCurrentlyLoadingAssets } from '../api';

function setTHREEMeshCF(threeMesh: THREE.Mesh, cframe: CFrame) {
    threeMesh.position.set(cframe.Position[0], cframe.Position[1], cframe.Position[2])
    threeMesh.rotation.order = "YXZ"
    threeMesh.rotation.x = rad(cframe.Orientation[0])
    threeMesh.rotation.y = rad(cframe.Orientation[1])
    threeMesh.rotation.z = rad(cframe.Orientation[2])
}

export class RenderableDesc {
    cframe: CFrame = new CFrame()
    size: Vector3 = new Vector3(1,1,1)
    
    meshDesc: MeshDesc = new MeshDesc()
    materialDesc: MaterialDesc = new MaterialDesc()
    skeletonDesc?: SkeletonDesc

    //skinning
    isBodyPart: boolean = false
    isSkinned: boolean = false //based on compiled mesh

    //adjustment
    /*adjustPosition = new Vector3(0,0,0)
    adjustRotation = new Vector3(0,0,0)
    adjustScale = new Vector3(1,1,1)*/

    originalScale: THREE.Vector3 = new THREE.Vector3(1,1,1) //based on compiled mesh
    result?: THREE.Mesh
    instance?: Instance

    isSame(other: RenderableDesc) {
        return this.cframe.isSame(other.cframe) &&
                this.meshDesc.isSame(other.meshDesc) &&
                this.materialDesc.isSame(other.materialDesc) &&
            /*this.adjustPosition.isSame(other.adjustPosition) &&
            this.adjustRotation.isSame(other.adjustRotation) &&
            this.adjustScale.isSame(other.adjustScale) &&*/
            this.isBodyPart === other.isBodyPart &&
            this.size.isSame(other.size) &&
            this.skeletonDesc === other.skeletonDesc //this looks like a mistake BUT its actually intentional
    }

    needsRegeneration(other: RenderableDesc) {
        //layered clothing cooldown
        if (this.meshDesc.layerDesc && (Date.now() / 1000) - this.meshDesc.compilationTimestamp < 0.6) {
            return false
        }

        return !this.meshDesc.isSame(other.meshDesc) || !this.materialDesc.isSame(other.materialDesc) //|| (!(this.size.isSame(other.size)) && (this.isSkinned || other.isSkinned))
    }

    fromRenderableDesc(other: RenderableDesc) {
        if (this.needsRegeneration(other)) {
            throw new Error("These RenderableDesc objects have differences that require recompilation")
        }

        //everything that doesnt require compilation should be here
        this.cframe = other.cframe
        this.size = other.size
        /*this.adjustPosition = other.adjustPosition
        this.adjustRotation = other.adjustRotation
        this.adjustScale = other.adjustScale*/
        this.isBodyPart = other.isBodyPart
        //this.isSkinned = other.isSkinned
    }

    fromInstance(child: Instance) {
        this.instance = child

        //cframe
        if (child.HasProperty("CFrame")) {
            this.cframe = child.Prop("CFrame") as CFrame

            if (child.FindFirstChildOfClass("WrapLayer")) {
                if (child.parent && child.parent.parent) {
                    const hrp = child.parent.parent.FindFirstChild("HumanoidRootPart")
                    if (hrp) {
                        this.cframe = hrp.Prop("CFrame") as CFrame
                    }
                }
            }
        }

        //skinning
        if (isAffectedByHumanoid(child)) {
            if (child.Prop("Name") !== "Head") {
                this.isBodyPart = true
            }
        }

        //mesh size
        switch (child.className) {
            case "Part": {
                const specialMesh = child.FindFirstChildOfClass("SpecialMesh")
                if (specialMesh) {
                    this.size = specialMesh.Property("Scale") as Vector3
                    if (specialMesh.HasProperty("Offset")) {
                        this.cframe = this.cframe.multiply(new CFrame(...(specialMesh.Prop("Offset") as Vector3).toVec3()))
                    }

                    switch (specialMesh.Property("MeshType")) {
                        case MeshType.Head: {
                            this.size = this.size.multiply(new Vector3(0.8, 0.8, 0.8))
                            break
                        }
                        default: {
                            break
                        }
                    }
                }
    
                break
            }
            case "MeshPart": {
                this.size = child.Property("Size") as Vector3

                //wrap layer
                const wrapLayer = child.FindFirstChildOfClass("WrapLayer")

                let model = undefined
                if (child.parent?.className === "Model") {
                    model = child.parent
                }
                if (child.parent?.parent?.className === "Model") {
                    model = child.parent.parent
                }

                if (wrapLayer && model) {
                    this.size = new Vector3(1,1,1)
                }

                break
            }
        }

        this.meshDesc.fromInstance(child)
        this.materialDesc.fromInstance(child)
    }

    //Used to dispose OLD stuff
    dispose(renderer: THREE.WebGLRenderer, scene: THREE.Scene, mesh?: THREE.Mesh, skeletonDesc?: SkeletonDesc) {
        if (this.meshDesc) {
            this.meshDesc.dispose()
        }
        if (mesh) {
            if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

                for (const material of materials) {
                    for (const key of Object.keys(material)) {
                        const value = (material as unknown as {[K in string]: unknown})[key]
                        if (value instanceof THREE.Texture) {
                            value.dispose()
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
        if (skeletonDesc) {
            skeletonDesc.dispose(scene)
        }
        if (mesh) {
            renderer.renderLists.dispose()
        }
    }

    async compileResult(renderer: THREE.WebGLRenderer, scene: THREE.Scene): Promise<THREE.Mesh | Response | undefined> {
        startCurrentlyLoadingAssets()

        const originalResult = this.result
        const originalSkeletonDesc = this.skeletonDesc
        this.result = undefined
        this.skeletonDesc = undefined

        //compile dependencies
        const promises: [Promise<THREE.Mesh | Response | undefined>, Promise<THREE.MeshStandardMaterial | THREE.MeshPhongMaterial>] = [
            this.meshDesc.compileMesh(),
            this.materialDesc.compileMaterial(this.meshDesc)
        ]

        const [threeMesh, threeMaterial]: [THREE.Mesh | Response | undefined, THREE.MeshStandardMaterial | THREE.MeshPhongMaterial] = await Promise.all(promises)
        if (!(threeMesh instanceof THREE.Mesh)) {
            stopCurrentlyLoadingAssets()
            return threeMesh
        }

        //material
        if (threeMesh instanceof THREE.SkinnedMesh) {
            (threeMaterial as unknown as {[skinning: string]: boolean}).skinning = true
            this.isSkinned = true
        }
        threeMesh.material = threeMaterial
        threeMesh.receiveShadow = true
        threeMaterial.needsUpdate = true

        this.result = threeMesh
        
        //scale
        this.originalScale = threeMesh.scale.clone()
        
        if (!this.meshDesc.scaleIsRelative) {
            threeMesh.scale.set(this.size.X, this.size.Y, this.size.Z)
        } else {
            const oldSize = this.originalScale
            threeMesh.scale.set(this.size.X / oldSize.x, this.size.Y / oldSize.y, this.size.Z / oldSize.z)
        }

        //skeleton
        if (!USE_LEGACY_SKELETON && SkeletonDesc.descNeedsSkeleton(this.meshDesc)) {
            this.skeletonDesc = new SkeletonDesc(this, this.meshDesc, scene)
        }

        this.dispose(renderer, scene, originalResult, originalSkeletonDesc)

        stopCurrentlyLoadingAssets()
        return threeMesh
    }

    getScale() {
        if (!this.result) {
            return new Vector3(1,1,1)
        }

        if (!this.meshDesc.scaleIsRelative) {
            return new Vector3(this.size.X, this.size.Y, this.size.Z)
        } else {
            const oldSize = this.originalScale
            return new Vector3(this.size.X / oldSize.x, this.size.Y / oldSize.y, this.size.Z / oldSize.z)
        }
    }

    updateResult() {
        if (this.result) {
            let resultCF = this.cframe

            if (this.isSkinned && this.instance) {
                const hrp = this.instance.parent?.FindFirstChild("HumanoidRootPart")
                if (hrp) {
                    resultCF = (hrp.Prop("CFrame") as CFrame).multiply(traverseRigCFrame(this.instance))
                }
            }

            //apply size
            this.result.scale.set(...this.getScale().toVec3())
            
            setTHREEMeshCF(this.result, resultCF)
            this.result.updateMatrix()
            this.result.updateMatrixWorld(true)
            
            if (this.skeletonDesc && this.instance) {
                if (this.result && this.result instanceof THREE.SkinnedMesh) {
                    this.result.bindMatrix.copy(this.result.matrixWorld.clone())
                    this.result.bindMatrixInverse.copy(this.result.matrixWorld.clone().invert())
                }
                this.skeletonDesc.update(this.instance)
            }
        }
    }
}
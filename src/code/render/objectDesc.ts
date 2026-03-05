import * as THREE from 'three'
import { CFrame, Instance, isAffectedByHumanoid, Vector3 } from "../rblx/rbx";
import { MaterialDesc } from "./subDescs/materialDesc";
import { MeshDesc } from "./subDescs/meshDesc";
import { rad } from '../misc/misc';
import { MeshType } from '../rblx/constant';
import { SkeletonDesc } from './subDescs/skeletonDesc';
import { traverseRigCFrame } from '../rblx/scale';
import { startCurrentlyLoadingAssets, stopCurrentlyLoadingAssets } from '../api';
import { RenderDesc } from './renderDesc';

function setTHREEMeshCF(threeMesh: THREE.Mesh, cframe: CFrame) {
    threeMesh.position.set(cframe.Position[0], cframe.Position[1], cframe.Position[2])
    threeMesh.rotation.order = "YXZ"
    threeMesh.rotation.x = rad(cframe.Orientation[0])
    threeMesh.rotation.y = rad(cframe.Orientation[1])
    threeMesh.rotation.z = rad(cframe.Orientation[2])
}

/**
 * Used to describe how Parts, MeshParts and Decals should be rendered
 */
export class ObjectDesc extends RenderDesc {
    cframe: CFrame = new CFrame()
    size: Vector3 = new Vector3(1,1,1)
    
    meshDesc: MeshDesc = new MeshDesc()
    materialDesc: MaterialDesc = new MaterialDesc()
    skeletonDesc?: SkeletonDesc

    //skinning
    isBodyPart: boolean = false
    isSkinned: boolean = false //based on compiled mesh

    originalScale: THREE.Vector3 = new THREE.Vector3(1,1,1) //based on compiled mesh

    isSame(other: ObjectDesc) {
        return this.cframe.isSame(other.cframe) &&
                this.meshDesc.isSame(other.meshDesc) &&
                this.materialDesc.isSame(other.materialDesc) &&
                this.isBodyPart === other.isBodyPart &&
                this.size.isSame(other.size) &&
                this.skeletonDesc === other.skeletonDesc //this looks like a mistake BUT its actually intentional
    }

    needsRegeneration(other: ObjectDesc) {
        //layered clothing cooldown
        if (this.meshDesc.layerDesc && (Date.now() / 1000) - this.meshDesc.compilationTimestamp < 0.6) {
            return false
        }

        return !this.meshDesc.isSame(other.meshDesc) || !this.materialDesc.isSame(other.materialDesc)
    }

    virtualFromRenderDesc(other: ObjectDesc) {
        //everything that doesnt require compilation should be here
        this.cframe = other.cframe
        this.size = other.size
        this.isBodyPart = other.isBodyPart
    }

    fromInstance(child: Instance) {
        this.instance = child

        let part: Instance | undefined = child
        if (part.className !== "Part" && part.className !== "MeshPart") {
            if (part.parent && (part.parent.className === "Part" || part.parent.className === "MeshPart")) {
                part = part.parent
            } else {
                part = undefined
            }
        }

        //cframe
        if (part && part.HasProperty("CFrame")) {
            this.cframe = part.Prop("CFrame") as CFrame

            if (part.FindFirstChildOfClass("WrapLayer")) {
                if (part.parent && part.parent.parent) {
                    const hrp = part.parent.parent.FindFirstChild("HumanoidRootPart")
                    if (hrp) {
                        this.cframe = hrp.Prop("CFrame") as CFrame
                    }
                }
            }
        }

        //skinning
        if (part && isAffectedByHumanoid(part)) {
            if (part.Prop("Name") !== "Head") {
                this.isBodyPart = true
            }
        }

        //mesh size
        if (part) {
            switch (part.className) {
                case "Part": {
                    const specialMesh = part.FindFirstChildOfClass("SpecialMesh")
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
                    this.size = part.Property("Size") as Vector3

                    //wrap layer
                    const wrapLayer = part.FindFirstChildOfClass("WrapLayer")

                    let model = undefined
                    if (part.parent?.className === "Model") {
                        model = part.parent
                    }
                    if (part.parent?.parent?.className === "Model") {
                        model = part.parent.parent
                    }

                    if (wrapLayer && model) {
                        this.size = new Vector3(1,1,1)
                    }

                    break
                }
            }
        }

        this.meshDesc.fromInstance(child)
        this.materialDesc.fromInstance(child)
    }

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
                
                material.dispose()
            }
        }
        if (mesh.geometry) {
            mesh.geometry.dispose()
        }
        scene.remove(mesh)
    }

    disposeSkeleton(scene: THREE.Scene, skeletonDesc: SkeletonDesc) {
        skeletonDesc.dispose(scene)
    }

    disposeRenderLists(renderer: THREE.WebGLRenderer) {
        renderer.renderLists.dispose()
    }

    //Used to dispose OLD stuff
    dispose(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
        if (this.meshDesc) {
            this.meshDesc.dispose()
        }

        const mesh = this.result
        if (mesh) {
            this.disposeMesh(scene, mesh)
        }
        if (this.skeletonDesc) {
            this.disposeSkeleton(scene, this.skeletonDesc)
        }
        if (mesh) {
            this.disposeRenderLists(renderer)
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
        if (SkeletonDesc.descNeedsSkeleton(this.meshDesc)) {
            this.skeletonDesc = new SkeletonDesc(this, this.meshDesc, scene)
        }

        if (originalResult) {
            this.disposeMesh(scene, originalResult)
        }
        if (originalSkeletonDesc) {
            this.disposeSkeleton(scene, originalSkeletonDesc)
        }
        if (originalResult) {
            this.disposeRenderLists(renderer)
        }

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
                let partToUse = this.instance
                if (partToUse.className === "Decal" && partToUse.parent) {
                    partToUse = partToUse.parent
                }

                const hrp = partToUse.parent?.FindFirstChild("HumanoidRootPart")

                if (hrp) {
                    resultCF = (hrp.Prop("CFrame") as CFrame).multiply(traverseRigCFrame(partToUse))
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
                if (this.instance.className !== "Decal") {
                    this.skeletonDesc.update(this.instance)
                } else if (this.instance.parent) {
                    this.skeletonDesc.update(this.instance.parent)
                }
            }
        }
    }
}
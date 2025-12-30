import * as THREE from 'three'
import { CFrame, Instance, isAffectedByHumanoid, Vector3 } from "../rblx/rbx";
import { MaterialDesc } from "./materialDesc";
import { MeshDesc } from "./meshDesc";
import { rad } from '../misc/misc';
import type { Authentication } from '../api';
import { traverseRigCFrame } from '../rblx/scale';
import { MeshType } from '../rblx/constant';
import { SkeletonDesc } from './skeletonDesc';

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
            this.size.isSame(other.size)
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

        //accessory specific
        const accessory = child.parent
        if (accessory && accessory.className === "Accessory" && accessory.parent) {
            const rig = accessory.parent
            const humanoid = rig.FindFirstChildOfClass("Humanoid")
            if (humanoid) {
                const humanoidDescription = humanoid.FindFirstChildOfClass("HumanoidDescription")
                if (humanoidDescription) {
                    const accessoryDescriptions = humanoidDescription.GetChildren()
                    for (const accessoryDesc of accessoryDescriptions) {
                        if (accessoryDesc.className === "AccessoryDescription" && accessoryDesc.Prop("Instance") === accessory) {
                            /*this.adjustPosition = accessoryDesc.Prop("Position") as Vector3
                            this.adjustRotation = accessoryDesc.Prop("Rotation") as Vector3
                            this.adjustScale = accessoryDesc.Prop("Scale") as Vector3*/
                        }
                    }
                }
            }
        }

        //mesh size
        switch (child.className) {
            case "Part": {
                const specialMesh = child.FindFirstChildOfClass("SpecialMesh")
                if (specialMesh) {
                    this.size = specialMesh.Property("Scale") as Vector3
    
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

    dispose(renderer: THREE.WebGLRenderer, scene: THREE.Scene, mesh?: THREE.Mesh) {
        if (this.meshDesc) {
            this.meshDesc.dispose()
        }
        if (mesh) {
            if (mesh.material) {
                (mesh.material as THREE.Material).dispose()
            }
            if (mesh.geometry) {
                mesh.geometry.dispose()
            }
            scene.remove(mesh)
        }
        if (this.skeletonDesc) {
            this.skeletonDesc.dispose(scene)
        }
        if (mesh) {
            renderer.renderLists.dispose()
        }
    }

    async compileResult(renderer: THREE.WebGLRenderer, scene: THREE.Scene, auth: Authentication): Promise<THREE.Mesh | Response | undefined> {
        const originalResult = this.result
        this.result = undefined

        //compile dependencies
        const promises: [Promise<THREE.Mesh | Response | undefined>, Promise<THREE.MeshStandardMaterial | THREE.MeshPhongMaterial>] = [
            this.meshDesc.compileMesh(auth),
            this.materialDesc.compileMaterial()
        ]

        const [threeMesh, threeMaterial]: [THREE.Mesh | Response | undefined, THREE.MeshStandardMaterial | THREE.MeshPhongMaterial] = await Promise.all(promises)
        if (!(threeMesh instanceof THREE.Mesh)) {
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
            this.skeletonDesc = new SkeletonDesc(this.meshDesc, scene)
        }

        this.dispose(renderer, scene, originalResult)

        return threeMesh
    }

    updateResult() {
        if (this.result) {
            let resultCF = this.cframe

            if (this.isBodyPart && this.isSkinned && this.instance) {
                const hrp = this.instance.parent?.FindFirstChild("HumanoidRootPart")
                if (hrp) {
                    resultCF = (hrp.Prop("CFrame") as CFrame).multiply(traverseRigCFrame(this.instance))
                }
            }

            //apply size
            if (!this.meshDesc.scaleIsRelative) {
                this.result.scale.set(this.size.X, this.size.Y, this.size.Z)
            } else {
                const oldSize = this.originalScale
                this.result.scale.set(this.size.X / oldSize.x, this.size.Y / oldSize.y, this.size.Z / oldSize.z)
            }

            //apply adjustment (INACCURATE DO NOT USE)
            /*
            this.result.scale.set(this.result.scale.x, this.result.scale.y, this.result.scale.z)
            this.result.scale.multiply(new THREE.Vector3(this.adjustScale.X, this.adjustScale.Y, this.adjustScale.Z));

            const offsetCF = new CFrame()
            offsetCF.Position = this.adjustPosition.toVec3()
            //offsetCF.Orientation = this.adjustRotation.toVec3()

            //rotation
            const ogRot = new CFrame()
            ogRot.Orientation = [...resultCF.Orientation]

            const newRot = new CFrame()
            newRot.Orientation = this.adjustRotation.toVec3()

            resultCF.Orientation = [0,0,0]
            resultCF = resultCF.multiply(offsetCF)

            const resultRot = newRot.multiply(ogRot)
            resultCF.Orientation = [...resultRot.Orientation]

            */
            setTHREEMeshCF(this.result, resultCF)
            this.result.updateMatrix()
        }
    }
}
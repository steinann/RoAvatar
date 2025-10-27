import { CFrame, Instance, Vector3 } from "../rblx/rbx"

export class MeshDesc {
    scale: Vector3 = new Vector3(1,1,1)
    mesh?: string

    deformationReference?: string
    referenceOrigin: CFrame = new CFrame()
    deformationCage?: string
    cageOrigin: CFrame = new CFrame()

    targetCages?: string[]
    targetOrigins?: CFrame[]
    

    fromInstance(instance: Instance) {
        
    }
}
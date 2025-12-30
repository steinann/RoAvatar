import type { MeshDesc } from "./meshDesc";

//is tied to a compiled meshDesc
export class SkeletonDesc {
    meshDesc: MeshDesc

    constructor(meshDesc: MeshDesc) {
        this.meshDesc = meshDesc
    }
}
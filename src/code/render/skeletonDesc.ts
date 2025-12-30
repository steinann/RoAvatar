//import * as THREE from 'three';
import type { MeshDesc } from "./meshDesc";

//is tied to a compiled meshDesc
export class SkeletonDesc {
    meshDesc: MeshDesc
    //skeleton: THREE.Skeleton

    constructor(meshDesc: MeshDesc) {
        this.meshDesc = meshDesc
    }
}
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { download, rad, saveByteArray } from '../misc/misc';
import { RenderableDesc } from './renderableDesc';
import { CFrame, type Connection, type Instance } from '../rblx/rbx';
import type { Authentication } from '../api';
import { RenderedClassTypes } from '../rblx/constant';
import { calculateMotor6Doffset, traverseRigCFrame } from '../rblx/scale';
import { GLTFExporter } from 'three/examples/jsm/Addons.js';

const isRenderingMesh = new Map<Instance,boolean>()
const renderables = new Map<Instance,RenderableDesc>()
const destroyConnections = new Map<Instance,Connection>()
const skeletons = new Map<Instance,THREE.Skeleton>()

//const lookAwayVector = [-0.406, 0.406, -0.819]
const lookAwayVector = [0.406, 0.306, -0.819]
const lookAwayDistance = 6

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 70, 1 / 1, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setPixelRatio(window.devicePixelRatio * 1)
renderer.setSize( 420, 420 );
renderer.domElement.setAttribute("style","width: 420px; height: 420; border-radius: 0px;")

renderer.domElement.setAttribute("id","OutfitInfo-outfit-image-3d")

//const backgroundColor = new THREE.Color( 0x2C2E31 )
//const backgroundColor = new THREE.Color( 0x191a1f )
//const backgroundColor = new THREE.Color( 0x2a2a2d )
const backgroundColor = new THREE.Color( 0x2b2d33 )
scene.background = backgroundColor;

const lightingType: string = "WellLit" //"Thumbnail" | "WellLit"

let thumbnailAmbientVal = 138 //138 SHOULD be accurate but its not???, nvm it probably is but there is a second light source, wait i think ambient is more correct to use
thumbnailAmbientVal = 128
//thumbnailAmbientVal = 153 //this is 255 * 0.6
let ambientLightColor = undefined
if (lightingType === "Thumbnail") {
    ambientLightColor = new THREE.Color(thumbnailAmbientVal / 255, thumbnailAmbientVal / 255, thumbnailAmbientVal / 255)
} else if (lightingType === "WellLit") {
    ambientLightColor = new THREE.Color(100 / 255, 100 / 255, 100 / 255)
}
//const ambientLight = new THREE.AmbientLight( 0x7a7a7a );
const ambientLight = new THREE.AmbientLight( ambientLightColor, Math.PI / 2 );
scene.add( ambientLight );

let directionalLightColor = undefined
const directionalLightVal = 0.7 * 0.9 * 2 * 0.4
if (lightingType === "Thumbnail") {
    directionalLightColor = new THREE.Color(directionalLightVal, directionalLightVal, directionalLightVal)
} else if (lightingType === "WellLit") {
    directionalLightColor = new THREE.Color(1,1,1)
}
let directionalLightIntensity = 1
if (lightingType === "WellLit") {
    directionalLightIntensity = Math.PI / 2
}

const directionalLight = new THREE.DirectionalLight( directionalLightColor, directionalLightIntensity );
//directionalLight.position.set(new THREE.Vector3(1.2,1,1.2))
if (lightingType === "WellLit") {
    directionalLight.position.set(-5,15,-8)
} else if (lightingType === "Thumbnail") {
    directionalLight.position.set(-0.47489210963249207 * 10, 0.8225368857383728 * 10, 0.3129066228866577 * 10)
}

if (lightingType === "WellLit") {
    directionalLight.castShadow = true
}
directionalLight.shadow.mapSize.width = 256;
directionalLight.shadow.mapSize.height = 256;

const bottomOffset = 1.6
const shadowPhysicalSize = 4.2
directionalLight.shadow.camera.left = -shadowPhysicalSize
directionalLight.shadow.camera.right = shadowPhysicalSize
directionalLight.shadow.camera.top = shadowPhysicalSize + bottomOffset
directionalLight.shadow.camera.bottom = -shadowPhysicalSize + bottomOffset

directionalLight.shadow.camera.near = 0.5; // default
directionalLight.shadow.camera.far = 25;

//const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
//scene.add(shadowHelper);

directionalLight.target.position.set(0,0,0)
scene.add( directionalLight );

if (lightingType === "WellLit") {
    const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.3 );
    //directionalLight.position.set(new THREE.Vector3(1.2,1,1.2))
    directionalLight2.position.set(5,-7,5)
    directionalLight2.target.position.set(0,0,0)
    scene.add( directionalLight2 );
} else if (lightingType === "Thumbnail") { //this looks good TODO: disable specular from this light somehow, should exclusively be diffuse
    const directionalLight2 = new THREE.DirectionalLight( directionalLightColor, directionalLightIntensity * 0.5 );
    //directionalLight.position.set(new THREE.Vector3(1.2,1,1.2))
    directionalLight2.position.set(-0.47489210963249207 * -10, 0.8225368857383728 * -10, 0.3129066228866577 * -10)
    directionalLight2.target.position.set(0,0,0)
    scene.add( directionalLight2 );
}

const planeGeometry = new THREE.PlaneGeometry( 20, 20, 32, 32 );
const planeShadowMaterial = new THREE.ShadowMaterial({opacity: 0.5});
const shadowPlane = new THREE.Mesh( planeGeometry, planeShadowMaterial );
shadowPlane.rotation.set(rad(-90),0,0)
shadowPlane.position.set(0,0,0)
shadowPlane.receiveShadow = true;
scene.add( shadowPlane );

const planeSolidColorMaterial = new THREE.MeshBasicMaterial({color: backgroundColor})
const plane = new THREE.Mesh( planeGeometry, planeSolidColorMaterial );
plane.rotation.set(rad(-90),0,0)
plane.position.set(0,0,0)
plane.receiveShadow = false;
scene.add( plane );

//orbit controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.maxDistance = 25
controls.zoomSpeed = 2

controls.target.set(0,3,0)
console.log(controls.target)

camera.position.set(lookAwayVector[0] * lookAwayDistance,3 + lookAwayVector[1] * lookAwayDistance,lookAwayVector[2] * lookAwayDistance)
camera.lookAt(new THREE.Vector3(0,3,0))
controls.update()

function animate() {
    renderer.render( scene, camera );

    requestAnimationFrame( () => {
        animate()
    } );
};

animate()

function setBoneToCFrame(bone: THREE.Bone, cf: CFrame) {
    bone.position.set(cf.Position[0], cf.Position[1], cf.Position[2])
    bone.rotation.order = "YXZ"
    bone.rotation.x = rad(cf.Orientation[0])
    bone.rotation.y = rad(cf.Orientation[1])
    bone.rotation.z = rad(cf.Orientation[2])
}

function getCFrameForBone(humanoid: Instance, name: string, includeTransform: boolean = false) {
    const rig = humanoid.parent
    if (rig) {
        const child = rig.FindFirstChild(name)
        if (child && (child.className === "MeshPart" || child.className === "Part")) {
            const motor = child.FindFirstChildOfClass("Motor6D")
            if (motor) {
                return calculateMotor6Doffset(motor, includeTransform)
            } else {
                //return new CFrame()
                return child.Prop("CFrame") as CFrame
            }
        }
    }

    return new CFrame()
}


export function getBoneMatrix(humanoid: Instance, name: string) {
    const rig = humanoid.parent
    if (rig) {
        const child = rig.FindFirstChild(name)
        if (child && (child.className === "MeshPart" || child.className === "Part")) {
            /*const motor = child.FindFirstChildOfClass("Motor6D")
            if (motor) {
                return new THREE.Matrix4().fromArray(calculateMotor6Doffset(motor, false).getMatrix()).invert()
            } else {
                return new THREE.Matrix4().fromArray(new CFrame().getMatrix()).invert()
                //return child.Prop("CFrame") as CFrame
            }*/
           return new THREE.Matrix4().fromArray(traverseRigCFrame(child).getMatrix())
        }
    }

    return new THREE.Matrix4().fromArray(new CFrame().getMatrix()).invert()
}

export const BoneNameToIndex: {[K in string]: number} = {
    "Root": 0,
    "HumanoidRootNode": 1,
    "LowerTorso": 2,
    "UpperTorso": 3,
    "RightUpperArm": 4,
    "RightLowerArm": 5,
    "RightHand": 6,
    "LeftUpperArm": 7,
    "LeftLowerArm": 8,
    "LeftHand": 9,
    "RightUpperLeg": 10,
    "RightLowerLeg": 11,
    "RightFoot": 12,
    "LeftUpperLeg": 13,
    "LeftLowerLeg": 14,
    "LeftFoot": 15,
    "Head": 16,
}

function updateSkeletonFromHumanoid(instance: Instance, skeleton: THREE.Skeleton) {
    const boneNames = ["LowerTorso", "UpperTorso", "RightUpperArm", "RightLowerArm", "RightHand", "LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperLeg", "RightLowerLeg", "RightFoot", "LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "Head"]
    
    //update rest position
    const bone = skeleton.getBoneByName("HumanoidRootNode")
    if (bone) {
        setBoneToCFrame(bone, getCFrameForBone(instance, "HumanoidRootPart", false))
        bone.updateMatrixWorld()
        const boneIndex = skeleton.bones.indexOf(bone);
        skeleton.boneInverses[ boneIndex ].copy(bone.matrixWorld).invert();
    }

    for (const boneName of boneNames) {
        const bone = skeleton.getBoneByName(boneName)
        if (bone) {
            setBoneToCFrame(bone, getCFrameForBone(instance, boneName, false))
            bone.updateMatrixWorld()
            const boneIndex = skeleton.bones.indexOf(bone);
            skeleton.boneInverses[ boneIndex ].copy(bone.matrixWorld).invert();
        }
    }

    skeleton.pose();

    //update position
    for (const boneName of boneNames) {
        const bone = skeleton.getBoneByName(boneName)
        if (bone) {
            setBoneToCFrame(bone, getCFrameForBone(instance, boneName, true))
        }
    }
}

function getSkeletonFromHumanoid(instance: Instance): THREE.Skeleton {
    if (!destroyConnections.get(instance)) {
        destroyConnections.set(instance, instance.Destroying.Connect(() => {
            removeInstance(instance)
            const connection = destroyConnections.get(instance)
            connection?.Disconnect()
            destroyConnections.delete(instance)
        }))
    }

    let skeleton = skeletons.get(instance)

    if (!skeleton) {
        //root
        const RootBone = new THREE.Bone()
        RootBone.name = "Root"
        RootBone.position.set(0,0,0)

        const HumanoidRootNodeBone = new THREE.Bone()
        HumanoidRootNodeBone.name = "HumanoidRootNode"
        setBoneToCFrame(HumanoidRootNodeBone, getCFrameForBone(instance, "HumanoidRootPart"))
        RootBone.add(HumanoidRootNodeBone)

        //torso
        const LowerTorsoBone = new THREE.Bone()
        LowerTorsoBone.name = "LowerTorso"
        setBoneToCFrame(LowerTorsoBone, getCFrameForBone(instance, "LowerTorso"))
        HumanoidRootNodeBone.add(LowerTorsoBone)

        const UpperTorsoBone = new THREE.Bone()
        UpperTorsoBone.name = "UpperTorso"
        setBoneToCFrame(UpperTorsoBone, getCFrameForBone(instance, "UpperTorso"))
        LowerTorsoBone.add(UpperTorsoBone)

        //head
        const HeadBone = new THREE.Bone()
        HeadBone.name = "Head"
        setBoneToCFrame(HeadBone, getCFrameForBone(instance, "Head"))
        UpperTorsoBone.add(HeadBone)

        //right arm
        const RightUpperArmBone = new THREE.Bone()
        RightUpperArmBone.name = "RightUpperArm"
        setBoneToCFrame(RightUpperArmBone, getCFrameForBone(instance, "RightUpperArm"))
        UpperTorsoBone.add(RightUpperArmBone)

        const RightLowerArmBone = new THREE.Bone()
        RightLowerArmBone.name = "RightLowerArm"
        setBoneToCFrame(RightLowerArmBone, getCFrameForBone(instance, "RightLowerArm"))
        RightUpperArmBone.add(RightLowerArmBone)

        const RightHandBone = new THREE.Bone()
        RightHandBone.name = "RightHand"
        setBoneToCFrame(RightHandBone, getCFrameForBone(instance, "RightHand"))
        RightLowerArmBone.add(RightHandBone)

        //left arm
        const LeftUpperArmBone = new THREE.Bone()
        LeftUpperArmBone.name = "LeftUpperArm"
        setBoneToCFrame(LeftUpperArmBone, getCFrameForBone(instance, "LeftUpperArm"))
        UpperTorsoBone.add(LeftUpperArmBone)

        const LeftLowerArmBone = new THREE.Bone()
        LeftLowerArmBone.name = "LeftLowerArm"
        setBoneToCFrame(LeftLowerArmBone, getCFrameForBone(instance, "LeftLowerArm"))
        LeftUpperArmBone.add(LeftLowerArmBone)

        const LeftHandBone = new THREE.Bone()
        LeftHandBone.name = "LeftHand"
        setBoneToCFrame(LeftHandBone, getCFrameForBone(instance, "LeftHand"))
        LeftLowerArmBone.add(LeftHandBone)

        //right leg
        const RightUpperLegBone = new THREE.Bone()
        RightUpperLegBone.name = "RightUpperLeg"
        setBoneToCFrame(RightUpperLegBone, getCFrameForBone(instance, "RightUpperLeg"))
        LowerTorsoBone.add(RightUpperLegBone)

        const RightLowerLegBone = new THREE.Bone()
        RightLowerLegBone.name = "RightLowerLeg"
        setBoneToCFrame(RightLowerLegBone, getCFrameForBone(instance, "RightLowerLeg"))
        RightUpperLegBone.add(RightLowerLegBone)

        const RightFootBone = new THREE.Bone()
        RightFootBone.name = "RightFoot"
        setBoneToCFrame(RightFootBone, getCFrameForBone(instance, "RightFoot"))
        RightLowerLegBone.add(RightFootBone)

        //left leg
        const LeftUpperLegBone = new THREE.Bone()
        LeftUpperLegBone.name = "LeftUpperLeg"
        setBoneToCFrame(LeftUpperLegBone, getCFrameForBone(instance, "LeftUpperLeg"))
        LowerTorsoBone.add(LeftUpperLegBone)

        const LeftLowerLegBone = new THREE.Bone()
        LeftLowerLegBone.name = "LeftLowerLeg"
        setBoneToCFrame(LeftLowerLegBone, getCFrameForBone(instance, "LeftLowerLeg"))
        LeftUpperLegBone.add(LeftLowerLegBone)

        const LeftFootBone = new THREE.Bone()
        LeftFootBone.name = "LeftFoot"
        setBoneToCFrame(LeftFootBone, getCFrameForBone(instance, "LeftFoot"))
        LeftLowerLegBone.add(LeftFootBone)

        skeleton = new THREE.Skeleton([RootBone, HumanoidRootNodeBone, LowerTorsoBone, UpperTorsoBone, RightUpperArmBone, RightLowerArmBone, RightHandBone, LeftUpperArmBone, LeftLowerArmBone, LeftHandBone, RightUpperLegBone, RightLowerLegBone, RightFootBone, LeftUpperLegBone, LeftLowerLegBone, LeftFootBone, HeadBone])
        //[getBoneMatrix(instance, "Root"), getBoneMatrix(instance, "HumanoidRootPart"), getBoneMatrix(instance, "LowerTorso"), getBoneMatrix(instance, "UpperTorso"), getBoneMatrix(instance, "RightUpperArm"), getBoneMatrix(instance, "RightLowerArm"), getBoneMatrix(instance, "RightHand"), getBoneMatrix(instance, "LeftUpperArm"), getBoneMatrix(instance, "LeftLowerArm"), getBoneMatrix(instance, "LeftHand"), getBoneMatrix(instance, "RightUpperLeg"), getBoneMatrix(instance, "RightLowerLeg"), getBoneMatrix(instance, "RightFoot"), getBoneMatrix(instance, "LeftUpperLeg"), getBoneMatrix(instance, "LeftLowerLeg"), getBoneMatrix(instance, "LeftFoot")]
        console.log(skeleton)
        //const skeletonHelper = new THREE.SkeletonHelper(RootBone)
        //                            scene.add(skeletonHelper)
        scene.add(RootBone)
        skeletons.set(instance, skeleton)
    } else {
        updateSkeletonFromHumanoid(instance, skeleton)
    }

    return skeleton
}

export function removeInstance(instance: Instance) {
    console.log("Removed instance:", instance.Prop("Name"), instance.id)

    const desc = renderables.get(instance)
    if (desc) {
        desc.dispose(renderer, scene, desc.result)
    }

    renderables.delete(instance)
    isRenderingMesh.delete(instance)
    const skeleton = skeletons.get(instance)
    skeletons.delete(instance)
    if (skeleton) {
        for (let i = 0; i < skeleton.bones.length; i++) {
            const bone = skeleton.bones[i];
            if (bone.parent) {
                bone.removeFromParent();
            }
        }
    }

    for (const child of instance.GetChildren()) {
        removeInstance(child)
    }
}

export function addInstance(instance: Instance, auth: Authentication) {
    if (RenderedClassTypes.includes(instance.className)) { //Renderables
        const oldDesc = renderables.get(instance)
        const newDesc = new RenderableDesc()
        newDesc.fromInstance(instance)

        if (oldDesc && !oldDesc.needsRegeneration(newDesc)) {
            //do nothing except update
            //console.log(`Updating ${instance.Prop("Name")}`)
            oldDesc.fromRenderableDesc(newDesc)
            oldDesc.updateResult()
        } else {
            if (!isRenderingMesh.get(instance)) {
                console.log(`Generating ${instance.Prop("Name")} ${instance.id}`)

                newDesc.result = oldDesc?.result //this is done so that the result can be disposed if a removeInstance is called during generation
                renderables.set(instance, newDesc)
                isRenderingMesh.set(instance, true)

                //get the mesh
                newDesc.compileResult(renderer, scene, auth).then(result => {
                    if (result && !(result instanceof Response)) {
                        newDesc.updateResult()

                        if (renderables.get(instance)) {
                            oldDesc?.dispose(renderer, scene, oldDesc.result)

                            if (result instanceof THREE.SkinnedMesh) {
                                let skeleton = undefined

                                if (instance.parent) {
                                    const humanoid = instance.parent.FindFirstChildOfClass("Humanoid")
                                    if (humanoid) {
                                        skeleton = getSkeletonFromHumanoid(humanoid)
                                    } else if (instance.parent.parent) {
                                        const humanoid = instance.parent.parent.FindFirstChildOfClass("Humanoid")
                                        if (humanoid) {
                                            skeleton = getSkeletonFromHumanoid(humanoid)
                                        }
                                    }
                                }
                                
                                if (skeleton) {
                                    result.bind(skeleton)
                                    scene.add(result)
                                }
                            } else {
                                scene.add(result)
                            }

                            console.log(`Generated ${instance.Prop("Name")} ${instance.id}`)

                            isRenderingMesh.set(instance, false)
                            addInstance(instance, auth)
                        } else {
                            newDesc.dispose(renderer, scene, newDesc.result)
                        }
                    }
                })
            }
        }

        if (!destroyConnections.get(instance)) {
            destroyConnections.set(instance, instance.Destroying.Connect(() => {
                removeInstance(instance)
                const connection = destroyConnections.get(instance)
                connection?.Disconnect()
                destroyConnections.delete(instance)
            }))
        }
    } else if (instance.className === "Humanoid") {
        const humanoidSkeleton = skeletons.get(instance)
        if (humanoidSkeleton) {
            updateSkeletonFromHumanoid(instance, humanoidSkeleton)
        }
    }

    for (const child of instance.GetChildren()) {
        addInstance(child, auth)
    }
}

export function setRendererSize(width: number, height: number) {
    renderer.setSize(width, height)
}
export function getRendererDom() {
    return renderer.domElement
}

export function getRendererCamera() {
    return camera
}

export function getRendererControls() {
    return controls
}

export function exportScene() {
    const exporter = new GLTFExporter()
    exporter.parse(scene, (gltf) => {
        if (gltf instanceof ArrayBuffer) {
            saveByteArray([gltf], "scene.glb")
        } else {
            download("scene.gltf",JSON.stringify(gltf))
        }
    }, (error) => {
        throw error
    })
}

// Extend the Window interface to include the API property
declare global {
    interface Window {
        RendererExportScene: typeof exportScene;
    }
}
window.RendererExportScene = exportScene

export function mount( container: HTMLDivElement ) {
    if (container) {
        container.insertBefore(renderer.domElement, container.firstChild)
    } else {
        renderer.domElement.remove()
    }
}
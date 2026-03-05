import * as THREE from 'three';
import { EffectComposer, OrbitControls, OutputPass, RenderPass, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { download, rad, saveByteArray } from '../misc/misc';
import type { RenderDesc } from './renderDesc';
import { ObjectDesc } from './objectDesc';
import { type Connection, type Instance } from '../rblx/rbx';
import type { Authentication } from '../api';
import { ObjectDescClassTypes } from '../rblx/constant';
import { GLTFExporter } from 'three/examples/jsm/Addons.js';
import { POST_PROCESSING_IS_DOUBLE_SIZE, USE_POST_PROCESSING } from '../misc/flags';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass.js';

// MAIN DATA FOR THE RENDERER (i should have really made this a class...)
const isRenderingMesh = new Map<Instance,boolean>()
const renderDescs = new Map<Instance,RenderDesc>()
const destroyConnections = new Map<Instance,Connection>()

// SETTING UP THREE JS SCENE
//const lookAwayVector = [-0.406, 0.406, -0.819]
const lookAwayVector = [0.406, 0.306, -0.819]
const lookAwayDistance = 6

const orbitControlsTarget: [number, number, number] = [0,3,0]

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 70, 1 / 1, 0.1, 100 );

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setClearColor(new THREE.Color(1,0,1), 0)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setPixelRatio(window.devicePixelRatio * 1)
renderer.setSize( 420, 420 );
if (USE_POST_PROCESSING && POST_PROCESSING_IS_DOUBLE_SIZE) {
    renderer.setSize( 840, 840 )
}
renderer.domElement.setAttribute("style","width: 420px; height: 420; border-radius: 0px;")

renderer.domElement.setAttribute("id","OutfitInfo-outfit-image-3d")

let effectComposer: EffectComposer | undefined = undefined

if (USE_POST_PROCESSING) {
    effectComposer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    effectComposer.addPass(renderPass)

    const resolution = new THREE.Vector2(420, 420)
    const bloomPass = new UnrealBloomPass(resolution, 0.15, 0.0001, 0.9)
    effectComposer.addPass(bloomPass)

    if (!POST_PROCESSING_IS_DOUBLE_SIZE) {
        const fxaaPass = new FXAAPass()
        effectComposer.addPass(fxaaPass)
    }

    const outputPass = new OutputPass()
    effectComposer.addPass(outputPass)
}

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
const shadowPhysicalSize = 5
directionalLight.shadow.camera.left = -shadowPhysicalSize
directionalLight.shadow.camera.right = shadowPhysicalSize
directionalLight.shadow.camera.top = shadowPhysicalSize + bottomOffset
directionalLight.shadow.camera.bottom = -shadowPhysicalSize + bottomOffset

directionalLight.shadow.camera.near = 0.5; // default
directionalLight.shadow.camera.far = 25;

directionalLight.shadow.intensity = 0.5

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
const planeShadowMaterial = new THREE.ShadowMaterial({opacity: 1.0});
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

controls.target.set(...orbitControlsTarget)
console.log(controls.target)

camera.position.set(lookAwayVector[0] * lookAwayDistance,3 + lookAwayVector[1] * lookAwayDistance,lookAwayVector[2] * lookAwayDistance)
camera.lookAt(new THREE.Vector3(...orbitControlsTarget))
controls.update()

function animate() {
    renderer.setRenderTarget(null)
    if (effectComposer) {
        effectComposer.render();
    } else {
        renderer.render(scene, camera)
    }

    requestAnimationFrame( () => {
        animate()
    } );
};

animate()

export function removeInstance(instance: Instance) {
    console.log("Removed instance:", instance.Prop("Name"), instance.id)

    const desc = renderDescs.get(instance)
    if (desc) {
        desc.dispose(renderer, scene)
    }

    renderDescs.delete(instance)
    isRenderingMesh.delete(instance)

    for (const child of instance.GetChildren()) {
        removeInstance(child)
    }
}

function addRenderDesc(instance: Instance, auth: Authentication, DescClass: typeof RenderDesc) {
    const oldDesc = renderDescs.get(instance)
    const newDesc = new DescClass()
    newDesc.fromInstance(instance)

    if (oldDesc && !oldDesc.needsRegeneration(newDesc)) {
        //do nothing except update
        //console.log(`Updating ${instance.Prop("Name")}`)
        if (!oldDesc.isSame(newDesc)) {
            oldDesc.fromRenderDesc(newDesc)
            oldDesc.updateResult()
        }
    } else {
        //generate new mesh
        if (!isRenderingMesh.get(instance)) {
            //console.log(`Generating ${instance.Prop("Name")} ${instance.id}`)

            newDesc.result = oldDesc?.result //this is done so that the result can be disposed if a removeInstance is called during generation
            renderDescs.set(instance, newDesc)
            isRenderingMesh.set(instance, true)

            //get the mesh
            newDesc.compileResult(renderer, scene).then(result => {
                if (result && !(result instanceof Response)) {
                    newDesc.updateResult()

                    if (renderDescs.get(instance)) {
                        oldDesc?.dispose(renderer, scene)

                        //update skeletonDesc for RenderDescs that have that
                        if (result instanceof THREE.SkinnedMesh && newDesc instanceof ObjectDesc) {
                            const skeleton = newDesc.skeletonDesc?.skeleton
                            
                            if (skeleton) {
                                result.bindMode = "detached"
                                if (newDesc.skeletonDesc) {
                                    scene.add(newDesc.skeletonDesc.rootBone)
                                }
                                result.bind(skeleton)
                                scene.add(result)
                            }
                        } else {
                            scene.add(result)
                        }

                        //console.log(`Generated ${instance.Prop("Name")} ${instance.id}`)

                        isRenderingMesh.set(instance, false)
                        addInstance(instance, auth) //check instance again in case it changed during compilation
                    } else {
                        newDesc.dispose(renderer, scene)
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
}

export function addInstance(instance: Instance, auth: Authentication) {
    //check that this decal isnt baked and should get its own ObjectDesc
    const isDecal = instance.className === "Decal"
    const isBakedDecal = isDecal && !instance.FindFirstChildOfClass("WrapTextureTransfer")
    let isFirstDecal = true
    if (isDecal && instance.parent) {
        const children = instance.GetChildren()
        for (const child of children) {
            if (child.className === "Decal" && child.FindFirstChildOfClass("WrapTextureTransfer") && child.id < instance.id) {
                isFirstDecal = false
            }
        }
    }

    //ObjectDesc
    if (ObjectDescClassTypes.includes(instance.className) && !isBakedDecal && (!isDecal || isFirstDecal)) {
        addRenderDesc(instance, auth, ObjectDesc)
    }
    //ParticleGroupDesc
    /*else if (ParticleGroupDescClassTypes.includes(instance.className)) {
        addParticleGroupDesc(instance, auth)
    }*/

    //update children  too
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

export function getRenderer() {
    return renderer
}

export function getScene() {
    return scene
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
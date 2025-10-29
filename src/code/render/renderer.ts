import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { rad } from '../misc/misc';
import { RenderableDesc } from './renderableDesc';
import type { Connection, Instance } from '../rblx/rbx';
import type { Authentication } from '../api';
import { RenderedClassTypes } from '../rblx/constant';

const renderables = new Map<Instance,RenderableDesc>()
const destroyConnections = new Map<Instance,Connection>()

const lookAwayVector = [-0.406, 0.406, -0.819]
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

scene.background = new THREE.Color( 0x2C2E31 );

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

const planeSolidColorMaterial = new THREE.MeshBasicMaterial({color: 0x2c2e31})
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

export function removeInstance(instance: Instance) {
    const desc = renderables.get(instance)
    if (desc) {
        desc.dispose(renderer, scene, desc.result)
    }

    renderables.delete(instance)

    for (const child of instance.GetChildren()) {
        removeInstance(child)
    }
}

export function addInstance(instance: Instance, auth: Authentication) {
    if (RenderedClassTypes.includes(instance.className)) {
        const oldDesc = renderables.get(instance)
        const newDesc = new RenderableDesc()
        newDesc.fromInstance(instance)

        if (oldDesc && !oldDesc.needsRegeneration(newDesc)) {
            //do nothing except update
            //console.log(`Updating ${instance.Prop("Name")}`)
            oldDesc.fromRenderableDesc(newDesc)
            oldDesc.updateResult()
        } else {
            //console.log(`Generating ${instance.Prop("Name")}`)

            renderables.set(instance, newDesc)
            newDesc.compileResult(renderer, scene, auth).then(result => {
                if (result instanceof THREE.Mesh) {
                    newDesc.updateResult()

                    if (renderables.get(instance) === newDesc) {
                        oldDesc?.dispose(renderer, scene, oldDesc.result)
                        scene.add(result)
                    } else {
                        newDesc.dispose(renderer, scene, newDesc.result)
                    }
                }
            })
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

export function mount( container: HTMLDivElement ) {
    if (container) {
        container.insertBefore(renderer.domElement, container.firstChild)
    } else {
        renderer.domElement.remove()
    }
}
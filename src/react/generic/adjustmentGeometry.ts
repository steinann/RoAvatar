import * as THREE from 'three';

let positionLines: undefined | THREE.Line[] = undefined
let rotationLines: undefined | THREE.Line[] = undefined
let scaleLines: undefined | THREE.Object3D[] = undefined

const L_SIZE = 1
const L_OPAC = 0.5
const L_BLU_OPAC = 1
const L_CIRCPOINTS = 32

const RED = 0xd42327
const GREEN = 0x08a84b
const BLUE = 0x0f5ff3

export function getPositionLines(): THREE.Line[] {
    if (!positionLines) {
        //x
        const xPoints = [new THREE.Vector3(-L_SIZE, 0, 0), new THREE.Vector3(L_SIZE, 0, 0)]
        const xGeometry = new THREE.BufferGeometry().setFromPoints(xPoints)
        const xMesh = new THREE.Line(xGeometry, new THREE.LineBasicMaterial({color: RED}))
        const xMeshUnder = new THREE.Line(xGeometry, new THREE.LineBasicMaterial({color: RED, opacity: L_OPAC, transparent: true, depthTest: false}))
        
        //y
        const yPoints = [new THREE.Vector3(0, -L_SIZE, 0), new THREE.Vector3(0, L_SIZE, 0)]
        const yGeometry = new THREE.BufferGeometry().setFromPoints(yPoints)
        const yMesh = new THREE.Line(yGeometry, new THREE.LineBasicMaterial({color: GREEN}))
        const yMeshUnder = new THREE.Line(yGeometry, new THREE.LineBasicMaterial({color: GREEN, opacity: L_OPAC, transparent: true, depthTest: false}))

        //z
        const zPoints = [new THREE.Vector3(0, 0, -L_SIZE), new THREE.Vector3(0, 0, L_SIZE)]
        const zGeometry = new THREE.BufferGeometry().setFromPoints(zPoints)
        const zMesh = new THREE.Line(zGeometry, new THREE.LineBasicMaterial({color: BLUE}))
        const zMeshUnder = new THREE.Line(zGeometry, new THREE.LineBasicMaterial({color: BLUE, opacity: L_OPAC * L_BLU_OPAC, transparent: true, depthTest: false}))

        positionLines = [xMesh, yMesh, zMesh, xMeshUnder, yMeshUnder, zMeshUnder]
    }

    return positionLines
}

function getCirclePoints(pointCount: number, radius: number, sinMask: THREE.Vector3, cosMask: THREE.Vector3) {
    const points: THREE.Vector3[] = []
    
    for (let i = 0; i < pointCount + 1; i++) {
        const sinVal = Math.sin(Math.PI * 2 / pointCount * i) * radius
        const cosVal = Math.cos(Math.PI * 2 / pointCount * i) * radius

        const point = new THREE.Vector3(sinVal, sinVal, sinVal).multiply(sinMask).add(new THREE.Vector3(cosVal, cosVal, cosVal).multiply(cosMask))
        points.push(point)
    }

    return points
}

export function getRotationLines(): THREE.Line[] {
    if (!rotationLines) {
        //x
        const xPoints = getCirclePoints(L_CIRCPOINTS, L_SIZE, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))
        const xGeometry = new THREE.BufferGeometry().setFromPoints(xPoints)
        const xMesh = new THREE.Line(xGeometry, new THREE.LineBasicMaterial({color: RED}))
        const xMeshUnder = new THREE.Line(xGeometry, new THREE.LineBasicMaterial({color: RED, opacity: L_OPAC, transparent: true, depthTest: false}))

        //y
        const yPoints = getCirclePoints(L_CIRCPOINTS, L_SIZE, new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0))
        const yGeometry = new THREE.BufferGeometry().setFromPoints(yPoints)
        const yMesh = new THREE.Line(yGeometry, new THREE.LineBasicMaterial({color: GREEN}))
        const yMeshUnder = new THREE.Line(yGeometry, new THREE.LineBasicMaterial({color: GREEN, opacity: L_OPAC, transparent: true, depthTest: false}))

        //z
        const zPoints = getCirclePoints(L_CIRCPOINTS, L_SIZE, new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0))
        const zGeometry = new THREE.BufferGeometry().setFromPoints(zPoints)
        const zMesh = new THREE.Line(zGeometry, new THREE.LineBasicMaterial({color: BLUE}))
        const zMeshUnder = new THREE.Line(zGeometry, new THREE.LineBasicMaterial({color: BLUE, opacity: L_OPAC * L_BLU_OPAC, transparent: true, depthTest: false}))

        rotationLines = [xMesh, yMesh, zMesh, xMeshUnder, yMeshUnder, zMeshUnder]
    }

    return rotationLines
}

export function getScaleLines(): THREE.Object3D[] {
    if (!scaleLines) {
        //x
        const xPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(-L_SIZE, 0, 0)]
        const xGeometry = new THREE.BufferGeometry().setFromPoints(xPoints)
        const xMesh = new THREE.Line(xGeometry, new THREE.LineBasicMaterial({color: BLUE}))
        const xMeshUnder = new THREE.Line(xGeometry, new THREE.LineBasicMaterial({color: BLUE, opacity: L_OPAC * L_BLU_OPAC, transparent: true, depthTest: false}))
        
        //y
        const yPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, L_SIZE, 0)]
        const yGeometry = new THREE.BufferGeometry().setFromPoints(yPoints)
        const yMesh = new THREE.Line(yGeometry, new THREE.LineBasicMaterial({color: BLUE}))
        const yMeshUnder = new THREE.Line(yGeometry, new THREE.LineBasicMaterial({color: BLUE, opacity: L_OPAC * L_BLU_OPAC, transparent: true, depthTest: false}))

        //z
        const zPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -L_SIZE)]
        const zGeometry = new THREE.BufferGeometry().setFromPoints(zPoints)
        const zMesh = new THREE.Line(zGeometry, new THREE.LineBasicMaterial({color: BLUE}))
        const zMeshUnder = new THREE.Line(zGeometry, new THREE.LineBasicMaterial({color: BLUE, opacity: L_OPAC * L_BLU_OPAC, transparent: true, depthTest: false}))

        scaleLines = [xMesh, yMesh, zMesh, xMeshUnder, yMeshUnder, zMeshUnder]
    }

    return scaleLines
}
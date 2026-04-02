import { CFrame, deg, RBXRenderer, Event } from "roavatar-renderer"

export type CameraDataType = "Editor" | "AvatarHeadshot"
export class CameraData {
    canFocus: boolean = true
    type: CameraDataType = "Editor"
    transitionStart: number = 0
    previousCF: CFrame = new CFrame()

    previousFov: number = 70
    fov: number = 70 //28.81402587890625

    transitionTime: number = 0.25

    //thumbnail only
    thumbnailFov: number = 28.81402587890625
    yRot: number = 0
    distanceScale: number = 1

    updatePreviousCF() {
        const camera = RBXRenderer.getRendererCamera()
        const camPos = camera.position
        let camEuler = camera.rotation.clone()
        camEuler = camEuler.reorder("YXZ")

        const cf = new CFrame()
        cf.Position = [...camPos.toArray()]
        cf.Orientation = [deg(camEuler.x), deg(camEuler.y), deg(camEuler.z)]

        this.previousCF = cf
    }

    transition(type: CameraDataType) {
        this.type = type
        if (type !== "Editor") {
            this.canFocus = false
        }
        this.transitionStart = Date.now() / 1000
        this.updatePreviousCF()
        this.previousFov = this.fov
        if (type !== "Editor") {
            this.fov = this.thumbnailFov
        } else {
            this.fov = 70
        }
    }

    clone() {
        const copy = new CameraData()
        copy.canFocus = this.canFocus
        copy.type = this.type
        copy.transitionStart = this.transitionStart
        copy.previousCF = this.previousCF.clone()

        copy.previousFov = this.previousFov
        copy.fov = this.fov

        copy.transitionTime = this.transitionTime

        copy.thumbnailFov = this.thumbnailFov
        copy.yRot = this.yRot
        copy.distanceScale = this.distanceScale

        return copy
    }
}

let currentCameraData = new CameraData()

export const onCameraDataChange = new Event()

export function getCameraData() {
    return currentCameraData
}

export function setCameraData(newCameraData: CameraData) {
    currentCameraData = newCameraData
    onCameraDataChange.Fire(newCameraData)
}
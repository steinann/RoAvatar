import { CFrame, deg, RBXRenderer, Event, lerp } from "roavatar-renderer"
import type { AdjustType } from "../accessoryAdjustment"

export type CameraDataType = "Editor" | "AvatarHeadshot" | "Avatar"
export class CameraData {
    canFocus: boolean = true
    type: CameraDataType = "Editor"
    transitionStart: number = 0
    previousCF: CFrame = new CFrame()

    previousFov: number = 70
    editorFov: number = 70 //28.81402587890625

    transitionTime: number = 0.25

    //thumbnail only
    thumbnailFov: number = 28.81402587890625
    yRot: number = 0
    distanceScale: number = 1

    //accessory adjustment
    adjustmentType: AdjustType = "position"
    adjustmentId: bigint = -1n
    adjustmentOpen: boolean = false

    getPassedTransitionTime() {
        const currentTime = Date.now() / 1000
        return currentTime - this.transitionStart
    }

    getNormalizedPassedTransitionTime() {
        return this.getPassedTransitionTime() / this.transitionTime
    }

    isTransition() {
        return this.getPassedTransitionTime() < this.transitionTime
    }

    get fov() {
        const normTransitionTime = this.getNormalizedPassedTransitionTime()
        const targetFov = this.type === "Editor" ? this.editorFov : this.thumbnailFov
        const fov = this.isTransition() ? lerp(this.previousFov, targetFov, normTransitionTime) : targetFov
        return fov
    }

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
        this.previousFov = this.fov //has to be at the start so it calculates correctly
        this.type = type
        this.canFocus = type === "Editor"
        this.transitionStart = Date.now() / 1000
        this.updatePreviousCF()
    }

    clone() {
        const copy = new CameraData()
        copy.canFocus = this.canFocus
        copy.type = this.type
        copy.transitionStart = this.transitionStart
        copy.previousCF = this.previousCF.clone()

        copy.previousFov = this.previousFov
        copy.editorFov = this.editorFov

        copy.transitionTime = this.transitionTime

        copy.thumbnailFov = this.thumbnailFov
        copy.yRot = this.yRot
        copy.distanceScale = this.distanceScale

        copy.adjustmentType = this.adjustmentType
        copy.adjustmentId = this.adjustmentId
        copy.adjustmentOpen = this.adjustmentOpen

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
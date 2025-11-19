import type { AnimationTrack } from "../animation";
import { DataType } from "../constant";
import { Property } from "../rbx";
import InstanceWrapper from "./InstanceWrapper";

export default class AnimatorWrapper extends InstanceWrapper {
    static className: string = "Animator"
    static requiredProperties: string[] = ["Name", "_TrackMap", "_NameIdMap", "_CurrentAnimation", "_HasLoadedAnimation"]

    setup() {
        this.instance.addProperty(new Property("Name", DataType.String), "Animator")

        this.instance.addProperty(new Property("_TrackMap", DataType.NonSerializable), new Map<bigint,AnimationTrack>())
        this.instance.addProperty(new Property("_NameIdMap", DataType.NonSerializable), new Map<string,bigint>())

        this.instance.addProperty(new Property("_CurrentAnimation", DataType.NonSerializable), "idle.Animation1")
        this.instance.addProperty(new Property("_HasLoadedAnimation", DataType.NonSerializable), false)
    }

    renderAnimation(addTime: number = 1 / 60) {
        const currentAnimName = this.instance.Prop("_CurrentAnimation") as string
        const nameIdMap = this.instance.Prop("_NameIdMap") as Map<string,bigint>
        const trackMap = this.instance.Prop("_TrackMap") as Map<bigint,AnimationTrack>

        const id = nameIdMap.get(currentAnimName)
        if (id) {
            const track = trackMap.get(id)
            if (track) {
                track.renderPose()
                track.setTime(track.timePosition + addTime)
            }
        } else {
            //console.log(currentAnimName, nameIdMap)
        }
    }

    playAnimation(name: string) {
        this.instance.setProperty("_CurrentAnimation", name)

        const nameIdMap = this.instance.Prop("_NameIdMap") as Map<string,bigint>
        const trackMap = this.instance.Prop("_TrackMap") as Map<bigint,AnimationTrack>

        const id = nameIdMap.get(name)
        if (id) {
            const track = trackMap.get(id)
            if (track) {
                track.setTime(0)
            }
        }
    }
}
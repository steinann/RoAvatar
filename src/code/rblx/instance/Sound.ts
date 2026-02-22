import { parseAssetString } from "../../api";
import { DataType } from "../constant";
import { Content, Property } from "../rbx";
import { InstanceWrapper } from "./InstanceWrapper";

class SoundWrapperData {
    audio: HTMLAudioElement | undefined
}

export default class SoundWrapper extends InstanceWrapper {
    static className: string = "Sound"
    static requiredProperties: string[] = ["Name", "_data"]

    setup() {
        //generic
        if (!this.instance.HasProperty("Name")) this.instance.addProperty(new Property("Name", DataType.String), "Sound")

        if (!this.instance.HasProperty("_data")) this.instance.addProperty(new Property("_data", DataType.NonSerializable), new SoundWrapperData())
    }

    get data() {
        return this.instance.Prop("_data") as SoundWrapperData
    }

    created() {
        this.instance.Destroying.Connect(() => {
            //cleanup audio
            if (this.data.audio) {
                this.Stop()
                this.data.audio = undefined
            }
        })
    }

    _updateVolume() {
        if (this.data.audio) {
            if (this.instance.HasProperty("Volume")) {
                const volume = this.instance.Prop("Volume") as number

                this.data.audio.volume = volume
            }
        }
    }

    Play() {
        //create audio
        if (!this.data.audio) {
            let audioUrl = undefined
            if (this.instance.HasProperty("SoundId")) {
                audioUrl = this.instance.Prop("SoundId") as string
            } else if (this.instance.HasProperty("AudioContent")) {
                audioUrl = (this.instance.Prop("AudioContent") as Content).uri
            }

            if (audioUrl && audioUrl.length > 0) {
                this.data.audio = new Audio(parseAssetString(audioUrl))
            }
        }

        //play audio
        if (this.data.audio) {
            this._updateVolume()
            this.data.audio.play()
        }
    }

    Stop() {
        //stop audio
        if (this.data.audio) {
            this.data.audio.pause()
            this.data.audio.currentTime = 0
        }
    }
}
import { mathRandom, Wait } from "../../misc/misc";
import { DataType } from "../constant";
import { Instance, Property } from "../rbx";
import { InstanceWrapper } from "./InstanceWrapper";
import SoundWrapper from "./SoundWrapper";

class ScriptWrapperData {
    shouldStop: boolean = false
}

export default class ScriptWrapper extends InstanceWrapper {
    static className: string = "Script"
    static requiredProperties: string[] = ["Name", "_data"]

    setup() {
        //generic
        if (!this.instance.HasProperty("Name")) this.instance.addProperty(new Property("Name", DataType.String), "Script")

        if (!this.instance.HasProperty("_data")) this.instance.addProperty(new Property("_data", DataType.NonSerializable), new ScriptWrapperData())
    }

    get data() {
        return this.instance.Prop("_data") as ScriptWrapperData
    }

    created(): void {
        this.Run()
    }

    Run() {
        switch (this.instance.Prop("Name") as string) {
            case "ChickenSounds":
            case "HarmonicaSounds":
            case "SoundPlayer":
                this.SoundPlayer(this.instance)
                break
        }
    }

    //Scripts
    async SoundPlayer(script: Instance) {
        //Made by steintro

        let Handle = undefined
        if (script.parent && script.parent.Prop("Name") === "Handle") {
            Handle = script.parent
        } else if (script.parent && script.parent.FindFirstChild("Handle")) {
            Handle = script.parent.FindFirstChild("Handle")
        }

        if (!Handle) return

        const Hat = Handle.parent

        if (!Hat) return

        const Sounds = []

        for (const child of Handle.GetDescendants()) {
            if (child.className === "Sound") {
                Sounds.push(child)
            }
        }

        function IsBeingWorn() {
            return Hat?.parent?.FindFirstChild("Humanoid")
        }

        let maxTime = 20
        if (script.Prop("Name") === "SoundPlayer") {
            maxTime = 15
        }

        while (true) {
            await Wait(mathRandom(5,maxTime))
            if (this.instance.destroyed || this.data.shouldStop) return

            if (IsBeingWorn()) {
                const index = mathRandom(0, Sounds.length - 1)
                
                const Sound = Sounds[index]
                
                const soundWrapper = new SoundWrapper(Sound)
                soundWrapper.Play()
            }
        }
    }
}
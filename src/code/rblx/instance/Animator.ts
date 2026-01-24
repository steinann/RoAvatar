import { API, Authentication, idFromStr } from "../../api";
import { AnimationTrack } from "../animation";
import { DataType, FaceControlNames, type AnimationSet, type AnimationSetEntry } from "../constant";
import { CFrame, Property, RBX } from "../rbx";
import InstanceWrapper from "./InstanceWrapper";

class AnimatorWrapperData {
    animationSet: AnimationSet = {}
    emotes = new Map<bigint,AnimationSetEntry>()

    animationTracks = new Map<bigint,AnimationTrack>()

    currentAnimation?: string = "idle"
    currentAnimationTrack?: AnimationTrack

    currentToolAnimation?: string
    currentToolAnimationTrack?: AnimationTrack

    currentMoodAnimation?: string = "mood"
    currentMoodAnimationTrack?: AnimationTrack
}

function getRandomBetweenInclusive(min: number, max: number) {
  return Math.random() * ((max + 1) - min) + min;
}


export default class AnimatorWrapper extends InstanceWrapper {
    static className: string = "Animator"
    static requiredProperties: string[] = ["Name", "_data", "_HasLoadedAnimation"]

    setup() {
        this.instance.addProperty(new Property("Name", DataType.String), "Animator")

        this.instance.addProperty(new Property("_data", DataType.NonSerializable), new AnimatorWrapperData())
        this.instance.addProperty(new Property("_HasLoadedAnimation", DataType.NonSerializable), false)
    }

    get data() {
        return this.instance.Prop("_data") as AnimatorWrapperData
    }

    _pickRandom(entries: AnimationSetEntry[]) {
        let totalWeight = 0
        for (const entry of entries) {
            totalWeight += entry.weight
        }

        if (totalWeight > 0) {
            let accumulatedWeight = 0
            const weight = getRandomBetweenInclusive(1, totalWeight)
            for (const entry of entries) {
                accumulatedWeight += entry.weight
                if (accumulatedWeight >= weight) {
                    return entry
                }
            }
        }

        return entries[0]
    }

    _getTrack(id: string) {
        const realId = BigInt(idFromStr(id))
        return this.data.animationTracks.get(realId)
    }

    _switchAnimation(name: string) {
        let transitionTime = 0.2
        if (name === this.data.currentAnimation) {
            transitionTime = 0.15
        }

        this.data.currentAnimation = name

        //get appropriate track
        let toPlayTrack: AnimationTrack | undefined = undefined

        if (!name.startsWith("emote.")) {
            const entries = this.data.animationSet[name]
            if (entries && entries.length > 0) {
                const entry = this._pickRandom(entries)
                if (entry) {
                    toPlayTrack = this._getTrack(entry.id)
                }
            }
        } else {
            const emoteId = BigInt(name.split(".")[1])
            const entry = this.data.emotes.get(emoteId)
            if (entry) {
                toPlayTrack = this._getTrack(entry.id)
            }
        }

        //if oldTrack !== newTrack
        if (toPlayTrack !== this.data.currentAnimationTrack) {
            //if new track
            if (toPlayTrack) {
                //stop old track
                if (this.data.currentAnimationTrack) {
                    this.data.currentAnimationTrack.Stop(transitionTime)
                }

                this.data.currentAnimationTrack = undefined

                //play new track
                this.data.currentAnimationTrack = toPlayTrack
                toPlayTrack.Play(transitionTime)
            }
        }

        return !!toPlayTrack
    }

    stopMoodAnimation() {
        if (this.data.currentMoodAnimationTrack) {
            this.data.currentMoodAnimationTrack.Stop()
        }
        this.data.currentMoodAnimationTrack = undefined
        this.data.currentMoodAnimation = undefined
    }

    _switchMoodAnimation(name: string) {
        let transitionTime = 0.2
        if (name === this.data.currentMoodAnimation) {
            transitionTime = 0.15
        }

        this.data.currentMoodAnimation = name

        //get appropriate track
        let toPlayTrack: AnimationTrack | undefined = undefined

        const entries = this.data.animationSet[name]
        if (entries && entries.length > 0) {
            const entry = this._pickRandom(entries)
            if (entry) {
                toPlayTrack = this._getTrack(entry.id)
            }
        }

        //if oldTrack !== newTrack
        if (toPlayTrack !== this.data.currentMoodAnimationTrack) {
            //if new track
            if (toPlayTrack) {
                //stop old track
                if (this.data.currentMoodAnimationTrack) {
                    this.data.currentMoodAnimationTrack.Stop(transitionTime)
                }

                this.data.currentMoodAnimationTrack = undefined

                //play new track
                this.data.currentMoodAnimationTrack = toPlayTrack
                toPlayTrack.Play(transitionTime)
            }
        }

        return !!toPlayTrack
    }

    isValidTrackForSet(track: AnimationTrack, name: string) {
        if (this.data.animationSet[name]) {
            for (const entry of this.data.animationSet[name]) {
                if (this._getTrack(entry.id) === track) {
                    return true
                }
            }
        }

        return false
    }

    _fixUnloaded() {
        if ((this.data.currentAnimation && !this.data.currentAnimationTrack) || (this.data.currentAnimation && this.data.currentAnimationTrack && !this.isValidTrackForSet(this.data.currentAnimationTrack, this.data.currentAnimation))) {
            this._switchAnimation(this.data.currentAnimation)
        }
        if ((this.data.currentMoodAnimation && !this.data.currentMoodAnimationTrack) || (this.data.currentMoodAnimation && this.data.currentMoodAnimationTrack && !this.isValidTrackForSet(this.data.currentMoodAnimationTrack, this.data.currentMoodAnimation))) {
            this._switchMoodAnimation(this.data.currentMoodAnimation)
        }
    }

    restPose() {
        const rig = this.instance.parent?.parent

        if (!rig) {
            return
        }

        const descendants = rig.GetDescendants()

        for (const child of descendants) {
            if (child.className === "Motor6D") {
                child.setProperty("Transform", new CFrame(0,0,0))
            } else if (child.className === "FaceControls") {
                const propertyNames = child.getPropertyNames()
                for (const propertyName of propertyNames) {
                    if (FaceControlNames.includes(propertyName)) {
                        child.setProperty(propertyName, 0)
                    }
                }
            }
        }
    }

    renderAnimation(addTime: number = 1 / 60) {
        this.restPose()
        this._fixUnloaded()

        for (const track of this.data.animationTracks.values()) {
            const looped = track.tick(addTime)
            if (this.data.currentAnimationTrack === track && looped && this.data.currentAnimation) {
                this._switchAnimation(this.data.currentAnimation)
            }
        }

        const rig = this.instance.parent?.parent
        if (rig) {
            //Recalculate motor6Ds, this is neccessary due to an ISSUE: that needs TODO: be fixed
            for (const child of rig.GetDescendants()) {
                if (child.className === "Motor6D") {
                    child.setProperty("Transform", child.Prop("Transform"))
                } else if (child.className === "Weld") {
                    child.setProperty("C0", child.Prop("C0"))
                }
            }
        }
    }

    async loadAvatarAnimation(auth: Authentication, id: bigint, isEmote: boolean = false, forceLoop: boolean = false): Promise<Response | undefined> {
        const humanoid = this.instance.parent
        if (!humanoid) {
            throw new Error("Parent is missing from Animator")
        }

        const animationInfo = await API.Asset.GetRBX(`rbxassetid://${id}`, undefined, auth)
        if (!(animationInfo instanceof RBX)) {
            return animationInfo
        }

        const root = animationInfo.generateTree().GetChildren()[0]

        const promises: Promise<Response | undefined>[] = []

        if (!isEmote) {
            //for every main animation
            for (const anim of root.GetChildren()) { 
                const animName = anim.Prop("Name") as string
                this.data.animationSet[animName] = []

                //for every sub animation
                for (const subAnim of anim.GetChildren()) {
                    const subAnimIdStr = subAnim.Prop("AnimationId") as string
                    let subWeight = 0
                    const subWeightChild = subAnim.FindFirstChild("Weight")
                    if (subWeightChild && subWeightChild.className === "NumberValue" && subWeightChild.HasProperty("Value")) {
                        subWeight = subWeightChild.Prop("Value") as number
                    }

                    if (subAnimIdStr.length > 0) {
                        const subAnimId = BigInt(idFromStr(subAnimIdStr))

                        //load sub animation
                        promises.push(new Promise(resolve => {
                            API.Asset.GetRBX(`rbxassetid://${subAnimId}`, undefined, auth).then(result => {
                                if (result instanceof RBX) {
                                    //get and parse animation track
                                    console.log("loading anim", subAnimId)

                                    const animTrackInstance = result.generateTree().GetChildren()[0]
                                    if (animTrackInstance && humanoid.parent) {
                                        const animTrack = new AnimationTrack().loadAnimation(humanoid.parent, animTrackInstance);
                                        if (forceLoop) {
                                            animTrack.looped = true
                                        }
                                        
                                        if (!this.data.animationSet[animName]) {
                                            this.data.animationSet[animName] = []
                                        }
                                        
                                        this.data.animationSet[animName].push({
                                            id: `rbxassetid://${subAnimId}`,
                                            weight: subWeight,
                                        })
                                        this.data.animationTracks.set(subAnimId, animTrack)

                                        this.instance.setProperty("_HasLoadedAnimation",true)
                                    }

                                    resolve(undefined)
                                } else {
                                    resolve(result)
                                }
                            })
                        }))
                    }
                }
            }
        } else {
            const animIdStr = root.Prop("AnimationId") as string
            const animId = BigInt(idFromStr(animIdStr))

            if (animIdStr.length > 0) {
                //load emote animation
                promises.push(new Promise(resolve => {
                    API.Asset.GetRBX(`rbxassetid://${animId}`, undefined, auth).then(result => {
                        if (result instanceof RBX) {
                            //get and parse animation track
                            const animTrackInstance = result.generateTree().GetChildren()[0]
                            if (animTrackInstance && humanoid.parent) {
                                const animTrack = new AnimationTrack().loadAnimation(humanoid.parent, animTrackInstance);
                                if (forceLoop) {
                                    animTrack.looped = true
                                }
                                
                                this.data.emotes.set(id, {
                                        id: `rbxassetid://${animId}`,
                                        weight: 1,
                                    })
                                this.data.animationTracks.set(animId, animTrack)

                                this.instance.setProperty("_HasLoadedAnimation",true)
                            }

                            resolve(undefined)
                        } else {
                            resolve(result)
                        }
                    })
                }))
            }
        }
    }

    playAnimation(name: string, type: "main" | "mood" | "tool" = "main"): boolean {
        console.log("playing", name)

        switch (type) {
            case "main":
                if (this.data.currentAnimation !== name) {
                    if (!name.startsWith("emote.")) {
                        this.playAnimation("mood", "mood")
                    } else {
                        this.stopMoodAnimation()
                    }
                    return this._switchAnimation(name)
                } else {
                    return true
                }
                break
            case "mood":
                if (this.data.currentMoodAnimation !== name) {
                    return this._switchMoodAnimation(name)
                } else {
                    return true
                }
                break
        }

        return false
    }
}
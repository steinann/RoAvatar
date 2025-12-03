import { API, Authentication, idFromStr } from "../../api";
import { AnimationTrack } from "../animation";
import { DataType, MainToSubNames } from "../constant";
import { Property, RBX } from "../rbx";
import InstanceWrapper from "./InstanceWrapper";

const weightMult = 3

//TODO: fix the giant mistake that was assuming subnames are consistent

export default class AnimatorWrapper extends InstanceWrapper {
    static className: string = "Animator"
    static requiredProperties: string[] = ["Name", "_TrackMap", "_NameIdMap", "_CurrentAnimation", "_HasLoadedAnimation"]

    setup() {
        this.instance.addProperty(new Property("Name", DataType.String), "Animator")

        this.instance.addProperty(new Property("_TrackMap", DataType.NonSerializable), new Map<bigint,AnimationTrack>())
        this.instance.addProperty(new Property("_NameIdMap", DataType.NonSerializable), new Map<string,bigint>())

        this.instance.addProperty(new Property("_CurrentAnimation", DataType.NonSerializable), "idle.Animation1")
        this.instance.addProperty(new Property("_HasLoadedAnimation", DataType.NonSerializable), false)

        this.instance.addProperty(new Property("_LastAnimationId", DataType.NonSerializable), -1n)
        this.instance.addProperty(new Property("_CurrentAnimationId", DataType.NonSerializable), -1n)

        this.instance.addProperty(new Property("_Weight", DataType.NonSerializable), 1)
    }

    renderAnimation(addTime: number = 1 / 60) {
        const currentAnimName = this.instance.Prop("_CurrentAnimation") as string
        const nameIdMap = this.instance.Prop("_NameIdMap") as Map<string,bigint>
        const trackMap = this.instance.Prop("_TrackMap") as Map<bigint,AnimationTrack>

        let id = nameIdMap.get(currentAnimName)

        if (this.instance.Prop("_CurrentAnimationId") !== id && id) {
            this.playAnimation(currentAnimName)
            this.renderAnimation(addTime)
            return
        }

        const lastId = this.instance.Prop("_LastAnimationId") as bigint

        let weight = lastId >= 0n ? this.instance.Prop("_Weight") as number : 1

        if (trackMap.get(lastId) && (!id || !trackMap.get(id))) {
            weight = 1
            id = lastId
        } else {
            if (lastId) {
                const track = trackMap.get(lastId)
                if (track) {
                    track.weight = 1 - weight
                    track.resetMotorTransforms()
                    track.setTime(track.timePosition + addTime)
                }
            }
        }

        if (id) {
            const track = trackMap.get(id)
            if (track) {
                //track.renderPose()
                track.weight = weight
                if (!lastId) {
                    track.resetMotorTransforms()
                }
                track.setTime(track.timePosition + addTime)

                if (id !== lastId) {
                    this.instance.setProperty("_Weight", Math.min(1,weight + addTime * weightMult))
                }

                const rig = track.rig
                if (rig) {
                    //Recalculate motor6Ds, this is neccessary do to an ISSUE: that needs TODO: be fixed
                    for (const child of rig.GetDescendants()) {
                        if (child.className === "Motor6D") {
                            child.setProperty("Transform", child.Prop("Transform"))
                        } else if (child.className === "Weld") {
                            child.setProperty("C0", child.Prop("C0"))
                        }
                    }
                }
            }
        } else {
            //console.log(currentAnimName, nameIdMap)
        }
    }

    async loadAvatarAnimation(auth: Authentication, id: bigint, isEmote: boolean = false, forceLoop: boolean = false): Promise<Response | undefined> {
        const humanoid = this.instance.parent
        if (!humanoid) {
            throw new Error("Parent is missing from Animator")
        }

        return new Promise(resolve => {
            API.Asset.GetRBX(`rbxassetid://${id}`, undefined, auth).then(result => { //get instance with animation ids
                if (result instanceof RBX) {
                    const promises2: Promise<Response | undefined>[] = []
                    const root = result.generateTree().GetChildren()[0]

                    if (!isEmote) { //avatar animation
                        //for every main animation
                        for (const anim of root.GetChildren()) { 
                            const animName = anim.Prop("Name") as string
                            //for every sub animation
                            for (const subAnim of anim.GetChildren()) {
                                let subName = subAnim.Prop("Name") as string
                                const subAnimIdStr = subAnim.Prop("AnimationId") as string

                                if (subAnimIdStr.length > 0) {
                                    const subAnimId = BigInt(idFromStr(subAnimIdStr))

                                    //load sub animation
                                    promises2.push(new Promise(resolve => {
                                        API.Asset.GetRBX(`rbxassetid://${subAnimId}`, undefined, auth).then(result => {
                                            if (result instanceof RBX) {
                                                //get and parse animation track
                                                console.log("loading anim", subAnimId)

                                                //TODO: properly fix sub names instead of this
                                                if (MainToSubNames[animName] && !MainToSubNames[animName].includes(subName)) {
                                                    subName = MainToSubNames[animName][0]
                                                }

                                                const animTrackInstance = result.generateTree().GetChildren()[0]
                                                if (animTrackInstance && humanoid.parent) {
                                                    const animTrack = new AnimationTrack().loadAnimation(humanoid.parent, animTrackInstance);
                                                    if (forceLoop) {
                                                        animTrack.looped = true
                                                    }
                                                    
                                                    (this.instance.Prop("_TrackMap") as Map<bigint,AnimationTrack>).set(subAnimId, animTrack);
                                                    (this.instance.Prop("_NameIdMap") as Map<string,bigint>).set(`${animName}.${subName}`, subAnimId)
                                                    this.instance.setProperty("_HasLoadedAnimation",true)
                                                    console.log(animTrack)
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
                    } else { //emote
                        const animIdStr = root.Prop("AnimationId") as string
                        const animId = BigInt(idFromStr(animIdStr))

                        if (animIdStr.length > 0) {
                            //load empote animation
                            promises2.push(new Promise(resolve => {
                                API.Asset.GetRBX(`rbxassetid://${animId}`, undefined, auth).then(result => {
                                    if (result instanceof RBX) {
                                        //get and parse animation track
                                        const animTrackInstance = result.generateTree().GetChildren()[0]
                                        if (animTrackInstance && humanoid.parent) {
                                            const animTrack = new AnimationTrack().loadAnimation(humanoid.parent, animTrackInstance);
                                            (this.instance.Prop("_TrackMap") as Map<bigint,AnimationTrack>).set(animId, animTrack);
                                            (this.instance.Prop("_NameIdMap") as Map<string,bigint>).set(`emote.${id}`, animId)
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

                    Promise.all(promises2).then((values2) => { //return result when all subs are finished loading
                        for (const value2 of values2) {
                            if (value2) {
                                resolve(value2)
                                return
                            }
                        }

                        resolve(undefined)
                        return
                    })
                } else {
                    resolve(result)
                }
            })
        })
    }

    playAnimation(name: string): boolean {
        console.log("playing",name)
        

        const nameIdMap = this.instance.Prop("_NameIdMap") as Map<string,bigint>
        const trackMap = this.instance.Prop("_TrackMap") as Map<bigint,AnimationTrack>

        const id = nameIdMap.get(name)
        if (id && this.instance.Prop("_CurrentAnimationId") !== id) {
            this.instance.setProperty("_CurrentAnimation", name)

            const currentId = this.instance.Prop("_CurrentAnimationId") as bigint
            this.instance.setProperty("_LastAnimationId", currentId)
            this.instance.setProperty("_CurrentAnimationId", id)
            if (currentId >= 0) {
                this.instance.setProperty("_Weight", 0)
            }

            const track = trackMap.get(id)
            if (track) {
                //track.resetMotorTransforms()
                //track.setTime(0)
                track.timePosition = 0
                return true
            }
        }

        return false
    }
}
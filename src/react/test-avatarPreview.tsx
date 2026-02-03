import { useCallback, useContext, useEffect } from "react"
import { API } from "../code/api"
import { AuthContext } from "./context/auth-context"
import { Instance, RBX } from "../code/rblx/rbx"
import HumanoidDescriptionWrapper from "../code/rblx/instance/HumanoidDescription"
//import { Outfit } from "../code/avatar/outfit"
import { addInstance, mount } from "../code/render/renderer"
import { Outfit } from "../code/avatar/outfit"
import { AnimationTrack } from "../code/rblx/animation"
//import { MaterialDesc } from "../code/render/materialDesc"
//import { MeshDesc } from "../code/render/meshDesc"

export default function Test_AvatarPreview(): React.JSX.Element {
    const auth = useContext(AuthContext)
    const containerRef = useCallback(mount, [])

    useEffect(() => {
        console.log("running")
        let idToUse = 126448532

        const urlParams = new URLSearchParams(window.location.search)
        const id = urlParams.get("id")
        //const userId = urlParams.get("userId")
        //const outfitId = urlParams.get("outfitId")
        if (id) {
            idToUse = Number(id)
        }


        if (auth) {
            const hrp = new Instance("HumanoidDescription")
            const hrpWrapper = new HumanoidDescriptionWrapper(hrp)
            console.log(hrpWrapper)

            
            API.Asset.GetRBX("../assets/HumanoidDescriptionExample.rbxm", undefined).then(result => {
                if (result instanceof RBX) {
                    const humanoidDescription = result.generateTree()
                    console.log(result)
                    console.log(humanoidDescription)
                    const hrpWrapper = new HumanoidDescriptionWrapper(humanoidDescription.GetChildren()[0])
                    console.log(hrpWrapper)
                }
            })

            API.Avatar.GetAvatarDetails(idToUse).then(result => {
                if (result instanceof Outfit) {
                    const humanoidDescriptionWrapper = new HumanoidDescriptionWrapper(new Instance("HumanoidDescription"))
                    console.log(humanoidDescriptionWrapper.instance.Prop("Face"))
                    humanoidDescriptionWrapper.fromOutfit(result).then(result => {
                        console.log(result)
                        if (result instanceof Instance) {
                            API.Asset.GetRBX("../assets/RigR15.rbxm", undefined).then(result => {
                                if (result instanceof RBX) {
                                    const dataModel = result.generateTree()
                                    const rig = dataModel.GetChildren()[0]
                                    
                                    let currentAnimationIndex = 0

                                    /*const animationIds = [
                                        507766388, //idle long
                                        913376220, //run
                                        507772104, //dance
                                    ]*/
                                    const animationIds = [
                                        "https://assetdelivery.roblox.com/v1/asset?id=" + 139130639469681, //Hugo / What you want
                                        "https://assetdelivery.roblox.com/v1/asset?id=" + 134948629272782, //Animation / Hakari dance
                                        "https://assetdelivery.roblox.com/v1/asset?id=" + 100114227897992, //Die lit (funnydance) / Bring it around
                                        //"../assets/armSwingCurveAnim.rbxm",
                                    ]

                                    //animationIds = stillPoseAnimationIds
                                    const animationTracks: AnimationTrack[] = []

                                    const animationPromises = []

                                    for (const id of animationIds) {
                                        animationPromises.push(new Promise<void>((resolve) => {
                                            API.Asset.GetAssetBuffer(id).then(buffer => {
                                                if (buffer instanceof ArrayBuffer) {
                                                    const rbx = new RBX()
                                                    rbx.fromBuffer(buffer)
                                                    console.log(rbx.generateTree())

                                                    const animationTrack = new AnimationTrack()
                                                    console.log(id)
                                                    animationTrack.loadAnimation(rig, rbx.dataModel.GetChildren()[0])
                                                    animationTrack.looped = true
                                                    animationTracks.push(animationTrack)
                                                    
                                                    console.log(animationTrack)

                                                    resolve()
                                                }
                                            })
                                        }))
                                    }

                                    let animationTotalTime = 5
                                    const animationTransitionTime = 0.5

                                    Promise.all(animationPromises).then(() => {
                                        function updateTrack(startTime: number, lastAnimationSwitch: number) {
                                            const nextAnimationIndex = (currentAnimationIndex + 1) % animationIds.length

                                            const animationTrack = animationTracks[currentAnimationIndex]
                                            const nextAnimationTrack = animationTracks[nextAnimationIndex]

                                            const newTime = performance.now() / 1000

                                            const playedTime = newTime - lastAnimationSwitch
                                            const firstHalfTime = animationTotalTime - animationTransitionTime

                                            nextAnimationTrack.weight = Math.max(0, playedTime - firstHalfTime) / animationTransitionTime
                                            animationTrack.weight = 1 - nextAnimationTrack.weight
                                            nextAnimationTrack.weight *= 1
                                            animationTrack.weight *= 1
                                            
                                            //console.log("----")
                                            //console.log(animationTrack.weight)
                                            animationTrack.resetMotorTransforms()
                                            animationTrack.setTime((newTime - startTime))
                                            nextAnimationTrack.setTime((newTime - startTime))

                                            //recalculate motor6ds
                                            for (const child of rig.GetDescendants()) {
                                                if (child.className === "Motor6D") {
                                                    child.setProperty("Transform", child.Prop("Transform"))
                                                } else if (child.className === "Weld") {
                                                    child.setProperty("C0", child.Prop("C0"))
                                                }
                                            }

                                            if (newTime - lastAnimationSwitch > animationTotalTime) {
                                                currentAnimationIndex++
                                                currentAnimationIndex = currentAnimationIndex % animationIds.length
                                                animationTotalTime = 5 + Math.random() * 5
                                                lastAnimationSwitch = performance.now() / 1000
                                            }

                                            if (auth) {
                                                addInstance(rig, auth)
                                            }

                                            setTimeout(() => {
                                                updateTrack(startTime, lastAnimationSwitch)
                                            }, 1000 / 60 - 1)
                                        }

                                        const lastAnimationSwitch = performance.now() / 1000
                                        animationTotalTime = animationTracks[currentAnimationIndex].length
                                        updateTrack(performance.now() / 1000, lastAnimationSwitch)
                                    })

                                    const humanoid = rig?.FindFirstChildOfClass("Humanoid")
                                    if (humanoid) {
                                        console.log("Starting to apply description...")
                                        humanoidDescriptionWrapper.applyDescription(humanoid).then(() => {
                                            addInstance(rig, auth)
                                            setTimeout(() => {
                                                API.Avatar.GetAvatarDetails(idToUse).then(result => {
                                                    if (result instanceof Outfit) {
                                                        const humanoidDescriptionWrapper2 = new HumanoidDescriptionWrapper(new Instance("HumanoidDescription"))
                                                        humanoidDescriptionWrapper2.fromOutfit(result).then(result => {
                                                            if (result instanceof Instance) {
                                                                humanoidDescriptionWrapper2.applyDescription(humanoid).then(result => {
                                                                    if (result instanceof Instance) {
                                                                        //addInstance(rig, auth)
                                                                        setInterval(() => {
                                                                            API.Avatar.GetAvatarDetails(idToUse).then(result => {
                                                                                if (result instanceof Outfit) {
                                                                                    const humanoidDescriptionWrapper2 = new HumanoidDescriptionWrapper(new Instance("HumanoidDescription"))
                                                                                    humanoidDescriptionWrapper2.fromOutfit(result).then(result => {
                                                                                        if (result instanceof Instance) {
                                                                                            humanoidDescriptionWrapper2.applyDescription(humanoid).then(result => {
                                                                                                if (!(result instanceof Response)) {
                                                                                                    //addInstance(rig, auth)
                                                                                                    console.log(rig)
                                                                                                    addInstance(rig, auth)
                                                                                                }
                                                                                            })
                                                                                        }
                                                                                    })
                                                                                }
                                                                            })
                                                                        },2000)
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                })
                                            },1200)
                                            
                                        })
                                        
                                    } else {
                                        throw rig
                                    }
                                } else {
                                    throw result
                                }
                            })

                            console.log("lets compare itself with itself!")
                            console.log(humanoidDescriptionWrapper.compare(humanoidDescriptionWrapper))

                            API.Asset.GetRBX("../assets/berryavHumanoidDescription.rbxm", undefined).then(result => {
                                if (result instanceof RBX) {
                                    console.log("lets compare itself with berry av (but from file!)")
                                    const hrp2 = result.generateTree().GetChildren()[0]
                                    const hrpWrapper2 = new HumanoidDescriptionWrapper(hrp2)
                                    console.log(humanoidDescriptionWrapper.compare(hrpWrapper2))
                                }
                            })
                        } else {
                            throw result
                        }
                    })
                } else {
                    throw result
                }
            })
        }
    }, [auth])

    return (<div ref={containerRef}></div>)
}
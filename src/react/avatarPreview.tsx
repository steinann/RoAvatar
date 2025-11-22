import { useCallback, useContext, useEffect } from "react"
import { AuthContext } from "./context/auth-context"
import { OutfitContext } from "./context/outfit-context"
import { addInstance, mount } from "../code/render/renderer"
import { AvatarType } from "../code/avatar/constant"
import { API, Authentication } from "../code/api"
import { Instance, RBX } from "../code/rblx/rbx"
import { Outfit } from "../code/avatar/outfit"
import HumanoidDescriptionWrapper from "../code/rblx/instance/HumanoidDescription"
import AnimatorWrapper from "../code/rblx/instance/Animator"

let hasLoadedAvatar = false
let currentRigType = AvatarType.R15
let currentRig: Instance | undefined = undefined
let lastOutfit: Outfit | undefined = undefined

let currentlyChangingRig = false
function setRigTo(newRigType: AvatarType, auth: Authentication) {
    return new Promise<undefined>((resolve) => {
        if (!currentlyChangingRig) {
            currentlyChangingRig = true

            if (currentRig) {
                currentRig.Destroy()
                currentRig = undefined
            }
            currentRigType = newRigType

            API.Asset.GetRBX(`../assets/Rig${currentRigType}.rbxm`, undefined, auth).then(result => {
                if (result instanceof RBX) {
                    const newRig = result.generateTree().GetChildren()[0]

                    currentRig = newRig
                    addInstance(currentRig, auth)
                } else {
                    //TODO: display error
                }
                currentlyChangingRig = false
                resolve(undefined)
            })
        }
    })
}

let currentlyUpdatingPreview = false
function updatePreview(outfit: Outfit, auth: Authentication) {
    if (!currentlyUpdatingPreview) {
        currentlyUpdatingPreview = true

        //update rig
        const newRigType: AvatarType = outfit.playerAvatarType

        const promises: Promise<undefined>[] = []
        if (newRigType !== currentRigType || !currentRig) {
            promises.push(setRigTo(newRigType, auth))
        }

        Promise.all(promises).then(() => {
            //get humanoid description
            const hrp = new Instance("HumanoidDescription")
            const hrpWrapper = new HumanoidDescriptionWrapper(hrp)
            hrpWrapper.fromOutfit(outfit, auth)
            
            if (currentRig) {
                const humanoid = currentRig.FindFirstChildOfClass("Humanoid")
                if (humanoid) {
                    //apply humanoid description to rig
                    hrpWrapper.applyDescription(humanoid, auth).then((result) => {
                        if (currentRig) {
                            addInstance(currentRig, auth)
                        }
                        if (result instanceof Instance) {
                            if (outfit !== lastOutfit && lastOutfit) {
                                updatePreview(lastOutfit, auth)
                            }
                            currentlyUpdatingPreview = false
                        } else {
                            //TODO: show error!
                            currentlyUpdatingPreview = false
                        }
                    })
                } else {
                    currentlyUpdatingPreview = false
                }
            } else {
                currentlyUpdatingPreview = false
            }
        })
    }
}

let animationInterval: number | undefined = undefined

export default function AvatarPreview({ setOutfit, animName }: { setOutfit :(a: Outfit) => void, animName: string}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    const containerRef = useCallback(mount, [])

    //load the initial avatar
    useEffect(() => {
        if (auth) {
            if (!hasLoadedAvatar) {
                API.Users.GetUserInfo(auth).then(result => {
                    if (result) {
                        const urlParams = new URLSearchParams(window.location.search)
                        const urlId = Number(urlParams.get("id"))

                        const idToUse = urlId || result.id
                        API.Avatar.GetAvatarDetails(auth, idToUse).then(result => {
                            if (result instanceof Outfit) { 
                                setOutfit(result)
                                hasLoadedAvatar = true
                            } 
                        })
                    }
                })
            } else {
                lastOutfit = outfit
                updatePreview(outfit, auth)
            }
        }
    }, [auth, outfit, setOutfit])

    //load extra scene
    /*useEffect(() => {
        if (auth) {
            API.Asset.GetRBX("../assets/Mesh Deformation Test.rbxl").then(result => {
                if (result instanceof RBX) {
                    const root = result.generateTree()
                    addInstance(root, auth)
                }
            })
        }
    }, [auth])*/

    //play/load animations
    useEffect(() => {
        if (currentRig) {
            const humanoid = currentRig.FindFirstChildOfClass("Humanoid")
            if (humanoid) {
                const animator = humanoid.FindFirstChildOfClass("Animator")
                if (animator) {
                    const animatorW = new AnimatorWrapper(animator)
                    const successfullyPlayed = animatorW.playAnimation(animName)
                    if (!successfullyPlayed && animName.startsWith("emote.") && auth) {
                        const emoteId = BigInt(animName.split(".")[1])
                        animatorW.loadAvatarAnimation(auth, emoteId, true, true).then(() => {
                            animatorW.playAnimation(animName)
                        })
                    }
                }
            }
        }
    }, [auth, animName])

    //render animations
    useEffect(() => {
        if (animationInterval) {
            clearInterval(animationInterval)
        }

        animationInterval = setInterval(() => {
            if (currentRig && auth) {
                const humanoid = currentRig.FindFirstChildOfClass("Humanoid")
                if (humanoid) {
                    const animator = humanoid.FindFirstChildOfClass("Animator")
                    if (animator) {
                        const animatorW = new AnimatorWrapper(animator)
                        animatorW.renderAnimation(1 / 60)
                        
                        addInstance(currentRig, auth)
                    }
                }
            }
        }, 1000 / 60)
    }, [auth])

    return (<div className="avatar-preview" ref={containerRef}></div>)
}
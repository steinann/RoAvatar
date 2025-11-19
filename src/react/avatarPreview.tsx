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

/*
import type { AnimationTrack } from "../code/rblx/animation"

const animationTrackMap = new Map<string,AnimationTrack>()

type AnimationTable = {[K in string]: {[K in string]: [string,number]}}
const initAnimationsTable: AnimationTable = {
    "idle": {
        "Animation1": ["http://www.roblox.com/asset/?id=507766388", 9],
        "Animation2": ["http://www.roblox.com/asset/?id=507766666", 1],
    }
}

let animationsTable: AnimationTable = JSON.parse(JSON.stringify(initAnimationsTable))
*/

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
        const newRigType: AvatarType = outfit.playerAvatarType

        const promises: Promise<undefined>[] = []
        if (newRigType !== currentRigType || !currentRig) {
            promises.push(setRigTo(newRigType, auth))
        }

        Promise.all(promises).then(() => {
            const hrp = new Instance("HumanoidDescription")
            const hrpWrapper = new HumanoidDescriptionWrapper(hrp)
            hrpWrapper.fromOutfit(outfit, auth)
            
            if (currentRig) {
                const humanoid = currentRig.FindFirstChildOfClass("Humanoid")
                if (humanoid) {
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

export default function AvatarPreview({ setOutfit }: { setOutfit :(a: Outfit) => void}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    const containerRef = useCallback(mount, [])

    useEffect(() => {
        if (auth) {
            if (!hasLoadedAvatar) {
                API.Users.GetUserInfo(auth).then(result => {
                    if (result) {
                        const idToUse = result.id
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
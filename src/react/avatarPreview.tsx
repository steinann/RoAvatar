import * as THREE from 'three';
import { useCallback, useContext, useEffect, useState } from "react"
import { AuthContext } from "./context/auth-context"
import { OutfitContext } from "./context/outfit-context"
import { addInstance, getRendererCamera, getRendererControls, mount } from "../code/render/renderer"
import { AvatarType } from "../code/avatar/constant"
import { API, Authentication } from "../code/api"
import { Instance, RBX, Vector3 } from "../code/rblx/rbx"
import { Outfit } from "../code/avatar/outfit"
import HumanoidDescriptionWrapper from "../code/rblx/instance/HumanoidDescription"
import AnimatorWrapper from "../code/rblx/instance/Animator"
import { base64ToArrayBuffer } from "../code/misc/misc"

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

export default function AvatarPreview({ children, setOutfit, animName }: React.PropsWithChildren & { setOutfit :(a: Outfit) => void, animName: string}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    const containerRef = useCallback(mount, [])

    const [cameraLocked, setCameraLocked] = useState(true)

    //load the initial avatar
    useEffect(() => {
        if (auth) {
            if (!hasLoadedAvatar) {
                API.Users.GetUserInfo(auth).then(result => {
                    if (result) {
                        const urlParams = new URLSearchParams(window.location.search)
                        const urlId = Number(urlParams.get("id"))
                        const base64Json = urlParams.get("base64")
                        const buffer = urlParams.get("buffer")

                        if (buffer) {
                            console.log("buffer", buffer)
                            const arrayBuffer = base64ToArrayBuffer(buffer)
                            const outfit = new Outfit()
                            outfit.fromBuffer(arrayBuffer, auth).then(() => {
                                setOutfit(outfit)
                                hasLoadedAvatar = true
                            })
                        }

                        if (base64Json && !buffer) {
                            const jsonData = atob(base64Json)
                            const outfit = new Outfit()
                            outfit.fromJson(JSON.parse(jsonData))
                            setOutfit(outfit)
                            hasLoadedAvatar = true
                        }

                        if (!base64Json && !buffer) {
                            const idToUse = urlId || result.id
                            API.Avatar.GetAvatarDetails(auth, idToUse).then(result => {
                                if (result instanceof Outfit) { 
                                    setOutfit(result)
                                    hasLoadedAvatar = true
                                } 
                            })
                        }
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
            //update camera position
            if (cameraLocked && currentRig) {
                const upperTorso = currentRig.FindFirstChild("HumanoidRootPart")
                if (upperTorso) {
                    const controls = getRendererControls()
                    const camera = getRendererCamera()

                    const pos = upperTorso.Prop("Position") as Vector3
                    
                    const offset = new THREE.Vector3().subVectors(camera.position, controls.target)

                    controls.target.set(pos.X, pos.Y + 0.5, pos.Z)
                    camera.position.set(pos.X + offset.x, pos.Y + 0.5 + offset.y, pos.Z + offset.z)
                    controls.update()
                }
            }

            //update animation and instance renderables
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
    }, [auth, cameraLocked])

    return (<div className="avatar-preview" ref={containerRef} onMouseDown={(e) => {
        if (e.buttons == 2 && (e.target as HTMLCanvasElement).id === "OutfitInfo-outfit-image-3d") {
            setCameraLocked(false)
        }
    }}>
        <button className={`avatar-preview-focus${cameraLocked ? " focus-disabled" : ""}`} onContextMenu={(e) => {e.preventDefault()}} onClick={(e) => {
            e.preventDefault()
            setCameraLocked(true)
        }}>
            <span title="Recenter" className="material-symbols-outlined">center_focus_weak</span>
        </button>
        {children}
    </div>)
}
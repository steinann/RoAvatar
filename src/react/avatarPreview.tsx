import * as THREE from 'three';
import { useCallback, useContext, useEffect, useState } from "react"
import { AuthContext } from "./context/auth-context"
import { OutfitContext } from "./context/outfit-context"
import { addInstance, getRendererCamera, getRendererControls, mount } from "../code/render/renderer"
import { AvatarType, LayeredClothingAssetOrder } from "../code/avatar/constant"
import { API, Authentication } from "../code/api"
import { Instance, RBX, Vector3 } from "../code/rblx/rbx"
import { Outfit } from "../code/avatar/outfit"
import HumanoidDescriptionWrapper from "../code/rblx/instance/HumanoidDescription"
import AnimatorWrapper from "../code/rblx/instance/Animator"
import { base64ToArrayBuffer } from "../code/misc/misc"
import { LOAD_TEST_PLACE } from '../code/misc/flags';

let hasLoadedAvatar = false
let currentRigType = AvatarType.R15
let currentRig: Instance | undefined = undefined
let lastOutfit: Outfit | undefined = undefined

let lastFrameTime = Date.now() / 1000

let currentlyChangingRig = false
function setRigTo(newRigType: AvatarType, auth: Authentication, setError: (a: string | undefined) => void) {
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

                    setError(undefined)
                } else {
                    //TODO: display error
                    setError("Failed to change rig")
                }
                currentlyChangingRig = false
                resolve(undefined)
            })
        }
    })
}

let currentlyUpdatingPreview = false
let failedLastDescription = false
function updatePreview(outfit: Outfit, auth: Authentication, setError: (a: string | undefined) => void) {
    if (!currentlyUpdatingPreview) {
        currentlyUpdatingPreview = true

        if (LOAD_TEST_PLACE) {
            API.Asset.GetRBX(LOAD_TEST_PLACE).then((result) => {
                if (result instanceof RBX) {
                    console.log("Loaded", LOAD_TEST_PLACE)
                    console.log(result)

                    const root = result.generateTree()
                    currentRig = root
                    addInstance(root, auth)
                }
            })

            return
        }

        //update rig
        const newRigType: AvatarType = outfit.playerAvatarType

        const promises: Promise<undefined>[] = []
        if (newRigType !== currentRigType || !currentRig) {
            promises.push(setRigTo(newRigType, auth, setError))
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
                    if (failedLastDescription) { //force next humanoiddescription to do an apply all
                        const ogDesc = humanoid.FindFirstChildOfClass("HumanoidDescription")
                        if (ogDesc) {
                            ogDesc.Destroy()
                        }
                    }

                    hrpWrapper.applyDescription(humanoid, auth).then((result) => {
                        if (currentRig) {
                            addInstance(currentRig, auth)
                        }
                        if (result instanceof Instance) {
                            failedLastDescription = false
                            if (outfit !== lastOutfit && lastOutfit) {
                                updatePreview(lastOutfit, auth, setError)
                            }
                            currentlyUpdatingPreview = false
                            setError(undefined)
                        } else {
                            failedLastDescription = true
                            //TODO: show error!
                            setError("Failed to apply HumanoidDescription")
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
    const [error, _setError] = useState<string | undefined>(undefined)
    const [warning, _setWarning] = useState<string | undefined>(undefined)

    function setError(error: string | undefined) {
        if (error) {
            console.error(`Preview Error: ${error}`)
        }
        _setError(error)
    }

    function setWarning(warning: string | undefined) {
        if (warning) {
            console.warn(`Preview Warning: ${warning}`)
        }
        _setWarning(warning)
    }

    //set warning based on outfit
    useEffect(() => {
        let layeredCount = 0

        const ignoredTypes = ["HairAccessory", "EyebrowAccessory", "EyelashAccessory"]

        for (const asset of outfit.assets) {
            if (LayeredClothingAssetOrder[asset.assetType.id] !== undefined && !ignoredTypes.includes(asset.assetType.name)) {
                layeredCount += 1
            }
        }

        if (layeredCount >= 2 && outfit.playerAvatarType === AvatarType.R15) {
            setWarning("Layered accessories are not in order in the preview")
        } else {
            setWarning(undefined)
        }
    }, [outfit])

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
                updatePreview(outfit, auth, setError)
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

                    //main animation
                    const successfullyPlayed = animatorW.playAnimation(animName)
                    if (!successfullyPlayed && animName.startsWith("emote.") && auth) {
                        const emoteId = BigInt(animName.split(".")[1])
                        animatorW.loadAvatarAnimation(auth, emoteId, true, true).then(() => {
                            animatorW.playAnimation(animName)
                        })
                    }

                    //mood animation
                    if (outfit.containsAssetType("MoodAnimation") && !animName.startsWith("emote.")) {
                        animatorW.playAnimation("mood", "mood")
                    } else {
                        animatorW.stopMoodAnimation()
                    }
                }
            }
        }
    }, [auth, animName, outfit])

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
                        const deltaTime = Date.now() / 1000 - lastFrameTime
                        lastFrameTime = Date.now() / 1000

                        const animatorW = new AnimatorWrapper(animator)
                        animatorW.renderAnimation(deltaTime)
                        
                        addInstance(currentRig, auth)
                    }
                }
            }
        }, 1000 / 60)
    }, [auth, cameraLocked])

    let previewInfoClass = "none"
    let previewInfoMessage = ""
    if (warning) {
        previewInfoClass = "warning"
        previewInfoMessage = warning
    }
    if (error) {
        previewInfoClass = "error"
        previewInfoMessage = error
    }

    return (<div className="avatar-preview" ref={containerRef} onMouseDown={(e) => {
        if (e.buttons == 2 && (e.target as HTMLCanvasElement).id === "OutfitInfo-outfit-image-3d") {
            setCameraLocked(false)
        }
    }}>
        {/*Recenter camera button*/}
        <button className={`avatar-preview-focus${cameraLocked ? " focus-disabled" : ""}`} onContextMenu={(e) => {e.preventDefault()}} onClick={(e) => {
            e.preventDefault()
            setCameraLocked(true)
        }}>
            <span title="Recenter" className="material-symbols-outlined">center_focus_weak</span>
        </button>
        {/*Error/warning text*/}
        <div className={`preview-info ${previewInfoClass}`}>
            <div className="preview-info-icon">
                <span title="Warning" className='material-symbols-outlined warning'>warning</span>
                <span title="Error" className='material-symbols-outlined error'>block</span>
            </div>
            <div className='preview-info-message roboto-600'>
                {previewInfoMessage}
            </div>
        </div>
        {children}
    </div>)
}
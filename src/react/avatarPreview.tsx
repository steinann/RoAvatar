import * as THREE from 'three';
import { useCallback, useContext, useEffect, useState } from "react"
import { AuthContext } from "./context/auth-context"
import { OutfitContext, OutfitFuncContext } from "./context/outfit-context"
import { AvatarType, Instance, Outfit, Authentication, API, RBX, RBXRenderer, FLAGS, mountElement, LayeredClothingAssetOrder, base64ToArrayBuffer, AnimatorWrapper, HumanoidDescriptionWrapper, Vector3, getCameraCFrameForHeadshotCustomized, lerpCFrame, lerp, CFrame } from 'roavatar-renderer';
import { getCameraData } from './generic/cameraData';

let hasLoadedAvatar = false
let currentRigType = AvatarType.R15
let currentRig: Instance | undefined = undefined
let lastOutfit: Outfit | undefined = undefined

let lastFrameTime = Date.now() / 1000

let currentlyChangingRig = false

function updateAnim(animName: string, currentRig: Instance, auth?: Authentication) {
    const humanoid = currentRig.FindFirstChildOfClass("Humanoid")
    if (humanoid) {
        const animator = humanoid.FindFirstChildOfClass("Animator")
        if (animator) {
            const animatorW = new AnimatorWrapper(animator)

            //main animation
            const successfullyPlayed = animatorW.playAnimation(animName)
            if (!successfullyPlayed && animName.startsWith("emote.") && auth) {
                const emoteId = BigInt(animName.split(".")[1])
                animatorW.loadAvatarAnimation(emoteId, true, true).then(() => {
                    animatorW.playAnimation(animName)
                })
            }

            //mood animation
            /*if (!animName.startsWith("emote.")) {
                animatorW.playAnimation("mood", "mood")
            } else {
                animatorW.stopMoodAnimation()
            }*/
        }
    }
}

function setRigTo(animName: string, newRigType: AvatarType, auth: Authentication, setError: (a: string | undefined) => void) {
    return new Promise<undefined>((resolve) => {
        if (!currentlyChangingRig) {
            currentlyChangingRig = true

            if (currentRig) {
                currentRig.Destroy()
                currentRig = undefined
            }
            currentRigType = newRigType

            const rigURL = `roavatar://Rig${currentRigType}.rbxm`

            API.Asset.GetRBX(rigURL, undefined).then(result => {
                if (result instanceof RBX) {
                    const newRig = result.generateTree().GetChildren()[0]

                    currentRig = newRig
                    RBXRenderer.addInstance(currentRig, auth)

                    updateAnim(animName, currentRig, auth)

                    //console.log("new rig", currentRig)

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
function updatePreview(currentAnim: string, outfit: Outfit, auth: Authentication, setError: (a: string | undefined) => void) {
    if (!currentlyUpdatingPreview) {
        currentlyUpdatingPreview = true

        if (FLAGS.LOAD_TEST_PLACE) {
            API.Asset.GetRBX(FLAGS.LOAD_TEST_PLACE).then((result) => {
                if (result instanceof RBX) {
                    console.log("Loaded", FLAGS.LOAD_TEST_PLACE)
                    console.log(result)

                    const root = result.generateTree()
                    console.log(root)
                    currentRig = root
                    RBXRenderer.addInstance(root, auth)
                }
            })

            return
        }

        //update rig
        const newRigType: AvatarType = outfit.playerAvatarType

        const promises: Promise<undefined>[] = []
        if (newRigType !== currentRigType || !currentRig) {
            promises.push(setRigTo(currentAnim, newRigType, auth, setError))
        }

        Promise.all(promises).then(() => {
            //get humanoid description
            const hrp = new Instance("HumanoidDescription")
            const hrpWrapper = new HumanoidDescriptionWrapper(hrp)
            hrpWrapper.fromOutfit(outfit)
            
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

                    hrpWrapper.applyDescription(humanoid).then((result) => {
                        if (currentRig) {
                            RBXRenderer.addInstance(currentRig, auth)
                        }
                        if (result instanceof Instance) {
                            failedLastDescription = false
                            if (outfit !== lastOutfit && lastOutfit) {
                                updatePreview(currentAnim, lastOutfit, auth, setError)
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

export default function AvatarPreview({ children, setSaveAlwaysOn, setOutfit, animName }: React.PropsWithChildren & { setSaveAlwaysOn: (a: boolean) => void, setOutfit: (a: Outfit) => void, animName: string }): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    const outfitFunc = useContext(OutfitFuncContext)

    const animLock = outfitFunc.animLock

    const containerRef = useCallback(mountElement, [])

    const [cameraLocked, setCameraLocked] = useState(true)
    const [error, _setError] = useState<string | undefined>(undefined)
    const [warning, _setWarning] = useState<string | undefined>(undefined)
    const [canFocus, setCanFocus] = useState<boolean>(true)
    const [isPfp, setIsPfp] = useState<boolean>(false)
    //const [loadingConnection, setLoadingConnection] = useState<Connection | undefined>(undefined)
    //const [isLoading, setIsLoading] = useState<boolean>(false)

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

    //create loading connection
    /*useEffect(() => {
        if (!loadingConnection) {
            setLoadingConnection(API.Events.OnLoadingAssets.Connect((newIsLoading) => {
                setIsLoading(newIsLoading as boolean)
            }))
        }
    }, [loadingConnection])*/

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
            setWarning(undefined)
        } else {
            setWarning(undefined)
        }
    }, [outfit])

    //load the initial avatar
    useEffect(() => {
        if (auth) {
            if (!hasLoadedAvatar) {
                API.Users.GetUserInfo().then(result => {
                    if (result) {
                        const urlParams = new URLSearchParams(window.location.search)
                        const urlId = Number(urlParams.get("id"))
                        const base64Json = urlParams.get("base64")
                        const buffer = urlParams.get("buffer")

                        if (buffer) {
                            console.log("buffer", buffer)
                            const arrayBuffer = base64ToArrayBuffer(buffer.replace(/\s/g, ''))
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
                            API.Avatar.GetAvatarDetails(idToUse).then(result => {
                                if (result instanceof Outfit) { 
                                    setOutfit(result)
                                    hasLoadedAvatar = true
                                } 
                            })
                        } else {
                            setSaveAlwaysOn(true)
                        }
                    }
                })
            } else {
                lastOutfit = outfit
                updatePreview(animName, outfit, auth, setError)
            }
        }
    }, [auth, outfit, setOutfit, setSaveAlwaysOn, animName])

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
            updateAnim(animName, currentRig, auth)
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
                    const controls = RBXRenderer.getRendererControls()
                    const camera = RBXRenderer.getRendererCamera()

                    const pos = upperTorso.Prop("Position") as Vector3

                    if (controls) {
                        const offset = new THREE.Vector3().subVectors(camera.position, controls.target)

                        controls.target.set(pos.X, pos.Y + 0.5, pos.Z)
                        camera.position.set(pos.X + offset.x, pos.Y + 0.5 + offset.y, pos.Z + offset.z)
                        controls.update()
                    }
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

                        //const currentTrack = animatorW.getCurrentAnimationTrack()

                        if (!animLock.locked) {
                            animatorW.renderAnimation(deltaTime)
                        } else {
                            animatorW.renderAnimation(deltaTime,
                                animLock.lockType === "time" ? animLock.value : undefined, 
                                animLock.lockType === "keyframe" ? animLock.value : undefined
                            )
                            //const time = animLock.lockType === "time" ? animLock.value : currentTrack.getKeyframeTime(animLock.value)
                            //currentTrack.setTime(time)
                        }

                        currentRig.preRender()
                        
                        RBXRenderer.addInstance(currentRig, auth)
                    }
                }

                //update camera
                const cameraData = getCameraData()
                const currentTime = Date.now() / 1000
                const transitionTime = currentTime - cameraData.transitionStart
                const isTransition = transitionTime < cameraData.transitionTime

                let targetCF = new CFrame()

                const controls = RBXRenderer.getRendererControls()
                if (controls) {
                    controls.update(0)
                    targetCF = RBXRenderer.getCameraCFrame()

                    controls.enabled = cameraData.type === "Editor" && !isTransition
                }

                if (cameraData.type === "AvatarHeadshot") {
                    targetCF = getCameraCFrameForHeadshotCustomized(currentRig, cameraData.thumbnailFov, cameraData.yRot, cameraData.distanceScale) || targetCF
                }

                if (isTransition) {
                    const newCF = lerpCFrame(cameraData.previousCF, targetCF, transitionTime / cameraData.transitionTime)
                    const newFov = lerp(cameraData.previousFov, cameraData.fov, transitionTime / cameraData.transitionTime)
                    RBXRenderer.setCameraCFrame(newCF)
                    RBXRenderer.setCameraFov(newFov)
                } else if (cameraData.type !== "Editor") {
                    RBXRenderer.setCameraCFrame(targetCF)
                    RBXRenderer.setCameraFov(cameraData.fov)
                }

                if (canFocus !== cameraData.canFocus) {
                    setCanFocus(cameraData.canFocus)
                }

                const newIsPfp = cameraData.type === "AvatarHeadshot"
                if (isPfp !== newIsPfp) {
                    setIsPfp(newIsPfp)
                }
            }

            //update renderer size
            const container = document.getElementById("avatar-preview")
            if (container) {
                RBXRenderer.setRendererSize(container.clientWidth, container.clientHeight)
            }
        }, 1000 / 60)

        return () => {
            if (animationInterval) {
                clearInterval(animationInterval)
                animationInterval = undefined
            }
        }
    }, [auth, cameraLocked, animLock, canFocus, setCanFocus, isPfp, setIsPfp])

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

    return (<div id="avatar-preview" className={`avatar-preview${isPfp ? " pfp-frame" : ""}`} ref={containerRef} onMouseDown={(e) => {
        if (e.buttons == 2 && (e.target as HTMLCanvasElement).id === "OutfitInfo-outfit-image-3d") {
            setCameraLocked(false)
        }
    }}>
        {/*Recenter camera button*/}
        {canFocus ? <button className={`avatar-preview-focus icon-button${cameraLocked ? " focus-disabled" : ""}`} onContextMenu={(e) => {e.preventDefault()}} onClick={(e) => {
            e.preventDefault()
            setCameraLocked(true)
        }}>
            <span title="Recenter" className="material-symbols-outlined">center_focus_weak</span>
        </button> : null}
        {/*Loading icon*/}
        {/*<span className='loader' style={{
            opacity: isLoading ? 1 : 0,
            position: "absolute",
            bottom: "12px",
            right: "12px",
            width: "24px",
            height: "24px",
            transition: "0.1s",
            }}></span>*/}

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
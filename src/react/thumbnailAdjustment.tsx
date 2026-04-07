import { useCallback, useContext, useEffect, useState } from "react"
import { API, AvatarType, mapNum, RBXRenderer, specialClamp } from "roavatar-renderer"
import { AnimLock, OutfitContext, OutfitFuncContext } from "./context/outfit-context"
import SliderInput from "./generic/sliderInput"
import { getCameraData, setCameraData } from "./generic/cameraData"
import Icon from "./generic/icon"
import ItemCategory from "./itemCategory"
import RadialButton from "./generic/radialButton"
import { AuthContext } from "./context/auth-context"
import { AlertContext } from "./context/alert-context"
import SelectInput from "./generic/selectInput"

const ThumbnailCustomizationType = {
    "AvatarHeadshot": 1,
    "Avatar": 2,
}

class ThumbnailCustomization {
    thumbnailType: number
    emoteAssetId: number = 0
    fieldOfViewDeg: number = 28.751935958862305
    yRotDeg: number = 0
    distanceScale: number = 1

    constructor(thumbnailType: number) {
        this.thumbnailType = thumbnailType
    }

    clone(): ThumbnailCustomization {
        const copy = new ThumbnailCustomization(this.thumbnailType)
        copy.emoteAssetId = this.emoteAssetId
        copy.fieldOfViewDeg = this.fieldOfViewDeg
        copy.yRotDeg = this.yRotDeg
        copy.distanceScale = this.distanceScale

        return copy
    }
}

type ThumbnailCustomizationProperty = "thumbnailType" | "emoteAssetId" | "fieldOfViewDeg" | "yRotDeg" | "distanceScale"

function CustomizationSlider({name, min, max, normal, property, thumbnailCustomization, setThumbnailCustomization}: {
    name: string,
    min: number,
    max: number,
    normal: number,
    property: ThumbnailCustomizationProperty,
    thumbnailCustomization: ThumbnailCustomization,
    setThumbnailCustomization: (a: ThumbnailCustomization) => void
}): React.JSX.Element {
    function setValue(val: number) {
        const newCustom = thumbnailCustomization.clone()
        newCustom[property] = val

        setThumbnailCustomization(newCustom)
    }

    return <div className="thumbnail-customization-slider">
        <div className="thumbnail-customization-top">
            <span className="thumbnail-customization-slider-name roboto-600">{name}</span>
            <button className="clear" onClick={()=>{setValue(normal)}}>
                <Icon>delete</Icon>
            </button>
        </div>
        <SliderInput value={mapNum(thumbnailCustomization[property], min, max, 0, 1)} setValue={(val) => {
            val = mapNum(val, 0, 1, min, max)
            setValue(val)
        }}/>
    </div>
}

const lockDataMap = new Map<number,AnimLock>()

function AdjustmentBottom({thumbnailCustomization, setIsAdvanced, isExit, selectedType, setSelectedType}: {thumbnailCustomization: ThumbnailCustomization, setIsAdvanced: (a: boolean) => void, isExit?: boolean, selectedType: SelectedType, setSelectedType: (a: SelectedType) => void}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const alert = useContext(AlertContext)

    if (Math.random() > 10) console.log(setIsAdvanced, isExit)

    return <div className="thumbnail-adjustment-bottom">
        {/*<button style={{display: "none"}} className="thumbnail-advanced roboto-500" onClick={() => {setIsAdvanced(!isExit)}}>
            {isExit ? "Simple" : "Advanced"}
        </button>*/}
        <SelectInput value={selectedType} setValue={setSelectedType as (a: string) => void} alternatives={["Both", "Head", "Fullbody"]} isUp={true}/>
        <div className="dialog-actions">
            <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                if (!auth && alert) {
                    alert("Not authenticated", 3000, false)
                }
                if (!auth) return

                const promises: Promise<Response>[] = []

                //head
                if (selectedType === "Both" || selectedType === "Head") {
                    promises.push(new Promise((resolve) => {
                        API.Avatar.ResetThumbnailCustomization(auth, ThumbnailCustomizationType.AvatarHeadshot).then((response) => {
                            resolve(response)
                        })
                    }))
                }

                //fullbody
                if (selectedType === "Both" || selectedType === "Fullbody") {
                    promises.push(new Promise((resolve) => {
                        API.Avatar.ResetThumbnailCustomization(auth, ThumbnailCustomizationType.Avatar).then((response) => {
                            resolve(response)
                        })
                    }))
                }

                Promise.all(promises).then((results) => {
                    let failed = false

                    for (const result of results) {
                        if (result.status !== 200) {
                            failed = true
                            break
                        }
                    }

                    if (alert) {
                        if (failed) {
                            alert("Failed to remove thumbnail customization for " + selectedType, 3000, false, false)
                        } else {
                            alert("Successfully removed thumbnail customization for " + selectedType, 3000, false, true)
                        }
                    }

                    API.Avatar.RedrawThumbnail(auth)
                })
            }}>
                Remove
            </RadialButton>
            <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                if (!auth && alert) {
                    alert("Not authenticated", 3000, false)
                }
                if (!auth) return

                const promises: Promise<Response>[] = []

                const camera = {
                    distanceScale: thumbnailCustomization.distanceScale,
                    fieldOfViewDeg: thumbnailCustomization.fieldOfViewDeg,
                    yRotDeg: thumbnailCustomization.yRotDeg
                }

                const cameraFullbody = {
                    distanceScale: 1,
                    fieldOfViewDeg: thumbnailCustomization.fieldOfViewDeg,
                    yRotDeg: thumbnailCustomization.yRotDeg
                }

                //head
                if (selectedType === "Both" || selectedType === "Head") {
                    promises.push(new Promise((resolve) => {
                        API.Avatar.SetThumbnailCustomization(auth, {
                            camera,
                            emoteAssetId: thumbnailCustomization.emoteAssetId,
                            thumbnailType: ThumbnailCustomizationType.AvatarHeadshot
                        }).then((response) => {
                            resolve(response)
                        })
                    }))
                }

                //fullbody
                if (selectedType === "Both" || selectedType === "Fullbody") {
                    promises.push(new Promise((resolve) => {
                        API.Avatar.SetThumbnailCustomization(auth, {
                            camera: cameraFullbody,
                            emoteAssetId: thumbnailCustomization.emoteAssetId,
                            thumbnailType: ThumbnailCustomizationType.Avatar
                        }).then((response) => {
                            resolve(response)
                        })
                    }))
                }

                Promise.all(promises).then((results) => {
                    let failed = false

                    for (const result of results) {
                        if (result.status !== 200) {
                            failed = true
                            break
                        }
                    }

                    if (alert) {
                        if (failed) {
                            alert("Failed to save thumbnail customization for " + selectedType, 3000, false, false)
                        } else {
                            alert("Successfully updated thumbnail customization for " + selectedType, 3000, false, true)
                        }
                    }

                    API.Avatar.RedrawThumbnail(auth)
                })
            }}>
                Save
            </RadialButton>
        </div>
    </div>
}

function SimpleAdjustment({thumbnailCustomization, setThumbnailCustomization, setIsAdvanced, selectedType, setSelectedType}: {thumbnailCustomization: ThumbnailCustomization, setThumbnailCustomization: (a: ThumbnailCustomization) => void, setIsAdvanced: (a: boolean) => void, selectedType: SelectedType, setSelectedType: (a: SelectedType) => void}): React.JSX.Element {
    const outfitFunc = useContext(OutfitFuncContext)

    return <>
        <CustomizationSlider name="Rotation" min={-60} max={60} normal={0} property="yRotDeg" thumbnailCustomization={thumbnailCustomization} setThumbnailCustomization={setThumbnailCustomization}/>
        <CustomizationSlider name="Distance" min={0.5} max={2.5} normal={1} property="distanceScale" thumbnailCustomization={thumbnailCustomization} setThumbnailCustomization={setThumbnailCustomization}/>
        <ItemCategory
            searchData={{taxonomy:"", salesTypeFilter: 0}}
            categoryType={"Animations"}
            subCategoryType={"_Emotes"}
            setOutfit={outfitFunc.setOutfit}
            animName={outfitFunc.animName}
            setAnimName={outfitFunc.setAnimName}
            wornItems={[thumbnailCustomization.emoteAssetId]}
            onClickItem={(_auth, itemInfo) => {
                const newThumbnailCustomization = thumbnailCustomization.clone()
                if (newThumbnailCustomization.emoteAssetId !== itemInfo.id) {
                    newThumbnailCustomization.emoteAssetId = Number(itemInfo.id)
                } else {
                    newThumbnailCustomization.emoteAssetId = 0
                }
                setThumbnailCustomization(newThumbnailCustomization)
            }}
            showNames={false}
        />
        <AdjustmentBottom thumbnailCustomization={thumbnailCustomization} setIsAdvanced={setIsAdvanced} selectedType={selectedType} setSelectedType={setSelectedType}/>
    </>
}

type SelectedType = "Both" | "Head" | "Fullbody"

//UNUSED
function AdvancedAdjustment({thumbnailCustomization, setThumbnailCustomization, setIsAdvanced, selectedType, setSelectedType}: {thumbnailCustomization: ThumbnailCustomization, setThumbnailCustomization: (a: ThumbnailCustomization) => void, setIsAdvanced: (a: boolean) => void, selectedType: SelectedType, setSelectedType: (a: SelectedType) => void}): React.JSX.Element {
    //const outfitFunc = useContext(OutfitFuncContext)

    return <>
        <div className="thumbnail-customization-top" style={{width: "90%", margin: "1em 0"}}>
            <span className="thumbnail-customization-slider-name roboto-600">Thumbnail Type</span>
            <SelectInput value={selectedType} setValue={setSelectedType as (a: string) => void} alternatives={["Both", "Head", "Fullbody"]}/>
        </div>
        <CustomizationSlider name="Rotation" min={-60} max={60} normal={0} property="yRotDeg" thumbnailCustomization={thumbnailCustomization} setThumbnailCustomization={setThumbnailCustomization}/>
        <CustomizationSlider name="Distance" min={0.5} max={2.5} normal={1} property="distanceScale" thumbnailCustomization={thumbnailCustomization} setThumbnailCustomization={setThumbnailCustomization}/>
        {/*<CustomizationSlider name="FOV" min={15} max={45} normal={28.814} property="fieldOfViewDeg" thumbnailCustomization={thumbnailCustomization} setThumbnailCustomization={setThumbnailCustomization}/>*/}
        <AdjustmentBottom thumbnailCustomization={thumbnailCustomization} setIsAdvanced={setIsAdvanced} isExit={true} selectedType={selectedType} setSelectedType={setSelectedType}/>
    </>
}

export default function ThumbnailAdjustment({isOpen}: {isOpen: boolean}): React.JSX.Element {
    const outfit = useContext(OutfitContext)
    const outfitFunc = useContext(OutfitFuncContext)

    const [top, setTop] = useState<number>(0)

    const [loadingCustomizations, setLoadingCustomizations] = useState<boolean>(false)
    const [loadedCustomizations, setLoadedCustomizations] = useState<boolean>(false)
    const [headshotCustomization, setHeadshotCustomization] = useState<ThumbnailCustomization>(new ThumbnailCustomization(ThumbnailCustomizationType.AvatarHeadshot))
    const [avatarCustomization, setAvatarCustomization] = useState<ThumbnailCustomization>(new ThumbnailCustomization(ThumbnailCustomizationType.Avatar))

    const [selectedType, setSelectedType] = useState<SelectedType>("Both")

    const [isAdvanced, setIsAdvanced] = useState<boolean>(false)

    const avatarPreview = document.getElementById("avatar-preview")

    const playerAvatarType = outfit.playerAvatarType
    const thumbnailCustomization = headshotCustomization
    const avatarPreviewBottom = avatarPreview?.getBoundingClientRect().bottom

    //update animation lock
    useEffect(() => {
        const emoteId = thumbnailCustomization.emoteAssetId

        if (emoteId > 0) {
            let lockData = lockDataMap.get(emoteId)
            if (!lockData) {
                API.Asset.GetRBX(`rbxassetid://${emoteId}`).then((rbx) => {
                    if (rbx instanceof Response) return

                    lockData = new AnimLock()
                    lockData.locked = true

                    const root = rbx.generateTree()
                    const animation = root.FindFirstChildOfClass("Animation")
                    if (animation) {
                        lockData.lockType = "time"

                        const thumbnailTime = animation.FindFirstChild("ThumbnailTime")
                        if (thumbnailTime) {
                            lockData.value = thumbnailTime.PropOrDefault("Value", 0) as number
                        } else {
                            lockData.value = -1
                        }

                        const thumbnailKeyframe = animation.FindFirstChild("ThumbnailKeyframe")
                        if (thumbnailKeyframe) {
                            console.log(thumbnailKeyframe)
                            lockData.lockType = "keyframe"
                            lockData.value = thumbnailKeyframe.PropOrDefault("Value", 0) as number
                            console.log(lockData.value)
                        }

                        const animationId = animation.PropOrDefault("AnimationId", "") as string
                        if (animationId.length > 0) {
                            API.Asset.GetRBX(animationId) //to preload animation so transition doesnt look weird
                        }
                    }

                    console.log("lock!", lockData)
                    if (isOpen) outfitFunc.setAnimLock(lockData)
                    lockDataMap.set(emoteId, lockData)
                })
            } else {
                if (isOpen) outfitFunc.setAnimLock(lockData)
            }
        }

    }, [thumbnailCustomization, outfitFunc, isOpen])

    //update animation
    const updateAnimation = useCallback((newCustomization: ThumbnailCustomization) => {
        if (isOpen) {
            if (newCustomization.emoteAssetId > 0 && playerAvatarType === AvatarType.R15) {
                outfitFunc.setAnimName(`emote.${newCustomization.emoteAssetId}`, true)
            } else {
                outfitFunc.setAnimName("", true)
            }
        }
    }, [outfitFunc, isOpen, playerAvatarType])

    //update thumbnail customization and camera to match
    const setThumbnailCustomization = useCallback((newCustomization: ThumbnailCustomization) => {
        if (newCustomization.thumbnailType === ThumbnailCustomizationType.AvatarHeadshot) {
            setHeadshotCustomization(newCustomization)
        } else if (newCustomization.thumbnailType === ThumbnailCustomizationType.Avatar) {
            setAvatarCustomization(newCustomization)
        }

        const newCameraData = getCameraData().clone()
        newCameraData.distanceScale = newCustomization.distanceScale
        //newCameraData.thumbnailFov = newCustomization.fieldOfViewDeg
        newCameraData.yRot = newCustomization.yRotDeg
        setCameraData(newCameraData)
        updateAnimation(newCustomization)
    }, [updateAnimation])

    //get thumbnail customizations
    useEffect(() => {
        if (!loadedCustomizations && !loadingCustomizations) {
            setLoadingCustomizations(true)
            API.Avatar.GetThumbnailCustomizations().then((newThumbnailCustomizations) => {
                setLoadingCustomizations(false)
                if (newThumbnailCustomizations instanceof Response) return
                setLoadedCustomizations(true)

                for (const customization of newThumbnailCustomizations.avatarThumbnailCustomizations) {
                    if (customization.camera.distanceScale >= 0) {
                        const newCustomization = new ThumbnailCustomization(customization.thumbnailType)
                        newCustomization.distanceScale = customization.camera.distanceScale
                        newCustomization.emoteAssetId = customization.emoteAssetId
                        newCustomization.fieldOfViewDeg = customization.camera.fieldOfViewDeg
                        newCustomization.yRotDeg = customization.camera.yRotDeg

                        setThumbnailCustomization(newCustomization)
                        updateAnimation(newCustomization)
                    } else {
                        setThumbnailCustomization(customization.thumbnailType === ThumbnailCustomizationType.AvatarHeadshot ? headshotCustomization : avatarCustomization)
                    }
                }
            })
        }
    }, [loadedCustomizations, loadingCustomizations, setLoadedCustomizations, setLoadingCustomizations, updateAnimation, setThumbnailCustomization, headshotCustomization, avatarCustomization])

    //update for open/close
    useEffect(() => {
        const cameraData = getCameraData()

        if (isOpen && cameraData.type !== "AvatarHeadshot") { // on opening
            outfitFunc.setCanSetAnimName(false)

            const newCameraData = cameraData.clone()
            newCameraData.transition("AvatarHeadshot")
            setCameraData(newCameraData)

            const plane = RBXRenderer.plane
            const shadowPlane = RBXRenderer.shadowPlane
            if (plane) plane.visible = false
            if (shadowPlane) shadowPlane.visible = false

            updateAnimation(headshotCustomization)
        } else if (!isOpen && cameraData.type === "AvatarHeadshot") { // on closing
            outfitFunc.setCanSetAnimName(true)

            const newCameraData = cameraData.clone()
            newCameraData.transition("Editor")
            setCameraData(newCameraData)

            const plane = RBXRenderer.plane
            const shadowPlane = RBXRenderer.shadowPlane
            if (plane) plane.visible = true
            if (shadowPlane) shadowPlane.visible = true

            outfitFunc.setAnimLock(new AnimLock())
            outfitFunc.setAnimName(`idle`, true)

            setIsAdvanced(false)
        }
    }, [isOpen, outfitFunc, headshotCustomization, updateAnimation, setIsAdvanced])

    //update animation
    useEffect(() => {
        updateAnimation(thumbnailCustomization)
    }, [playerAvatarType, updateAnimation, thumbnailCustomization])

    //update top
    useEffect(() => {
        const avatarPreview = document.getElementById("avatar-preview")
        const avatarPreviewBottom = avatarPreview?.getBoundingClientRect().bottom

        if (avatarPreviewBottom) {
            const newTop = avatarPreviewBottom
            if (newTop !== top) {
                setTop(newTop)
            }
        }
    }, [setTop, top, avatarPreviewBottom, isOpen])

    //control using viewport
    useEffect(() => {
        if (!avatarPreview || !isOpen) return

        function onMouseMove(e: MouseEvent) {
            if (!avatarPreview || e.target !== avatarPreview && avatarPreview.querySelector("canvas") !== e.target) return
            if (e.buttons === 1) {
                const newYRot = thumbnailCustomization.yRotDeg - e.movementX / 2.5

                const newThumbnailCustomization = thumbnailCustomization.clone()
                newThumbnailCustomization.yRotDeg = specialClamp(newYRot, -60, 60)
                setThumbnailCustomization(newThumbnailCustomization)
            }
        }

        function onWheel(e: WheelEvent) {
            if (!avatarPreview || e.target !== avatarPreview && avatarPreview.querySelector("canvas") !== e.target) return
            const newDistance = thumbnailCustomization.distanceScale + e.deltaY / 500

            const newThumbnailCustomization = thumbnailCustomization.clone()
            newThumbnailCustomization.distanceScale = specialClamp(newDistance, 0.5, 2.5)
            setThumbnailCustomization(newThumbnailCustomization)
        }

        avatarPreview.addEventListener("mousemove", onMouseMove)
        avatarPreview.addEventListener("wheel", onWheel)

        return () => {
            avatarPreview.removeEventListener("mousemove", onMouseMove)
            avatarPreview.removeEventListener("wheel", onWheel)
        }
    }, [avatarPreview, setThumbnailCustomization, thumbnailCustomization, isOpen])

    return <>
        <div className={`thumbnail-adjustment${isOpen ? " open" : ""}`} style={{top: `${top}px`}}>
            {thumbnailCustomization ? 
                <>
                    {!isAdvanced ? 
                        <SimpleAdjustment thumbnailCustomization={thumbnailCustomization} setThumbnailCustomization={setThumbnailCustomization} setIsAdvanced={setIsAdvanced} selectedType={selectedType} setSelectedType={setSelectedType}/> :
                        <AdvancedAdjustment thumbnailCustomization={thumbnailCustomization} setThumbnailCustomization={setThumbnailCustomization} setIsAdvanced={setIsAdvanced} selectedType={selectedType} setSelectedType={setSelectedType}/>
                    }
                </>
            : null}
        </div>
    </>
}
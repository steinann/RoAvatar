import { useContext, useEffect, useRef, useState } from "react"
import Icon from "./generic/icon";
import { FLAGS, generateOutfitModelThumbnail, LocalOutfit, Outfit, OutfitModel, type LocalOutfitJson } from "roavatar-renderer";
import { getSetting, setSetting } from "./generic/settings";
import { AuthContext } from "./context/auth-context";
import RadialButton from "./generic/radialButton";
import { OutfitFuncContext } from "./context/outfit-context";

export default function RecoveryOutfit(): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfitFunc = useContext(OutfitFuncContext)

    const [recoveryOutfitOpen, setRecoveryOutfitOpen] = useState(false)
    const [recoveryOutfit, setRecoveryOutfit] = useState<OutfitModel | undefined>(undefined)
    const [outfitImage, setOutfitImage] = useState<string | undefined>(undefined)

    const recoveryOutfitDialogRef = useRef<HTMLDialogElement>(null)

    //load recovery outfit
    useEffect(() => {
        if (auth) {
            getSetting("s-recovery-outfit", true).then((shouldShowRecovery) => {
                if (!shouldShowRecovery) {
                    return
                }

                getSetting("recovery-outfit", null).then((result) => {
                    if (!result) return

                    const localOutfit = new LocalOutfit(new Outfit())
                    localOutfit.fromJson(result as LocalOutfitJson)

                    localOutfit.toOutfitModel(auth).then((outfitModel) => {
                        setRecoveryOutfit(outfitModel)
                        setRecoveryOutfitOpen(true)

                        const ogTimeout = FLAGS.THUMBNAIL_TIMEOUT
                        const ogCooldown = FLAGS.LAYERED_CLOTHING_COOLDOWN
                        FLAGS.LAYERED_CLOTHING_COOLDOWN = 0
                        FLAGS.THUMBNAIL_TIMEOUT = 10
                        generateOutfitModelThumbnail(auth, outfitModel, {
                            size: [420,420], 
                            type: "webp", 
                            quality: 0.9
                        }).then((result) => {
                            FLAGS.THUMBNAIL_TIMEOUT = ogTimeout
                            FLAGS.LAYERED_CLOTHING_COOLDOWN = ogCooldown
                            setOutfitImage(result as string)
                        })
                    })
                })
            })
        }
    }, [auth])

    //update dialog
    useEffect(() => {
        if (recoveryOutfitOpen) {
            recoveryOutfitDialogRef.current?.showModal()
        } else {
            recoveryOutfitDialogRef.current?.close()
        }
    }, [recoveryOutfitOpen])

    return <>
        <dialog style={recoveryOutfitOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={recoveryOutfitDialogRef} onCancel={() => {setRecoveryOutfitOpen(false)}}>
            {/*Title and exit button*/}
            <div className="dialog-top">
                <span className="dialog-title roboto-700" style={{margin:0}}>Continue creating last outfit?</span>
                <button title="Close" style={{height: "3em"}} className="exit-button icon-button" onClick={() => {
                        setSetting("recovery-outfit", null)
                        setRecoveryOutfitOpen(false)
                    }}>
                    <Icon>close</Icon>
                </button>
            </div>
            {/*Image*/}
            <div className="dialog-line"></div>
            <div className="outfit-capture-container">
                {outfitImage ?
                <img className="outfit-capture" src={outfitImage}></img> :
                <div className="outfit-capture loading-gradient"></div>}
            </div>

            {/*Buttons*/}
            <div className="dialog-line"></div>
            <div className="dialog-actions">
                <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                    setSetting("recovery-outfit", null)
                    setRecoveryOutfitOpen(false)
                }}>Discard</RadialButton>
                <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                    setSetting("recovery-outfit", null)
                    setRecoveryOutfitOpen(false)

                    if (recoveryOutfit) {
                        outfitFunc.setOutfitModel(recoveryOutfit)
                    }
                }}>Continue</RadialButton>
            </div>
        </dialog>
    </>
}
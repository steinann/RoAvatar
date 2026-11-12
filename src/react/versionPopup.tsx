import { useEffect, useRef, useState } from "react"
import RadialButton from "./generic/radialButton"
import { getSetting, setSetting } from "./generic/settings"

//REMEMBER TO CHANGE THIS PLEASE
const IS_TESTING = false
const DEFAULT_VERSION_ID = 2 //should be the same as the current version id IN THE FUTURE
const CURRENT_VERSION_ID = 2
const VERSION_HAS_POPUP = false

let shownThisSession = false

export default function VersionPopup(): React.JSX.Element {
    const [dialogOpen, setDialogOpen] = useState(false)

    const dialogRef = useRef<HTMLDialogElement>(null)

    //update dialog
    useEffect(() => {
        if (dialogOpen) {
            dialogRef.current?.showModal()
        } else {
            dialogRef.current?.close()
        }
    }, [dialogOpen])

    //show if needed
    useEffect(() => {
        if (shownThisSession || !VERSION_HAS_POPUP) return
        shownThisSession = true

        getSetting("s-show-changelog", true).then((showChangelog) => {
            if (!showChangelog) return

            getSetting("versionPopup", DEFAULT_VERSION_ID).then((result) => {
                setSetting("versionPopup", CURRENT_VERSION_ID)

                if ((result as number) < CURRENT_VERSION_ID || IS_TESTING) {
                    setDialogOpen(true)
                }
            })
        })
    }, [])

    return <>
        {/*Popup itself*/}
        <dialog style={dialogOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={dialogRef} onCancel={() => {setDialogOpen(false)}}>
            {/*Title and exit button*/}
            <div className="dialog-top">
                <span className="dialog-title roboto-700" style={{margin:0}}>New in v1.6.0</span>
                <button style={{height: "3em"}} className="exit-button icon-button" onClick={() => {setDialogOpen(false)}}>
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <div className="dialog-line"></div>
            <span className="dialog-text-subtitle dialog-text-margin roboto-600">- Added "Screenshot Mode"</span>
            <span className="dialog-text dialog-text-margin roboto-400">Pose your avatar, set the mood, and save the result! Find it inside the adjustment menu on the avatar preview.</span>
            <div className="dialog-line"></div>
            <div className="outfit-capture-container">
                <img className="outfit-capture" src="../assets/gpose_0.webp"></img>
                <img className="outfit-capture" src="../assets/gpose_1.webp"></img>
            </div>
            <div className="dialog-line"></div>
            <div className="dialog-actions">
                <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                    setSetting("s-show-changelog", false)
                    setDialogOpen(false)
                }}>Don't show again</RadialButton>
                <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                    setDialogOpen(false)
                }}>Okay</RadialButton>
            </div>
        </dialog>
    </>
}
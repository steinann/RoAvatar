import { useContext, useEffect, useRef, useState } from "react"
import { OutfitContext } from "./context/outfit-context"
import { arrayBufferToBase64 } from "../code/misc/misc"
import RadialButton from "./generic/radialButton"
import { API } from "../code/api"

export default function TryInGameButton(): React.JSX.Element {
    const outfit = useContext(OutfitContext)

    const [tryOpen, setTryOpen] = useState(false)

    const tryDialogRef = useRef<HTMLDialogElement>(null)

    //update dialog
    useEffect(() => {
        if (tryOpen) {
            tryDialogRef.current?.showModal()
        } else {
            tryDialogRef.current?.close()
        }
    }, [tryOpen])

    const outfitData = arrayBufferToBase64(outfit.toBuffer())

    return <>
        {/*Share button*/}
        <RadialButton className="basic-radial-button tryingame" onClick={() => {setTryOpen(true)}}>Try In-Game</RadialButton>

        {/*Share menu*/}
        <dialog style={tryOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={tryDialogRef} onCancel={() => {setTryOpen(false)}}>
            {/*Title and exit button*/}
            <div className="dialog-top">
                <span className="dialog-title roboto-700" style={{margin:0}}>Copy the data</span>
                <button style={{height: "3em"}} className="exit-button icon-button" onClick={() => {setTryOpen(false)}}>
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <div className="dialog-line"></div>
            <span className="dialog-text dialog-text-margin roboto-400">Paste the outfit data after joining the game</span>
            <textarea style={{marginTop: "5px"}} className="roboto-400" readOnly={true} rows={8} cols={60}
                value={
                    `${outfitData}`
                }>
            </textarea>
            <div className="dialog-line"></div>
            <RadialButton className="basic-radial-button" onClick={
                ()=>{API.Generic.JoinPlace(135979364355750)}
            }>Play</RadialButton>
        </dialog>
    </>
}
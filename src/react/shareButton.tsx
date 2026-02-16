import { useContext, useEffect, useRef, useState } from "react"
import { OutfitContext } from "./context/outfit-context"
import { arrayBufferToBase64 } from "../code/misc/misc"
import RadialButton from "./generic/radialButton"
import Icon from "./generic/icon"

export default function ShareButton(): React.JSX.Element {
    const outfit = useContext(OutfitContext)

    const [shareOpen, setShareOpen] = useState(false)

    const shareDialogRef = useRef<HTMLDialogElement>(null)

    //update dialog
    useEffect(() => {
        if (shareOpen) {
            shareDialogRef.current?.showModal()
        } else {
            shareDialogRef.current?.close()
        }
    }, [shareOpen])

    const outfitData = arrayBufferToBase64(outfit.toBuffer())

    return <>
        {/*Share button*/}
        <RadialButton className="left-top-button icon-button" title="Share" onClick={() => {setShareOpen(true)}}>
            <Icon>share</Icon>
        </RadialButton>

        {/*Share menu*/}
        <dialog style={shareOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={shareDialogRef} onCancel={() => {setShareOpen(false)}}>
            {/*Title and exit button*/}
            <div className="dialog-top">
                <span className="dialog-title roboto-700" style={{margin:0}}>Share</span>
                <button title="Close" style={{height: "3em"}} className="exit-button icon-button" onClick={() => {setShareOpen(false)}}>
                    <Icon>close</Icon>
                </button>
            </div>
            <div className="dialog-line"></div>
            <span className="dialog-text dialog-text-margin roboto-400" style={{marginTop: "5px"}}>Only people with RoAvatar can use this link</span>
            <textarea style={{marginTop: "5px"}} className="roboto-400" readOnly={true} rows={8} cols={60}
                value={
                    `https://www.roblox.com/my/avatar-plus?buffer=${outfitData}`
                }>
            </textarea>
        </dialog>
    </>
}
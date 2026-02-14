import { useContext, useEffect, useRef, useState } from "react"
import { OutfitContext } from "./context/outfit-context"
import { arrayBufferToBase64 } from "../code/misc/misc"
import RadialButton from "./generic/radialButton"

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

    //exit when click outside
    useEffect(() => {
        const mouseUpListener = (e: MouseEvent) => {
            if (!shareDialogRef.current?.contains(e.target as HTMLElement)) {
                setShareOpen(false)
            }
        }

        document.addEventListener("mouseup", mouseUpListener)
        
        return () => {
            document.removeEventListener("mouseup", mouseUpListener)
        }
    })

    const outfitData = arrayBufferToBase64(outfit.toBuffer())

    return <>
        {/*Share button*/}
        <RadialButton className="left-top-button icon-button" title="Share" onClick={() => {setShareOpen(true)}}>
            <span className="material-symbols-outlined">share</span>
        </RadialButton>

        {/*Share menu*/}
        <dialog style={shareOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={shareDialogRef} onCancel={() => {setShareOpen(false)}}>
            {/*Title and exit button*/}
            <div className="dialog-top">
                <span className="dialog-title roboto-700" style={{margin:0}}>Share</span>
                <button style={{height: "3em"}} className="exit-button icon-button" onClick={() => {setShareOpen(false)}}>
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <textarea style={{marginTop: "5px"}} className="roboto-400" readOnly={true} rows={8} cols={60}
                value={
                    `https://www.roblox.com/my/avatar-plus?buffer=${outfitData}`
                }>
            </textarea>
            <span className="dialog-text roboto-500" style={{marginTop: "5px"}}>Only people with RoAvatar can use this link</span>
        </dialog>
    </>
}
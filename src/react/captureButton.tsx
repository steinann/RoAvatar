import { useContext, useEffect, useRef, useState } from "react"
import { OutfitContext } from "./context/outfit-context"
import RadialButton from "./generic/radialButton"
import Icon from "./generic/icon"
import { API, type Outfit } from "roavatar-renderer"
import { AuthContext } from "./context/auth-context"

function downloadImage(imageUrl: string, filename: string) {
  const link = document.createElement("a")
  link.href = imageUrl
  link.download = filename

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function CaptureButton(): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    const [captureOpen, setCaptureOpen] = useState(false)
    const [outfitImageUrl, setOutfitImageUrl] = useState<string | undefined>(undefined)
    const [lastOutfit, setLastOutfit] = useState<Outfit | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)

    const captureDialogRef = useRef<HTMLDialogElement>(null)

    //update dialog
    useEffect(() => {
        if (captureOpen) {
            captureDialogRef.current?.showModal()
        } else {
            captureDialogRef.current?.close()
        }
    }, [captureOpen])

    //update image
    useEffect(() => {
        if (captureOpen && lastOutfit !== outfit && auth && !isLoading) {
            setLastOutfit(outfit)
            setOutfitImageUrl(undefined)

            setIsLoading(true)
            API.Thumbnails.RenderOutfit(auth, outfit, "720x720").then((imageUrl) => {
                if (imageUrl) {
                    setOutfitImageUrl(imageUrl.replace("Webp", "Png"))
                } else {
                    setOutfitImageUrl("../assets/broken-avatar-200px.png")
                }
            }).finally(() => {
                setIsLoading(false)
            })
        }
    }, [captureOpen, lastOutfit, auth, outfit, isLoading])

    return <>
        {/*Share button*/}
        <RadialButton className="left-top-button icon-button" title="Screenshot" onClick={() => {setCaptureOpen(true)}}>
            <Icon>photo_camera</Icon>
        </RadialButton>

        {/*Share menu*/}
        <dialog style={captureOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={captureDialogRef} onCancel={() => {setCaptureOpen(false)}}>
            {/*Title and exit button*/}
            <div className="dialog-top">
                <span className="dialog-title roboto-700" style={{margin:0}}>Screenshot</span>
                <button title="Close" style={{height: "3em"}} className="exit-button icon-button" onClick={() => {setCaptureOpen(false)}}>
                    <Icon>close</Icon>
                </button>
            </div>
            <div className="dialog-line"></div>
            <span className="dialog-text dialog-text-margin roboto-400" style={{marginTop: "5px"}}>The pose in the image reflects your thumbnail pose</span>
            <div className="dialog-line"></div>
            <div className="outfit-capture-container">
                {outfitImageUrl ?
                <img className="outfit-capture" src={outfitImageUrl}></img> :
                <div className="outfit-capture loading-gradient"></div>}
            </div>
            {outfitImageUrl ? 
            <>
                <div className="dialog-line"></div>
                <div className="dialog-actions">
                    <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                        downloadImage(outfitImageUrl, "outfit-screenshot.png")
                    }}><Icon>download</Icon>Download</RadialButton>
                </div>
            </>
            : null}
        </dialog>
    </>
}
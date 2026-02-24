import { useContext, useEffect, useRef, useState } from "react"
import RadialButton from "./generic/radialButton"
import Icon from "./generic/icon"
import { AlertContext } from "./context/alert-context"
import { RoAvatarData, RoAvatarDataError } from "../code/rblx/roavatar-data-parser"
import { API } from "../code/api"

export default function InfoButton(): React.JSX.Element {
    const alert = useContext(AlertContext)

    const [infoOpen, setInfoOpen] = useState(false)
    const [versionData, setVersionData] = useState<RoAvatarData | undefined>(undefined)
    const [latestVersion, setLatestVersion] = useState<string>("Unknown")
    const [applicableErrors, setApplicableErrors] = useState<RoAvatarDataError[]>([])

    const infoDialogRef = useRef<HTMLDialogElement>(null)

    //update dialog
    useEffect(() => {
        if (infoOpen) {
            infoDialogRef.current?.showModal()
        } else {
            infoDialogRef.current?.close()
        }
    }, [infoOpen])

    //fetch roavatar data
    useEffect(() => {
        if (!versionData) {
            API.Generic.GetRoAvatarData().then((data) => {
                if (data instanceof RoAvatarData) {
                    setVersionData(data)

                    //version data
                    const browser = API.Generic.GetBrowser()
                    if (data.versions) {
                        setLatestVersion(data.versions.getForBrowser(browser) || "Unknown")
                    }

                    //errors
                    const applicableErrors = []
                    for (const error of data.errors) {
                        if (error.shouldShow()) {
                            if (error.text && error.type !== "Bug" && alert) {
                                alert(error.text, 6000, error.type === "Warning")
                            }
                            applicableErrors.push(error)
                        }
                    }
                    setApplicableErrors(applicableErrors)
                }
            })
        }
    }, [versionData, alert])

    return <>
        {/*Info button*/}
        <RadialButton className="left-top-button icon-button" title="Info" onClick={() => {setInfoOpen(true)}}>
            <Icon>info_i</Icon>
        </RadialButton>

        {/*Share menu*/}
        <dialog style={infoOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={infoDialogRef} onCancel={() => {setInfoOpen(false)}}>
            {/*Title and exit button*/}
            <div className="dialog-top">
                <span className="dialog-title roboto-700" style={{margin:0}}>Version Info</span>
                <button title="Close" style={{height: "3em"}} className="exit-button icon-button" onClick={() => {setInfoOpen(false)}}>
                    <Icon>close</Icon>
                </button>
            </div>
            <div className="dialog-line"></div>
            <span className="dialog-text dialog-text-margin roboto-600" style={{marginTop: "5px"}}>Environment: {API.Generic.GetBrowser()}</span>
            <span className="dialog-text dialog-text-margin roboto-600" style={{marginTop: "5px"}}>Installed Version: {API.Generic.GetManifestVersion()}</span>
            <span className="dialog-text dialog-text-margin roboto-600" style={{marginTop: "5px"}}>Latest Version: {latestVersion}</span>
            <div className="dialog-line"></div>
            <span className="dialog-text dialog-text-margin roboto-600" style={{marginTop: "5px"}}>Version Issues:</span>
            {applicableErrors.map((error) => {
                return <span className="dialog-text dialog-text-margin roboto-400" style={{marginTop: "5px"}}>{error.text}</span>
            })}
            {applicableErrors.length === 0 ? <span className="dialog-text dialog-text-margin roboto-400" style={{marginTop: "5px"}}>None</span> : null}
        </dialog>
    </>
}
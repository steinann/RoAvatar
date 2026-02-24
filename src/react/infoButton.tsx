import { useContext, useEffect, useRef, useState } from "react"
import RadialButton from "./generic/radialButton"
import Icon from "./generic/icon"
import { AlertContext } from "./context/alert-context"
import { RoAvatarData, RoAvatarDataError, versionToNumber } from "../code/rblx/roavatar-data-parser"
import { API } from "../code/api"

export default function InfoButton(): React.JSX.Element {
    const alert = useContext(AlertContext)

    const [infoOpen, setInfoOpen] = useState(false)
    const [versionData, setVersionData] = useState<RoAvatarData | undefined>(undefined)
    const [latestVersion, setLatestVersion] = useState<string>("Unknown")
    const [applicableErrors, setApplicableErrors] = useState<RoAvatarDataError[]>([])
    const [outdatedType, setOutdatedType] = useState<undefined | "warning" | "error">(undefined)

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
                        const latestVersion = data.versions.getForBrowser(browser) || "Unknown"
                        setLatestVersion(latestVersion)
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

                    //outdated
                    let outdatedType: undefined | "warning" | "error" = undefined

                    if (data.versions) {
                        const latestVersion = data.versions.getForBrowser(browser) || "0.0.0"
                        if (versionToNumber(latestVersion) > versionToNumber(API.Generic.GetManifestVersion())) {
                            outdatedType = "warning"
                        }
                    }

                    if (data.criticalOutdated) {
                        if (versionToNumber(data.criticalOutdated.getForBrowser(browser) || "0.0.0") >= versionToNumber(API.Generic.GetManifestVersion())) {
                            outdatedType = "error"
                        }
                    }

                    setOutdatedType(outdatedType)
                }
            })
        }
    }, [versionData, alert])

    const versionStyleToUse: React.CSSProperties = {}

    if (outdatedType === "error") {
        versionStyleToUse.color = "rgb(212, 35, 59)"
    } else if (outdatedType === "warning") {
        versionStyleToUse.color = "rgb(230, 212, 59)"
    }

    return <>
        {/*Info button*/}
        <RadialButton className="left-top-button icon-button" title="Info" onClick={() => {setInfoOpen(true)}}>
            {outdatedType === "error" ? <div className="left-top-button-error"></div> : null}
            <Icon style={{zIndex: 1}}>info_i</Icon>
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
            {outdatedType === "error" ? <span className="dialog-text dialog-text-margin roboto-600" style={{marginTop: "5px", color: "rgb(212, 35, 59)"}}>
                Your version is critically outdated, check version issues for details
                </span> : null}
            {outdatedType === "warning" ? <span className="dialog-text dialog-text-margin roboto-600" style={{marginTop: "5px", color: "rgb(230, 212, 59)"}}>
                Your version is outdated
                </span> : null}
            <span className="dialog-text dialog-text-margin roboto-600" style={{marginTop: "5px"}}>Environment: {API.Generic.GetBrowser()}</span>
            <span className="dialog-text dialog-text-margin roboto-600" style={{marginTop: "5px"}}>Installed Version: <span style={versionStyleToUse}>{API.Generic.GetManifestVersion()}</span></span>
            <span className="dialog-text dialog-text-margin roboto-600" style={{marginTop: "5px"}}>Latest Version: {latestVersion}</span>
            <div className="dialog-line"></div>
            <span className="dialog-text dialog-text-margin roboto-600" style={{marginTop: "5px"}}>Version Issues:</span>
            {applicableErrors.map((error) => {
                const styleToUse: React.CSSProperties = {marginTop: "5px"}
                if (error.color) {
                    styleToUse.color = error.color
                }

                return <span className="dialog-text dialog-text-margin roboto-400" style={styleToUse}>{error.text}</span>
            })}
            {applicableErrors.length === 0 ? <span className="dialog-text dialog-text-margin roboto-400" style={{marginTop: "5px"}}>None</span> : null}
        </dialog>
    </>
}
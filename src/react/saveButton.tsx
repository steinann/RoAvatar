import { useContext, useEffect, useState } from "react"
import { OutfitContext } from "./context/outfit-context"
import { API } from "../code/api"
import { AuthContext } from "./context/auth-context"
import RadialButton from "./generic/radialButton"
import { AlertContext } from "./context/alert-context"

let lastHistoryIndex: number | undefined = undefined

export default function SaveButton({forceOn, historyIndex, historyLength}: {forceOn: boolean, historyIndex: number, historyLength: number}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    const alert = useContext(AlertContext)

    const [lastSaveIndex, setLastSaveIndex] = useState(0)
    const [justSaved, setJustSaved] = useState(false)

    if (!lastHistoryIndex) {
        lastHistoryIndex = historyIndex
    }

    const validationIssues = outfit.getValidationIssues()
    const hasIssue = validationIssues.length > 0

    useEffect(() => {
        if (historyLength <= lastSaveIndex && historyLength > 0) {
            setLastSaveIndex(-1)
        }
    }, [historyLength, lastSaveIndex])

    useEffect(() => {
        if (historyIndex !== lastHistoryIndex) {
            lastHistoryIndex = historyIndex
            setJustSaved(false)
        }
    }, [historyIndex, setJustSaved])

    const buttonEnabled = (lastSaveIndex !== historyIndex || (forceOn && !justSaved)) && !hasIssue

    //TODO: compare the current outfit with the last saved one
    return <RadialButton effectDisabled={!buttonEnabled} className={`save-button roboto-600${!buttonEnabled ? " save-button-inactive" : ""}`} onClick={() => {
        if (auth && buttonEnabled) {
            //if you redraw a thumbnail right before updating the avatar the thumbnail might end up becoming the old avatar instead of the new one (kinda cool), happens more frequently if the old one takes long to render
            //API.Avatar.RedrawThumbnail(auth)
            API.Avatar.WearOutfit(auth, outfit, false).then(result => {
                console.log(result)
                if (result[0]) {
                    setLastSaveIndex(historyIndex)
                    if (result[1] && alert) {
                        alert("Some items were removed, due to not being owned", 3000, true)
                    }
                    setJustSaved(true)
                } else if (alert) {
                    alert("Failed to save outfit", 3000, false)
                }
            })
        }
    }}>
        <span className="save-button-text">
            Save
        </span>
        {hasIssue ? <span style={{position: "absolute", right: "15px"}} className="material-symbols-outlined" title={validationIssues[0].text}>error</span> : null}
    </RadialButton>
}
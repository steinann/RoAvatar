import { useContext, useEffect, useState } from "react"
import { OutfitContext } from "./context/outfit-context"
import { API } from "../code/api"
import { AuthContext } from "./context/auth-context"
import RadialButton from "./generic/radialButton"

export default function SaveButton({historyIndex,historyLength}: {historyIndex: number, historyLength: number}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    const [lastSaveIndex, setLastSaveIndex] = useState(0)

    const validationIssues = outfit.getValidationIssues()
    const hasIssue = validationIssues.length > 0

    useEffect(() => {
        if (historyLength <= lastSaveIndex && historyLength > 0) {
            setLastSaveIndex(-1)
        }
    }, [historyLength, lastSaveIndex])

    const buttonEnabled = lastSaveIndex !== historyIndex && !hasIssue

    //TODO: compare the current outfit with the last saved one
    return <RadialButton effectDisabled={!buttonEnabled} className={`save-button roboto-600${!buttonEnabled ? " save-button-inactive" : ""}`} onClick={() => {
        if (auth && buttonEnabled) {
            API.Avatar.WearOutfit(auth, outfit, false).then(result => {
                console.log(result)
                if (result) {
                    setLastSaveIndex(historyIndex)
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
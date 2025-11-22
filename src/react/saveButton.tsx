import { useContext, useEffect, useState } from "react"
import { OutfitContext } from "./context/outfit-context"
import { API } from "../code/api"
import { AuthContext } from "./context/auth-context"

export default function SaveButton({historyIndex,historyLength}: {historyIndex: number, historyLength: number}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    const [lastSaveIndex, setLastSaveIndex] = useState(0)

    useEffect(() => {
        if (historyLength <= lastSaveIndex && historyLength > 0) {
            setLastSaveIndex(-1)
        }
    }, [historyLength, lastSaveIndex])

    return <button className={`save-button roboto-600${lastSaveIndex === historyIndex ? " save-button-inactive" : ""}`} onClick={() => {
        if (auth && lastSaveIndex !== historyIndex) {
            API.Avatar.WearOutfit(auth, outfit, false).then(result => {
                console.log(result)
                if (result) {
                    setLastSaveIndex(historyIndex)
                }
            })
        }
    }}>Save</button>
}
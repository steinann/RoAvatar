import { useContext } from "react"
import { OutfitContext } from "./context/outfit-context"
import { API } from "../code/api"
import { AuthContext } from "./context/auth-context"

export default function SaveButton(): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    return <button className="save-button roboto-600" onClick={() => {
        if (auth) {
            API.Avatar.WearOutfit(auth, outfit, false)
        }
    }}>Save</button>
}
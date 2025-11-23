import { useContext } from "react"
import { OutfitContext } from "./context/outfit-context"
import SliderInput from "./sliderInput"
import { mapNum } from "../code/misc/misc"
import type { Outfit, ScaleName } from "../code/avatar/outfit"
import { AvatarType } from "../code/avatar/constant"

//TODO: Make changing scale less laggy by not requiring mesh compilation for skinnedmeshes and having a cooldown on layered clothing
function ScaleInput({outfit, setOutfit, _setOutfit, scale, scaleName, min, max}: {outfit: Outfit, setOutfit: (a: Outfit) => void, _setOutfit: (a: Outfit) => void, scale: ScaleName, scaleName: string, min: number, max: number}): React.JSX.Element {
    return <>
        <div className="scale-info">
            <span className="scale-name roboto-600">{scaleName}</span>
            <span className="scale-value roboto-600">{Math.round(outfit.scale[scale] * 100) + "%"}</span>
        </div>
        <SliderInput value={mapNum(outfit.scale[scale],min,max,0,1)} setValue={(value: number, mouseUp: boolean) => {
            const newOutfit = outfit.clone()
            newOutfit.scale[scale] = Math.round(mapNum(value,0,1,min,max) * 100) / 100
            newOutfit.scale.depth = 1 - (1 - outfit.scale.width) / 2
            if (mouseUp) {
                setOutfit(newOutfit)
            } else {
                _setOutfit(newOutfit)
            }
        }}/>
    </>
}

export default function ScaleCategory({setOutfit, _setOutfit}: {setOutfit: (a: Outfit) => void, _setOutfit: (a: Outfit) => void}): React.JSX.Element {
    //const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    return <div className="scale-category">
        <div className="scale-info">
            <span className="scale-name roboto-600">Rig</span>
        </div>
        <div className="rig-select">
            <button className={`rig-button rig-button-left roboto-600${outfit.playerAvatarType === AvatarType.R6 ? " rig-button-active" : ""}`} onClick={() => {
                const newOutfit = outfit.clone()
                newOutfit.playerAvatarType = AvatarType.R6
                setOutfit(newOutfit)
            }}>R6</button>
            <button className={`rig-button rig-button-right roboto-600${outfit.playerAvatarType === AvatarType.R15 ? " rig-button-active" : ""}`} onClick={() => {
                const newOutfit = outfit.clone()
                newOutfit.playerAvatarType = AvatarType.R15
                setOutfit(newOutfit)
            }}>R15</button>
        </div>
        <ScaleInput outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit} scale="height" scaleName="Height" min={0.9} max={1.05}/>
        <ScaleInput outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit} scale="width" scaleName="Width" min={0.7} max={1}/>
        <ScaleInput outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit} scale="head" scaleName="Head" min={0.95} max={1}/>
        <ScaleInput outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit} scale="bodyType" scaleName="Body Type" min={0} max={1}/>
        <ScaleInput outfit={outfit} setOutfit={setOutfit} _setOutfit={_setOutfit} scale="proportion" scaleName="Proportions" min={0} max={1}/>
    </div>
}
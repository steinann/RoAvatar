import { useContext } from "react";
import { OutfitFuncContext } from "./context/outfit-context";
import SelectInput from "./generic/selectInput";
import { AvatarType } from "roavatar-renderer";

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function AnimationPicker(): React.JSX.Element  {
    const outfitFunc = useContext(OutfitFuncContext)

    const isR6 = outfitFunc.outfitModel.outfit.playerAvatarType === AvatarType.R6
    const alternatives = isR6 ? 
        ["Idle", "Walk", "Jump", "Fall", "Climb"] : 
        ["Idle", "Walk", "Run", "Jump", "Fall", "Swim", "Climb"]
    alternatives.reverse() //i dont like the most important ones being at the top
    const fixedAnimName = capitalizeFirstLetter(outfitFunc.animName)

    return <SelectInput
    className={"animation-picker"}
    value={alternatives.includes(fixedAnimName) ? fixedAnimName : "..."}
    setValue={(v) => {outfitFunc.setAnimName(v.toLowerCase())}}
    isUp={true}
    alternatives={alternatives}/>
}
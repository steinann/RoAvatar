import type { Outfit } from "../code/avatar/outfit"
import type { SpecialInfo } from "../code/avatar/sorts"
import BodyColorCategory from "./bodyColorCategory"
import EmoteCategory from "./emoteCategory"
import ScaleCategory from "./scaleCategory"

export default function SpecialCategory({specialInfo, categoryType, setOutfit, setAnimName, _setOutfit}: {specialInfo: SpecialInfo, categoryType: string, setOutfit: (a: Outfit) => void, setAnimName: (a: string) => void, _setOutfit: (a: Outfit) => void}): React.JSX.Element {
    //Picks the category element to use based on type in SpecialInfo
    switch (specialInfo.type) {
        case "Emotes":
            return <EmoteCategory categoryType={categoryType} setOutfit={setOutfit} setAnimName={setAnimName}/>
        case "Scale":
            return <ScaleCategory setOutfit={setOutfit} _setOutfit={_setOutfit}/>
        case "Skin Color":
            return <BodyColorCategory setOutfit={setOutfit} _setOutfit={_setOutfit}/>
        default:
            return <></>
    }
}
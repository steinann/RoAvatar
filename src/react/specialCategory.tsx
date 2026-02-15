import type { Search_Payload } from "../code/api-constant"
import type { Outfit } from "../code/avatar/outfit"
import type { SpecialInfo } from "../code/avatar/sorts"
import BodyColorCategory from "./bodyColorCategory"
import EmoteCategory from "./emoteCategory"
import LocalOutfitCategory from "./localOutfitCategory"
import ScaleCategory from "./scaleCategory"

export default function SpecialCategory({specialInfo, searchData, categoryType, setOutfit, animName, setAnimName, _setOutfit}: {specialInfo: SpecialInfo, searchData: Search_Payload, categoryType: string, setOutfit: (a: Outfit) => void, animName: string, setAnimName: (a: string) => void, _setOutfit: (a: Outfit) => void}): React.JSX.Element {
    //Picks the category element to use based on type in SpecialInfo
    switch (specialInfo.type) {
        case "Emotes":
            return <EmoteCategory searchData={searchData} categoryType={categoryType} setOutfit={setOutfit} animName={animName} setAnimName={setAnimName}/>
        case "Scale":
            return <ScaleCategory setOutfit={setOutfit} _setOutfit={_setOutfit}/>
        case "Skin Color":
            return <BodyColorCategory setOutfit={setOutfit} _setOutfit={_setOutfit}/>
        case "LocalOutfits":
            return <LocalOutfitCategory searchData={searchData} setOutfit={setOutfit}/>
        default:
            return <></>
    }
}
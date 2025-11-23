import type { Outfit } from "../code/avatar/outfit"
import EmoteCategory from "./emoteCategory"
import ScaleCategory from "./scaleCategory"

export default function SpecialCategory({categoryType, subCategoryType, setOutfit, setAnimName, _setOutfit}: {categoryType: string, subCategoryType: string, setOutfit: (a: Outfit) => void, setAnimName: (a: string) => void, _setOutfit: (a: Outfit) => void}): React.JSX.Element {
    switch (subCategoryType) {
        case "Emotes":
            return <EmoteCategory categoryType={categoryType} setOutfit={setOutfit} setAnimName={setAnimName}/>
        case "Scale":
            return <ScaleCategory setOutfit={setOutfit} _setOutfit={_setOutfit}/>
        default:
            return <></>
    }
}
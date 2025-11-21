import type { Outfit } from "../code/avatar/outfit"
import EmoteCategory from "./emoteCategory"

export default function SpecialCategory({categoryType, subCategoryType, setOutfit, setAnimName}: {categoryType: string, subCategoryType: string, setOutfit: (a: Outfit) => void, setAnimName: (a: string) => void}): React.JSX.Element {
    switch (subCategoryType) {
        case "Emotes":
            return <EmoteCategory categoryType={categoryType} setOutfit={setOutfit} setAnimName={setAnimName}/>
        default:
            return <></>
    }
}
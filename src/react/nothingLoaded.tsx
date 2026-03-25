import type { Search_Payload } from "roavatar-renderer"

export default function NothingLoaded({loadedAll, itemCount, keyword, searchData, forceText}: {loadedAll: boolean, itemCount: number, searchData?: Search_Payload, keyword?: string, forceText?: string}): React.JSX.Element {
    const shouldShow = loadedAll && itemCount === 0
    
    let textToShow = keyword && keyword.length > 0 ? `No "${keyword}" items found` : "No items found"
    if (searchData) {
        if (searchData.salesTypeFilter === 2 || searchData.includeNotForSale === false || searchData.creatorName && searchData.creatorName.length > 0) {
            textToShow += " with filter"
        }
    }

    if (forceText) {
        textToShow = forceText
    }

    if (shouldShow) {
        return <>
            <div className="roboto-600 nothing-loaded">
                {textToShow}
            </div>
        </>
    } else {
        return <></>
    }
}
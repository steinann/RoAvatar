export default function NothingLoaded({loadedAll, itemCount, keyword}: {loadedAll: boolean, itemCount: number, keyword?: string}): React.JSX.Element {
    const shouldShow = loadedAll && itemCount === 0
    
    if (shouldShow) {
        return <>
            <div className="roboto-600 nothing-loaded">
                {keyword && keyword.length > 0 ? `No "${keyword}" items found` : "No items found"}
            </div>
        </>
    } else {
        return <></>
    }
}
import { useContext, useEffect, useRef, useState } from "react"
import { AuthContext } from "./context/auth-context"
import { OutfitContext } from "./context/outfit-context"
import { Outfit } from "../code/avatar/outfit"
import { API, Authentication } from "../code/api"
import ItemCard from "./itemCard"
import { AssetTypes, CatalogBundleTypes, ItemInfo } from "../code/avatar/asset"
import { defaultOnClick } from "./categoryShared"
import type { Search_Payload } from "../code/api-constant"
let lastLoadId = 0
let lastSearchData: Search_Payload | undefined = undefined
function useMarketplaceItems(auth: Authentication | undefined, searchData: Search_Payload) {
    const [nextPageToken, setNextPageToken] = useState<string | null | undefined>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [items, setItems] = useState<AvatarInventoryItem[]>([])

    const refresh = () => {
        setItems([])
        setNextPageToken("")
        setIsLoading(false)
        lastLoadId++
    }

    //refresh if searchData has changed
    useEffect(() => {
        if (searchData.taxonomy !== lastSearchData?.taxonomy ||
            searchData.salesTypeFilter !== lastSearchData.salesTypeFilter ||
            searchData.categoryFilter !== lastSearchData.categoryFilter ||
            searchData.sortType !== lastSearchData.sortType ||
            searchData.keyword !== lastSearchData.keyword ||
            searchData.topics?.length !== lastSearchData.topics?.length || //is this okay?
            searchData.creatorName !== lastSearchData.creatorName ||
            searchData.minPrice !== lastSearchData.minPrice ||
            searchData.maxPrice !== lastSearchData.maxPrice ||
            searchData.includeNotForSale !== lastSearchData.includeNotForSale ||
            searchData.limit !== lastSearchData.limit
        ) {
            lastSearchData = searchData
            refresh()
        }
    }, [searchData])

    const loadMore = () => {
        if (!auth || isLoading) return

        lastLoadId++
        const loadId = lastLoadId

        if (nextPageToken !== null && nextPageToken !== undefined) {
            setIsLoading(true)
            API.Catalog.Search(auth, searchData, nextPageToken).then(response => {
                if (loadId !== lastLoadId) return
                if (!(response instanceof Response)) {
                    if (loadId !== lastLoadId) return
                    //update page token
                    const pageToken = response.nextPageCursor
                    if (pageToken && pageToken.length > 0) {
                        setNextPageToken(pageToken)
                    } else {
                        setNextPageToken(null)
                    }

                    //add all new items to the items list
                    const newItems: AvatarInventoryItem[] = []
                    for (const item of response.data) {
                        //price
                        let itemPrice = undefined
                        if (!item.isOffSale && !item.hasResellers) {
                            itemPrice = item.price
                        } else if (item.hasResellers) {
                            itemPrice = item.lowestResalePrice
                        }

                        //limitedType
                        let limitedType: undefined | "Limited" | "LimitedUnique" = undefined
                        if (item.itemRestrictions.includes("Limited")) {
                            limitedType = "Limited"
                        } else if (item.itemRestrictions.includes("LimitedUnique")) {
                            limitedType = "LimitedUnique"
                        } else if (item.itemRestrictions.includes("Collectible")) {
                            limitedType = "LimitedUnique"
                        }

                        //push item data
                        newItems.push({
                            itemName: item.name,
                            itemId: item.id,
                            itemCategory: {
                                itemType: item.itemType === "Asset" ? 1 : 0,
                                itemSubType: (item.itemType === "Asset" ? item.assetType : item.bundleType) || 0
                            },
                            price: itemPrice,
                            limitedType: limitedType,
                        })
                    }
                    
                    setItems(prev => [...prev, ...newItems])
                }
                setIsLoading(false)
            })
        }
    }

    const hasLoadedAll = nextPageToken === null || nextPageToken === undefined

    return {items, isLoading, loadMore, hasLoadedAll, refresh }
}

type AvatarInventoryItem = {
    itemName: string,
    itemId: number,
    itemCategory: {itemType: number, itemSubType: number},
    price?: number,
    limitedType?: "Limited" | "LimitedUnique",
}

export default function MarketplaceCategory({children, searchData, setOutfit, setAnimName, onClickItem, wornItems = [], setAlertText, setAlertEnabled}: React.PropsWithChildren & {searchData: Search_Payload, setOutfit: (a: Outfit) => void, setAnimName: (a: string) => void, onClickItem?: (a: Authentication, b: ItemInfo) => void, wornItems?: number[], setAlertText?: (a: string) => void, setAlertEnabled?: (a: boolean) => void}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    const scrollDivRef: React.RefObject<HTMLDivElement | null> = useRef(null)

    const {items, isLoading, loadMore, hasLoadedAll, refresh } = useMarketplaceItems(auth, searchData)

    //scroll to start when searchData changes
    useEffect(() => {
        if (scrollDivRef.current) {
            scrollDivRef.current.scrollTo(0,0)
        }
    }, [searchData])

    //load more if nothing has been loaded yet
    useEffect(() => {
        if (!hasLoadedAll && items.length <= 0) {
            loadMore()
        } else {
            //in case the amount of items isnt enough to add a scrollbar but there is still another page
            onScroll()
        }
    })

    //check if it should load more on scroll
    function onScroll() {
        if (scrollDivRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollDivRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                loadMore()
            }
        }
    }

    //create item infos based on response
    const itemInfos: ItemInfo[] = []
    for (const item of items) {
        const itemType = item.itemCategory.itemType === 1 ? "Asset" : "Bundle"
        let itemSubType: string = "undefined"
        if (itemType === "Asset") {
            itemSubType = AssetTypes[item.itemCategory.itemSubType]
        } else if (itemType === "Bundle") {
            itemSubType = CatalogBundleTypes[item.itemCategory.itemSubType]
        }

        const itemInfo = new ItemInfo(itemType, itemSubType, item.itemId, item.itemName)
        itemInfo.price = item.price
        itemInfo.limitedType = item.limitedType

        itemInfos.push(itemInfo)
    }

    //determine on click function for itemcards
    const onClickFunc = onClickItem

    //create item cards
    let itemComponents = null

    if (auth && itemInfos.length > 0) {
        let i = 0;
        itemComponents = <>
        {
            itemInfos.map((item) => (
                <ItemCard showViewButton={true} setAlertText={setAlertText} setAlertEnabled={setAlertEnabled} key={i++} auth={auth} itemInfo={item} refresh={refresh} isWorn={item.itemType === "Asset" ? outfit.containsAsset(item.id) || wornItems.includes(item.id) : false} onClick={(item) => {
                    if (onClickFunc) {
                        onClickFunc(auth, item)
                    } else {
                        defaultOnClick(auth, item, outfit, setAnimName, setOutfit)
                    }
                }}/>
            ))
        }</>
    } else if (!hasLoadedAll) { //fake items while loading
        itemComponents = <>{
            new Array(20).fill(0).map(() => (
                <ItemCard/>
            ))
        }</>
    }

    return (
    <div className="container">
        <div ref={scrollDivRef} onScroll={onScroll} className="item-container dark-scrollbar">
            {children}
            {itemComponents}
            { isLoading ? (new Array(20).fill(0).map(() => (
                <ItemCard/>
            ))) : null}
            {/*isLoading ? (<div className="item" style={fakeLoaderImageStyle}><span className="loader"></span></div>) : null*/}
        </div>
        
    </div>
    )
}
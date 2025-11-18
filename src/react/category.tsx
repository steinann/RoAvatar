import { useContext, useEffect, useRef, useState } from "react"
import { AuthContext } from "./context/auth-context"
import { OutfitContext } from "./context/outfit-context"
import { Outfit } from "../code/avatar/outfit"
import { API, Authentication } from "../code/api"
import ItemCard from "./itemCard"
import { AssetTypes, BundleTypes, ItemInfo } from "../code/avatar/asset"

let lastCategory = ""
let lastLoadId = 0
function useItems(auth: Authentication | undefined, category: string) {
    const [nextPageToken, setNextPageToken] = useState<string | null | undefined>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [items, setItems] = useState<AvatarInventoryItem[]>([])

    useEffect(() => {
        if (category !== lastCategory) {
            lastCategory = category
            setItems([])
            setNextPageToken("")
            setIsLoading(false)
            lastLoadId++
        }
    }, [category])

    const loadMore = () => {
        if (!auth || isLoading) return

        lastLoadId++
        const loadId = lastLoadId

        if (nextPageToken !== null && nextPageToken !== undefined) {
            setIsLoading(true)
            console.log("starting items", loadId, nextPageToken)
            API.Avatar.GetAvatarInventory(auth, category, nextPageToken).then(response => {
                if (loadId !== lastLoadId) return
                if (response.status === 200) {
                    response.json().then(body => {
                        //console.log(body)
                        const pageToken = body.nextPageToken
                        if (pageToken && pageToken.length > 0) {
                            setNextPageToken(pageToken)
                        } else {
                            setNextPageToken(null)
                        }

                        console.log("setting items", loadId)
                        if (nextPageToken !== null) {
                            console.log(nextPageToken)
                        } else {
                            console.log("null")
                        }
                        const newItems = body.avatarInventoryItems
                        setItems(prev => [...prev, ...newItems])
                    }).finally(() => {
                        setIsLoading(false)
                    })
                } else {
                    setIsLoading(false)
                }
            })
        }
    }

    const hasLoadedAll = nextPageToken === null || nextPageToken === undefined

    return {items, isLoading, loadMore, hasLoadedAll }
}

type AvatarInventoryItem = {
    itemName: string,
    itemId: number,
    itemCategory: {itemType: number, itemSubType: number},
}

export default function ItemCategory({categoryType, setOutfit}: {categoryType: string, setOutfit: (a: Outfit) => void}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    const scrollDivRef: React.RefObject<HTMLDivElement | null> = useRef(null)

    const {items, isLoading, loadMore, hasLoadedAll } = useItems(auth, categoryType === "Recent" ? "recentAdded":"2")

    useEffect(() => {
        if (scrollDivRef.current) {
            scrollDivRef.current.scrollTo(0,0)
        }
    }, [categoryType])

    useEffect(() => {
        if (!hasLoadedAll) {
            loadMore()
        }
    })

    function onScroll() {
        if (scrollDivRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollDivRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 150) {
                loadMore()
            }
        }
    }

    const itemInfos: ItemInfo[] = []
    for (const item of items) {
        const itemType = item.itemCategory.itemType === 1 ? "Asset" : "Bundle"
        let itemSubType: string = "undefined"
        if (itemType === "Asset") {
            itemSubType = AssetTypes[item.itemCategory.itemSubType]
        } else if (itemType === "Bundle") {
            itemSubType = BundleTypes[item.itemCategory.itemSubType]
        }

        
        itemInfos.push(new ItemInfo(itemType, itemSubType, item.itemId, item.itemName))
    }

    let itemComponents = null

    if (auth && itemInfos.length > 0) {
        itemComponents = <>{
            itemInfos.map((item) => (
                <ItemCard auth={auth} itemInfo={item} onClick={() => {
                    if (item.itemType === "Asset") {
                        const newOutfit = outfit.clone(); 
                        newOutfit.addAsset(item.id, item.type, item.name);
                        setOutfit(newOutfit)
                    }
                }}/>
            ))
        }</>
    } else if (!hasLoadedAll) {
        itemComponents = <>{
            new Array(20).fill(0).map(() => (
                <ItemCard/>
            ))
        }</>
    }
    /*const fakeLoaderImageStyle = {
        alignItems: "center",
        justifyContent: "center",
        height: "150px",
        cursor: "initial",
    }*/

    return (
    <div className="container">
        <div ref={scrollDivRef} onScroll={onScroll} className="item-container dark-scrollbar">
            {itemComponents}
            { isLoading ? (new Array(20).fill(0).map(() => (
                <ItemCard/>
            ))) : null}
            {/*isLoading ? (<div className="item" style={fakeLoaderImageStyle}><span className="loader"></span></div>) : null*/}
        </div>
        
    </div>
    )
}
import { useContext, useEffect, useRef, useState } from "react"
import { AuthContext } from "./context/auth-context"
import { OutfitContext } from "./context/outfit-context"
import { Outfit } from "../code/avatar/outfit"
import { API, Authentication } from "../code/api"
import ItemCard from "./itemCard"
import { AssetTypes, BundleTypes, ItemInfo } from "../code/avatar/asset"
import { CategoryDictionary, SpecialInfo } from "../code/avatar/sorts"
import RadialButton from "./generic/radialButton"
import { defaultOnClick } from "./categoryShared"
import type { Inventory_Result, ItemDetails_Result, Search_Payload } from "../code/api-constant"
import NothingLoaded from "./nothingLoaded"
import { AlertContext } from "./context/alert-context"

type ItemList = {itemType: "Asset" | "Bundle", id: number}[]
async function getItemDetailsIfNeeded(auth: Authentication, items: ItemList, searchData: Search_Payload): Promise<undefined | Response | ItemDetails_Result> {
    const isNeeded = searchData.includeNotForSale === false ||
    searchData.salesTypeFilter === 2 ||
    searchData.creatorName && searchData.creatorName.length > 0 ||
    searchData.minPrice !== undefined ||
    searchData.maxPrice !== undefined

    if (isNeeded) {
        return await API.Catalog.GetItemDetails(auth, items)
    }

    return undefined
}

function itemPassesFilter(item: ItemDetails_Result["data"][0], searchData: Search_Payload): boolean {
    return !!(
        (!item.isOffSale || searchData.includeNotForSale) &&
        ((item.itemRestrictions.includes("Limited") || item.itemRestrictions.includes("LimitedUnique")) || searchData.salesTypeFilter !== 2) &&
        (!searchData.creatorName || searchData.creatorName.length < 0 || item.creatorName.toLowerCase() === searchData.creatorName.toLowerCase()) &&
        (searchData.minPrice == undefined || item.lowestPrice && item.lowestPrice >= searchData.minPrice) &&
        (searchData.maxPrice == undefined || item.lowestPrice && item.lowestPrice <= searchData.maxPrice)
    )
}

let lastCategory = ""
let lastSubCategory = ""
let lastLoadId = 0
let lastSearchData: Search_Payload | undefined = undefined
let lastDetailsRateLimit = 0
function useItems(auth: Authentication | undefined, category: string, subCategory: string, searchData: Search_Payload) {
    const [nextPageToken, setNextPageToken] = useState<string | null | undefined>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [items, setItems] = useState<AvatarInventoryItem[]>([])

    const itemsInIds = items.map((a) => {return a.itemCategory.itemType.toString() + "_" + a.itemId.toString()})

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

    useEffect(() => {
        if (category !== lastCategory || subCategory !== lastSubCategory) {
            lastCategory = category
            lastSubCategory = subCategory
            refresh()
        }
    }, [category, subCategory])

    const sortInfo = CategoryDictionary.Inventory[category][subCategory]
    if (sortInfo instanceof SpecialInfo) {
        throw new Error("ItemCategory does not support special sort types")
    }

    const sortOption = sortInfo.sortOption
    const itemInfos = sortInfo.itemCategories

    const loadMore = (force: boolean = false) => {
        if (!auth || (isLoading && !force)) return

        lastLoadId++
        const loadId = lastLoadId

        if (nextPageToken !== null && nextPageToken !== undefined) {
            setIsLoading(true)
            if (sortOption !== "inventory") {
                API.Avatar.GetAvatarInventory(sortOption, nextPageToken, itemInfos).then(body => {
                    if (loadId !== lastLoadId) return
                    if (!(body instanceof Response)) {
                        if (Date.now() / 1000 - lastDetailsRateLimit < 2) {
                            //setIsLoading(false)
                            setTimeout(loadMore, 2000, true)
                            return
                        }
                        //console.log(body)
                        
                        getItemDetailsIfNeeded(auth, body.avatarInventoryItems.map((a) => {
                            return {itemType: a.itemCategory.itemType === 1 ? "Asset" : "Bundle", id: a.itemId}
                        }), searchData).then((itemDetails) => {
                            //prevent too much spam
                            if (loadId !== lastLoadId) return
                            if (itemDetails instanceof Response) {
                                lastDetailsRateLimit = Date.now() / 1000
                                setIsLoading(false)
                                return
                            }

                            //update page token
                            const pageToken = body.nextPageToken
                            if (pageToken && pageToken.length > 0) {
                                setNextPageToken(pageToken)
                            } else {
                                setNextPageToken(null)
                            }

                            const newItems: AvatarInventoryItem[] = []
                            for (const item of body.avatarInventoryItems) {
                                const itemType = item.itemCategory.itemType === 1 ? "Asset" : "Bundle"

                                if (itemDetails && itemType == "Bundle") continue

                                //check if item passes filter
                                let passedFilter = true
                                if (itemDetails) {
                                    const itemDetail = itemDetails.data.find((a) => {return a.id === item.itemId && a.itemType === itemType})

                                    if (itemDetail) {
                                        if (itemDetail.itemRestrictions.includes("Limited")) {
                                            (item as AvatarInventoryItem).limitedType = "Limited";
                                        }
                                        if (itemDetail.itemRestrictions.includes("LimitedUnique")) {
                                            (item as AvatarInventoryItem).limitedType = "LimitedUnique";
                                        }
                                        passedFilter = itemPassesFilter(itemDetail, searchData)
                                    }
                                }

                                const passedSearch = !searchData.keyword || item.itemName.toLowerCase().includes(searchData.keyword.toLowerCase())

                                //check that item hasnt already been added
                                const selfItemId = item.itemCategory.itemType.toString() + "_" + item.itemId.toString()
                                const alreadyAdded = itemsInIds.includes(selfItemId)

                                if (passedSearch && passedFilter && !alreadyAdded) {
                                    newItems.push(item)
                                }
                            }
                            setItems(prev => [...prev, ...newItems])
                        }).finally(() => {
                            setIsLoading(false)
                        })
                    } else {
                        setIsLoading(false)
                    }
                })
            } else {
                auth.getUserInfo().then(userInfo => {
                    if (!userInfo) {
                        return
                    }

                    API.Inventory.GetInventory(userInfo.id, itemInfos[0].subType, nextPageToken).then(response => {
                        if (loadId !== lastLoadId) return
                        if (response.status === 200) {
                            response.json().then((body: Inventory_Result) => {
                                if (loadId !== lastLoadId) return

                                const pageToken = body.nextPageCursor
                                if (pageToken && pageToken.length > 0) {
                                    setNextPageToken(pageToken)
                                } else {
                                    setNextPageToken(null)
                                }

                                const newItems: AvatarInventoryItem[] = []
                                for (const asset of body.data) {
                                    if (!searchData.keyword || asset.assetName.toLowerCase().includes(searchData.keyword.toLowerCase())) {
                                        newItems.push({
                                            itemCategory: {itemType: 1, itemSubType: itemInfos[0].subType},
                                            itemId: asset.assetId,
                                            itemName: asset.assetName,
                                        })
                                    }
                                }
                                setItems(prev => [...prev, ...newItems])
                            }).finally(() => {
                                if (loadId !== lastLoadId) return
                                setIsLoading(false)
                            })
                        } else {
                            setIsLoading(false)
                        }
                    }).finally(() => {
                        if (loadId !== lastLoadId) return
                        setIsLoading(false)
                    })
                }).finally(() => {
                    if (loadId !== lastLoadId) return
                    setIsLoading(false)
                })
            }
        }
    }

    const hasLoadedAll = nextPageToken === null || nextPageToken === undefined

    return {items, isLoading, loadMore, hasLoadedAll, refresh }
}

type AvatarInventoryItem = {
    itemName: string,
    itemId: number,
    itemCategory: {itemType: number, itemSubType: number},
    outfitDetail?: {assets: {id: number}[]},
    limitedType?: "Limited" | "LimitedUnique",
}

export default function ItemCategory({children, searchData, categoryType, subCategoryType, setOutfit, animName, setAnimName, onClickItem, wornItems = []}: React.PropsWithChildren & {searchData: Search_Payload, categoryType: string, subCategoryType: string, setOutfit: (a: Outfit) => void, animName: string, setAnimName: (a: string) => void, onClickItem?: (a: Authentication, b: ItemInfo) => void, wornItems?: number[]}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    const alert = useContext(AlertContext)

    const outfitNameInputRef: React.RefObject<HTMLInputElement | null> = useRef(null)
    const createOutfitDialogRef: React.RefObject<HTMLDialogElement | null> = useRef(null)
    const scrollDivRef: React.RefObject<HTMLDivElement | null> = useRef(null)

    const [outfitDialogOpen, setOutfitDialogOpen] = useState(false)

    const {items, isLoading, loadMore, hasLoadedAll, refresh } = useItems(auth, categoryType, subCategoryType, searchData)

    //manage open state of create outfit dialog
    useEffect(() => {
        if (outfitDialogOpen) {
            createOutfitDialogRef.current?.showModal()
        } else {
            createOutfitDialogRef.current?.close()
        }
    }, [outfitDialogOpen])

    //scroll to start when searchData changes
    useEffect(() => {
        if (scrollDivRef.current) {
            scrollDivRef.current.scrollTo(0,0)
        }
    }, [categoryType, subCategoryType])

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
        const itemType = item.itemCategory.itemType === 1 ? "Asset" : "Outfit"
        let itemSubType: string = "undefined"
        if (itemType === "Asset") {
            itemSubType = AssetTypes[item.itemCategory.itemSubType]
        } else if (itemType === "Outfit") {
            itemSubType = BundleTypes[item.itemCategory.itemSubType]
        }

        const itemInfo = new ItemInfo(itemType, itemSubType, item.itemId, item.itemName)
        itemInfo.limitedType = item.limitedType
        if (item.outfitDetail?.assets) {
            for (const asset of item.outfitDetail.assets) {
                itemInfo.bundledAssets.push(asset.id)
            }
        }

        itemInfos.push(itemInfo)
    }

    //determine on click function for itemcards
    const onClickFunc = onClickItem

    //create item cards
    let itemComponents = null

    const isOutfits = categoryType === "Avatars" && subCategoryType === "Creations"

    if (auth && itemInfos.length > 0 || hasLoadedAll && auth) {
        let i = 0;
        itemComponents = <>
        {/*CREATE OUTFIT DIALOG */
        isOutfits ?
        <>
            <dialog style={outfitDialogOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={createOutfitDialogRef} onCancel={() => {setOutfitDialogOpen(false)}}>
                <span className="dialog-title roboto-700">Create New Character</span>
                <div className="dialog-line"></div>
                <span className="dialog-text dialog-text-margin roboto-400">A saved character will be created from your current appearance</span>
                <input ref={outfitNameInputRef} className="dialog-text-input roboto-400" placeholder="Name"></input>
                <div className="dialog-line"></div>
                <div className="dialog-actions">
                    <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                        setOutfitDialogOpen(false)
                    }}>Cancel</RadialButton>
                    <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                        setOutfitDialogOpen(false)

                        const nameValue = outfitNameInputRef.current?.value || ""

                        const toSaveOutfit = outfit.clone()
                        if (nameValue.length > 0) {
                            toSaveOutfit.name = nameValue
                        } else {
                            toSaveOutfit.name = "Untitled Avatar"
                        }

                        API.Avatar.SaveOutfit(auth, toSaveOutfit).then((result) => {
                        if (result.status === 200) {
                            refresh()
                        } else {
                            if (alert) {
                                alert("Failed to save outfit, if you're missing items try saving to Local instead", 4000, false)
                            }
                        }
                })
                    }}>Create</RadialButton>
                </div>
            </dialog>
            <ItemCard key={i++} auth={auth} forceImage="../assets/newnewoutfit.png" imageAffectedByTheme={true} itemInfo={new ItemInfo("None", "", -1, "Create")} buttonClassName="item-template-button" onClick={() => {
                setOutfitDialogOpen(true)
            }}/>
        </> : null}
        {
            itemInfos.map((item) => (
                <ItemCard key={i++} auth={auth} itemInfo={item} refresh={refresh} canEditOutfit={isOutfits} isWorn={item.itemType === "Asset" ? outfit.containsAsset(item.id) || wornItems.includes(item.id) : false} onClick={(item) => {
                    if (onClickFunc) {
                        onClickFunc(auth, item)
                    } else {
                        defaultOnClick(item, outfit, setAnimName, setOutfit, animName)
                    }
                }}/>
            ))
        }
        <NothingLoaded loadedAll={hasLoadedAll} itemCount={itemInfos.length} keyword={searchData.keyword} searchData={searchData}/>
        </>
    } else if (!hasLoadedAll) { //fake items while loading
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
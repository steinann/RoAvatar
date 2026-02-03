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

let lastCategory = ""
let lastSubCategory = ""
let lastLoadId = 0
function useItems(auth: Authentication | undefined, category: string, subCategory: string) {
    const [nextPageToken, setNextPageToken] = useState<string | null | undefined>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [items, setItems] = useState<AvatarInventoryItem[]>([])

    const refresh = () => {
        setItems([])
        setNextPageToken("")
        setIsLoading(false)
        lastLoadId++
    }

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

    const loadMore = () => {
        if (!auth || isLoading) return

        lastLoadId++
        const loadId = lastLoadId

        if (nextPageToken !== null && nextPageToken !== undefined) {
            setIsLoading(true)
            if (sortOption !== "inventory") {
                API.Avatar.GetAvatarInventory(auth, sortOption, nextPageToken, itemInfos).then(response => {
                    if (loadId !== lastLoadId) return
                    if (response.status === 200) {
                        response.json().then(body => {
                            if (loadId !== lastLoadId) return
                            //console.log(body)
                            const pageToken = body.nextPageToken
                            if (pageToken && pageToken.length > 0) {
                                setNextPageToken(pageToken)
                            } else {
                                setNextPageToken(null)
                            }
                            
                            const newItems = body.avatarInventoryItems
                            setItems(prev => [...prev, ...newItems])
                        }).finally(() => {
                            if (loadId !== lastLoadId) return
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

                    API.Inventory.GetInventory(auth, userInfo.id, itemInfos[0].subType, nextPageToken).then(response => {
                        if (loadId !== lastLoadId) return
                        if (response.status === 200) {
                            response.json().then((body) => {
                                if (loadId !== lastLoadId) return

                                const pageToken = body.nextPageCursor
                                if (pageToken && pageToken.length > 0) {
                                    setNextPageToken(pageToken)
                                } else {
                                    setNextPageToken(null)
                                }

                                const newItems: AvatarInventoryItem[] = []
                                for (const asset of body.data) {
                                    newItems.push({
                                        itemCategory: {itemType: 1, itemSubType: itemInfos[0].subType},
                                        itemId: asset.assetId,
                                        itemName: asset.assetName,
                                    })
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
}

export default function ItemCategory({children, categoryType, subCategoryType, setOutfit, setAnimName, onClickItem, wornItems = [], setAlertText, setAlertEnabled}: React.PropsWithChildren & {categoryType: string, subCategoryType: string, setOutfit: (a: Outfit) => void, setAnimName: (a: string) => void, onClickItem?: (a: Authentication, b: ItemInfo) => void, wornItems?: number[], setAlertText?: (a: string) => void, setAlertEnabled?: (a: boolean) => void}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)

    const outfitNameInputRef: React.RefObject<HTMLInputElement | null> = useRef(null)
    const createOutfitDialogRef: React.RefObject<HTMLDialogElement | null> = useRef(null)
    const scrollDivRef: React.RefObject<HTMLDivElement | null> = useRef(null)

    const [outfitDialogOpen, setOutfitDialogOpen] = useState(false)

    const {items, isLoading, loadMore, hasLoadedAll, refresh } = useItems(auth, categoryType, subCategoryType)

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

        
        itemInfos.push(new ItemInfo(itemType, itemSubType, item.itemId, item.itemName))
    }

    //determine on click function for itemcards
    const onClickFunc = onClickItem

    //create item cards
    let itemComponents = null

    const isOutfits = categoryType === "Characters" && subCategoryType === "Creations"

    if (auth && itemInfos.length > 0 || hasLoadedAll && auth) {
        let i = 0;
        itemComponents = <>
        {/*CREATE OUTFIT DIALOG */
        isOutfits ?
        <>
            <dialog style={outfitDialogOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={createOutfitDialogRef} onCancel={() => {setOutfitDialogOpen(false)}}>
                <span className="dialog-title roboto-700">Create New Character</span>
                <input ref={outfitNameInputRef} className="dialog-text-input roboto-300" placeholder="Name"></input>
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
                            if (setAlertEnabled && setAlertText) {
                                setAlertText("Failed to save outfit")
                                setAlertEnabled(true)
                                setTimeout(() => {
                                    setAlertEnabled(false)
                                }, 3000)
                            }
                        }
                })
                    }}>Create</RadialButton>
                </div>
            </dialog>
            <ItemCard setAlertText={setAlertText} setAlertEnabled={setAlertEnabled} key={i++} auth={auth} forceImage="../assets/newnewoutfit.png" imageAffectedByTheme={true} itemInfo={new ItemInfo("None", "", -1, "Create")} onClick={() => {
                setOutfitDialogOpen(true)
            }}/>
        </> : null}
        {
            itemInfos.map((item) => (
                <ItemCard setAlertText={setAlertText} setAlertEnabled={setAlertEnabled} key={i++} auth={auth} itemInfo={item} refresh={refresh} canEditOutfit={isOutfits} isWorn={item.itemType === "Asset" ? outfit.containsAsset(item.id) || wornItems.includes(item.id) : false} onClick={(item) => {
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
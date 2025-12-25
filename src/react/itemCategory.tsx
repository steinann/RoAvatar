import { useContext, useEffect, useRef, useState } from "react"
import { AuthContext } from "./context/auth-context"
import { OutfitContext } from "./context/outfit-context"
import { Outfit } from "../code/avatar/outfit"
import { API, Authentication } from "../code/api"
import ItemCard from "./itemCard"
import { AssetTypes, BundleTypes, ItemInfo, ToRemoveBeforeBundleType } from "../code/avatar/asset"
import { CategoryDictionary, SpecialInfo } from "../code/avatar/sorts"
import { DefaultAnimations, type AnimationProp } from "../code/rblx/constant"
import RadialButton from "./generic/radialButton"

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

    useEffect(() => {
        if (outfitDialogOpen) {
            createOutfitDialogRef.current?.showModal()
        } else {
            createOutfitDialogRef.current?.close()
        }
    }, [outfitDialogOpen])

    useEffect(() => {
        if (scrollDivRef.current) {
            scrollDivRef.current.scrollTo(0,0)
        }
    }, [categoryType, subCategoryType])

    useEffect(() => {
        if (!hasLoadedAll && items.length <= 0) {
            loadMore()
        } else {
            //in case the amount of items isnt enough to add a scrollbar but there is still another page
            onScroll()
        }
    })

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
            itemSubType = BundleTypes[item.itemCategory.itemSubType]
        }

        
        itemInfos.push(new ItemInfo(itemType, itemSubType, item.itemId, item.itemName))
    }

    //determine on click function for itemcards
    const defaultOnClick = (auth: Authentication, item: ItemInfo) => {
        if (!outfit.containsAsset(item.id) && item.itemType === "Asset") {
            const newOutfit = outfit.clone(); 
            newOutfit.addAsset(item.id, item.type, item.name);
            if (item.type.endsWith("Animation")) {
                const entry = DefaultAnimations[item.type as AnimationProp]
                const mainName = entry[0]
                const subArr = entry[1]
                const sub0 = subArr[0]
                if (sub0) {
                    const sub0Name = sub0[0]

                    setAnimName(`${mainName}.${sub0Name}`)
                }
            } else {
                setAnimName(`idle.Animation1`)
            }
            setOutfit(newOutfit)
        } else if (item.itemType === "Asset") {
            const newOutfit = outfit.clone(); 
            newOutfit.removeAsset(item.id);
            setOutfit(newOutfit)
        } else if (item.itemType === "Bundle" && (item.type === "Outfit" || item.type === "Character")) {
            API.Avatar.GetOutfitDetails(auth, item.id, outfit.creatorId || 1).then((result) => {
                if (result instanceof Outfit) {
                    if (item.type === "Character") {
                        result.bodyColors = outfit.bodyColors.clone()
                    }

                    setOutfit(result)
                }
            })
        } else if (item.itemType === "Bundle" && (item.type === "DynamicHead" || item.type === "Shoes" || item.type === "AnimationPack")) {
            const newOutfit = outfit.clone()

            const toRemove = ToRemoveBeforeBundleType[item.type]
            for (const type of toRemove) {
                newOutfit.removeAssetType(type)
            }

            API.Avatar.GetOutfitDetails(auth, item.id, outfit.creatorId || 1).then((result) => {
                if (result instanceof Outfit) {
                    for (const asset of result.assets) {
                        newOutfit.addAsset(asset.id, asset.assetType.id, asset.name)
                    }

                    setOutfit(newOutfit)
                }
            })
        }
    }
    const onClickFunc = onClickItem || defaultOnClick

    //create item cards
    let itemComponents = null

    const isOutfits = categoryType === "Characters" && subCategoryType === "Creations"

    if (auth && itemInfos.length > 0) {
        let i = 0;
        itemComponents = <>
        {isOutfits ?
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
                            //TODO: add error
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
                    onClickFunc(auth, item)
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
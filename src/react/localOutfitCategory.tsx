import React, { useContext, useEffect, useRef, useState } from "react"
import type { Search_Payload } from "../code/api-constant";
import type { Outfit } from "../code/avatar/outfit";
import { AuthContext } from "./context/auth-context";
import { ItemInfo } from "../code/avatar/asset";
import ItemCard from "./itemCard";
import { API, type Authentication } from "../code/api";
import { LocalOutfit } from "../code/avatar/local-outfit";
import RadialButton from "./generic/radialButton";
import { OutfitContext } from "./context/outfit-context";
import { imageUrlToDataUrl } from "../code/misc/misc";
import NothingLoaded from "./nothingLoaded";

let lastLoadId = 0
let lastSearchData: Search_Payload | undefined = undefined
function useLocalOutfitItems(auth: Authentication | undefined, searchData: Search_Payload) {
    const [nextPageToken, setNextPageToken] = useState<string | null | undefined>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [items, setItems] = useState<LocalOutfit[]>([])
    const [searchedItems, setSearchedItems] = useState<LocalOutfit[]>([])

    const refresh = () => {
        setItems([])
        setSearchedItems([])
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
            API.LocalOutfit.GetLocalOutfits().then(localOutfits => {
                if (loadId !== lastLoadId) return
                setNextPageToken(null)

                const newSearchedItems: LocalOutfit[] = []
                for (const item of localOutfits) {
                    if (!searchData.keyword || item.name.toLowerCase().includes(searchData.keyword.toLowerCase())) {
                        newSearchedItems.push(item)
                    }
                }
                setItems(prev => [...prev, ...localOutfits])
                setSearchedItems(prev => [...prev, ...newSearchedItems])
            }).finally(() => {
                if (loadId !== lastLoadId) return
                setIsLoading(false)
            })
        }
    }

    const hasLoadedAll = nextPageToken === null || nextPageToken === undefined

    return {items, searchedItems, isLoading, loadMore, hasLoadedAll, refresh }
}

export default function LocalOutfitCategory({children, searchData, setOutfit, setAlertText, setAlertEnabled}: React.PropsWithChildren & {searchData: Search_Payload, setOutfit: (a: Outfit) => void, setAlertText?: (a: string) => void, setAlertEnabled?: (a: boolean) => void}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    
    const [outfitDialogOpen, setOutfitDialogOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const outfitNameInputRef: React.RefObject<HTMLInputElement | null> = useRef(null)
    const createOutfitDialogRef: React.RefObject<HTMLDialogElement | null> = useRef(null)
    const scrollDivRef: React.RefObject<HTMLDivElement | null> = useRef(null)

    const {items, searchedItems, isLoading, loadMore, hasLoadedAll, refresh } = useLocalOutfitItems(auth, searchData)

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
    for (const item of searchedItems) {
        const itemInfo = new ItemInfo("None", "LocalOutfit", items.indexOf(item), item.name)

        itemInfos.push(itemInfo)
    }

    //determine on click function for itemcards
    const onClickFunc = (_auth: Authentication, item: ItemInfo) => {
        items[item.id].toOutfit().then((newOutfit) => {
            setOutfit(newOutfit)
        })
    }

    //create item cards
    let itemComponents = null

    if ((auth && itemInfos.length > 0 || hasLoadedAll && auth) && !isSaving) {
        let i = 0;
        itemComponents = <>
        <>
            <dialog style={outfitDialogOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={createOutfitDialogRef} onCancel={() => {setOutfitDialogOpen(false)}}>
                <span className="dialog-title roboto-700">Create New Character</span>
                <div className="dialog-line"></div>
                <span className="dialog-text dialog-text-margin roboto-400">A saved character will be created locally from your current appearance</span>
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

                        if (hasLoadedAll && items.length < 250) {
                            const localOutfit = new LocalOutfit(toSaveOutfit)
                            localOutfit.date = Date.now()
                            localOutfit.name = toSaveOutfit.name
                            const newLocalOutfits = items.slice()
                            newLocalOutfits.unshift(localOutfit)

                            setIsSaving(true)

                            new Promise((resolve) => {
                                API.Thumbnails.RenderOutfit(auth, outfit).then((imageUrl) => {
                                    if (imageUrl) {
                                        imageUrlToDataUrl(imageUrl).then((result) => {
                                            localOutfit.image = result
                                            resolve(result)
                                        }, () => {
                                            resolve(undefined)
                                        })
                                    } else {
                                        resolve(undefined)
                                    }
                                }).catch(() => {
                                    resolve(undefined)
                                })
                            }).then(() => {
                                API.LocalOutfit.SetLocalOutfits(newLocalOutfits)
                                refresh()
                            }).finally(() => {
                                setIsSaving(false)
                            })
                        } else {
                            if (setAlertEnabled && setAlertText) {
                                setAlertText(items.length >= 250 ? "Too many outfits" : "Failed to save outfit")
                                setAlertEnabled(true)
                                setTimeout(() => {
                                    setAlertEnabled(false)
                                }, 3000)
                            }
                        }
                    }}>Create</RadialButton>
                </div>
            </dialog>
            <ItemCard setAlertText={setAlertText} setAlertEnabled={setAlertEnabled} key={i++} auth={auth} forceImage="../assets/newnewoutfit.png" imageAffectedByTheme={true} itemInfo={new ItemInfo("None", "", -1, "Create")} buttonClassName="item-template-button" onClick={() => {
                setOutfitDialogOpen(true)
            }}/>
        </>
        {
            itemInfos.map((item) => (
                <ItemCard isLocalOutfit={true} canEditOutfit={true} forceImage={items[item.id]?.image || "../assets/broken-avatar-200px.png"} setAlertText={setAlertText} setAlertEnabled={setAlertEnabled} key={i++} auth={auth} itemInfo={item} refresh={refresh} onClick={(item) => {
                    onClickFunc(auth, item)
                }} deleteCallback={() => {
                    //delete outfit
                    const newLocalOutfits = items.slice()
                    newLocalOutfits.splice(item.id, 1)
                    API.LocalOutfit.SetLocalOutfits(newLocalOutfits)
                    refresh()
                }} renameCallback={(newName) => {
                    //rename outfit
                    const newLocalOutfits = items.slice()
                    newLocalOutfits[item.id].name = newName
                    API.LocalOutfit.SetLocalOutfits(newLocalOutfits)
                    refresh()
                }} updateCallback={(newOutfit) => {
                    //update outfit
                    const newLocalOutfits = items.slice()
                    const localOutfit = newLocalOutfits[item.id]
                    localOutfit.update(newOutfit)

                    setIsSaving(true)

                    new Promise((resolve) => {
                        API.Thumbnails.RenderOutfit(auth, outfit).then((imageUrl) => {
                            if (imageUrl) {
                                imageUrlToDataUrl(imageUrl).then((result) => {
                                    localOutfit.image = result
                                    resolve(result)
                                }, () => {
                                    resolve(undefined)
                                })
                            } else {
                                resolve(undefined)
                            }
                        }).catch(() => {
                            resolve(undefined)
                        })
                    }).then(() => {
                        API.LocalOutfit.SetLocalOutfits(newLocalOutfits)
                        refresh()
                    }).finally(() => {
                        setIsSaving(false)
                    })
                }}/>
            ))
        }
        <NothingLoaded loadedAll={hasLoadedAll} itemCount={itemInfos.length} keyword={searchData.keyword}/>
        </>
    } else if (!hasLoadedAll || isSaving) { //fake items while loading
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
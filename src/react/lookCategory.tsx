import React, { useContext, useEffect, useRef, useState } from "react"
import type { Search_Payload, UserLooks_Result } from "../code/api-constant";
import { Outfit } from "../code/avatar/outfit";
import { AuthContext } from "./context/auth-context";
import { ItemInfo } from "../code/avatar/asset";
import ItemCard from "./itemCard";
import { API, type Authentication } from "../code/api";
import RadialButton from "./generic/radialButton";
import { OutfitContext } from "./context/outfit-context";
import NothingLoaded from "./nothingLoaded";
import { AlertContext } from "./context/alert-context";

let lastLoadId = 0
let lastSearchData: Search_Payload | undefined = undefined
function useLooks(auth: Authentication | undefined, searchData: Search_Payload, hasPremium: boolean | undefined) {
    const [nextPageToken, setNextPageToken] = useState<string | null | undefined>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [items, setItems] = useState<UserLooks_Result["data"]>([])
    const [searchedItems, setSearchedItems] = useState<UserLooks_Result["data"]>([])

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

    useEffect(() => {
        if (hasPremium === false) {
            setNextPageToken(null)
        }
    }, [hasPremium])

    const loadMore = () => {
        if (!auth || isLoading || !hasPremium) return

        lastLoadId++
        const loadId = lastLoadId

        if (nextPageToken !== null && nextPageToken !== undefined) {
            setIsLoading(true)
            API.Users.GetUserInfo().then(userInfo => {
                if (loadId !== lastLoadId) return
                if (!userInfo) {
                    setIsLoading(false)
                    return
                }

                API.Looks.GetUserLooks(userInfo.id, nextPageToken).then(looksResult => {
                    if (loadId !== lastLoadId) return
                    if (looksResult instanceof Response) {
                        setIsLoading(false)
                        return
                    }
                    
                    const pageToken = looksResult.nextCursor
                    if (pageToken && pageToken.length > 0) {
                        setNextPageToken(pageToken)
                    } else {
                        setNextPageToken(null)
                    }

                    const newSearchedItems: UserLooks_Result["data"] = []
                    for (const item of looksResult.data) {
                        if (!searchData.keyword || item.name.toLowerCase().includes(searchData.keyword.toLowerCase())) {
                            newSearchedItems.push(item)
                        }
                    }
                    setItems(prev => [...prev, ...looksResult.data])
                    setSearchedItems(prev => [...prev, ...newSearchedItems])
                }).finally(() => {
                    if (loadId !== lastLoadId) return
                    setIsLoading(false)
                })
            })
        }
    }

    const hasLoadedAll = nextPageToken === null || nextPageToken === undefined

    return {items, searchedItems, isLoading, loadMore, hasLoadedAll, refresh }
}

export default function LooksCategory({children, searchData, setOutfit}: React.PropsWithChildren & {searchData: Search_Payload, setOutfit: (a: Outfit) => void}): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfit = useContext(OutfitContext)
    const alert = useContext(AlertContext)
    
    const [outfitDialogOpen, setOutfitDialogOpen] = useState(false)
    const [hasPremium, setHasPremium] = useState<boolean | undefined>(undefined)

    const outfitDescriptionInputRef: React.RefObject<HTMLInputElement | null> = useRef(null)
    const outfitNameInputRef: React.RefObject<HTMLInputElement | null> = useRef(null)
    const createOutfitDialogRef: React.RefObject<HTMLDialogElement | null> = useRef(null)
    const scrollDivRef: React.RefObject<HTMLDivElement | null> = useRef(null)

    const {items, searchedItems, isLoading, loadMore, hasLoadedAll, refresh } = useLooks(auth, searchData, hasPremium)

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

    //check if user has premium
    useEffect(() => {
        if (hasPremium === undefined) {
            API.Users.GetUserInfo().then((userInfo) => {
                if (userInfo) {
                    API.PremiumFeatures.GetSubscription(userInfo.id).then((subscriptionResult) => {
                        if (!(subscriptionResult instanceof Response)) {
                            if (subscriptionResult.subscriptionProductModel.robuxStipendAmount >= 1000) {
                                setHasPremium(true)
                            } else {
                                setHasPremium(false)
                            }
                        }
                    })
                }
            })
            
        }
    }, [hasPremium])

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
        const itemInfo = new ItemInfo("Look", "Look", item.lookId, item.name)
        itemInfo.price = item.totalValue

        itemInfos.push(itemInfo)
    }

    //determine on click function for itemcards
    const onClickFunc = (_auth: Authentication, item: ItemInfo) => {
        const newOutfit = new Outfit()
        API.Looks.GetLook(item.id.toString()).then(lookDetails => {
            if (!(lookDetails instanceof Response)) {
                newOutfit.fromLook(lookDetails.look).then((success) => {
                    if (success) {
                        setOutfit(newOutfit)
                    } else if (alert) {
                        alert("Failed to wear Look", 3000, false)
                    }
                })
            } else if (alert) {
                alert("Failed to get Look", 3000, false)
            }
        })
    }

    //create item cards
    let itemComponents = null

    if ((auth && itemInfos.length > 0 || hasLoadedAll && auth)) {
        let i = 0;
        itemComponents = <>
        <>
            <dialog style={outfitDialogOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={createOutfitDialogRef} onCancel={() => {setOutfitDialogOpen(false)}}>
                <span className="dialog-title roboto-700">Publish Current Character</span>
                <div className="dialog-line"></div>
                <span className="dialog-text dialog-text-margin roboto-400">Your current character appearance will be published to the Marketplace</span>
                <input ref={outfitNameInputRef} className="dialog-text-input roboto-400" placeholder="Name"></input>
                <div className="dialog-line"></div>
                <input ref={outfitDescriptionInputRef} className="dialog-text-input roboto-400" placeholder="Description"></input>
                <div className="dialog-line"></div>
                <div className="dialog-actions">
                    <RadialButton className="dialog-cancel roboto-600" onClick={() => {
                        setOutfitDialogOpen(false)
                    }}>Cancel</RadialButton>
                    <RadialButton className="dialog-confirm roboto-600" onClick={() => {
                        setOutfitDialogOpen(false)

                        const nameValue = outfitNameInputRef.current?.value || ""
                        const descriptionValue = outfitDescriptionInputRef.current?.value || ""

                        const toSaveOutfit = outfit.clone()
                        if (nameValue.length > 0) {
                            toSaveOutfit.name = nameValue
                        } else {
                            toSaveOutfit.name = "Untitled Avatar"
                        }
                        
                        let description = "An avatar"

                        if (descriptionValue.length > 0) {
                            description = descriptionValue
                        }

                        API.Looks.CreateLook(auth, toSaveOutfit, toSaveOutfit.name, description).then((response) => {
                            if (response.status === 200) {
                                refresh()
                            } else if (alert) {
                                alert("Failed to publish outfit, do you own everything?", 3000, false)
                            }
                        })
                    }}>Publish</RadialButton>
                </div>
            </dialog>
            {hasPremium === true ? <ItemCard key={i++} auth={auth} forceImage="../assets/newpublish.png" imageAffectedByTheme={true} itemInfo={new ItemInfo("None", "", -1, "Publish")} buttonClassName="item-template-button" onClick={() => {
                setOutfitDialogOpen(true)
            }}/> : null}
        </>
        {
            itemInfos.map((item) => (
                <ItemCard isSpecialOutfit={true} showViewButton={true} canEditOutfit={true} key={i++} auth={auth} itemInfo={item} refresh={refresh} onClick={(item) => {
                    onClickFunc(auth, item)
                }} deleteCallback={() => {
                    //delete outfit
                    API.Looks.DeleteLook(auth, item.id.toString()).then((response) => {
                        if (response.status === 200) {
                            refresh()
                        } else if (alert) {
                            alert("Failed to delete published outfit", 3000, false)
                        }
                    })
                }}/>
            ))
        }
        <NothingLoaded loadedAll={hasLoadedAll} itemCount={itemInfos.length} keyword={searchData.keyword} searchData={searchData} forceText={
            hasPremium === false ? "Roblox only allows Premium 1000+ users to publish outfits" : undefined
        }/>
        </>
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
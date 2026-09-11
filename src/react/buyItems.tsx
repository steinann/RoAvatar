import { useContext, useEffect, useRef, useState } from "react"
import RadialButton from "./generic/radialButton"
import Icon from "./generic/icon"
import { API, Asset, ItemInfo, type UserInfo } from "roavatar-renderer"
import { Tooltip } from "react-tooltip"
import { OutfitFuncContext } from "./context/outfit-context"
import ItemCard from "./itemCard"
import { AuthContext } from "./context/auth-context"

export default function BuyItemsButton(): React.JSX.Element {
    const auth = useContext(AuthContext)
    const outfitFunc = useContext(OutfitFuncContext)

    const [cartOpen, setCartOpen] = useState(false)
    const [userInfo, setUserInfo] = useState<UserInfo | undefined>(undefined)
    const [unownedAssets, setUnownedAssets] = useState<Asset[]>([])
    const [costs, setCosts] = useState<(number | "offsale")[] | undefined>(undefined)

    const cartDialogRef = useRef<HTMLDialogElement>(null)

    const outfitModel = outfitFunc.outfitModel
    const outfit = outfitModel.outfit

    //update dialog
    useEffect(() => {
        if (cartOpen) {
            cartDialogRef.current?.showModal()
        } else {
            cartDialogRef.current?.close()
        }
    }, [cartOpen])

    //get user info
    useEffect(() => {
        let shouldCancel = false

        API.Users.GetUserInfo().then((newUserInfo) => {
            if (shouldCancel) return

            if (newUserInfo) {
                setUserInfo(newUserInfo)
            }
        })

        return () => {
            shouldCancel = true
        }
    }, [])

    //get unowned assets list
    useEffect(() => {
        if (!userInfo) return
        setUnownedAssets([])
        setCosts(undefined)

        let shouldCancel = false

        const allAssets = outfitModel.background ? [outfitModel.background, ...outfit.clone().assets] : outfit.clone().assets

        const ownedPromises: Promise<boolean | Response>[] = []

        for (const asset of allAssets) {
            ownedPromises.push(API.Inventory.IsItemOwned(userInfo.id, "Asset", asset.id))
        }

        Promise.all(ownedPromises).then((results) => {
            if (shouldCancel) return

            const unownedAssets: Asset[] = []

            for (let i = 0; i < results.length; i++) {
                const result = results[i]
                const asset = allAssets[i]

                if (!result) {
                    unownedAssets.push(asset)
                }
            }

            setUnownedAssets(unownedAssets)
            setCosts(undefined)
        })

        return () => {
            shouldCancel = true
        }
    }, [outfit, outfit.assets, outfitModel.background, userInfo])

    //get item costs
    useEffect(() => {
        if (!auth) return
        if (unownedAssets.length === 0) {
            setCosts([])
            return
        }

        let shouldCancel = false

        API.Catalog.GetItemDetails(auth, unownedAssets.map((asset) => {return {itemType: "Asset", id: asset.id}})).then((result) => {
            if (result instanceof Response || shouldCancel) return

            const totalCosts: (number | "offsale")[] = new Array(unownedAssets.length).fill("offsale")
            for (const asset of result.data) {
                const index = unownedAssets.findIndex((v) => {return v.id === asset.id})
                if (index > -1) {
                    if (asset.isOffSale) {
                        totalCosts[index] = "offsale"
                    } else {
                        totalCosts[index] = asset.lowestPrice || 0
                    }
                }
            }
            setCosts(totalCosts)
        })

        return () => {
            shouldCancel = true
        }
    }, [auth, unownedAssets.length, unownedAssets])

    let totalCost: number | undefined = undefined
    let offsaleCount: number | undefined = undefined
    if (costs) {
        offsaleCount = 0
        totalCost = 0
        for (const cost of costs) {
            if (cost !== "offsale") {
                totalCost += cost
            } else {
                offsaleCount += 1
            }
        }
    }

    const inactive = unownedAssets.length === 0

    return <>
        {/*Info button*/}
        <RadialButton className={`left-top-button icon-button${inactive ? " left-top-button-inactive":""}`}
            data-tooltip-content={`${unownedAssets.length} unowned ${unownedAssets.length === 1 ? "item" : "items"}`}
            data-tooltip-id="buy-items-button"
            onClick={inactive ? () => {} : () => {setCartOpen(true)}}
            effectDisabled={inactive}>
            <Icon>shopping_cart</Icon>
        </RadialButton>
        <Tooltip id="buy-items-button"/>

        {/*Share menu*/}
        <dialog style={cartOpen ? {opacity: 1} : {display: "none", opacity: 0}} ref={cartDialogRef} onCancel={() => {setCartOpen(false)}}>
            {/*Title and exit button*/}
            <div className="dialog-top">
                <span className="dialog-title roboto-700" style={{margin:0}}>Unowned Items</span>
                <button title="Close" style={{height: "3em"}} className="exit-button icon-button" onClick={() => {setCartOpen(false)}}>
                    <Icon>close</Icon>
                </button>
            </div>
            <div className="dialog-line"></div>
                <span className="dialog-text roboto-400">
                    {unownedAssets.length > 0 ? <>
                        {`${unownedAssets.length} ${unownedAssets.length === 1 ? "item" : "items"} | `}
                        {totalCost === 0 ?
                            "Free" 
                            : "Estimated Cost: "}
                        {totalCost === 0 ? null : <>
                            <span className="icon-robux-16x16"></span>
                            {`${totalCost ? totalCost : "?"}`}
                        </>}
                        {offsaleCount && offsaleCount > 0 ? <>
                                <span> | </span>
                                <span style={{color: "rgb(230, 212, 59)"}}>
                                {`${offsaleCount} offsale`}
                                </span>
                            </> : null}
                    </> : "All items owned"}
                </span>
            <div className="dialog-line"></div>
            <div className="buy-items-list dark-scrollbar">
                {unownedAssets.map((asset, index) => {
                    const itemInfo = new ItemInfo("Asset", asset.assetType.name, asset.id, asset.name, asset.supportsHeadShapes)
                    if (costs) {
                        const cost = costs[index]
                        if (cost === "offsale") {
                            itemInfo.offsale = true
                        } else {
                            itemInfo.price = cost
                        }
                    }

                    return <ItemCard key={asset._uuid} auth={auth} itemInfo={itemInfo} isWorn={false} forceIsWorn={true} interactive={false} showViewButton={true}/>
                })}
            </div>
            <div className="dialog-line"></div>
            <RadialButton className="basic-radial-button" onClick={() => {
                const tryingame = document.querySelector("button.tryingame") as HTMLButtonElement | undefined
                if (tryingame) {
                    tryingame.click()
                }

                setCartOpen(false)
            }}>Try & Buy In-Game</RadialButton>
        </dialog>
    </>
}
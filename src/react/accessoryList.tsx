import { ItemInfo, type Authentication } from "roavatar-renderer"
import ItemCard from "./itemCard"
import { useContext } from "react"
import { OutfitContext } from "./context/outfit-context"

export default function AccessoryList({auth, open, assets, nothingMessage, showOrderArrows, selectedAssetIds, onItemClick, onArrowClick }: {auth: Authentication, open: boolean, assets: number[], nothingMessage: string, showOrderArrows?: boolean, selectedAssetIds?: number[], onItemClick?: (a: ItemInfo) => void, onArrowClick?: (a: ItemInfo, up: boolean) => void}): React.JSX.Element {
    const outfit = useContext(OutfitContext)

    return <ul className={`accessory-select${open ? "" : " icons-collapsed"}`}>
        {/*No assets*/}
        {assets.length === 0 ? 
            <ItemCard
            auth={auth}
            key={0}
            interactive={false}
            imageAffectedByTheme={true}
            forceImage="../assets/blankline.png"
            itemInfo={
                new ItemInfo("None", "", 0, nothingMessage)
                }
            includeName={false}
            buttonClassName="item-template-button" /> : null}
        {/*Per asset*/}
        {assets.map((assetId) => {
            let asset = undefined
            for (const outfitAsset of outfit.assets) {
                if (outfitAsset.id === assetId) {
                    asset = outfitAsset
                }
            }

            if (!asset) return

            const itemInfo = new ItemInfo("Asset", asset.assetType.name, asset.id, asset.name, asset.supportsHeadShapes)

            const isSelected = selectedAssetIds && selectedAssetIds.includes(asset.id)

            return <ItemCard
                key={asset._uuid}
                showOrderArrows={showOrderArrows}
                buttonClassName={isSelected ? "adjust-asset" : undefined}
                auth={auth} includeName={false}
                itemInfo={itemInfo}
                onClick={onItemClick}
                onArrowClick={onArrowClick}/>
        })}
    </ul>
}
export type SaleLocationType = "ShopOnly" | "ShopAndAllExperiences" | string

export interface NavigationMenuItems {
    categories: {
        category: string,
        taxonomy: string,
        assetTypeIds: number[],
        bundleTypeIds: number[],
        categoryId: number,
        name: string,
        orderIndex: number,
        subcategories: {
            subcategory: string | null,
            taxonomy: string,
            assetTypeIds: number[],
            bundleTypeIds: number[],
            subcategoryId: number | null,
            name: string,
            shortName: string | null,
        }[],
        isSearchable: boolean
    }[],
    genres: {
        genre: number,
        name: string,
        isSelected: boolean,
    }[],
    sortMenu: {
        sortOptions: {
            sortType: number,
            sortOrder: number,
            name: string,
            isSelected: boolean,
            hasSubMenu: boolean,
            isPriceRelated: boolean,
        }[],
        sortAggregations: {
            sortAggregation: number,
            name: string,
            isSelected: boolean,
            hasSubMenu: boolean,
            isPriceRelated: boolean,
        }[]
    },
    creatorFilters: {
        userId: number,
        name: string,
        isSelected: boolean,
    }[],
    priceFilters: {
        currencyType: number,
        name: string,
        excludePriceSorts: boolean
    }[],
    defaultGearSubcategory: number,
    defaultCategory: number,
    defaultCategoryIdForRecommendedSearch: number,
    defaultCreator: number,
    defaultCurrency: number,
    defaultSortType: number,
    defaultSortAggregation: number,
    categoriesWithCreator: number[],
    isGenreAllowed: boolean,
    robloxUserId: number,
    robloxUserName: string,
    gearSubcategory: number,
    allCategories: number,
    freeFilter: number,
    customRobuxFilter: number,
    robuxFilter: number,
    salesTypeFilters: {
        name: string,
        filter: number,
    }[]
}

export interface GetTopics_Payload {
    items: unknown[],
    maxResult: 40,
    selectTopics: string[]
}

export interface GetTopics_Result {
    error: null | unknown,
    topics: {
        displayName: string,
        originalTopicName: string,
    }[]
}

export interface Search_Payload {
    taxonomy: string,
    salesTypeFilter: number,
    categoryFilter?: number,
    sortType?: number,
    keyword?: string,
    topics?: string[],
    creatorName?: string,
    minPrice?: number,
    maxPrice?: number,
    includeNotForSale?: boolean,
    limit?: number
}

export function cloneSearch_Payload(data: Search_Payload) {
  const newData: Search_Payload = {
    taxonomy: data.taxonomy,
    salesTypeFilter: data.salesTypeFilter,
    categoryFilter: data.categoryFilter,
    sortType: data.sortType,
    keyword: data.keyword,
    topics: undefined,
    creatorName: data.creatorName,
    minPrice: data.minPrice,
    maxPrice: data.maxPrice,
    includeNotForSale: data.includeNotForSale,
    limit: data.limit
  }

  if (data.topics) {
    newData.topics = []
    for (const topic of data.topics) {
      newData.topics.push(topic)
    }
  }

  return newData
}

export interface Search_Result {
    keyword: string | null,
    previousPageCursor: string | null,
    nextPageCursor: string | null,
    data: {
        bundledItems: {
            id: number,
            name: string,
            type: "Asset" | "UserOutfit",
        }[],
        id: number,
        itemType: "Asset" | "Bundle",
        assetType?: number,
        bundleType?: number,
        name: string,
        description: string,
        productId: number,
        itemStatus: unknown[],
        itemRestrictions: string[],
        creatorHasVerifiedBadge: boolean,
        creatorType: "User" | "Group",
        creatorTargetId: number,
        creatorName: string,
        price: number,
        lowestPrice?: number,
        lowestResalePrice: number,
        priceStatus?: "Off Sale" | string,
        unitsAvailableForConsumption: number,
        favoriteCount: number,
        offSaleDeadline: null | unknown,
        collectibleItemId: string,
        totalQuantity: number,
        saleLocationType: SaleLocationType,
        hasResellers: boolean,
        isOffSale?: boolean
    }[]
}

export interface BundleDetails_Result {
    bundleType: number,
    bundledItems: {
        id: number,
        name: string,
        owned: boolean,
        type: "Asset" | "UserOutfit"
    }[],
    collectibleItemId: string,
    creatorHasVerifiedBadge: boolean,
    creatorName: string,
    creatorTargetId: number,
    creatorType: "User" | "Group",
    description: string,
    expectedSellerId: number,
    favoriteCount: number,
    hasResellers: boolean,
    id: number,
    isPBR: boolean,
    isPurchasable: boolean,
    isRecolorable: boolean,
    itemCreatedUtc: string,
    itemRestrictions: string[],
    itemStatus: unknown[],
    itemType: "Asset" | "Bundle",
    lowestPrice: number,
    lowestResalePrice: number,
    name: string,
    offSaleDeadline: null | unknown,
    owned: boolean,
    price: number,
    productId: number,
    saleLocationType: SaleLocationType,
    totalQuantity: number,
    unitsAvailableForConsumption: number,
}

export interface ThumbnailsCustomization_Payload {
    thumbnailType: number,
    emoteAssetId: number,
    camera: {
        fieldOfViewDeg: number,
        yRotDeg: number,
        distanceScale: number,
    }
}

export interface AvatarInventory_Result {
    avatarInventoryItems: {
        itemId: number,
        itemName: string,
        itemCategory: {
            itemType: number,
            itemSubType: number,
        },
        availabilityStatus: string,
        acquisitionTime: string,
        outfitDetail?: {
            assets: {
                id: number
            }[],
            bodyColor3s: {
                headColor3: string,
                leftArmColor3: string,
                leftLegColor3: string,
                rightArmColor3: string,
                rightLegColor3: string,
                torsoColor3: string,
            },
            playerAvatarType: "R6" | "R15",
            scales: {
                bodyType: number,
                depth: number,
                head: number,
                height: number,
                proportion: number,
                width: number,
            }
        }
    }[],
    nextPageToken: string | null,
}

export interface Inventory_Result {
    data: {
        assetId: number,
        assetName: string,
        collectibleItemId: string | null,
        collectibleItemInstanceId: string | null,
        created: string,
        owner: {
            buildersClubMembershipType: string | "None",
            userId: number,
            username: string,
        },
        serialNumber: number,
        updated: string,
        userAssetId: number,
    }[],
    nextPageCursor: string | null,
    previousPageCursor: string | null,
}

export interface ItemDetail_Result {
    assetType: number,
    bundledItems: [],
    collectibleItemId: string | null,
    creatorHasVerifiedBadge: boolean,
    creatorName: string,
    creatorTargetId: number,
    creatorType: "User" | "Group",
    description: string,
    favoriteCount: number,
    id: number,
    isOffSale: boolean,
    itemRestrictions: string[],
    itemStatus: string[],
    itemType: "Asset" | "Bundle",
    lowestPrice?: number,
    name: string,
    offsaleDeadline: null,
    saleLocationType: string,
    taxonomy: {
        taxonomyId: string,
        taxonomyName: string,
    }
}

export interface ItemDetails_Result {
    data: ItemDetail_Result[]
}
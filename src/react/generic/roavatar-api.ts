import { CONFIG } from "./config"
import { Outfit, type OutfitJson } from "roavatar-renderer"

export interface AvatarListV1 {
    data: {
        id: string,
        timestamp: string,
    }[]
}

export const ROAVATAR_API = {
    users: {
        getAvatarHistory: async (userId: number) => {
            const response = await fetch(`${CONFIG.ROAVATAR_API_URL}/v1/users/${userId}/avatar-history`)
            if (response.status !== 200) return response

            const data = await response.json()
            return data as AvatarListV1
        }
    },
    avatars: {
        getAvatar: async (avatarId: string) => {
            const response = await fetch(`${CONFIG.ROAVATAR_API_URL}/v1/avatars/${avatarId}/avatar`)
            if (response.status !== 200) return response

            const data = await response.json() as OutfitJson
            const outfit = new Outfit()
            outfit.fromJson(data)

            return outfit
        },
        withAsset: async (assetId: number) => {
            const response = await fetch(`${CONFIG.ROAVATAR_API_URL}/v1/avatars/with-asset/${assetId}`)
            if (response.status !== 200) return response

            const data = await response.json()
            return data as AvatarListV1
        },
        search: async (query: string) => {
            const response = await fetch(`${CONFIG.ROAVATAR_API_URL}/v1/avatars/search/${query}`)
            if (response.status !== 200) return response

            const data = await response.json()
            return data as AvatarListV1
        }
    }
}
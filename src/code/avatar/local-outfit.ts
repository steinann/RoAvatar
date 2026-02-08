import { arrayBufferToBase64, base64ToArrayBuffer } from "../misc/misc"
import { Outfit } from "./outfit"

export interface LocalOutfitJson {
    name: string;
    id: number;
    creator: number | undefined;
    date: number;
    image: string | undefined;
    buffer: string;
}

export class LocalOutfit {
    name: string
    id: number
    creator?: number
    date: number

    image?: string

    buffer: string

    constructor(outfit: Outfit) {
        this.name = outfit.name
        this.id = outfit.id
        this.creator = outfit.creatorId
        this.date = Date.now()

        this.buffer = arrayBufferToBase64(outfit.toBuffer())
    }

    toJson(): LocalOutfitJson {
        return {
            name: this.name,
            id: this.id,
            creator: this.creator,
            date: this.date,

            image: this.image,

            buffer: this.buffer
        }
    }

    fromJson(data: LocalOutfitJson) {
        this.name = data.name
        this.id = data.id
        this.creator = data.creator

        this.image = data.image

        this.buffer = data.buffer

        return this
    }

    update(outfit: Outfit) {
        this.buffer = arrayBufferToBase64(outfit.toBuffer())
        this.image = undefined
    }

    async toOutfit(): Promise<Outfit> {
        const outfit = new Outfit()
        outfit.name = this.name
        outfit.id = this.id
        outfit.creatorId = this.creator

        await outfit.fromBuffer(base64ToArrayBuffer(this.buffer))

        return outfit
    }
}
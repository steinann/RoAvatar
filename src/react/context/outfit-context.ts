import { createContext } from 'react'
import { Outfit } from 'roavatar-renderer'

export const OutfitContext = createContext<Outfit>(new Outfit())

export class AnimLock {
    locked: boolean = false
    lockType: "time" | "keyframe" = "time"
    value: number = 0
}

export const OutfitFuncContext = createContext<{
    setOutfit: (a: Outfit) => void,
    _setOutfit: (a: Outfit) => void,
    animName: string,
    setAnimName: (a: string, force?: boolean) => void,
    setCanSetAnimName: (a: boolean) => void,
    animLock: AnimLock,
    setAnimLock: (a: AnimLock) => void,
}>({
    setOutfit: () => {},
    _setOutfit: () => {},
    animName: "",
    setAnimName: () => {},
    setCanSetAnimName: () => {},
    animLock: new AnimLock(),
    setAnimLock: () => {},
})
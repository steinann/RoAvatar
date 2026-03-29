import { createContext } from 'react'
import { Outfit } from 'roavatar-renderer'

export const OutfitContext = createContext<Outfit>(new Outfit())

export const OutfitFuncContext = createContext<{
    setOutfit: (a: Outfit) => void,
    animName: string,
    setAnimName: (a: string) => void,
}>({
    setOutfit: () => {},
    animName: "",
    setAnimName: () => {},
})
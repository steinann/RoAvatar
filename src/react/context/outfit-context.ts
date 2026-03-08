import { createContext } from 'react'
import { Outfit } from 'roavatar-renderer'

export const OutfitContext = createContext<Outfit>(new Outfit())
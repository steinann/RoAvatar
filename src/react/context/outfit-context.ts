import { createContext } from 'react'
import { Outfit } from '../../code/avatar/outfit'

export const OutfitContext = createContext<Outfit>(new Outfit())
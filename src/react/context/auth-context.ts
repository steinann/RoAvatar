import { createContext } from 'react'
import { Authentication } from 'roavatar-renderer'

export const AuthContext = createContext<Authentication | undefined>(undefined)
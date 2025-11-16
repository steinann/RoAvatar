import { createContext } from 'react'
import type { Authentication } from '../../code/api'

export const AuthContext = createContext<Authentication | undefined>(undefined)
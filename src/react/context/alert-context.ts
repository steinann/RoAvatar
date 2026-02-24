import { createContext } from 'react'

export const AlertContext = createContext<((text: string, duration: number, isWarning: boolean) => void )| undefined>(undefined)
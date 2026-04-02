import { createContext } from 'react'

export const AlertContext = createContext<((text: string, duration: number, isWarning: boolean, isSuccess?: boolean) => void )| undefined>(undefined)
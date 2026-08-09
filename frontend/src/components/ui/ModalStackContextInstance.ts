import { createContext } from 'react'

export interface ModalStackContextValue {
  register: (id: string) => void
  unregister: (id: string) => void
  stack: string[]
}

export const ModalStackContext = createContext<ModalStackContextValue | null>(null)
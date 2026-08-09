import { useCallback, useState, type ReactNode } from 'react'
import { ModalStackContext } from './ModalStackContextInstance'

export function ModalStackProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<string[]>([])

  const register = useCallback((id: string) => {
    setStack((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const unregister = useCallback((id: string) => {
    setStack((prev) => prev.filter((existing) => existing !== id))
  }, [])

  return (
    <ModalStackContext.Provider value={{ register, unregister, stack }}>
      {children}
    </ModalStackContext.Provider>
  )
}
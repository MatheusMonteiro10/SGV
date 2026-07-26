import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface ModalStackContextValue {
  register: (id: string) => void
  unregister: (id: string) => void
  stack: string[]
}

const ModalStackContext = createContext<ModalStackContextValue | null>(null)

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

export function useModalStack() {
  const context = useContext(ModalStackContext)
  if (!context) {
    throw new Error('useModalStack deve ser usado dentro de um ModalStackProvider')
  }
  return context
}
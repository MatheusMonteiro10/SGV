import { useContext } from 'react'
import { ModalStackContext } from '../components/ui/ModalStackContextInstance'

export function useModalStack() {
  const context = useContext(ModalStackContext)
  if (!context) {
    throw new Error('useModalStack deve ser usado dentro de um ModalStackProvider')
  }
  return context
}
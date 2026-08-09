import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useModalStack } from '../../hooks/useModalStack'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  closeOnBackdrop?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  size = 'md',
}: ModalProps) {
  const id = useId()
  const { register, unregister, stack } = useModalStack()

  // Entra na fila de empilhamento apenas enquanto estiver aberto.
  useEffect(() => {
    if (!isOpen) return
    register(id)
    return () => unregister(id)
  }, [isOpen, id, register, unregister])

  const index = stack.indexOf(id)
  const isTopmost = isOpen && index === stack.length - 1

  // Esc só fecha o modal do topo da pilha — um modal por baixo não deve reagir.
  useEffect(() => {
    if (!isTopmost) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTopmost, onClose])

  // Trava o scroll do body enquanto qualquer modal estiver aberto.
  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  if (!isOpen || index === -1) return null

  const zIndexBase = 100 + index * 10

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center px-4 py-8" style={{ zIndex: zIndexBase }}>
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${id}-title` : undefined}
        className={`relative flex max-h-[85vh] w-full ${SIZE_CLASSES[size]} flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl`}
        style={{ zIndex: zIndexBase + 1 }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
          {title ? (
            <h2 id={`${id}-title`} className="font-display text-lg text-ink">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-ink-soft transition hover:bg-paper-dim hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && <div className="shrink-0 border-t border-line bg-paper px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
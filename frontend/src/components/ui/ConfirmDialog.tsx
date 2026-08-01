import { Modal } from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  isConfirming?: boolean
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isConfirming = false,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!isConfirming}
    >
      <p className="text-sm text-ink-soft">{description}</p>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isConfirming}
          className="flex-1 rounded-full border border-line py-2.5 text-sm font-medium text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className={`flex-1 rounded-full py-2.5 text-sm font-medium text-paper transition disabled:cursor-not-allowed disabled:opacity-60 ${
            variant === 'danger' ? 'bg-danger hover:bg-danger/90' : 'bg-ink hover:bg-amber-dim'
          }`}
        >
          {isConfirming ? 'Aguarde...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
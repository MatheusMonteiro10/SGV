import { Modal } from '../ui/Modal'
import type { ViagemResponse } from '../../types/viagem'
import { formatarHorario } from '../../utils/viagem'

interface ModalListaViagensDiaProps {
  isOpen: boolean
  onClose: () => void
  titulo: string
  viagens: ViagemResponse[]
  isLoading?: boolean
  onSelecionarViagem: (viagem: ViagemResponse) => void
  onAgendarNovaViagem: () => void
}

export function ModalListaViagensDia({
  isOpen,
  onClose,
  titulo,
  viagens,
  isLoading,
  onSelecionarViagem,
  onAgendarNovaViagem,
}: ModalListaViagensDiaProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titulo}
      size="sm"
      footer={
        <button
          type="button"
          onClick={onAgendarNovaViagem}
          className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-amber-dim"
        >
          + Agendar nova viagem
        </button>
      }
    >
      {isLoading ? (
        <p className="py-6 text-center text-sm text-ink-soft">Carregando viagens...</p>
      ) : viagens.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-soft">Nenhuma viagem agendada para este dia.</p>
      ) : (
        <ul className="space-y-2">
          {viagens.map((viagem) => (
            <li key={viagem.id}>
              <button
                type="button"
                onClick={() => onSelecionarViagem(viagem)}
                className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-left text-sm text-ink transition hover:border-amber hover:bg-amber/5"
              >
                <span className="font-medium">{viagem.destino}</span>
                <span className="font-mono text-xs text-ink-soft">
                  {formatarHorario(viagem.horarioPartida)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
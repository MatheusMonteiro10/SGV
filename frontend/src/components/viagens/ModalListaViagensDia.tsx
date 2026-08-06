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
  podeAgendar?: boolean
}

export function ModalListaViagensDia({
  isOpen,
  onClose,
  titulo,
  viagens,
  isLoading,
  onSelecionarViagem,
  onAgendarNovaViagem,
  podeAgendar = true,
}: ModalListaViagensDiaProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titulo}
      size="sm"
      footer={
        podeAgendar ? (
          <button
            type="button"
            onClick={onAgendarNovaViagem}
            className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-amber-dim"
          >
            + Agendar nova viagem
          </button>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full cursor-not-allowed rounded-full bg-paper-dim py-2.5 text-sm font-medium text-ink-soft"
            >
              + Agendar nova viagem
            </button>
            <p className="text-center text-xs text-ink-soft">
              Não é possível agendar viagens em dias que já passaram.
            </p>
          </div>
        )
      }
    >
      {isLoading ? (
        <p className="py-6 text-center text-sm text-ink-soft">Carregando viagens...</p>
      ) : viagens.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-soft">Nenhuma viagem neste dia.</p>
      ) : (
        <ul className="space-y-2">
          {viagens.map((viagem) => (
            <li key={viagem.id}>
              <button
                type="button"
                onClick={() => onSelecionarViagem(viagem)}
                className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-left text-sm text-ink transition hover:border-amber hover:bg-amber/5"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      viagem.status === 'AGENDADA' ? 'bg-amber' : 'bg-teal'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="font-medium">{viagem.destino}</span>
                </span>
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
import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useExcluirViagem } from '../../hooks/useExcluirViagem'
import { formatarHorario } from '../../utils/viagem'
import type { ViagemResponse } from '../../types/viagem'

interface ModalDetalhesViagemProps {
  isOpen: boolean
  onClose: () => void
  viagem: ViagemResponse | null
  onAlterar: (viagem: ViagemResponse) => void
}

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const STATUS_LABEL: Record<ViagemResponse['status'], string> = {
  AGENDADA: 'Agendada',
  CONCLUIDA: 'Concluída',
}

function formatarData(dataIso: string): string {
  // dataIso é yyyy-MM-dd local; construir com partes evita off-by-one por fuso,
  // mesmo padrão já usado no título do Modal 1 (CalendarioPage).
  const [y, m, d] = dataIso.split('-').map(Number)
  const data = new Date(y, m - 1, d)
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(data)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function ModalDetalhesViagem({ isOpen, onClose, viagem, onAlterar }: ModalDetalhesViagemProps) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)
  const { mutate: excluir, isPending: isExcluindo } = useExcluirViagem()

  if (!viagem) return null

  function handleConfirmarExclusao() {
    if (!viagem) return
    setErroExclusao(null)

    excluir(viagem.id, {
      onSuccess: () => {
        setConfirmandoExclusao(false)
        onClose() // fecha Modal 2 -> volta ao Modal 1, já atualizado via invalidação
      },
      onError: () => {
        setErroExclusao('Não foi possível excluir a viagem. Tente novamente.')
      },
    })
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Detalhes da viagem"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmandoExclusao(true)}
              className="flex-1 rounded-full border border-danger/40 py-2.5 text-sm font-medium text-danger transition hover:border-danger hover:bg-danger/5"
            >
              Excluir
            </button>
            <button
              type="button"
              onClick={() => onAlterar(viagem)}
              className="flex-1 rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-amber-dim"
            >
              Alterar
            </button>
          </div>
        }
      >
        {erroExclusao && (
          <div role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {erroExclusao}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">Status</span>
            <span
              className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wide ${
                viagem.status === 'AGENDADA' ? 'bg-amber/15 text-amber-dim' : 'bg-teal/15 text-teal'
              }`}
            >
              {STATUS_LABEL[viagem.status]}
            </span>
          </div>

          <Campo label="Cliente" valor={viagem.nomeCliente} />
          <Campo label="Destino" valor={viagem.destino} />
          <Campo label="Local de partida" valor={viagem.localPartida} />
          <Campo label="Data" valor={formatarData(viagem.dataPartida)} />
          <Campo label="Horário de partida" valor={formatarHorario(viagem.horarioPartida)} />
          <Campo label="Valor cobrado" valor={formatadorMoeda.format(viagem.valorCobrado)} />
          {viagem.observacoes && <Campo label="Observações" valor={viagem.observacoes} multiline />}
          {viagem.status === 'CONCLUIDA' && viagem.avaliacao != null && (
            <Campo label="Avaliação" valor={`${viagem.avaliacao} / 5`} />
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmandoExclusao}
        onClose={() => setConfirmandoExclusao(false)}
        onConfirm={handleConfirmarExclusao}
        title="Excluir viagem"
        description={`Tem certeza que deseja excluir a viagem para ${viagem.destino}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        isConfirming={isExcluindo}
      />
    </>
  )
}

function Campo({ label, valor, multiline }: { label: string; valor: string; multiline?: boolean }) {
  return (
    <div>
      <span className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">{label}</span>
      <p className={`mt-0.5 text-sm text-ink ${multiline ? 'whitespace-pre-wrap' : ''}`}>{valor}</p>
    </div>
  )
}
import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useExcluirViagem } from '../../hooks/useExcluirViagem'
import { useConcluirViagem } from '../../hooks/useConcluirViagem'
import { useAvaliarViagem } from '../../hooks/useAvaliarViagem'
import { formatarHorario, formatarMoeda, formatarDataExtensa } from '../../utils/viagem'
import type { ViagemResponse } from '../../types/viagem'

interface ModalDetalhesViagemProps {
  isOpen: boolean
  onClose: () => void
  viagem: ViagemResponse | null
  onAlterar: (viagem: ViagemResponse) => void
}

const STATUS_LABEL: Record<ViagemResponse['status'], string> = {
  AGENDADA: 'Agendada',
  CONCLUIDA: 'Concluída',
}

export function ModalDetalhesViagem({ isOpen, onClose, viagem, onAlterar }: ModalDetalhesViagemProps) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)
  const [erroConclusao, setErroConclusao] = useState<string | null>(null)
  const { mutate: excluir, isPending: isExcluindo } = useExcluirViagem()
  const { mutate: concluir, isPending: isConcluindo } = useConcluirViagem()

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

  function handleConcluir() {
    if (!viagem) return
    setErroConclusao(null)

    concluir(viagem.id, {
      onError: () => {
        setErroConclusao('Não foi possível concluir a viagem. Tente novamente.')
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
          <div className="flex flex-col gap-3">
            {viagem.status === 'AGENDADA' && (
              <button
                type="button"
                onClick={handleConcluir}
                disabled={isConcluindo}
                className="w-full rounded-full bg-teal py-2.5 text-sm font-medium text-paper transition hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConcluindo ? 'Concluindo...' : 'Marcar como concluída'}
              </button>
            )}
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
          </div>
        }
      >
        {erroExclusao && (
          <div role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {erroExclusao}
          </div>
        )}
        {erroConclusao && (
          <div role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {erroConclusao}
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
          <Campo label="Data" valor={formatarDataExtensa(viagem.dataPartida)} />
          <Campo label="Horário de partida" valor={formatarHorario(viagem.horarioPartida)} />
          <Campo label="Valor cobrado" valor={formatarMoeda(viagem.valorCobrado)} />
          {viagem.observacoes && <Campo label="Observações" valor={viagem.observacoes} multiline />}

          {viagem.status === 'CONCLUIDA' && (
            <AvaliacaoInterativa key={viagem.id} viagemId={viagem.id} avaliacaoInicial={viagem.avaliacao} />
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

interface AvaliacaoInterativaProps {
  viagemId: string
  avaliacaoInicial: number | null
}

/*
  Componente isolado (com key={viagem.id} no pai) pra que o estado local de
  "nota selecionada" e "hover" nunca vaze entre viagens diferentes reaproveitando
  o mesmo Modal. Otimista: atualiza a nota local assim que a mutação confirma,
  sem esperar o refetch da invalidação do React Query pra refletir na tela.
*/
function AvaliacaoInterativa({ viagemId, avaliacaoInicial }: AvaliacaoInterativaProps) {
  const [notaAtual, setNotaAtual] = useState(avaliacaoInicial)
  const [notaHover, setNotaHover] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const { mutate, isPending } = useAvaliarViagem(viagemId)

  function handleAvaliar(nota: number) {
    if (isPending || nota === notaAtual) return
    setErro(null)

    mutate(nota, {
      onSuccess: () => setNotaAtual(nota),
      onError: () => setErro('Não foi possível salvar a avaliação. Tente novamente.'),
    })
  }

  const notaExibida = notaHover ?? notaAtual ?? 0

  return (
    <div>
      <span className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">
        {notaAtual == null ? 'Avaliar viagem' : 'Avaliação'}
      </span>

      <div
        className="mt-1.5 flex items-center gap-1"
        onMouseLeave={() => setNotaHover(null)}
        role="radiogroup"
        aria-label="Avaliação da viagem, de 1 a 5 estrelas"
      >
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={notaAtual === valor}
            aria-label={`${valor} ${valor === 1 ? 'estrela' : 'estrelas'}`}
            disabled={isPending}
            onMouseEnter={() => setNotaHover(valor)}
            onClick={() => handleAvaliar(valor)}
            className="text-2xl leading-none transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className={valor <= notaExibida ? 'text-amber-dim' : 'text-line'}>★</span>
          </button>
        ))}
        {isPending && <span className="ml-2 text-xs text-ink-soft">Salvando...</span>}
      </div>

      {erro && <p className="mt-1 text-xs text-danger">{erro}</p>}
    </div>
  )
}
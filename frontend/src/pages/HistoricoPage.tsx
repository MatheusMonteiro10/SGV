import { useMemo, useState } from 'react'
import { useViagensPorStatus } from '../hooks/useViagensPorStatus'
import { ModalDetalhesViagem } from '../components/viagens/ModalDetalhesViagem'
import { ModalRegistroEdicaoViagem } from '../components/viagens/ModalRegistroEdicaoViagem'
import { formatarDataCurta, formatarHorario, formatarMoeda } from '../utils/viagem'
import {
  filtrarPorPeriodo,
  ordenarPorDataDesc,
  OPCOES_FILTRO_HISTORICO,
  type FiltroPeriodoHistorico,
} from '../utils/historico'
import type { ViagemResponse } from '../types/viagem'

export function HistoricoPage() {
  const [filtro, setFiltro] = useState<FiltroPeriodoHistorico>('7dias')
  const [viagemSelecionada, setViagemSelecionada] = useState<ViagemResponse | null>(null)
  const [viagemEmEdicao, setViagemEmEdicao] = useState<ViagemResponse | null>(null)

  const { data: viagens, isLoading, isError } = useViagensPorStatus('CONCLUIDA')

  const viagensFiltradas = useMemo(() => {
    if (!viagens) return []
    return ordenarPorDataDesc(filtrarPorPeriodo(viagens, filtro))
  }, [viagens, filtro])

  function handleAlterar(viagem: ViagemResponse) {
    setViagemEmEdicao(viagem)
  }

  function handleFecharEdicao() {
    setViagemEmEdicao(null)
  }

  function handleSucessoEdicao() {
    setViagemEmEdicao(null)
    setViagemSelecionada(null) // fecha também o Modal de detalhes, mesmo padrão do Calendário
  }

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber-dim">SGV</span>
      <h1 className="mt-1 font-display text-2xl text-ink">Histórico</h1>
      <p className="mt-1 text-sm text-ink-soft">Viagens concluídas.</p>

      <FiltroSegmentado valor={filtro} onChange={setFiltro} />

      {isError && (
        <p className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Não foi possível carregar o histórico de viagens.
        </p>
      )}

      {isLoading ? (
        <p className="mt-8 text-center text-sm text-ink-soft">Carregando viagens...</p>
      ) : viagensFiltradas.length === 0 ? (
        <p className="mt-8 text-center text-sm text-ink-soft">
          Nenhuma viagem concluída neste período.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {viagensFiltradas.map((viagem) => (
            <li key={viagem.id}>
              <CardViagem viagem={viagem} onClick={() => setViagemSelecionada(viagem)} />
            </li>
          ))}
        </ul>
      )}

      <ModalDetalhesViagem
        isOpen={viagemSelecionada !== null}
        onClose={() => setViagemSelecionada(null)}
        viagem={viagemSelecionada}
        onAlterar={handleAlterar}
      />

      <ModalRegistroEdicaoViagem
        isOpen={viagemEmEdicao !== null}
        onClose={handleFecharEdicao}
        onSuccess={handleSucessoEdicao}
        modo="editar"
        viagem={viagemEmEdicao}
      />
    </div>
  )
}

function FiltroSegmentado({
  valor,
  onChange,
}: {
  valor: FiltroPeriodoHistorico
  onChange: (v: FiltroPeriodoHistorico) => void
}) {
  return (
    <div className="mt-5 flex gap-1 rounded-full border border-line bg-paper-dim/60 p-1">
      {OPCOES_FILTRO_HISTORICO.map((opcao) => {
        const ativo = opcao.valor === valor
        return (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => onChange(opcao.valor)}
            className={[
              'flex-1 rounded-full py-1.5 font-mono text-[11px] uppercase tracking-wide transition',
              ativo ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
            ].join(' ')}
          >
            {opcao.label}
          </button>
        )
      })}
    </div>
  )
}

function CardViagem({ viagem, onClick }: { viagem: ViagemResponse; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-1 rounded-xl border border-line bg-white px-4 py-3 text-left transition hover:border-amber hover:bg-amber/5"
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-sm text-ink">{viagem.destino}</span>
        <span className="font-mono text-xs text-ink-soft">
          {formatarDataCurta(viagem.dataPartida)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-soft">
          {viagem.nomeCliente} · {formatarHorario(viagem.horarioPartida)}
        </span>
        <span className="font-mono text-xs font-medium text-teal">
          {formatarMoeda(viagem.valorCobrado)}
        </span>
      </div>

      {viagem.avaliacao != null && (
        <div className="mt-0.5">
          <Estrelas nota={viagem.avaliacao} />
        </div>
      )}
    </button>
  )
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="font-mono text-xs tracking-wide text-amber-dim" aria-label={`Avaliação: ${nota} de 5`}>
      {'★'.repeat(nota)}
      <span className="text-line">{'★'.repeat(5 - nota)}</span>
    </span>
  )
}
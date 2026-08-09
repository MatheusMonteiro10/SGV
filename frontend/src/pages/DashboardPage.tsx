import { useMemo, useState } from 'react'
import { useViagensPorStatus } from '../hooks/useViagensPorStatus'
import { Modal } from '../components/ui/Modal'
import { formatarMoeda } from '../utils/viagem'
import { NOMES_MESES, NOMES_MESES_ABREV, NOMES_DIAS_SEMANA } from '../utils/calendario'
import {
  somarValores,
  filtrarPorAno,
  filtrarPorMes,
  totaisPorMes,
  totaisPorDiaSemana,
  dataMaisRecente,
  formatarDataAtualizacao,
} from '../utils/dashboard'

export function DashboardPage() {
  const hoje = useMemo(() => new Date(), [])
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mesSelecionado, setMesSelecionado] = useState<number | null>(null)

  const { data: viagens, isLoading, isError } = useViagensPorStatus('CONCLUIDA')

  // Resumo geral (independe do ano navegado no gráfico) 
  const totalGeral = useMemo(() => somarValores(viagens ?? []), [viagens])
  const atualizadoEm = useMemo(() => dataMaisRecente(viagens ?? []), [viagens])

  const comparacaoMensal = useMemo(() => {
    const mesAtualIdx = hoje.getMonth()
    const anoAtual = hoje.getFullYear()
    const mesAnteriorDate = new Date(anoAtual, mesAtualIdx - 1, 1)

    const totalMesAtual = somarValores(filtrarPorMes(viagens ?? [], anoAtual, mesAtualIdx))
    const totalMesAnterior = somarValores(
      filtrarPorMes(viagens ?? [], mesAnteriorDate.getFullYear(), mesAnteriorDate.getMonth()),
    )
    return {
      diferenca: totalMesAtual - totalMesAnterior,
      nomeMesAnterior: NOMES_MESES[mesAnteriorDate.getMonth()],
    }
  }, [viagens, hoje])

  // Dados do ano em navegação (gráfico + cards + dia da semana)
  const viagensDoAno = useMemo(() => filtrarPorAno(viagens ?? [], ano), [viagens, ano])
  const totais = useMemo(() => totaisPorMes(viagens ?? [], ano), [viagens, ano])
  const maiorTotal = Math.max(...totais, 0)
  const indiceMelhorMes = totais.indexOf(maiorTotal)
  const temDadosNoAno = totais.some((t) => t > 0)

  const totalAno = useMemo(() => somarValores(viagensDoAno), [viagensDoAno])
  const quantidadeAno = viagensDoAno.length
  const mediaPorViagem = quantidadeAno > 0 ? totalAno / quantidadeAno : 0

  const totaisDiaSemana = useMemo(() => totaisPorDiaSemana(viagensDoAno), [viagensDoAno])
  const maiorTotalDiaSemana = Math.max(...totaisDiaSemana, 0)

  // Detalhe do mês selecionado (modal)
  const viagensDoMesSelecionado = useMemo(() => {
    if (mesSelecionado === null) return []
    return filtrarPorMes(viagens ?? [], ano, mesSelecionado).sort((a, b) =>
      a.dataPartida.localeCompare(b.dataPartida),
    )
  }, [viagens, ano, mesSelecionado])

  const totalMesSelecionado = useMemo(() => somarValores(viagensDoMesSelecionado), [viagensDoMesSelecionado])

  function irParaAnoAnterior() {
    setMesSelecionado(null)
    setAno((a) => a - 1)
  }

  function irParaProximoAno() {
    setMesSelecionado(null)
    setAno((a) => a + 1)
  }

  return (
    <div>
      {isError && (
        <p className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Não foi possível carregar os dados financeiros.
        </p>
      )}

      {/* Resumo total acumulado */}
      <div className="mt-6">
        <span className="text-sm text-ink-soft">Ganhos com viagens</span>
        <p className="mt-1 font-display text-3xl text-ink">{formatarMoeda(totalGeral)}</p>
        {atualizadoEm && (
          <p className="mt-1 text-xs text-ink-soft">Atualizado em {formatarDataAtualizacao(atualizadoEm)}</p>
        )}
        {viagens && viagens.length > 0 && (
          <p
            className={`mt-2 flex items-center gap-1 text-sm font-medium ${
              comparacaoMensal.diferenca >= 0 ? 'text-teal' : 'text-danger'
            }`}
          >
            {comparacaoMensal.diferenca >= 0 ? '↑' : '↓'} {formatarMoeda(Math.abs(comparacaoMensal.diferenca))}
            <span className="font-normal text-ink-soft">
              {comparacaoMensal.diferenca >= 0 ? ' a mais' : ' a menos'} que em {comparacaoMensal.nomeMesAnterior}
            </span>
          </p>
        )}
      </div>

      {/* Navegação de ano */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={irParaAnoAnterior}
          aria-label="Ano anterior"
          className="rounded-full p-2 text-ink-soft transition hover:bg-paper-dim hover:text-ink"
        >
          <ChevronIcon direction="left" />
        </button>
        <span className="font-mono text-sm text-ink">{ano}</span>
        <button
          type="button"
          onClick={irParaProximoAno}
          aria-label="Próximo ano"
          className="rounded-full p-2 text-ink-soft transition hover:bg-paper-dim hover:text-ink"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      {/* Gráfico de barras */}
      {isLoading ? (
        <p className="mt-8 text-center text-sm text-ink-soft">Carregando...</p>
      ) : !temDadosNoAno ? (
        <p className="mt-8 text-center text-sm text-ink-soft">Nenhuma viagem concluída em {ano}.</p>
      ) : (
        <div className="mt-4 flex items-end gap-1.5">
          {totais.map((valor, idx) => {
            const altura = maiorTotal > 0 ? Math.max((valor / maiorTotal) * 100, valor > 0 ? 6 : 2) : 2
            const ehMelhorMes = idx === indiceMelhorMes && valor > 0
            return (
              <button
                key={idx}
                type="button"
                onClick={() => valor > 0 && setMesSelecionado(idx)}
                disabled={valor === 0}
                className="group flex flex-1 flex-col items-center gap-1.5 disabled:cursor-not-allowed"
              >
                <div className="flex h-32 w-full items-end">
                  <div
                    style={{ height: `${altura}%` }}
                    className={`w-full rounded-t-sm transition ${
                      ehMelhorMes
                        ? 'bg-amber'
                        : valor > 0
                          ? 'bg-amber-dim/70 group-hover:bg-amber-dim'
                          : 'bg-paper-dim'
                    }`}
                  />
                </div>
                <span
                  className={`font-mono text-[10px] ${
                    ehMelhorMes ? 'font-semibold text-amber-dim' : 'text-ink-soft'
                  }`}
                >
                  {NOMES_MESES_ABREV[idx]}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Estatísticas do ano */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <CardEstatistica label={`Total em ${ano}`} valor={formatarMoeda(totalAno)} />
        <CardEstatistica label="Viagens no ano" valor={String(quantidadeAno)} />
        <CardEstatistica label="Média por viagem" valor={formatarMoeda(mediaPorViagem)} />
        <CardEstatistica label="Melhor mês" valor={maiorTotal > 0 ? NOMES_MESES[indiceMelhorMes] : '—'} />
      </div>

      {/* Ganhos por dia da semana */}
      {temDadosNoAno && (
        <div className="mt-8">
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">
            Ganhos por dia da semana em {ano}
          </span>
          <div className="mt-3 space-y-2">
            {NOMES_DIAS_SEMANA.map((nome, idx) => {
              const valor = totaisDiaSemana[idx]
              const largura = maiorTotalDiaSemana > 0 ? (valor / maiorTotalDiaSemana) * 100 : 0
              return (
                <div key={nome} className="flex items-center gap-3">
                  <span className="w-9 shrink-0 font-mono text-[11px] text-ink-soft">{nome}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-dim">
                    <div className="h-full rounded-full bg-teal" style={{ width: `${largura}%` }} />
                  </div>
                  <span className="w-20 shrink-0 text-right font-mono text-[11px] text-ink-soft">
                    {formatarMoeda(valor)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal de detalhe do mês */}
      <Modal
        isOpen={mesSelecionado !== null}
        onClose={() => setMesSelecionado(null)}
        title={mesSelecionado !== null ? `${NOMES_MESES[mesSelecionado]} de ${ano}` : ''}
        size="sm"
      >
        <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">Total acumulado no mês</p>
        <p className="mt-1 font-display text-2xl text-ink">{formatarMoeda(totalMesSelecionado)}</p>

        <ul className="mt-5 space-y-2">
          {viagensDoMesSelecionado.map((viagem) => (
            <li
              key={viagem.id}
              className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3 text-sm"
            >
              <span className="text-ink">{viagem.destino}</span>
              <span className="font-mono text-xs font-medium text-teal">
                {formatarMoeda(viagem.valorCobrado)}
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}

function CardEstatistica({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-wide text-ink-soft">{label}</span>
      <p className="mt-1 font-display text-lg text-ink">{valor}</p>
    </div>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  const d = direction === 'left' ? 'M12.5 5L7.5 10L12.5 15' : 'M7.5 5L12.5 10L7.5 15'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
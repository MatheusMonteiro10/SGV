import { useMemo, useState } from 'react'
import { useViagensPorPeriodo } from '../hooks/useViagensPorPeriodo'
import { gerarGradeMensal, NOMES_DIAS_SEMANA, NOMES_MESES } from '../utils/calendario'
import { ModalListaViagensDia } from '../components/viagens/ModalListaViagensDia'
import type { ViagemResponse } from '../types/viagem'

export function CalendarioPage() {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth()) // 0-indexed
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)

  const grade = useMemo(() => gerarGradeMensal(ano, mes), [ano, mes])

  // Busca cobrindo toda a grade exibida (incluindo padding), não só o mês "puro",
  // pra já vir com os dados corretos se algum dia de padding tiver viagem.
  const inicio = grade[0].dataIso
  const fim = grade[grade.length - 1].dataIso

  const { data: viagens, isLoading, isError } = useViagensPorPeriodo(inicio, fim)

  // Set de datas (yyyy-MM-dd) que tem ao menos uma viagem AGENDADA.
  const diasComAgendada = useMemo(() => {
    const set = new Set<string>()
    viagens
      ?.filter((v) => v.status === 'AGENDADA')
      .forEach((v) => set.add(v.dataPartida))
    return set
  }, [viagens])

  // Viagens AGENDADA do dia clicado, ordenadas por horário — é o que o Modal 1 lista.
  const viagensDoDiaSelecionado = useMemo(() => {
    if (!diaSelecionado || !viagens) return []
    return viagens
      .filter((v) => v.status === 'AGENDADA' && v.dataPartida === diaSelecionado)
      .sort((a, b) => a.horarioPartida.localeCompare(b.horarioPartida))
  }, [viagens, diaSelecionado])

  const tituloModal = useMemo(() => {
    if (!diaSelecionado) return ''
    // dataIso é yyyy-MM-dd local; construir com partes evita off-by-one por fuso.
    const [y, m, d] = diaSelecionado.split('-').map(Number)
    const data = new Date(y, m - 1, d)
    const texto = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(data)
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }, [diaSelecionado])

  function irParaMesAnterior() {
    setDiaSelecionado(null)
    if (mes === 0) {
      setMes(11)
      setAno((a) => a - 1)
    } else {
      setMes((m) => m - 1)
    }
  }

  function irParaProximoMes() {
    setDiaSelecionado(null)
    if (mes === 11) {
      setMes(0)
      setAno((a) => a + 1)
    } else {
      setMes((m) => m + 1)
    }
  }

  function irParaHoje() {
    setAno(hoje.getFullYear())
    setMes(hoje.getMonth())
    setDiaSelecionado(null)
  }

  function handleClickDia(dataIso: string) {
    setDiaSelecionado(dataIso)
    // TODO: abrir Modal 1 (lista de viagens do dia)
  }

  function handleFecharModal() {
    setDiaSelecionado(null)
  }

  function handleSelecionarViagem(viagem: ViagemResponse) {
    // TODO (item 6 do roadmap): abrir Modal 2 (detalhes) empilhado sobre este.
    console.log('Abrir Modal 2 para viagem:', viagem.id)
  }

  function handleAgendarNovaViagem() {
    // TODO: abrir o modal compartilhado de registro/edição,
    // empilhado sobre este, pré-preenchido com diaSelecionado.
    console.log('Abrir modal de registro para o dia:', diaSelecionado)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber-dim">SGV</span>
          <h1 className="mt-1 font-display text-2xl text-ink">
            {NOMES_MESES[mes]} <span className="text-ink-soft">{ano}</span>
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={irParaMesAnterior}
            aria-label="Mês anterior"
            className="rounded-full p-2 text-ink-soft transition hover:bg-paper-dim hover:text-ink"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={irParaHoje}
            className="rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-soft transition hover:bg-paper-dim hover:text-ink"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={irParaProximoMes}
            aria-label="Próximo mês"
            className="rounded-full p-2 text-ink-soft transition hover:bg-paper-dim hover:text-ink"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>

      {isError && (
        <p className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Não foi possível carregar as viagens deste período.
        </p>
      )}

      <div className="mt-6 grid grid-cols-7 gap-1 text-center font-mono text-[11px] uppercase tracking-wide text-ink-soft">
        {NOMES_DIAS_SEMANA.map((nome) => (
          <span key={nome} className="py-1">
            {nome}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {grade.map((dia) => {
          const temAgendada = diasComAgendada.has(dia.dataIso)
          const estaSelecionado = diaSelecionado === dia.dataIso

          return (
            <button
              key={dia.dataIso}
              type="button"
              onClick={() => handleClickDia(dia.dataIso)}
              disabled={isLoading}
              className={[
                'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition',
                dia.noMesAtual ? 'text-ink' : 'text-ink-soft/50',
                estaSelecionado
                  ? 'border-2 border-amber bg-amber/10'
                  : 'border border-transparent hover:border-line hover:bg-paper-dim',
                dia.isHoje && !estaSelecionado ? 'border-line' : '',
              ].join(' ')}
            >
              <span className={dia.isHoje ? 'font-semibold text-amber-dim' : undefined}>{dia.diaDoMes}</span>
              {temAgendada && (
                <span
                  className="mt-1 h-1.5 w-1.5 rounded-full bg-amber"
                  aria-label="Dia com viagem agendada"
                />
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-ink-soft">
        <span className="h-1.5 w-1.5 rounded-full bg-amber" />
        Dia com viagem agendada
      </p>

      <ModalListaViagensDia
        isOpen={diaSelecionado !== null}
        onClose={handleFecharModal}
        titulo={tituloModal}
        viagens={viagensDoDiaSelecionado}
        isLoading={isLoading}
        onSelecionarViagem={handleSelecionarViagem}
        onAgendarNovaViagem={handleAgendarNovaViagem}
      />
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
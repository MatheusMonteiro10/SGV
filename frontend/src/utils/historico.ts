import type { ViagemResponse } from '../types/viagem'
import { parseDataIso } from './viagem'

export type FiltroPeriodoHistorico = '7dias' | '1mes' | 'todas'

export const OPCOES_FILTRO_HISTORICO: Array<{ valor: FiltroPeriodoHistorico; label: string }> = [
  { valor: '7dias', label: 'Últimos 7 dias' },
  { valor: '1mes', label: 'Último mês' },
  { valor: 'todas', label: 'Todas' },
]

export function filtrarPorPeriodo(
  viagens: ViagemResponse[],
  filtro: FiltroPeriodoHistorico,
): ViagemResponse[] {
  if (filtro === 'todas') return viagens

  const limite = new Date()
  limite.setHours(0, 0, 0, 0)

  if (filtro === '7dias') {
    limite.setDate(limite.getDate() - 7)
  } else {
    limite.setMonth(limite.getMonth() - 1)
  }

  return viagens.filter((v) => parseDataIso(v.dataPartida) >= limite)
}

// Mais recente primeiro, em caso de mesma data, horário mais tarde primeiro
export function ordenarPorDataDesc(viagens: ViagemResponse[]): ViagemResponse[] {
  return [...viagens].sort((a, b) => {
    const porData = b.dataPartida.localeCompare(a.dataPartida)
    if (porData !== 0) return porData
    return b.horarioPartida.localeCompare(a.horarioPartida)
  })
}
import type { ViagemResponse } from '../types/viagem'
import { parseDataIso } from './viagem'

// Soma o valorCobrado de uma lista de viagens
export function somarValores(viagens: ViagemResponse[]): number {
  return viagens.reduce((acc, v) => acc + v.valorCobrado, 0)
}

// Filtra viagens cuja dataPartida caia no ano informado
export function filtrarPorAno(viagens: ViagemResponse[], ano: number): ViagemResponse[] {
  return viagens.filter((v) => parseDataIso(v.dataPartida).getFullYear() === ano)
}

// Filtra viagens cuja dataPartida caia no mês (0-indexed) e ano informados
export function filtrarPorMes(viagens: ViagemResponse[], ano: number, mes: number): ViagemResponse[] {
  return viagens.filter((v) => {
    const data = parseDataIso(v.dataPartida)
    return data.getFullYear() === ano && data.getMonth() === mes
  })
}

// Array de 12 posições (jan..dez) com o total ganho em cada mês do ano informado
export function totaisPorMes(viagens: ViagemResponse[], ano: number): number[] {
  const totais = Array(12).fill(0)
  filtrarPorAno(viagens, ano).forEach((v) => {
    const mes = parseDataIso(v.dataPartida).getMonth()
    totais[mes] += v.valorCobrado
  })
  return totais
}

/*
  Array de 7 posições (dom..sáb, mesma ordem de NOMES_DIAS_SEMANA) com o
  total ganho em viagens que caíram em cada dia da semana
 */
export function totaisPorDiaSemana(viagens: ViagemResponse[]): number[] {
  const totais = Array(7).fill(0)
  viagens.forEach((v) => {
    const dia = parseDataIso(v.dataPartida).getDay()
    totais[dia] += v.valorCobrado
  })
  return totais
}

// updatedAt mais recente entre as viagens informadas, ou null se a lista estiver vazia
export function dataMaisRecente(viagens: ViagemResponse[]): string | null {
  if (viagens.length === 0) return null
  return viagens.reduce(
    (maisRecente, v) => (v.updatedAt > maisRecente ? v.updatedAt : maisRecente),
    viagens[0].updatedAt,
  )
}

// Formata um updatedAt (LocalDateTime do backend, ex: "2026-08-07T10:15:30") como dd/mm/aaaa
export function formatarDataAtualizacao(updatedAtIso: string): string {
  const data = new Date(updatedAtIso)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(data)
}
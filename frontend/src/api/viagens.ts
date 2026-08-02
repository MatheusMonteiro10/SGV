import api from './axios'
import type { ViagemRequest, ViagemResponse } from '../types/viagem'

export function registrarViagem(dados: ViagemRequest) {
  return api.post<ViagemResponse>('/viagens', dados)
}

export function atualizarViagem(id: string, dados: ViagemRequest) {
  return api.put<ViagemResponse>(`/viagens/${id}`, dados)
}

export function listarPorPeriodo(inicio: string, fim: string) {
  return api.get<ViagemResponse[]>('/viagens/periodo', { params: { inicio, fim } })
}

export function excluirViagem(id: string) {
  return api.delete<void>(`/viagens/${id}`)
}
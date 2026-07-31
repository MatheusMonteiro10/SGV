import api from './axios'
import type { ViagemRequest, ViagemResponse } from '../types/viagem'

export function registrarViagem(dados: ViagemRequest) {
  return api.post<ViagemResponse>('/viagens', dados)
}

export function listarPorPeriodo(inicio: string, fim: string) {
  return api.get<ViagemResponse[]>('/viagens/periodo', { params: { inicio, fim } })
}
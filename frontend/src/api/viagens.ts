import api from './axios'
import type { ViagemRequest, ViagemResponse } from '../types/viagem'

export function registrarViagem(dados: ViagemRequest) {
  return api.post<ViagemResponse>('/viagens', dados)
}
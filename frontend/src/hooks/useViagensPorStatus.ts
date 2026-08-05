import { useQuery } from '@tanstack/react-query'
import { listarPorStatus } from '../api/viagens'
import type { StatusViagem } from '../types/viagem'

/*
  Query key segue o padrão ['viagens', ...] pra ser pega por qualquer
  invalidação de mutação de viagem (criar/editar/excluir), igual
  useViagensPorPeriodo
 */
export function useViagensPorStatus(status: StatusViagem) {
  return useQuery({
    queryKey: ['viagens', 'status', status],
    queryFn: () => listarPorStatus(status).then((res) => res.data),
  })
}
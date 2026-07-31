import { useQuery } from '@tanstack/react-query'
import { listarPorPeriodo } from '../api/viagens'

/**
 * Busca viagens num intervalo [inicio, fim] 
 * Query key segue o padrão ['viagens', ...] para que qualquer mutação de viagem
 * (criar/editar/excluir) possa invalidar tudo sob esse namespace de uma vez.
 */
export function useViagensPorPeriodo(inicio: string, fim: string) {
  return useQuery({
    queryKey: ['viagens', 'periodo', inicio, fim],
    queryFn: () => listarPorPeriodo(inicio, fim).then((res) => res.data),
    enabled: Boolean(inicio && fim),
  })
}
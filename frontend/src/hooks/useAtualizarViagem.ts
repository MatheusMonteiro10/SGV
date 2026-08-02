import { useMutation, useQueryClient } from '@tanstack/react-query'
import { atualizarViagem } from '../api/viagens'
import type { ViagemRequest } from '../types/viagem'

export function useAtualizarViagem(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dados: ViagemRequest) => atualizarViagem(id, dados),
    onSuccess: () => {
      // sob ['viagens'], atualizando lista do Modal 1 e cor do dia no calendário.
      queryClient.invalidateQueries({ queryKey: ['viagens'] })
    },
  })
}
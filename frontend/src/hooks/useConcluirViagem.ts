import { useMutation, useQueryClient } from '@tanstack/react-query'
import { concluirViagem } from '../api/viagens'

export function useConcluirViagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => concluirViagem(id),
    onSuccess: () => {
      // mesma estratégia dos demais hooks: atualiza calendário (dia perde a cor
      // de agendado) e histórico (viagem passa a aparecer lá) via invalidação
      queryClient.invalidateQueries({ queryKey: ['viagens'] })
    },
  })
}
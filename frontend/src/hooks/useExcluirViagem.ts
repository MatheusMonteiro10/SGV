import { useMutation, useQueryClient } from '@tanstack/react-query'
import { excluirViagem } from '../api/viagens'

export function useExcluirViagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => excluirViagem(id),
    onSuccess: () => {
      // mesma estratégia do useRegistrarViagem: invalida tudo sob ['viagens'],
      // atualizando a lista do Modal 1 e a cor do dia no calendário de fundo.
      queryClient.invalidateQueries({ queryKey: ['viagens'] })
    },
  })
}
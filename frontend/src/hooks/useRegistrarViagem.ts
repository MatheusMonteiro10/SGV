import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registrarViagem } from '../api/viagens'
import type { ViagemRequest } from '../types/viagem'

export function useRegistrarViagem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dados: ViagemRequest) => registrarViagem(dados),
    onSuccess: () => {
      // Invalida qualquer query futura de listagem (histórico, período, dashboard)
      // para que a nova viagem apareça sem precisar de refresh manual.
      queryClient.invalidateQueries({ queryKey: ['viagens'] })
    },
  })
}
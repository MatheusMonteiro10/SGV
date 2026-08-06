import { useMutation, useQueryClient } from '@tanstack/react-query'
import { avaliarViagem } from '../api/viagens'

export function useAvaliarViagem(id: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (nota: number) => avaliarViagem(id, nota),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['viagens'] })
        },
    })
}
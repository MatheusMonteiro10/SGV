export type StatusViagem = 'AGENDADA' | 'CONCLUIDA'

export interface ViagemRequest {
  nomeCliente: string
  destino: string
  localPartida: string
  dataPartida: string // yyyy-MM-dd
  horarioPartida: string // HH:mm
  valorCobrado: number
  observacoes?: string | null
}

export interface ViagemResponse {
  id: string
  nomeCliente: string
  destino: string
  localPartida: string
  dataPartida: string
  horarioPartida: string
  valorCobrado: number
  observacoes: string | null
  status: StatusViagem
  avaliacao: number | null
  createdAt: string
  updatedAt: string
}
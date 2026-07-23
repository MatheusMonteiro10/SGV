export interface Usuario {
  id: string
  nome: string
  email: string
}

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  usuario: Usuario
}

export interface ApiErrorResponse {
  timestamp: string
  status: number
  message: string
  campos?: Record<string, string>
}
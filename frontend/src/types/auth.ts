export interface Usuario {
  id: string
  nome: string
  email: string
}

export interface RegistroRequest {
  nome: string
  email: string
  senha: string
  confirmacaoSenha: string
}

export interface VerificacaoEmailRequest {
  email: string
  codigo: string
}

export interface ReenvioConfirmacaoRequest {
  email: string
}

export interface MensagemResponse {
  mensagem: string
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

export interface GoogleLoginRequest {
  idToken: string
}

export interface EsqueciSenhaRequest {
  email: string
}

export interface RedefinirSenhaRequest {
  email: string
  codigo: string
  novaSenha: string
  confirmacaoNovaSenha: string
}
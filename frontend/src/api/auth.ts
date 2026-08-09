import api from './axios'

import type {
  MensagemResponse,
  ReenvioConfirmacaoRequest,
  RegistroRequest,
  VerificacaoEmailRequest,
  EsqueciSenhaRequest,
  RedefinirSenhaRequest,
} from '../types/auth'

import type { 
  GoogleLoginRequest, 
  LoginResponse } from '../types/auth'

export function registrar(dados: RegistroRequest) {
  return api.post<MensagemResponse>('/auth/registro', dados)
}

export function verificarEmail(dados: VerificacaoEmailRequest) {
  return api.post<MensagemResponse>('/auth/verificar-email', dados)
}

export function reenviarCodigoRegistro(dados: ReenvioConfirmacaoRequest) {
  return api.post<MensagemResponse>('/auth/reenviar-codigo-registro', dados)
}

export function loginComGoogle(dados: GoogleLoginRequest) {
  return api.post<LoginResponse>('/auth/google', dados)
}

export function esqueciSenha(dados: EsqueciSenhaRequest) {
  return api.post<MensagemResponse>('/auth/esqueci-senha', dados)
}

export function redefinirSenha(dados: RedefinirSenhaRequest) {
  return api.post<MensagemResponse>('/auth/redefinir-senha', dados)
}
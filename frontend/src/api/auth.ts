import api from './axios'

import type {
  MensagemResponse,
  ReenvioConfirmacaoRequest,
  RegistroRequest,
  VerificacaoEmailRequest,
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
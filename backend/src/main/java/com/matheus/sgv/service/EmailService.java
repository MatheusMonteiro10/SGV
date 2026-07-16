package com.matheus.sgv.service;

public interface EmailService {
    void enviarCodigoConfirmacao(String destinatario, String codigo);
    void enviarCodigoResetSenha(String destinatario, String codigo);
}
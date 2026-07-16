package com.matheus.sgv.service;

import com.matheus.sgv.exception.EmailSendingException;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;

    public SmtpEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void enviarCodigoConfirmacao(String destinatario, String codigo) {
        enviar(destinatario, "SGV - Confirme seu cadastro",
                "Seu código de confirmação é: " + codigo + "\n\nEle expira em 10 minutos.");
    }

    @Override
    public void enviarCodigoResetSenha(String destinatario, String codigo) {
        enviar(destinatario, "SGV - Redefinição de senha",
                "Seu código para redefinir a senha é: " + codigo + "\n\nEle expira em 5 minutos.");
    }

    private void enviar(String destinatario, String assunto, String corpo) {
        try {
            SimpleMailMessage mensagem = new SimpleMailMessage();
            mensagem.setTo(destinatario);
            mensagem.setSubject(assunto);
            mensagem.setText(corpo);
            mailSender.send(mensagem);
        } catch (MailException e) {
            throw new EmailSendingException("Falha ao enviar e-mail para " + destinatario);
        }
    }
}
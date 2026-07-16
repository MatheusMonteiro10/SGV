package com.matheus.sgv.service;

import com.matheus.sgv.exception.*;
import com.matheus.sgv.model.CodigoVerificacao;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.model.enums.TipoCodigoVerificacao;
import com.matheus.sgv.repository.CodigoVerificacaoRepository;
import com.matheus.sgv.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private static final int VALIDADE_CODIGO_MINUTOS = 10;

    private final UsuarioRepository usuarioRepository;
    private final CodigoVerificacaoRepository codigoVerificacaoRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthService(UsuarioRepository usuarioRepository,
                       CodigoVerificacaoRepository codigoVerificacaoRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.codigoVerificacaoRepository = codigoVerificacaoRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public void registrarLocal(String nome, String email, String senhaPura, String confirmacaoSenha) {
        if (!senhaPura.equals(confirmacaoSenha)) {
            throw new InvalidCredentialsException("As senhas não conferem");
        }

        usuarioRepository.findByEmail(email).ifPresent(existente -> {
            if (existente.isEmailVerified()) {
                throw new EmailAlreadyRegisteredException(email);
            }
            // Existe mas nunca verificou: permite reenvio em vez de bloquear
            reenviarCodigo(existente, TipoCodigoVerificacao.REGISTRO);
            throw new UnverifiedEmailException("Cadastro pendente de verificação. Novo código enviado.");
        });

        Usuario usuario = new Usuario(nome, email, passwordEncoder.encode(senhaPura));
        usuarioRepository.save(usuario);

        gerarEEnviarCodigo(usuario, TipoCodigoVerificacao.REGISTRO);
    }

    @Transactional
    public void verificarEmail(String email, String codigoInformado) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + email));

        if (usuario.isEmailVerified()) {
            throw new InvalidCredentialsException("E-mail já verificado");
        }

        validarCodigo(usuario, codigoInformado, TipoCodigoVerificacao.REGISTRO);
        usuario.setEmailVerified(true);
    }

    @Transactional(readOnly = true)
    public Usuario login(String email, String senhaPura) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("E-mail ou senha inválidos"));

        if (!passwordEncoder.matches(senhaPura, usuario.getSenhaHash())) {
            throw new InvalidCredentialsException("E-mail ou senha inválidos");
        }

        if (!usuario.isEmailVerified()) {
            throw new UnverifiedEmailException("E-mail ainda não verificado");
        }

        return usuario;
        // TODO: gerar e retornar JWT quando JwtService existir.
        // Por ora devolve a entidade
    }

    @Transactional
    public void reenviarCodigo(String email, TipoCodigoVerificacao tipo) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + email));
        reenviarCodigo(usuario, tipo);
    }

    // TODO: implementar autenticação com Google.
    // @Transactional
    // public Usuario autenticarOuRegistrarGoogle(String tokenGoogle) {
    //     var payload = googleAuthService.verificar(tokenGoogle);
    //     ...
    // }

    // ---- Helpers privados ----

    private void reenviarCodigo(Usuario usuario, TipoCodigoVerificacao tipo) {
        codigoVerificacaoRepository.invalidarTodos(usuario, tipo);
        gerarEEnviarCodigo(usuario, tipo);
    }

    private void gerarEEnviarCodigo(Usuario usuario, TipoCodigoVerificacao tipo) {
        String codigo = String.format("%06d", new Random().nextInt(1_000_000));

        CodigoVerificacao entidade = new CodigoVerificacao(
                usuario, codigo, tipo, LocalDateTime.now().plusMinutes(VALIDADE_CODIGO_MINUTOS));
        codigoVerificacaoRepository.save(entidade);

        if (tipo == TipoCodigoVerificacao.REGISTRO) {
            emailService.enviarCodigoConfirmacao(usuario.getEmail(), codigo);
        } else {
            emailService.enviarCodigoResetSenha(usuario.getEmail(), codigo);
        }
    }

    private void validarCodigo(Usuario usuario, String codigoInformado, TipoCodigoVerificacao tipo) {
        CodigoVerificacao codigo = codigoVerificacaoRepository
                .findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(usuario, tipo)
                .orElseThrow(() -> new InvalidVerificationCodeException("Código inválido"));

        if (LocalDateTime.now().isAfter(codigo.getExpiracao())) {
            throw new InvalidVerificationCodeException("Código expirado");
        }
        if (!codigo.getCodigo().equals(codigoInformado)) {
            throw new InvalidVerificationCodeException("Código incorreto");
        }

        codigo.setUsado(true);
    }
}
package com.matheus.sgv.service;

import com.matheus.sgv.dto.auth.GoogleUserInfo;
import com.matheus.sgv.exception.*;
import com.matheus.sgv.model.CodigoVerificacao;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.model.enums.AuthProvider;
import com.matheus.sgv.model.enums.TipoCodigoVerificacao;
import com.matheus.sgv.repository.CodigoVerificacaoRepository;
import com.matheus.sgv.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private CodigoVerificacaoRepository codigoVerificacaoRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private EmailService emailService;
    @Mock
    private GoogleAuthService googleAuthService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                usuarioRepository, codigoVerificacaoRepository, passwordEncoder, emailService, googleAuthService);
    }

    // ---------- registrarLocal ----------

    @Test
    void registrarLocal_senhasDiferentes_lancaInvalidCredentialsException() {
        assertThatThrownBy(() -> authService.registrarLocal("Ana", "ana@mail.com", "senha123", "outraSenha"))
                .isInstanceOf(InvalidCredentialsException.class);

        verifyNoInteractions(usuarioRepository, codigoVerificacaoRepository, emailService);
    }

    @Test
    void registrarLocal_emailJaCadastradoEVerificado_lancaEmailAlreadyRegisteredException() {
        Usuario existente = new Usuario("Ana", "ana@mail.com", "hash");
        existente.setEmailVerified(true);
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(existente));

        assertThatThrownBy(() ->
                authService.registrarLocal("Ana", "ana@mail.com", "senha123", "senha123"))
                .isInstanceOf(EmailAlreadyRegisteredException.class);

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void registrarLocal_emailCadastradoNaoVerificado_reenviaCodigoELancaUnverifiedEmailException() {
        Usuario existente = new Usuario("Ana", "ana@mail.com", "hash");
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(existente));

        assertThatThrownBy(() ->
                authService.registrarLocal("Ana", "ana@mail.com", "senha123", "senha123"))
                .isInstanceOf(UnverifiedEmailException.class);

        verify(codigoVerificacaoRepository).invalidarTodos(existente, TipoCodigoVerificacao.REGISTRO);
        verify(codigoVerificacaoRepository).save(any(CodigoVerificacao.class));
        verify(emailService).enviarCodigoConfirmacao(eq("ana@mail.com"), any());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void registrarLocal_sucesso_criaUsuarioEEnviaCodigo() {
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("senha123")).thenReturn("hashSeguro");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.registrarLocal("Ana", "ana@mail.com", "senha123", "senha123");

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        Usuario salvo = captor.getValue();

        assertThat(salvo.getNome()).isEqualTo("Ana");
        assertThat(salvo.getEmail()).isEqualTo("ana@mail.com");
        assertThat(salvo.getSenhaHash()).isEqualTo("hashSeguro");
        assertThat(salvo.getProvider()).isEqualTo(AuthProvider.LOCAL);

        verify(codigoVerificacaoRepository).save(any(CodigoVerificacao.class));
        verify(emailService).enviarCodigoConfirmacao(eq("ana@mail.com"), any());
    }

    @Test
    void registrarLocal_emailJaCadastradoComGoogle_lancaEmailAlreadyRegisteredException() {
        Usuario existenteGoogle = new Usuario("Ana", "ana@mail.com", "google-123", AuthProvider.GOOGLE);
        // provider GOOGLE sempre nasce com emailVerified = true (ver registrarViaGoogle)
        existenteGoogle.setEmailVerified(true);
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(existenteGoogle));

        assertThatThrownBy(() ->
                authService.registrarLocal("Ana", "ana@mail.com", "senha123", "senha123"))
                .isInstanceOf(EmailAlreadyRegisteredException.class);

        verify(usuarioRepository, never()).save(any());
        verifyNoInteractions(codigoVerificacaoRepository, emailService);
    }

    // ---------- verificar email ----------

    @Test
    void verificarEmail_usuarioNaoEncontrado_lancaResourceNotFoundException() {
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verificarEmail("ana@mail.com", "123456"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void verificarEmail_jaVerificado_lancaInvalidCredentialsException() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        usuario.setEmailVerified(true);
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> authService.verificarEmail("ana@mail.com", "123456"))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void verificarEmail_codigoNaoEncontrado_lancaInvalidVerificationCodeException() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));
        when(codigoVerificacaoRepository.findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(
                usuario, TipoCodigoVerificacao.REGISTRO)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verificarEmail("ana@mail.com", "123456"))
                .isInstanceOf(InvalidVerificationCodeException.class)
                .hasMessage("Código inválido");
    }

    @Test
    void verificarEmail_codigoExpirado_lancaInvalidVerificationCodeException() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        CodigoVerificacao codigo = new CodigoVerificacao(
                usuario, "123456", TipoCodigoVerificacao.REGISTRO, LocalDateTime.now().minusMinutes(1));
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));
        when(codigoVerificacaoRepository.findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(
                usuario, TipoCodigoVerificacao.REGISTRO)).thenReturn(Optional.of(codigo));

        assertThatThrownBy(() -> authService.verificarEmail("ana@mail.com", "123456"))
                .isInstanceOf(InvalidVerificationCodeException.class)
                .hasMessage("Código expirado");
    }

    @Test
    void verificarEmail_codigoIncorreto_lancaInvalidVerificationCodeException() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        CodigoVerificacao codigo = new CodigoVerificacao(
                usuario, "123456", TipoCodigoVerificacao.REGISTRO, LocalDateTime.now().plusMinutes(10));
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));
        when(codigoVerificacaoRepository.findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(
                usuario, TipoCodigoVerificacao.REGISTRO)).thenReturn(Optional.of(codigo));

        assertThatThrownBy(() -> authService.verificarEmail("ana@mail.com", "999999"))
                .isInstanceOf(InvalidVerificationCodeException.class)
                .hasMessage("Código incorreto");
    }

    @Test
    void verificarEmail_sucesso_marcaUsuarioComoVerificado() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        CodigoVerificacao codigo = new CodigoVerificacao(
                usuario, "123456", TipoCodigoVerificacao.REGISTRO, LocalDateTime.now().plusMinutes(10));
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));
        when(codigoVerificacaoRepository.findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(
                usuario, TipoCodigoVerificacao.REGISTRO)).thenReturn(Optional.of(codigo));

        authService.verificarEmail("ana@mail.com", "123456");

        assertThat(usuario.isEmailVerified()).isTrue();
        assertThat(codigo.isUsado()).isTrue();
    }

    // ---------- login ----------

    @Test
    void login_usuarioNaoEncontrado_lancaInvalidCredentialsException() {
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login("ana@mail.com", "senha123"))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_senhaIncorreta_lancaInvalidCredentialsException() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        usuario.setEmailVerified(true);
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("senhaErrada", "hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login("ana@mail.com", "senhaErrada"))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_emailNaoVerificado_lancaUnverifiedEmailException() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("senha123", "hash")).thenReturn(true);

        assertThatThrownBy(() -> authService.login("ana@mail.com", "senha123"))
                .isInstanceOf(UnverifiedEmailException.class);
    }

    @Test
    void login_sucesso_retornaUsuario() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        usuario.setEmailVerified(true);
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("senha123", "hash")).thenReturn(true);

        Usuario resultado = authService.login("ana@mail.com", "senha123");

        assertThat(resultado).isEqualTo(usuario);
    }

    // ---------- reenviar codigo ----------

    @Test
    void reenviarCodigo_usuarioNaoEncontrado_lancaResourceNotFoundException() {
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.reenviarCodigo("ana@mail.com", TipoCodigoVerificacao.RESET_SENHA))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void reenviarCodigo_resetSenha_enviaEmailCorreto() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));

        authService.reenviarCodigo("ana@mail.com", TipoCodigoVerificacao.RESET_SENHA);

        verify(codigoVerificacaoRepository).invalidarTodos(usuario, TipoCodigoVerificacao.RESET_SENHA);
        verify(emailService).enviarCodigoResetSenha(eq("ana@mail.com"), any());
        verify(emailService, never()).enviarCodigoConfirmacao(any(), any());
    }

    @Test
    void reenviarCodigo_confirmacaoRegistro_enviaEmailCorreto() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));

        authService.reenviarCodigo("ana@mail.com", TipoCodigoVerificacao.REGISTRO);

        verify(codigoVerificacaoRepository).invalidarTodos(usuario, TipoCodigoVerificacao.REGISTRO);
        verify(emailService).enviarCodigoConfirmacao(eq("ana@mail.com"), any());
        verify(emailService, never()).enviarCodigoResetSenha(any(), any());
    }

    // ---------- redefinir senha ----------

    @Test
    void redefinirSenha_senhasDiferentes_lancaInvalidCredentialsException() {
        assertThatThrownBy(() ->
                authService.redefinirSenha("ana@mail.com", "123456", "novaSenha1", "outraSenha1"))
                .isInstanceOf(InvalidCredentialsException.class);

        verifyNoInteractions(usuarioRepository, codigoVerificacaoRepository);
    }

    @Test
    void redefinirSenha_usuarioNaoEncontrado_lancaResourceNotFoundException() {
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                authService.redefinirSenha("ana@mail.com", "123456", "novaSenha1", "novaSenha1"))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(codigoVerificacaoRepository);
    }

    @Test
    void redefinirSenha_contaGoogle_lancaPasswordResetNotAllowedException() {
        Usuario usuarioGoogle = new Usuario("Ana", "ana@mail.com", "google-123", AuthProvider.GOOGLE);
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuarioGoogle));

        assertThatThrownBy(() ->
                authService.redefinirSenha("ana@mail.com", "123456", "novaSenha1", "novaSenha1"))
                .isInstanceOf(PasswordResetNotAllowedException.class);

        verifyNoInteractions(codigoVerificacaoRepository, passwordEncoder);
    }

    @Test
    void redefinirSenha_codigoNaoEncontrado_lancaInvalidVerificationCodeException() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));
        when(codigoVerificacaoRepository.findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(
                usuario, TipoCodigoVerificacao.RESET_SENHA)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                authService.redefinirSenha("ana@mail.com", "123456", "novaSenha1", "novaSenha1"))
                .isInstanceOf(InvalidVerificationCodeException.class)
                .hasMessage("Código inválido");

        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void redefinirSenha_codigoExpirado_lancaInvalidVerificationCodeException() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        CodigoVerificacao codigo = new CodigoVerificacao(
                usuario, "123456", TipoCodigoVerificacao.RESET_SENHA, LocalDateTime.now().minusMinutes(1));
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));
        when(codigoVerificacaoRepository.findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(
                usuario, TipoCodigoVerificacao.RESET_SENHA)).thenReturn(Optional.of(codigo));

        assertThatThrownBy(() ->
                authService.redefinirSenha("ana@mail.com", "123456", "novaSenha1", "novaSenha1"))
                .isInstanceOf(InvalidVerificationCodeException.class)
                .hasMessage("Código expirado");
    }

    @Test
    void redefinirSenha_codigoIncorreto_lancaInvalidVerificationCodeException() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        CodigoVerificacao codigo = new CodigoVerificacao(
                usuario, "123456", TipoCodigoVerificacao.RESET_SENHA, LocalDateTime.now().plusMinutes(5));
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));
        when(codigoVerificacaoRepository.findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(
                usuario, TipoCodigoVerificacao.RESET_SENHA)).thenReturn(Optional.of(codigo));

        assertThatThrownBy(() ->
                authService.redefinirSenha("ana@mail.com", "999999", "novaSenha1", "novaSenha1"))
                .isInstanceOf(InvalidVerificationCodeException.class)
                .hasMessage("Código incorreto");
    }

    @Test
    void redefinirSenha_sucesso_atualizaSenhaHashEMarcaCodigoComoUsado() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hashAntigo");
        CodigoVerificacao codigo = new CodigoVerificacao(
                usuario, "123456", TipoCodigoVerificacao.RESET_SENHA, LocalDateTime.now().plusMinutes(5));
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));
        when(codigoVerificacaoRepository.findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(
                usuario, TipoCodigoVerificacao.RESET_SENHA)).thenReturn(Optional.of(codigo));
        when(passwordEncoder.encode("novaSenha1")).thenReturn("hashNovo");

        authService.redefinirSenha("ana@mail.com", "123456", "novaSenha1", "novaSenha1");

        assertThat(usuario.getSenhaHash()).isEqualTo("hashNovo");
        assertThat(codigo.isUsado()).isTrue();
    }

    // ---------- autenticar ou registrar Google ----------

    @Test
    void autenticarOuRegistrarGoogle_usuarioJaExiste_retornaSemRegistrarNovamente() {
        GoogleUserInfo info = new GoogleUserInfo("google-123", "ana@mail.com", "Ana");
        Usuario existente = new Usuario("Ana", "ana@mail.com", "google-123", AuthProvider.GOOGLE);
        when(googleAuthService.verificarToken("token-valido")).thenReturn(info);
        when(usuarioRepository.findByGoogleId("google-123")).thenReturn(Optional.of(existente));

        Usuario resultado = authService.autenticarOuRegistrarGoogle("token-valido");

        assertThat(resultado).isEqualTo(existente);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void autenticarOuRegistrarGoogle_emailJaCadastradoComSenha_lancaEmailAlreadyRegisteredException() {
        GoogleUserInfo info = new GoogleUserInfo("google-123", "ana@mail.com", "Ana");
        Usuario existenteLocal = new Usuario("Ana", "ana@mail.com", "hash");
        when(googleAuthService.verificarToken("token-valido")).thenReturn(info);
        when(usuarioRepository.findByGoogleId("google-123")).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(existenteLocal));

        assertThatThrownBy(() -> authService.autenticarOuRegistrarGoogle("token-valido"))
                .isInstanceOf(EmailAlreadyRegisteredException.class);

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void autenticarOuRegistrarGoogle_usuarioNovo_registraEJaMarcaEmailVerificado() {
        GoogleUserInfo info = new GoogleUserInfo("google-123", "ana@mail.com", "Ana");
        when(googleAuthService.verificarToken("token-valido")).thenReturn(info);
        when(usuarioRepository.findByGoogleId("google-123")).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.empty());
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        Usuario resultado = authService.autenticarOuRegistrarGoogle("token-valido");

        assertThat(resultado.getEmail()).isEqualTo("ana@mail.com");
        assertThat(resultado.getGoogleId()).isEqualTo("google-123");
        assertThat(resultado.getProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(resultado.isEmailVerified()).isTrue();
    }

    @Test
    void autenticarOuRegistrarGoogle_tokenInvalido_lancaExcecao() {
        when(googleAuthService.verificarToken("token-invalido"))
                .thenThrow(new InvalidCredentialsException("Token Google inválido"));

        assertThatThrownBy(() -> authService.autenticarOuRegistrarGoogle("token-invalido"))
                .isInstanceOf(InvalidCredentialsException.class);

        verifyNoInteractions(usuarioRepository);
    }
}
package com.matheus.sgv.service;

import com.matheus.sgv.BaseIntegrationTest;
import com.matheus.sgv.exception.EmailAlreadyRegisteredException;
import com.matheus.sgv.exception.InvalidVerificationCodeException;
import com.matheus.sgv.model.CodigoVerificacao;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.model.enums.TipoCodigoVerificacao;
import com.matheus.sgv.repository.CodigoVerificacaoRepository;
import com.matheus.sgv.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

/*
  Testes de integração do AuthService: Spring context real, Postgres real (Testcontainers),
  migrations reais via Flyway. O objetivo aqui é validar o que o unit test com Mockito
  estruturalmente não consegue provar: que o dirty checking do Hibernate de fato persiste
  as mudanças no banco ao final da transação.
  EmailService é mockado (@MockBean) para não depender de um servidor SMTP real durante os
 */
@Transactional
class AuthServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CodigoVerificacaoRepository codigoVerificacaoRepository;

    @Autowired
    private EntityManager entityManager;

    @MockBean
    private EmailService emailService;

    @Test
    void registrarLocal_sucesso_persisteUsuarioNaoVerificadoNoBanco() {
        authService.registrarLocal("Ana", "ana.integracao@mail.com", "senha123", "senha123");

        entityManager.flush();
        entityManager.clear();

        Optional<Usuario> salvo = usuarioRepository.findByEmail("ana.integracao@mail.com");
        assertThat(salvo).isPresent();
        assertThat(salvo.get().isEmailVerified()).isFalse();
        assertThat(salvo.get().getSenhaHash()).isNotEqualTo("senha123"); // garantindo que foi hasheada

        verify(emailService).enviarCodigoConfirmacao(eq("ana.integracao@mail.com"), any());
    }

    @Test
    void verificarEmail_codigoValido_persisteEmailVerifiedTrueNoBanco() {
        authService.registrarLocal("Bruno", "bruno.integracao@mail.com", "senha123", "senha123");
        entityManager.flush();

        Usuario usuario = usuarioRepository.findByEmail("bruno.integracao@mail.com").orElseThrow();
        CodigoVerificacao codigo = codigoVerificacaoRepository
                .findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(usuario, TipoCodigoVerificacao.REGISTRO)
                .orElseThrow();

        entityManager.clear(); // limpa o contexto de persistência: a próxima leitura vem do banco, não do cache

        authService.verificarEmail("bruno.integracao@mail.com", codigo.getCodigo());

        entityManager.flush();
        entityManager.clear(); // força a próxima consulta a ir ao banco de novo

        Usuario recarregado = usuarioRepository.findByEmail("bruno.integracao@mail.com").orElseThrow();
        assertThat(recarregado.isEmailVerified())
                .as("email_verified deveria ter sido persistido via dirty checking, sem chamada explícita a save()")
                .isTrue();

        CodigoVerificacao codigoRecarregado = codigoVerificacaoRepository.findById(codigo.getId()).orElseThrow();
        assertThat(codigoRecarregado.isUsado()).isTrue();
    }

    @Test
    void verificarEmail_codigoIncorreto_naoAlteraEstadoPersistidoDoUsuario() {
        authService.registrarLocal("Carla", "carla.integracao@mail.com", "senha123", "senha123");
        entityManager.flush();
        entityManager.clear();

        assertThatThrownBy(() -> authService.verificarEmail("carla.integracao@mail.com", "000000"))
                .isInstanceOf(InvalidVerificationCodeException.class);

        entityManager.flush();
        entityManager.clear();

        Usuario usuario = usuarioRepository.findByEmail("carla.integracao@mail.com").orElseThrow();
        assertThat(usuario.isEmailVerified()).isFalse();
    }

    @Test
    void registrarLocal_emailJaVerificado_naoDuplicaUsuarioNoBanco() {
        authService.registrarLocal("Dan", "dan.integracao@mail.com", "senha123", "senha123");
        entityManager.flush();

        Usuario existente = usuarioRepository.findByEmail("dan.integracao@mail.com").orElseThrow();
        existente.setEmailVerified(true);
        entityManager.flush();
        entityManager.clear();

        assertThatThrownBy(() ->
                authService.registrarLocal("Dan", "dan.integracao@mail.com", "outraSenha1", "outraSenha1"))
                .isInstanceOf(EmailAlreadyRegisteredException.class);

        long quantidade = usuarioRepository.findByEmail("dan.integracao@mail.com").stream().count();
        assertThat(quantidade).isEqualTo(1); // não deve ter criado um segundo registro
    }

    @Test
    void redefinirSenha_codigoValido_persisteNovaSenhaHashNoBanco() {
        authService.registrarLocal("Elis", "elis.integracao@mail.com", "senhaAntiga1", "senhaAntiga1");
        entityManager.flush();

        Usuario usuario = usuarioRepository.findByEmail("elis.integracao@mail.com").orElseThrow();
        String hashAntigo = usuario.getSenhaHash();

        // dispara o código de RESET_SENHA (fluxo real: /esqueci-senha)
        authService.reenviarCodigo("elis.integracao@mail.com", TipoCodigoVerificacao.RESET_SENHA);
        entityManager.flush();

        CodigoVerificacao codigo = codigoVerificacaoRepository
                .findTopByUsuarioAndTipoAndUsadoFalseOrderByExpiracaoDesc(usuario, TipoCodigoVerificacao.RESET_SENHA)
                .orElseThrow();

        entityManager.clear();

        authService.redefinirSenha("elis.integracao@mail.com", codigo.getCodigo(), "senhaNova123", "senhaNova123");

        entityManager.flush();
        entityManager.clear();

        Usuario recarregado = usuarioRepository.findByEmail("elis.integracao@mail.com").orElseThrow();
        assertThat(recarregado.getSenhaHash())
                .as("senha_hash deveria ter sido persistida via dirty checking, sem chamada explícita a save()")
                .isNotEqualTo(hashAntigo);

        CodigoVerificacao codigoRecarregado = codigoVerificacaoRepository.findById(codigo.getId()).orElseThrow();
        assertThat(codigoRecarregado.isUsado()).isTrue();

        verify(emailService).enviarCodigoResetSenha(eq("elis.integracao@mail.com"), any());
    }

    @Test
    void redefinirSenha_contaGoogle_naoAlteraSenhaHashNoBanco() {
        // Fluxo Google não passa por registrarLocal; cria o usuário direto no repositório
        // pra simular uma conta que só existe via OAuth.
        Usuario usuarioGoogle = new Usuario("Gui", "gui.integracao@mail.com", "google-id-fake",
                com.matheus.sgv.model.enums.AuthProvider.GOOGLE);
        usuarioGoogle.setEmailVerified(true);
        usuarioRepository.save(usuarioGoogle);
        entityManager.flush();
        entityManager.clear();

        assertThatThrownBy(() ->
                authService.redefinirSenha("gui.integracao@mail.com", "123456", "senhaNova123", "senhaNova123"))
                .isInstanceOf(com.matheus.sgv.exception.PasswordResetNotAllowedException.class);

        Usuario recarregado = usuarioRepository.findByEmail("gui.integracao@mail.com").orElseThrow();
        assertThat(recarregado.getSenhaHash()).isNull();
    }
}
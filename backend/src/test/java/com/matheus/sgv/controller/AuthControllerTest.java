package com.matheus.sgv.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matheus.sgv.dto.auth.LoginRequest;
import com.matheus.sgv.dto.auth.RegistroRequest;
import com.matheus.sgv.dto.auth.VerificacaoEmailRequest;
import com.matheus.sgv.exception.InvalidCredentialsException;
import com.matheus.sgv.exception.UnverifiedEmailException;
import com.matheus.sgv.exception.InvalidVerificationCodeException;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.model.enums.TipoCodigoVerificacao;
import com.matheus.sgv.config.SecurityConfig;
import com.matheus.sgv.repository.UsuarioRepository;
import com.matheus.sgv.service.AuthService;
import com.matheus.sgv.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/*
  Testes de controller do AuthController: fatia web (@WebMvcTest), sem subir o banco.
  AuthService e JwtService são mockados, a lógica de negócio deles já está
  coberta nos unit/integration testes de service. Aqui o foco é: roteamento, bean validation
  dos DTOs (@Valid), serialização JSON e mapeamento de exceções via GlobalExceptionHandler.
  UsuarioRepository é mockado apenas porque é dependência do JwtAuthenticationFilter, que
  entra no contexto junto com o SecurityConfig, não é usado por nenhum teste aqui, já que
  /api/auth/** é permitAll.
 */
@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UsuarioRepository usuarioRepository;

    // ---------- POST /api/auth/registro ----------

    @Test
    void registrar_dadosValidos_retorna201() throws Exception {
        RegistroRequest request = new RegistroRequest("Ana", "ana@mail.com", "senha123", "senha123");

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mensagem").exists());
    }

    @Test
    void registrar_senhaCurta_retorna400ComErroDeValidacao() throws Exception {
        // senha com menos de 8 caracteres viola @Size(min = 8) em RegistroRequest
        RegistroRequest request = new RegistroRequest("Ana", "ana@mail.com", "123", "123");

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.senha").exists());
    }

    @Test
    void registrar_emailInvalido_retorna400ComErroDeValidacao() throws Exception {
        RegistroRequest request = new RegistroRequest("Ana", "nao-e-um-email", "senha123", "senha123");

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.email").exists());
    }

    // ---------- POST /api/auth/verificar-email ----------

    @Test
    void verificarEmail_codigoComTamanhoErrado_retorna400() throws Exception {
        // @Size(min = 6, max = 6) em VerificacaoEmailRequest
        VerificacaoEmailRequest request = new VerificacaoEmailRequest("ana@mail.com", "123");

        mockMvc.perform(post("/api/auth/verificar-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.codigo").exists());
    }

    // ---------- POST /api/auth/login ----------

    @Test
    void login_credenciaisValidas_retorna200ComToken() throws Exception {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        usuario.setId(UUID.randomUUID());
        usuario.setEmailVerified(true);

        when(authService.login("ana@mail.com", "senha123")).thenReturn(usuario);
        when(jwtService.gerarToken(usuario)).thenReturn("token-fake-jwt");

        LoginRequest request = new LoginRequest("ana@mail.com", "senha123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-fake-jwt"))
                .andExpect(jsonPath("$.usuario.email").value("ana@mail.com"));
    }

    @Test
    void login_credenciaisInvalidas_retorna401() throws Exception {
        when(authService.login(eq("ana@mail.com"), any()))
                .thenThrow(new InvalidCredentialsException("E-mail ou senha inválidos"));

        LoginRequest request = new LoginRequest("ana@mail.com", "senhaErrada");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("E-mail ou senha inválidos"));
    }

    @Test
    void login_emailNaoVerificado_retorna403() throws Exception {
        when(authService.login(eq("ana@mail.com"), any()))
                .thenThrow(new UnverifiedEmailException("E-mail ainda não verificado"));

        LoginRequest request = new LoginRequest("ana@mail.com", "senha123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void login_emailComFormatoInvalido_retorna400SemChegarNoService() throws Exception {
        LoginRequest request = new LoginRequest("nao-e-email", "senha123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        org.mockito.Mockito.verifyNoInteractions(authService);
    }

    // ---------- POST /api/auth/reenviar-codigo-registro ----------

    @Test
    void reenviarCodigoRegistro_emailValido_retorna200EChamaServiceComTipoCorreto() throws Exception {
        String body = """
                {"email": "ana@mail.com"}
                """;

        mockMvc.perform(post("/api/auth/reenviar-codigo-registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        org.mockito.Mockito.verify(authService)
                .reenviarCodigo("ana@mail.com", TipoCodigoVerificacao.REGISTRO);
    }

    // ---------- POST /api/auth/redefinir-senha ----------

    @Test
    void redefinirSenha_dadosValidos_retorna200EChamaServiceComParametrosCorretos() throws Exception {
        String body = """
            {"email": "ana@mail.com", "codigo": "123456", "novaSenha": "novaSenha1", "confirmacaoNovaSenha": "novaSenha1"}
            """;

        mockMvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensagem").exists());

        org.mockito.Mockito.verify(authService)
                .redefinirSenha("ana@mail.com", "123456", "novaSenha1", "novaSenha1");
    }

    @Test
    void redefinirSenha_novaSenhaCurta_retorna400ComErroDeValidacao() throws Exception {
        String body = """
            {"email": "ana@mail.com", "codigo": "123456", "novaSenha": "123", "confirmacaoNovaSenha": "123"}
            """;

        mockMvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.novaSenha").exists());

        org.mockito.Mockito.verifyNoInteractions(authService);
    }

    @Test
    void redefinirSenha_codigoComTamanhoErrado_retorna400ComErroDeValidacao() throws Exception {
        String body = """
            {"email": "ana@mail.com", "codigo": "123", "novaSenha": "novaSenha1", "confirmacaoNovaSenha": "novaSenha1"}
            """;

        mockMvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.codigo").exists());

        org.mockito.Mockito.verifyNoInteractions(authService);
    }

    @Test
    void redefinirSenha_senhasNaoConferem_retorna401() throws Exception {
        org.mockito.Mockito.doThrow(new InvalidCredentialsException("As senhas não conferem"))
                .when(authService).redefinirSenha("ana@mail.com", "123456", "novaSenha1", "outraSenha1");

        String body = """
            {"email": "ana@mail.com", "codigo": "123456", "novaSenha": "novaSenha1", "confirmacaoNovaSenha": "outraSenha1"}
            """;

        mockMvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("As senhas não conferem"));
    }

    @Test
    void redefinirSenha_contaGoogle_retorna409() throws Exception {
        org.mockito.Mockito.doThrow(new com.matheus.sgv.exception.PasswordResetNotAllowedException(
                        "Esta conta usa login com Google e não possui senha para redefinir"))
                .when(authService).redefinirSenha("ana@mail.com", "123456", "novaSenha1", "novaSenha1");

        String body = """
            {"email": "ana@mail.com", "codigo": "123456", "novaSenha": "novaSenha1", "confirmacaoNovaSenha": "novaSenha1"}
            """;

        mockMvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void redefinirSenha_codigoInvalido_retorna400() throws Exception {
        org.mockito.Mockito.doThrow(new InvalidVerificationCodeException("Código incorreto"))
                .when(authService).redefinirSenha("ana@mail.com", "000000", "novaSenha1", "novaSenha1");

        String body = """
            {"email": "ana@mail.com", "codigo": "000000", "novaSenha": "novaSenha1", "confirmacaoNovaSenha": "novaSenha1"}
            """;

        mockMvc.perform(post("/api/auth/redefinir-senha")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Código incorreto"));
    }
}
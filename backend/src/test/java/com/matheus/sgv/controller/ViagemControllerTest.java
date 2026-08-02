package com.matheus.sgv.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matheus.sgv.dto.viagem.AvaliacaoRequest;
import com.matheus.sgv.dto.viagem.ViagemRequest;
import com.matheus.sgv.exception.InvalidStatusTransitionException;
import com.matheus.sgv.exception.ResourceNotFoundException;
import com.matheus.sgv.exception.UnauthorizedAcessException;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.model.Viagem;
import com.matheus.sgv.model.enums.StatusViagem;
import com.matheus.sgv.config.SecurityConfig;
import com.matheus.sgv.repository.UsuarioRepository;
import com.matheus.sgv.service.JwtService;
import com.matheus.sgv.service.ViagemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/*
  Testes de controller do ViagemController: fatia web, ViagemService mockado.
  Autenticação é simulada via SecurityMockMvcRequestPostProcessors.authentication(...),
  que injeta o Authentication diretamente no SecurityContext antes da cadeia de filtros,
  não depende de um JWT real nem passa pelo JwtAuthenticationFilter de fato.
 */
@WebMvcTest(ViagemController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class ViagemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ViagemService viagemService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UsuarioRepository usuarioRepository;

    private Usuario usuarioAutenticado;
    private Authentication autenticacao;

    @BeforeEach
    void setUp() {
        usuarioAutenticado = new Usuario("Ana", "ana@mail.com", "hash");
        usuarioAutenticado.setId(UUID.randomUUID());
        autenticacao = new UsernamePasswordAuthenticationToken(
                usuarioAutenticado, null, Collections.emptyList());
    }

    private Viagem criarViagem(StatusViagem status) {
        Viagem viagem = new Viagem(usuarioAutenticado, "Cliente X", "Destino Y", "Local Z",
                LocalDate.now().plusDays(1), LocalTime.of(9, 0), new BigDecimal("150.00"), null);
        viagem.setId(UUID.randomUUID());
        viagem.setStatusViagem(status);
        return viagem;
    }

    // ---------- Segurança: acesso sem autenticação ----------

    @Test
    void listarHistorico_semAutenticacao_retorna401() throws Exception {
        mockMvc.perform(get("/api/viagens"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(viagemService);
    }

    // ---------- POST /api/viagens ----------

    @Test
    void registrar_autenticadoComDadosValidos_retorna201() throws Exception {
        Viagem viagem = criarViagem(StatusViagem.AGENDADA);
        when(viagemService.registrar(eq(usuarioAutenticado), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(viagem);

        ViagemRequest request = new ViagemRequest("Cliente X", "Destino Y", "Local Z",
                LocalDate.now().plusDays(1), LocalTime.of(9, 0), new BigDecimal("150.00"), null);

        mockMvc.perform(post("/api/viagens")
                        .with(authentication(autenticacao))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nomeCliente").value("Cliente X"));
    }

    @Test
    void registrar_valorCobradoZerado_retorna400SemChegarNoService() throws Exception {
        // @DecimalMin(value = "0.0", inclusive = false) em ViagemRequest
        ViagemRequest request = new ViagemRequest("Cliente X", "Destino Y", "Local Z",
                LocalDate.now().plusDays(1), LocalTime.of(9, 0), BigDecimal.ZERO, null);

        mockMvc.perform(post("/api/viagens")
                        .with(authentication(autenticacao))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.valorCobrado").exists());

        verifyNoInteractions(viagemService);
    }

    @Test
    void registrar_nomeClienteEmBranco_retorna400() throws Exception {
        ViagemRequest request = new ViagemRequest("   ", "Destino Y", "Local Z",
                LocalDate.now().plusDays(1), LocalTime.of(9, 0), new BigDecimal("150.00"), null);

        mockMvc.perform(post("/api/viagens")
                        .with(authentication(autenticacao))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nomeCliente").exists());
    }

    // ---------- PUT /api/viagens/{id} ----------

    @Test
    void atualizar_autenticadoComDadosValidos_retorna200() throws Exception {
        UUID id = UUID.randomUUID();
        Viagem viagemAtualizada = criarViagem(StatusViagem.AGENDADA);
        viagemAtualizada.setId(id);
        viagemAtualizada.setNomeCliente("Cliente Editado");

        when(viagemService.atualizar(eq(id), eq(usuarioAutenticado), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(viagemAtualizada);

        ViagemRequest request = new ViagemRequest("Cliente Editado", "Destino Y", "Local Z",
                LocalDate.now().plusDays(1), LocalTime.of(9, 0), new BigDecimal("150.00"), null);

        mockMvc.perform(put("/api/viagens/{id}", id)
                        .with(authentication(autenticacao))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomeCliente").value("Cliente Editado"));
    }

    @Test
    void atualizar_viagemDeOutroUsuario_retorna403() throws Exception {
        UUID id = UUID.randomUUID();
        when(viagemService.atualizar(eq(id), eq(usuarioAutenticado), any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new UnauthorizedAcessException("Viagem não pertence ao usuário solicitante"));

        ViagemRequest request = new ViagemRequest("Cliente X", "Destino Y", "Local Z",
                LocalDate.now().plusDays(1), LocalTime.of(9, 0), new BigDecimal("150.00"), null);

        mockMvc.perform(put("/api/viagens/{id}", id)
                        .with(authentication(autenticacao))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // ---------- GET /api/viagens/{id} ----------

    @Test
    void buscarPorId_naoEncontrada_retorna404() throws Exception {
        UUID id = UUID.randomUUID();
        when(viagemService.buscarPorId(eq(id), eq(usuarioAutenticado)))
                .thenThrow(new ResourceNotFoundException("Viagem não encontrada: " + id));

        mockMvc.perform(get("/api/viagens/{id}", id).with(authentication(autenticacao)))
                .andExpect(status().isNotFound());
    }

    @Test
    void buscarPorId_viagemDeOutroUsuario_retorna403() throws Exception {
        UUID id = UUID.randomUUID();
        when(viagemService.buscarPorId(eq(id), eq(usuarioAutenticado)))
                .thenThrow(new UnauthorizedAcessException("Viagem não pertence ao usuário solicitante"));

        mockMvc.perform(get("/api/viagens/{id}", id).with(authentication(autenticacao)))
                .andExpect(status().isForbidden());
    }

    // ---------- PATCH /api/viagens/{id}/concluir ----------

    @Test
    void concluir_viagemValida_retorna200ComStatusAtualizado() throws Exception {
        UUID id = UUID.randomUUID();
        Viagem viagemConcluida = criarViagem(StatusViagem.CONCLUIDA);
        viagemConcluida.setId(id);
        when(viagemService.atualizarStatus(id, usuarioAutenticado, StatusViagem.CONCLUIDA))
                .thenReturn(viagemConcluida);

        mockMvc.perform(patch("/api/viagens/{id}/concluir", id).with(authentication(autenticacao)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONCLUIDA"));
    }

    // ---------- PATCH /api/viagens/{id}/avaliacao ----------

    @Test
    void avaliar_notaValida_retorna200() throws Exception {
        UUID id = UUID.randomUUID();
        Viagem viagem = criarViagem(StatusViagem.CONCLUIDA);
        viagem.setId(id);
        viagem.setAvaliacao(5);
        when(viagemService.avaliar(id, usuarioAutenticado, 5)).thenReturn(viagem);

        AvaliacaoRequest request = new AvaliacaoRequest(5);

        mockMvc.perform(patch("/api/viagens/{id}/avaliacao", id)
                        .with(authentication(autenticacao))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avaliacao").value(5));
    }

    @Test
    void avaliar_notaAcimaDoLimite_retorna400SemChegarNoService() throws Exception {
        // Este é o teste que a análise anterior sugeriu no lugar errado (no ViagemService).
        // A validação é do AvaliacaoRequest (@Max(5)), disparada aqui, na borda HTTP.
        UUID id = UUID.randomUUID();
        AvaliacaoRequest request = new AvaliacaoRequest(6);

        mockMvc.perform(patch("/api/viagens/{id}/avaliacao", id)
                        .with(authentication(autenticacao))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nota").exists());

        verifyNoInteractions(viagemService);
    }

    @Test
    void avaliar_notaAbaixoDoLimite_retorna400SemChegarNoService() throws Exception {
        UUID id = UUID.randomUUID();
        AvaliacaoRequest request = new AvaliacaoRequest(0);

        mockMvc.perform(patch("/api/viagens/{id}/avaliacao", id)
                        .with(authentication(autenticacao))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nota").exists());

        verifyNoInteractions(viagemService);
    }

    @Test
    void avaliar_notaNula_retorna400() throws Exception {
        UUID id = UUID.randomUUID();
        // corpo sem o campo "nota"
        String body = "{}";

        mockMvc.perform(patch("/api/viagens/{id}/avaliacao", id)
                        .with(authentication(autenticacao))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nota").exists());
    }

    @Test
    void avaliar_viagemAgendada_retorna409() throws Exception {
        UUID id = UUID.randomUUID();
        when(viagemService.avaliar(id, usuarioAutenticado, 5))
                .thenThrow(new InvalidStatusTransitionException("Só é possível avaliar viagens concluídas"));

        AvaliacaoRequest request = new AvaliacaoRequest(5);

        mockMvc.perform(patch("/api/viagens/{id}/avaliacao", id)
                        .with(authentication(autenticacao))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    // ---------- DELETE /api/viagens/{id} ----------

    @Test
    void remover_solicitanteDono_retorna204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(viagemService).remover(id, usuarioAutenticado);

        mockMvc.perform(delete("/api/viagens/{id}", id).with(authentication(autenticacao)))
                .andExpect(status().isNoContent());
    }
}
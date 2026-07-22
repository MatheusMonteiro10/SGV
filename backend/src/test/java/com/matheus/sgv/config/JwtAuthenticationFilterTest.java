package com.matheus.sgv.config;

import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.repository.UsuarioRepository;
import com.matheus.sgv.service.JwtService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/*
  Testa o JwtAuthenticationFilter isoladamente, sem passar pelo Spring MVC ou pelo restante
  da SecurityFilterChain. Isso cobre o que os testes de controller (que injetam Authentication
  diretamente via SecurityMockMvcRequestPostProcessors) contornam por completo: o parsing real
  do header Authorization, a validação do token e a busca do usuário no banco.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, usuarioRepository);
    }

    @AfterEach
    void limparContexto() {
        // O filtro popula um contexto estático (SecurityContextHolder); sem limpar isso aqui,
        // um teste poderia "vazar" autenticação para o próximo, mascarando falhas.
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilter_semHeaderAuthorization_naoAutenticaEContinuaChain() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(jwtService, usuarioRepository);
    }

    @Test
    void doFilter_headerSemPrefixoBearer_naoAutenticaEContinuaChain() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "token-sem-prefixo-bearer");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(jwtService, usuarioRepository);
    }

    @Test
    void doFilter_tokenInvalido_naoAutenticaEContinuaChain() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token-invalido");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.tokenValido("token-invalido")).thenReturn(false);

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(usuarioRepository, never()).findById(any());
    }

    @Test
    void doFilter_tokenValidoMasUsuarioNaoExisteMais_naoAutenticaEContinuaChain() throws Exception {
        UUID usuarioId = UUID.randomUUID();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token-valido");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.tokenValido("token-valido")).thenReturn(true);
        when(jwtService.extrairUsuarioId("token-valido")).thenReturn(usuarioId.toString());
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.empty());

        filter.doFilter(request, response, filterChain);

        // Cenário: token assinado corretamente, mas o usuário foi deletado depois
        // de o token ter sido emitido. O filtro deve deixar passar sem autenticar,
        // não lançar exceção — quem barra o acesso é a regra de autorização mais à frente.
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilter_tokenValidoEUsuarioExiste_autenticaEContinuaChain() throws Exception {
        UUID usuarioId = UUID.randomUUID();
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        usuario.setId(usuarioId);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token-valido");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.tokenValido("token-valido")).thenReturn(true);
        when(jwtService.extrairUsuarioId("token-valido")).thenReturn(usuarioId.toString());
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));

        filter.doFilter(request, response, filterChain);

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isEqualTo(usuario);
        assertThat(authentication.isAuthenticated()).isTrue();
        verify(filterChain).doFilter(request, response);
    }
}
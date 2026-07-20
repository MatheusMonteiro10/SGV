package com.matheus.sgv.service;

import com.matheus.sgv.exception.ResourceNotFoundException;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    private UsuarioService usuarioService;

    @BeforeEach
    void setUp() {
        usuarioService = new UsuarioService(usuarioRepository);
    }

    // ---------- buscar por Id ----------

    @Test
    void buscarPorId_usuarioExiste_retornaUsuario() {
        UUID id = UUID.randomUUID();
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        usuario.setId(id);
        when(usuarioRepository.findById(id)).thenReturn(Optional.of(usuario));

        Usuario resultado = usuarioService.buscarPorId(id);

        assertThat(resultado).isEqualTo(usuario);
    }

    @Test
    void buscarPorId_usuarioNaoExiste_lancaResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(usuarioRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> usuarioService.buscarPorId(id))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(id.toString());
    }

    // ---------- buscar por email ----------

    @Test
    void buscarPorEmail_usuarioExiste_retornaUsuario() {
        Usuario usuario = new Usuario("Ana", "ana@mail.com", "hash");
        when(usuarioRepository.findByEmail("ana@mail.com")).thenReturn(Optional.of(usuario));

        Usuario resultado = usuarioService.buscarPorEmail("ana@mail.com");

        assertThat(resultado).isEqualTo(usuario);
    }

    @Test
    void buscarPorEmail_usuarioNaoExiste_lancaResourceNotFoundException() {
        when(usuarioRepository.findByEmail("fantasma@mail.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> usuarioService.buscarPorEmail("fantasma@mail.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("fantasma@mail.com");
    }
}
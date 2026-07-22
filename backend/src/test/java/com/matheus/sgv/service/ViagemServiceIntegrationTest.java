package com.matheus.sgv.service;

import com.matheus.sgv.BaseIntegrationTest;
import com.matheus.sgv.exception.InvalidStatusTransitionException;
import com.matheus.sgv.exception.ResourceNotFoundException;
import com.matheus.sgv.exception.UnauthorizedAcessException;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.model.Viagem;
import com.matheus.sgv.model.enums.StatusViagem;
import com.matheus.sgv.repository.UsuarioRepository;
import com.matheus.sgv.repository.ViagemRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/*
  Testes de integração do ViagemService: Spring context real, Postgres real (Testcontainers).
  Foco em provar persistência via dirty checking (atualizarStatus e avaliar não chamam save()
  explicitamente) e em checagem de propriedade com usuários de fato persistidos no banco,
  não instâncias soltas em memória como nos unit tests com Mockito.
 */
@Transactional
class ViagemServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ViagemService viagemService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ViagemRepository viagemRepository;

    @Autowired
    private EntityManager entityManager;

    private Usuario dono;
    private Usuario outroUsuario;

    @BeforeEach
    void setUp() {
        dono = usuarioRepository.save(new Usuario("Ana", "ana.viagem@mail.com", "hash"));
        outroUsuario = usuarioRepository.save(new Usuario("Bruno", "bruno.viagem@mail.com", "hash"));
        entityManager.flush();
    }

    private Viagem registrarViagemPersistida(Usuario usuario, StatusViagem status) {
        Viagem viagem = viagemService.registrar(
                usuario, "Cliente X", "Destino Y", "Local Z",
                LocalDate.now().plusDays(1), LocalTime.of(9, 0), new BigDecimal("150.00"), null);

        if (status == StatusViagem.CONCLUIDA) {
            viagem.setStatusViagem(StatusViagem.CONCLUIDA);
        }
        entityManager.flush();
        entityManager.clear();
        return viagem;
    }

    @Test
    void registrar_persisteViagemNoBancoComUsuarioCorreto() {
        Viagem viagem = registrarViagemPersistida(dono, StatusViagem.AGENDADA);

        Viagem recarregada = viagemRepository.findById(viagem.getId()).orElseThrow();
        assertThat(recarregada.getUsuario().getId()).isEqualTo(dono.getId());
        assertThat(recarregada.getNomeCliente()).isEqualTo("Cliente X");
        assertThat(recarregada.getStatusViagem()).isEqualTo(StatusViagem.AGENDADA);
    }

    @Test
    void atualizarStatus_paraConcluida_persisteViaDirtyChecking() {
        Viagem viagem = registrarViagemPersistida(dono, StatusViagem.AGENDADA);

        viagemService.atualizarStatus(viagem.getId(), dono, StatusViagem.CONCLUIDA);

        entityManager.flush();
        entityManager.clear(); // força a próxima leitura a ir ao banco, não ao cache do contexto de persistência

        Viagem recarregada = viagemRepository.findById(viagem.getId()).orElseThrow();
        assertThat(recarregada.getStatusViagem())
                .as("status deveria ter sido persistido via dirty checking, sem chamada explícita a save()")
                .isEqualTo(StatusViagem.CONCLUIDA);
    }

    @Test
    void atualizarStatus_viagemDeOutroUsuario_lancaExceptionENaoAlteraBanco() {
        Viagem viagem = registrarViagemPersistida(dono, StatusViagem.AGENDADA);

        assertThatThrownBy(() -> viagemService.atualizarStatus(viagem.getId(), outroUsuario, StatusViagem.CONCLUIDA))
                .isInstanceOf(UnauthorizedAcessException.class);

        entityManager.flush();
        entityManager.clear();

        Viagem recarregada = viagemRepository.findById(viagem.getId()).orElseThrow();
        assertThat(recarregada.getStatusViagem()).isEqualTo(StatusViagem.AGENDADA);
    }

    @Test
    void avaliar_viagemConcluida_persisteAvaliacaoViaDirtyChecking() {
        Viagem viagem = registrarViagemPersistida(dono, StatusViagem.CONCLUIDA);

        viagemService.avaliar(viagem.getId(), dono, 5);

        entityManager.flush();
        entityManager.clear();

        Viagem recarregada = viagemRepository.findById(viagem.getId()).orElseThrow();
        assertThat(recarregada.getAvaliacao()).isEqualTo(5);
    }

    @Test
    void avaliar_viagemAgendada_lancaExceptionENaoPersisteAvaliacao() {
        Viagem viagem = registrarViagemPersistida(dono, StatusViagem.AGENDADA);

        assertThatThrownBy(() -> viagemService.avaliar(viagem.getId(), dono, 5))
                .isInstanceOf(InvalidStatusTransitionException.class);

        entityManager.flush();
        entityManager.clear();

        Viagem recarregada = viagemRepository.findById(viagem.getId()).orElseThrow();
        assertThat(recarregada.getAvaliacao()).isNull();
    }

    @Test
    void remover_solicitanteDono_removeViagemDoBanco() {
        Viagem viagem = registrarViagemPersistida(dono, StatusViagem.AGENDADA);
        UUID id = viagem.getId();

        viagemService.remover(id, dono);

        entityManager.flush();
        entityManager.clear();

        assertThat(viagemRepository.findById(id)).isEmpty();
    }

    @Test
    void remover_viagemDeOutroUsuario_lancaExceptionENaoRemoveDoBanco() {
        Viagem viagem = registrarViagemPersistida(dono, StatusViagem.AGENDADA);
        UUID id = viagem.getId();

        assertThatThrownBy(() -> viagemService.remover(id, outroUsuario))
                .isInstanceOf(UnauthorizedAcessException.class);

        entityManager.flush();
        entityManager.clear();

        assertThat(viagemRepository.findById(id)).isPresent();
    }

    @Test
    void buscarPorId_idInexistente_lancaResourceNotFoundException() {
        UUID idInexistente = UUID.randomUUID();

        assertThatThrownBy(() -> viagemService.buscarPorId(idInexistente, dono))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
package com.matheus.sgv.service;

import com.matheus.sgv.exception.InvalidStatusTransitionException;
import com.matheus.sgv.exception.ResourceNotFoundException;
import com.matheus.sgv.exception.UnauthorizedAcessException;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.model.Viagem;
import com.matheus.sgv.model.enums.StatusViagem;
import com.matheus.sgv.repository.ViagemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ViagemServiceTest {

    @Mock
    private ViagemRepository viagemRepository;

    private ViagemService viagemService;

    private Usuario dono;
    private Usuario outroUsuario;

    @BeforeEach
    void setUp() {
        viagemService = new ViagemService(viagemRepository);

        dono = new Usuario("Ana", "ana@mail.com", "hash");
        dono.setId(UUID.randomUUID());

        outroUsuario = new Usuario("Bruno", "bruno@mail.com", "hash");
        outroUsuario.setId(UUID.randomUUID());
    }

    private Viagem criarViagem(Usuario usuario, StatusViagem status) {
        Viagem viagem = new Viagem(usuario, "Cliente X", "Destino Y", "Local Z",
                LocalDate.now().plusDays(1), LocalTime.of(9, 0), new BigDecimal("150.00"), null);
        viagem.setId(UUID.randomUUID());
        viagem.setStatusViagem(status);
        return viagem;
    }

    // ---------- registrar ----------

    @Test
    void registrar_dadosValidos_salvaViagemComUsuarioCorreto() {
        when(viagemRepository.save(any(Viagem.class))).thenAnswer(inv -> inv.getArgument(0));

        Viagem resultado = viagemService.registrar(
                dono, "Cliente X", "Destino Y", "Local Z",
                LocalDate.now().plusDays(1), LocalTime.of(9, 0), new BigDecimal("150.00"), "obs");

        verify(viagemRepository).save(any(Viagem.class));

        assertThat(resultado.getUsuario()).isEqualTo(dono);
        assertThat(resultado.getNomeCliente()).isEqualTo("Cliente X");
        assertThat(resultado.getDestino()).isEqualTo("Destino Y");
        assertThat(resultado.getValorCobrado()).isEqualByComparingTo("150.00");
        assertThat(resultado.getStatusViagem()).isEqualTo(StatusViagem.AGENDADA);
    }

    // ---------- buscar por Id ----------

    @Test
    void buscarPorId_viagemNaoExiste_lancaResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(viagemRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> viagemService.buscarPorId(id, dono))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void buscarPorId_viagemNaoPertenceAoSolicitante_lancaUnauthorizedAcessException() {
        Viagem viagem = criarViagem(dono, StatusViagem.AGENDADA);
        when(viagemRepository.findById(viagem.getId())).thenReturn(Optional.of(viagem));

        assertThatThrownBy(() -> viagemService.buscarPorId(viagem.getId(), outroUsuario))
                .isInstanceOf(UnauthorizedAcessException.class);
    }

    @Test
    void buscarPorId_viagemPertenceAoSolicitante_retornaViagem() {
        Viagem viagem = criarViagem(dono, StatusViagem.AGENDADA);
        when(viagemRepository.findById(viagem.getId())).thenReturn(Optional.of(viagem));

        Viagem resultado = viagemService.buscarPorId(viagem.getId(), dono);

        assertThat(resultado).isEqualTo(viagem);
    }

    // ---------- listagens (delegação direta ao repository) ----------

    @Test
    void listarHistorico_delegaParaRepository() {
        List<Viagem> esperado = List.of(criarViagem(dono, StatusViagem.AGENDADA));
        when(viagemRepository.findByUsuarioOrderByDataPartidaDesc(dono)).thenReturn(esperado);

        List<Viagem> resultado = viagemService.listarHistorico(dono);

        assertThat(resultado).isEqualTo(esperado);
    }

    @Test
    void listarPorPeriodo_delegaParaRepository() {
        LocalDate inicio = LocalDate.now();
        LocalDate fim = inicio.plusDays(7);
        List<Viagem> esperado = List.of(criarViagem(dono, StatusViagem.AGENDADA));
        when(viagemRepository.findByUsuarioAndDataPartidaBetween(dono, inicio, fim)).thenReturn(esperado);

        List<Viagem> resultado = viagemService.listarPorPeriodo(dono, inicio, fim);

        assertThat(resultado).isEqualTo(esperado);
    }

    @Test
    void listarPorStatus_delegaParaRepository() {
        List<Viagem> esperado = List.of(criarViagem(dono, StatusViagem.CONCLUIDA));
        when(viagemRepository.findByUsuarioAndStatusViagem(dono, StatusViagem.CONCLUIDA)).thenReturn(esperado);

        List<Viagem> resultado = viagemService.listarPorStatus(dono, StatusViagem.CONCLUIDA);

        assertThat(resultado).isEqualTo(esperado);
    }

    @Test
    void listarParaDashboard_delegaParaRepository() {
        LocalDate inicio = LocalDate.now().minusDays(30);
        LocalDate fim = LocalDate.now();
        List<Viagem> esperado = List.of(criarViagem(dono, StatusViagem.CONCLUIDA));
        when(viagemRepository.findByUsuarioAndStatusViagemAndDataPartidaBetween(
                dono, StatusViagem.CONCLUIDA, inicio, fim)).thenReturn(esperado);

        List<Viagem> resultado = viagemService.listarParaDashboard(dono, StatusViagem.CONCLUIDA, inicio, fim);

        assertThat(resultado).isEqualTo(esperado);
    }

    // ---------- atualizar status ----------

    @Test
    void atualizarStatus_viagemNaoPertenceAoSolicitante_lancaUnauthorizedAcessException() {
        Viagem viagem = criarViagem(dono, StatusViagem.AGENDADA);
        when(viagemRepository.findById(viagem.getId())).thenReturn(Optional.of(viagem));

        assertThatThrownBy(() -> viagemService.atualizarStatus(viagem.getId(), outroUsuario, StatusViagem.CONCLUIDA))
                .isInstanceOf(UnauthorizedAcessException.class);

        assertThat(viagem.getStatusViagem()).isEqualTo(StatusViagem.AGENDADA);
    }

    @Test
    void atualizarStatus_solicitanteDono_alteraStatusViaDirtyChecking() {
        Viagem viagem = criarViagem(dono, StatusViagem.AGENDADA);
        when(viagemRepository.findById(viagem.getId())).thenReturn(Optional.of(viagem));

        Viagem resultado = viagemService.atualizarStatus(viagem.getId(), dono, StatusViagem.CONCLUIDA);

        assertThat(resultado.getStatusViagem()).isEqualTo(StatusViagem.CONCLUIDA);
        // Sem save explícito: dirty checking do JPA persiste no commit da transação real.
        verify(viagemRepository, never()).save(any());
    }

    // ---------- remover ----------

    @Test
    void remover_viagemNaoPertenceAoSolicitante_lancaUnauthorizedAcessExceptionENaoRemove() {
        Viagem viagem = criarViagem(dono, StatusViagem.AGENDADA);
        when(viagemRepository.findById(viagem.getId())).thenReturn(Optional.of(viagem));

        assertThatThrownBy(() -> viagemService.remover(viagem.getId(), outroUsuario))
                .isInstanceOf(UnauthorizedAcessException.class);

        verify(viagemRepository, never()).delete(any());
    }

    @Test
    void remover_solicitanteDono_removeViagem() {
        Viagem viagem = criarViagem(dono, StatusViagem.AGENDADA);
        when(viagemRepository.findById(viagem.getId())).thenReturn(Optional.of(viagem));

        viagemService.remover(viagem.getId(), dono);

        verify(viagemRepository).delete(viagem);
    }

    // ---------- avaliar ----------

    @Test
    void avaliar_viagemNaoPertenceAoSolicitante_lancaUnauthorizedAcessException() {
        Viagem viagem = criarViagem(dono, StatusViagem.CONCLUIDA);
        when(viagemRepository.findById(viagem.getId())).thenReturn(Optional.of(viagem));

        assertThatThrownBy(() -> viagemService.avaliar(viagem.getId(), outroUsuario, 5))
                .isInstanceOf(UnauthorizedAcessException.class);
    }

    @Test
    void avaliar_viagemAindaAgendada_lancaInvalidStatusTransitionException() {
        Viagem viagem = criarViagem(dono, StatusViagem.AGENDADA);
        when(viagemRepository.findById(viagem.getId())).thenReturn(Optional.of(viagem));

        assertThatThrownBy(() -> viagemService.avaliar(viagem.getId(), dono, 5))
                .isInstanceOf(InvalidStatusTransitionException.class)
                .hasMessage("Só é possível avaliar viagens concluídas");

        assertThat(viagem.getAvaliacao()).isNull();
    }

    @Test
    void avaliar_viagemConcluida_definesAvaliacao() {
        Viagem viagem = criarViagem(dono, StatusViagem.CONCLUIDA);
        when(viagemRepository.findById(viagem.getId())).thenReturn(Optional.of(viagem));

        Viagem resultado = viagemService.avaliar(viagem.getId(), dono, 4);

        assertThat(resultado.getAvaliacao()).isEqualTo(4);
    }
}
package com.matheus.sgv.service;

import com.matheus.sgv.exception.InvalidDepartureDateException;
import com.matheus.sgv.exception.UnauthorizedAcessException;
import com.matheus.sgv.exception.ResourceNotFoundException;
import com.matheus.sgv.exception.InvalidStatusTransitionException;
import com.matheus.sgv.model.Usuario;
import com.matheus.sgv.model.Viagem;
import com.matheus.sgv.model.enums.StatusViagem;
import com.matheus.sgv.repository.ViagemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class ViagemService {

    private final ViagemRepository viagemRepository;

    public ViagemService(ViagemRepository viagemRepository) {
        this.viagemRepository = viagemRepository;
    }

    @Transactional
    public Viagem registrar(Usuario usuario, String nomeCliente, String destino, String localPartida,
                            LocalDate dataPartida, LocalTime horarioPartida, BigDecimal valorCobrado,
                            String observacoes) {
        validarDataNaoPassada(dataPartida);
        Viagem viagem = new Viagem(usuario, nomeCliente, destino, localPartida,
                dataPartida, horarioPartida, valorCobrado, observacoes);
        return viagemRepository.save(viagem);
    }

    @Transactional(readOnly = true)
    public Viagem buscarPorId(UUID id, Usuario solicitante) {
        Viagem viagem = viagemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Viagem não encontrada: " + id));
        validarPropriedade(viagem, solicitante);
        return viagem;
    }

    @Transactional(readOnly = true)
    public List<Viagem> listarHistorico(Usuario usuario) {
        return viagemRepository.findByUsuarioOrderByDataPartidaDesc(usuario);
    }

    @Transactional(readOnly = true)
    public List<Viagem> listarPorPeriodo(Usuario usuario, LocalDate inicio, LocalDate fim) {
        return viagemRepository.findByUsuarioAndDataPartidaBetween(usuario, inicio, fim);
    }

    @Transactional(readOnly = true)
    public List<Viagem> listarPorStatus(Usuario usuario, StatusViagem status) {
        return viagemRepository.findByUsuarioAndStatusViagem(usuario, status);
    }

    @Transactional(readOnly = true)
    public List<Viagem> listarParaDashboard(Usuario usuario, StatusViagem status, LocalDate inicio, LocalDate fim) {
        return viagemRepository.findByUsuarioAndStatusViagemAndDataPartidaBetween(usuario, status, inicio, fim);
    }

    @Transactional
    public Viagem atualizarStatus(UUID id, Usuario solicitante, StatusViagem novoStatus) {
        Viagem viagem = buscarPorId(id, solicitante);
        viagem.setStatusViagem(novoStatus);
        return viagem; // dirty checking persiste o UPDATE ao final da transação
    }

    @Transactional
    public void remover(UUID id, Usuario solicitante) {
        Viagem viagem = buscarPorId(id, solicitante);
        viagemRepository.delete(viagem);
    }

    @Transactional
    public Viagem avaliar(UUID id, Usuario solicitante, Integer nota) {
        Viagem viagem = buscarPorId(id, solicitante);

        if (viagem.getStatusViagem() != StatusViagem.CONCLUIDA) {
            throw new InvalidStatusTransitionException("Só é possível avaliar viagens concluídas");
        }

        viagem.setAvaliacao(nota);
        return viagem;
    }

    @Transactional
    public Viagem atualizar(UUID id, Usuario solicitante, String nomeCliente, String destino, String localPartida,
                            LocalDate dataPartida, LocalTime horarioPartida, BigDecimal valorCobrado,
                            String observacoes) {
        Viagem viagem = buscarPorId(id, solicitante);

        // Só valida "não pode ser passado" quando a viagem permanece AGENDADA.
        // Viagens CONCLUIDA legitimamente têm dataPartida no passado.
        if (viagem.getStatusViagem() == StatusViagem.AGENDADA) {
            validarDataNaoPassada(dataPartida);
        }

        viagem.setNomeCliente(nomeCliente);
        viagem.setDestino(destino);
        viagem.setLocalPartida(localPartida);
        viagem.setDataPartida(dataPartida);
        viagem.setHorarioPartida(horarioPartida);
        viagem.setValorCobrado(valorCobrado);
        viagem.setObservacoes(observacoes);

        return viagem;
    }

    private void validarPropriedade(Viagem viagem, Usuario solicitante) {
        if (!viagem.getUsuario().getId().equals(solicitante.getId())) {
            throw new UnauthorizedAcessException("Viagem não pertence ao usuário solicitante");
        }
    }

    private void validarDataNaoPassada(LocalDate dataPartida) {
        if (dataPartida.isBefore(LocalDate.now())) {
            throw new InvalidDepartureDateException("Não é possível agendar viagem para uma data anterior a hoje");
        }
    }
}
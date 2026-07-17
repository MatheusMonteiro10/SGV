package com.matheus.sgv.dto.viagem;

import com.matheus.sgv.model.Viagem;
import com.matheus.sgv.model.enums.StatusViagem;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

public record ViagemResponse(
        UUID id,
        String nomeCliente,
        String destino,
        String localPartida,
        LocalDate dataPartida,
        LocalTime horarioPartida,
        BigDecimal valorCobrado,
        String observacoes,
        StatusViagem status,
        Integer avaliacao,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ViagemResponse from(Viagem viagem) {
        return new ViagemResponse(
                viagem.getId(),
                viagem.getNomeCliente(),
                viagem.getDestino(),
                viagem.getLocalPartida(),
                viagem.getDataPartida(),
                viagem.getHorarioPartida(),
                viagem.getValorCobrado(),
                viagem.getObservacoes(),
                viagem.getStatusViagem(),
                viagem.getAvaliacao(),
                viagem.getCreatedAt(),
                viagem.getUpdatedAt()
        );
    }
}
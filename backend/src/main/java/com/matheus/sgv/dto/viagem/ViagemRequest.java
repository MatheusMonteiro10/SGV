package com.matheus.sgv.dto.viagem;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record ViagemRequest(
        @NotBlank(message = "Nome do cliente é obrigatório")
        @Size(max = 150)
        String nomeCliente,

        @NotBlank(message = "Destino é obrigatório")
        @Size(max = 150)
        String destino,

        @NotBlank(message = "Local de partida é obrigatório")
        @Size(max = 150)
        String localPartida,

        @NotNull(message = "Data de partida é obrigatória")
        LocalDate dataPartida,

        @NotNull(message = "Horário de partida é obrigatório")
        LocalTime horarioPartida,

        @NotNull(message = "Valor cobrado é obrigatório")
        @DecimalMin(value = "0.0", inclusive = false, message = "Valor deve ser maior que zero")
        @Digits(integer = 8, fraction = 2)
        BigDecimal valorCobrado,

        String observacoes
) {
}
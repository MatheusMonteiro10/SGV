package com.matheus.sgv.dto.viagem;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AvaliacaoRequest(
        @NotNull(message = "Avaliação é obrigatória")
        @Min(value = 1, message = "Avaliação deve ser entre 1 e 5")
        @Max(value = 5, message = "Avaliação deve ser entre 1 e 5")
        Integer nota
) { }
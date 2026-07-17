package com.matheus.sgv.dto.auth;

import com.matheus.sgv.dto.usuario.UsuarioResponse;

public record LoginResponse(
        String token,
        UsuarioResponse usuario
) {
}
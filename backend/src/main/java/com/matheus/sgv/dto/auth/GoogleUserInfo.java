package com.matheus.sgv.dto.auth;

public record GoogleUserInfo(
        String googleId,
        String email,
        String nome
) { }
package com.matheus.sgv.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.matheus.sgv.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private final Algorithm algoritmo;
    private final long expiracaoMs;

    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.expiration-ms}") long expiracaoMs) {
        this.algoritmo = Algorithm.HMAC256(secret);
        this.expiracaoMs = expiracaoMs;
    }

    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now();

        return JWT.create()
                .withSubject(usuario.getId().toString())
                .withClaim("email", usuario.getEmail())
                .withIssuedAt(Date.from(agora))
                .withExpiresAt(Date.from(agora.plusMillis(expiracaoMs)))
                .sign(algoritmo);
    }

    public String extrairUsuarioId(String token) {
        return verificar(token).getSubject();
    }

    public boolean tokenValido(String token) {
        try {
            verificar(token);
            return true;
        } catch (JWTVerificationException e) {
            return false;
        }
    }

    private DecodedJWT verificar(String token) {
        return JWT.require(algoritmo)
                .build()
                .verify(token);
    }
}
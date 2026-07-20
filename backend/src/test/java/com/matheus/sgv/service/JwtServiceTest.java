package com.matheus.sgv.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.matheus.sgv.model.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "segredo-de-teste-nao-usar-em-producao";
    private static final long EXPIRACAO_MS = 3_600_000; // 1 hora

    private JwtService jwtService;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRACAO_MS);

        usuario = new Usuario("Ana", "ana@mail.com", "hash");
        usuario.setId(UUID.randomUUID());
    }

    @Test
    void gerarToken_contemSubjectEEmailCorretos() {
        String token = jwtService.gerarToken(usuario);

        var decoded = JWT.decode(token);
        assertThat(decoded.getSubject()).isEqualTo(usuario.getId().toString());
        assertThat(decoded.getClaim("email").asString()).isEqualTo("ana@mail.com");
    }

    @Test
    void gerarToken_expiracaoRespeitaConfiguracao() {
        Instant antes = Instant.now();
        String token = jwtService.gerarToken(usuario);
        Instant depois = Instant.now();

        var decoded = JWT.decode(token);
        Instant expiraEm = decoded.getExpiresAtAsInstant();

        // expiraEm deve estar entre (antes + EXPIRACAO_MS) e (depois + EXPIRACAO_MS),
        // com folga de 1s pra absorver o tempo de execução do teste em si.
        assertThat(expiraEm).isAfterOrEqualTo(antes.plusMillis(EXPIRACAO_MS).minusSeconds(1));
        assertThat(expiraEm).isBeforeOrEqualTo(depois.plusMillis(EXPIRACAO_MS).plusSeconds(1));
    }

    @Test
    void extrairUsuarioId_tokenValido_retornaIdCorreto() {
        String token = jwtService.gerarToken(usuario);

        String idExtraido = jwtService.extrairUsuarioId(token);

        assertThat(idExtraido).isEqualTo(usuario.getId().toString());
    }

    @Test
    void tokenValido_tokenGeradoPeloServico_retornaTrue() {
        String token = jwtService.gerarToken(usuario);

        assertThat(jwtService.tokenValido(token)).isTrue();
    }

    @Test
    void tokenValido_tokenMalformado_retornaFalse() {
        assertThat(jwtService.tokenValido("isto-nao-e-um-jwt")).isFalse();
    }

    @Test
    void tokenValido_tokenVazio_retornaFalse() {
        assertThat(jwtService.tokenValido("")).isFalse();
    }

    @Test
    void tokenValido_assinadoComChaveDiferente_retornaFalse() {
        String tokenComOutraChave = JWT.create()
                .withSubject(usuario.getId().toString())
                .withClaim("email", usuario.getEmail())
                .withIssuedAt(Date.from(Instant.now()))
                .withExpiresAt(Date.from(Instant.now().plusMillis(EXPIRACAO_MS)))
                .sign(Algorithm.HMAC256("outro-segredo-completamente-diferente"));

        assertThat(jwtService.tokenValido(tokenComOutraChave)).isFalse();
    }

    @Test
    void tokenValido_tokenExpirado_retornaFalse() {
        String tokenExpirado = JWT.create()
                .withSubject(usuario.getId().toString())
                .withClaim("email", usuario.getEmail())
                .withIssuedAt(Date.from(Instant.now().minusSeconds(120)))
                .withExpiresAt(Date.from(Instant.now().minusSeconds(60))) // expirou há 1 minuto
                .sign(Algorithm.HMAC256(SECRET)); // mesma chave, então só a expiração invalida

        assertThat(jwtService.tokenValido(tokenExpirado)).isFalse();
    }

    @Test
    void extrairUsuarioId_tokenAdulterado_lancaJWTVerificationException() {
        String token = jwtService.gerarToken(usuario);
        String tokenAdulterado = token.substring(0, token.length() - 2) + "xx";

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jwtService.extrairUsuarioId(tokenAdulterado))
                .isInstanceOf(com.auth0.jwt.exceptions.JWTVerificationException.class);
    }
}
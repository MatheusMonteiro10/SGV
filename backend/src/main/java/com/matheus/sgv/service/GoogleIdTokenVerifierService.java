package com.matheus.sgv.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.matheus.sgv.dto.auth.GoogleUserInfo;
import com.matheus.sgv.exception.InvalidCredentialsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
public class GoogleIdTokenVerifierService implements GoogleAuthService {

    private final GoogleIdTokenVerifier verifier;

    public GoogleIdTokenVerifierService(@Value("${google.client-id}") String clientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    @Override
    public GoogleUserInfo verificarToken(String idTokenString) {
        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(idTokenString);
        } catch (GeneralSecurityException | IOException e) {
            throw new InvalidCredentialsException("Falha ao verificar token do Google");
        }

        if (idToken == null) {
            throw new InvalidCredentialsException("Token do Google inválido ou expirado");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String nome = (String) payload.get("name");

        return new GoogleUserInfo(payload.getSubject(), payload.getEmail(), nome);
    }
}
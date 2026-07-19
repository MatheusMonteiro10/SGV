package com.matheus.sgv.service;

import com.matheus.sgv.dto.auth.GoogleUserInfo;

public interface GoogleAuthService {
    GoogleUserInfo verificarToken(String idTokenString);
}
package com.matheus.sgv.exception;

public class PasswordResetNotAllowedException extends RuntimeException {
    public PasswordResetNotAllowedException(String message) {
        super(message);
    }
}

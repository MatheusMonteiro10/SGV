package com.matheus.sgv.exception;

public class UnauthorizedAcessException extends RuntimeException {
    public UnauthorizedAcessException(String message) {
        super(message);
    }
}

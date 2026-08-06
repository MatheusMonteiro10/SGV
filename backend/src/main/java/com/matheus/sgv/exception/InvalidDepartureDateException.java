package com.matheus.sgv.exception;

public class InvalidDepartureDateException extends RuntimeException {
    public InvalidDepartureDateException(String message) {
        super(message);
    }
}

package io.settler.exceptions;

/**
 * Exception thrown when authentication fails.
 * This includes invalid API keys, expired tokens, or missing credentials.
 */
public class AuthException extends SettlerException {

    public AuthException(String message) {
        super(message, 401, "unauthorized", null);
    }

    public AuthException(String message, Throwable cause) {
        super(message, cause, 401, "unauthorized", null);
    }

    public AuthException(String message, String requestId) {
        super(message, 401, "unauthorized", requestId);
    }
}

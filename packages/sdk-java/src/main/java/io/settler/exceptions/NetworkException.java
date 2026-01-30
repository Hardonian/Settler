package io.settler.exceptions;

/**
 * Exception thrown when a network error occurs while communicating with the Settler API.
 * This includes connection timeouts, DNS resolution failures, and other transport-level errors.
 */
public class NetworkException extends SettlerException {
    private final boolean retryable;

    public NetworkException(String message) {
        super(message);
        this.retryable = true;
    }

    public NetworkException(String message, Throwable cause) {
        super(message, cause);
        this.retryable = true;
    }

    public NetworkException(String message, Throwable cause, boolean retryable) {
        super(message, cause);
        this.retryable = retryable;
    }

    /**
     * Indicates whether this error is potentially transient and the request could be retried.
     *
     * @return true if the request can be retried, false otherwise
     */
    public boolean isRetryable() {
        return retryable;
    }
}

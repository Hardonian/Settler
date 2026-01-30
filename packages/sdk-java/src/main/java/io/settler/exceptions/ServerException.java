package io.settler.exceptions;

/**
 * Exception thrown when the Settler API server encounters an internal error.
 * These are typically transient errors that can be retried.
 */
public class ServerException extends SettlerException {
    private final boolean retryable;

    public ServerException(String message) {
        super(message, 500, "internal_server_error", null);
        this.retryable = true;
    }

    public ServerException(String message, int statusCode) {
        super(message, statusCode, "internal_server_error", null);
        this.retryable = statusCode >= 500 && statusCode < 600;
    }

    public ServerException(String message, int statusCode, String requestId) {
        super(message, statusCode, "internal_server_error", requestId);
        this.retryable = statusCode >= 500 && statusCode < 600;
    }

    public ServerException(String message, Throwable cause, int statusCode, String requestId) {
        super(message, cause, statusCode, "internal_server_error", requestId);
        this.retryable = statusCode >= 500 && statusCode < 600;
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

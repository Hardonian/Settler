package io.settler.exceptions;

/**
 * Base exception for all Settler API errors.
 * All other exceptions in the SDK extend this class.
 */
public class SettlerException extends Exception {
    private final int statusCode;
    private final String errorCode;
    private final String requestId;

    public SettlerException(String message) {
        super(message);
        this.statusCode = 0;
        this.errorCode = null;
        this.requestId = null;
    }

    public SettlerException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 0;
        this.errorCode = null;
        this.requestId = null;
    }

    public SettlerException(String message, int statusCode, String errorCode, String requestId) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.requestId = requestId;
    }

    public SettlerException(String message, Throwable cause, int statusCode, String errorCode, String requestId) {
        super(message, cause);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.requestId = requestId;
    }

    /**
     * Gets the HTTP status code associated with this error.
     *
     * @return the HTTP status code, or 0 if not applicable
     */
    public int getStatusCode() {
        return statusCode;
    }

    /**
     * Gets the error code returned by the API.
     *
     * @return the error code, or null if not available
     */
    public String getErrorCode() {
        return errorCode;
    }

    /**
     * Gets the request ID for debugging purposes.
     *
     * @return the request ID, or null if not available
     */
    public String getRequestId() {
        return requestId;
    }
}

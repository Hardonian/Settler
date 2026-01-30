package io.settler.exceptions;

/**
 * Exception thrown when request validation fails.
 * This includes missing required parameters, invalid data types, or constraint violations.
 */
public class ValidationException extends SettlerException {
    private final String field;

    public ValidationException(String message) {
        super(message, 400, "bad_request", null);
        this.field = null;
    }

    public ValidationException(String message, String field) {
        super(message, 400, "bad_request", null);
        this.field = field;
    }

    public ValidationException(String message, String field, String requestId) {
        super(message, 400, "bad_request", requestId);
        this.field = field;
    }

    /**
     * Gets the field that failed validation, if applicable.
     *
     * @return the field name, or null if not field-specific
     */
    public String getField() {
        return field;
    }
}

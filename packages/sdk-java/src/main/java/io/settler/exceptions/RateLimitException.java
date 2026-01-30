package io.settler.exceptions;

import java.time.Duration;
import java.time.Instant;

/**
 * Exception thrown when API rate limits are exceeded.
 * Contains information about when the rate limit resets.
 */
public class RateLimitException extends SettlerException {
    private final Instant resetTime;
    private final int retryAfter;

    public RateLimitException(String message) {
        super(message, 429, "rate_limit_exceeded", null);
        this.resetTime = null;
        this.retryAfter = 0;
    }

    public RateLimitException(String message, int retryAfter) {
        super(message, 429, "rate_limit_exceeded", null);
        this.retryAfter = retryAfter;
        this.resetTime = Instant.now().plus(Duration.ofSeconds(retryAfter));
    }

    public RateLimitException(String message, int retryAfter, String requestId) {
        super(message, 429, "rate_limit_exceeded", requestId);
        this.retryAfter = retryAfter;
        this.resetTime = Instant.now().plus(Duration.ofSeconds(retryAfter));
    }

    /**
     * Gets the time when the rate limit resets.
     *
     * @return the reset time, or null if unknown
     */
    public Instant getResetTime() {
        return resetTime;
    }

    /**
     * Gets the number of seconds to wait before retrying.
     *
     * @return the retry-after value in seconds, or 0 if unknown
     */
    public int getRetryAfter() {
        return retryAfter;
    }
}

"""Circuit breaker, retry, rate limiting, and bulkhead patterns.

Production-grade fault tolerance patterns for distributed systems.
"""

import functools
import random
import threading
import time
from collections.abc import Callable
from contextlib import contextmanager
from dataclasses import dataclass
from enum import Enum
from typing import Any


class CircuitState(Enum):
    """States of a circuit breaker."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker."""

    failure_threshold: int = 5
    recovery_timeout: float = 60.0
    half_open_max_calls: int = 3
    success_threshold: int = 2


class CircuitBreaker:
    """Circuit breaker pattern implementation.

    Prevents cascade failures by temporarily blocking calls to failing services.

    Example:
        breaker = CircuitBreaker("external_api", CircuitBreakerConfig())

        @breaker
        def call_external_api():
            # If this fails 5 times, circuit opens
            return requests.get("https://api.example.com")

        # After 60s, circuit goes half-open
        # If 2 consecutive calls succeed, circuit closes
    """

    def __init__(self, name: str, config: CircuitBreakerConfig | None = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitState.CLOSED
        self._failures = 0
        self._successes = 0
        self._last_failure_time: float | None = None
        self._half_open_calls = 0
        self._lock = threading.Lock()

    def can_execute(self) -> bool:
        """Check if execution is allowed."""
        with self._lock:
            if self.state == CircuitState.CLOSED:
                return True
            elif self.state == CircuitState.OPEN:
                if time.time() - (self._last_failure_time or 0) > self.config.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    self._half_open_calls = 0
                    return True
                return False
            else:  # HALF_OPEN
                return self._half_open_calls < self.config.half_open_max_calls

    def record_success(self):
        """Record a successful execution."""
        with self._lock:
            if self.state == CircuitState.HALF_OPEN:
                self._successes += 1
                if self._successes >= self.config.success_threshold:
                    self.state = CircuitState.CLOSED
                    self._failures = 0
                    self._successes = 0
            else:
                self._failures = 0

    def record_failure(self):
        """Record a failed execution."""
        with self._lock:
            self._failures += 1
            self._last_failure_time = time.time()

            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.OPEN
                self._successes = 0
            elif self._failures >= self.config.failure_threshold:
                self.state = CircuitState.OPEN

    def __call__(self, func: Callable) -> Callable:
        """Decorator to wrap a function with circuit breaker."""

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if not self.can_execute():
                raise Exception(f"Circuit breaker '{self.name}' is OPEN")

            try:
                result = func(*args, **kwargs)
                self.record_success()
                return result
            except Exception as e:
                self.record_failure()
                raise e

        return wrapper

    def get_state(self) -> dict[str, Any]:
        """Get current circuit breaker state."""
        with self._lock:
            return {
                "name": self.name,
                "state": self.state.value,
                "failures": self._failures,
                "successes": self._successes,
                "last_failure": self._last_failure_time,
            }


@dataclass
class RetryConfig:
    """Configuration for retry executor."""

    max_attempts: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    exponential_base: float = 2.0
    jitter: bool = True
    retryable_exceptions: set[type[Exception]] | None = None


class RetryExecutor:
    """Retry executor with exponential backoff and jitter.

    Example:
        retry = RetryExecutor(RetryConfig(max_attempts=5, base_delay=2.0))

        @retry
        def flaky_operation():
            # Will retry up to 5 times with exponential backoff
            return call_unreliable_service()
    """

    def __init__(self, config: RetryConfig | None = None):
        self.config = config or RetryConfig()

    def calculate_delay(self, attempt: int) -> float:
        """Calculate delay for a retry attempt."""
        # Exponential backoff
        delay = self.config.base_delay * (self.config.exponential_base**attempt)
        delay = min(delay, self.config.max_delay)

        # Add jitter (±25%)
        if self.config.jitter:
            jitter_amount = delay * 0.25
            delay = delay + random.uniform(-jitter_amount, jitter_amount)

        return max(0, delay)

    def should_retry(self, exception: Exception) -> bool:
        """Check if exception is retryable."""
        if self.config.retryable_exceptions is None:
            return True
        return type(exception) in self.config.retryable_exceptions

    def execute(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with retry logic."""
        last_exception = None

        for attempt in range(self.config.max_attempts):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e

                if not self.should_retry(e):
                    raise

                if attempt < self.config.max_attempts - 1:
                    delay = self.calculate_delay(attempt)
                    time.sleep(delay)

        raise last_exception

    def __call__(self, func: Callable) -> Callable:
        """Decorator to wrap a function with retry logic."""

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return self.execute(func, *args, **kwargs)

        return wrapper


@dataclass
class RateLimitConfig:
    """Configuration for rate limiter."""

    max_requests: int = 100
    window_seconds: float = 60.0


class RateLimiter:
    """Token bucket rate limiter.

    Limits requests to prevent overwhelming downstream services.

    Example:
        limiter = RateLimiter(RateLimitConfig(max_requests=10, window_seconds=1.0))

        @limiter
        def api_call():
            # Max 10 calls per second
            return requests.get("https://api.example.com")
    """

    def __init__(self, config: RateLimitConfig):
        self.config = config
        self._buckets: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def _clean_old_requests(self, key: str):
        """Remove requests outside the time window."""
        now = time.time()
        cutoff = now - self.config.window_seconds

        if key in self._buckets:
            self._buckets[key] = [t for t in self._buckets[key] if t > cutoff]

    def is_allowed(self, key: str = "default") -> bool:
        """Check if request is allowed."""
        with self._lock:
            self._clean_old_requests(key)

            if key not in self._buckets:
                self._buckets[key] = []

            if len(self._buckets[key]) < self.config.max_requests:
                self._buckets[key].append(time.time())
                return True

            return False

    def __call__(self, func: Callable) -> Callable:
        """Decorator to wrap a function with rate limiting."""

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if not self.is_allowed():
                raise Exception("Rate limit exceeded")
            return func(*args, **kwargs)

        return wrapper

    def get_remaining(self, key: str = "default") -> int:
        """Get remaining requests in window."""
        with self._lock:
            self._clean_old_requests(key)
            return max(0, self.config.max_requests - len(self._buckets.get(key, [])))


class Bulkhead:
    """Bulkhead pattern - isolate resources.

    Limits concurrent operations to prevent resource exhaustion.
    """

    def __init__(self, max_concurrent: int = 10, max_queue: int = 100):
        self.max_concurrent = max_concurrent
        self.max_queue = max_queue
        self._semaphore = threading.Semaphore(max_concurrent)
        self._queue_size = 0
        self._lock = threading.Lock()

    @contextmanager
    def acquire(self, timeout: float | None = None):
        """Acquire bulkhead slot."""
        acquired = False
        try:
            # Check queue size
            with self._lock:
                if self._queue_size >= self.max_queue:
                    raise Exception("Bulkhead queue full")
                self._queue_size += 1

            # Acquire semaphore
            acquired = self._semaphore.acquire(timeout=timeout)
            if not acquired:
                raise TimeoutError("Bulkhead acquisition timeout")

            yield self
        finally:
            if acquired:
                self._semaphore.release()
            with self._lock:
                self._queue_size = max(0, self._queue_size - 1)

    def get_metrics(self) -> dict[str, int]:
        """Get bulkhead metrics."""
        with self._lock:
            return {
                "max_concurrent": self.max_concurrent,
                "max_queue": self.max_queue,
                "queue_size": self._queue_size,
                "available_slots": self._semaphore._value,  # type: ignore
            }


# Decorator functions for easy use


def circuit_breaker(config: CircuitBreakerConfig | None = None):
    """Create a circuit breaker decorator."""
    breaker = CircuitBreaker("default", config)

    def decorator(func: Callable) -> Callable:
        return breaker(func)

    return decorator


def retry(config: RetryConfig | None = None):
    """Create a retry decorator."""
    executor = RetryExecutor(config)

    def decorator(func: Callable) -> Callable:
        return executor(func)

    return decorator


def rate_limit(config: RateLimitConfig | None = None):
    """Create a rate limiter decorator."""
    limiter = RateLimiter(config or RateLimitConfig())

    def decorator(func: Callable) -> Callable:
        return limiter(func)

    return decorator


# Global circuit breaker registry
_circuit_breakers: dict[str, CircuitBreaker] = {}


def get_circuit_breaker(name: str, config: CircuitBreakerConfig | None = None) -> CircuitBreaker:
    """Get or create a named circuit breaker."""
    if name not in _circuit_breakers:
        _circuit_breakers[name] = CircuitBreaker(name, config)
    return _circuit_breakers[name]


def get_all_circuit_breaker_states() -> list[dict[str, Any]]:
    """Get states of all circuit breakers."""
    return [cb.get_state() for cb in _circuit_breakers.values()]


# Export public API
__all__ = [
    # Classes
    "CircuitBreaker",
    "CircuitBreakerConfig",
    "CircuitState",
    "RetryExecutor",
    "RetryConfig",
    "RateLimiter",
    "RateLimitConfig",
    "Bulkhead",
    # Functions
    "circuit_breaker",
    "retry",
    "rate_limit",
    "get_circuit_breaker",
    "get_all_circuit_breaker_states",
]

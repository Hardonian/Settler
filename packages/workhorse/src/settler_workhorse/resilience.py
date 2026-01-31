"""
Resilience - Circuit breakers, retries, and fault tolerance.

Implements enterprise-grade resilience patterns:
- Circuit Breaker (prevent cascade failures)
- Retry with exponential backoff
- Bulkhead (isolate resources)
- Timeout management
- Rate limiting
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union
import asyncio
import random
import threading
import time
from contextlib import contextmanager


class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration.
    
    Attributes:
        failure_threshold: Number of failures before opening circuit
        recovery_timeout: Seconds to wait before trying recovery
        half_open_max_calls: Max calls allowed in half-open state
        success_threshold: Consecutive successes to close circuit
        name: Circuit breaker name
    """
    failure_threshold: int = 5
    recovery_timeout: float = 30.0
    half_open_max_calls: int = 3
    success_threshold: int = 2
    name: str = "default"


class CircuitBreaker:
    """Circuit breaker implementation.
    
    Prevents cascade failures by stopping requests to failing services.
    """
    
    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.half_open_calls = 0
        self._lock = threading.RLock()
    
    def can_execute(self) -> bool:
        """Check if execution is allowed."""
        with self._lock:
            if self.state == CircuitState.CLOSED:
                return True
            
            if self.state == CircuitState.OPEN:
                # Check if recovery timeout has passed
                if self.last_failure_time:
                    elapsed = (datetime.utcnow() - self.last_failure_time).total_seconds()
                    if elapsed >= self.config.recovery_timeout:
                        self.state = CircuitState.HALF_OPEN
                        self.half_open_calls = 0
                        return True
                return False
            
            if self.state == CircuitState.HALF_OPEN:
                if self.half_open_calls < self.config.half_open_max_calls:
                    self.half_open_calls += 1
                    return True
                return False
            
            return True
    
    def record_success(self) -> None:
        """Record successful execution."""
        with self._lock:
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.config.success_threshold:
                    self._reset()
            else:
                self.failure_count = 0
    
    def record_failure(self) -> None:
        """Record failed execution."""
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = datetime.utcnow()
            
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.OPEN
                self.half_open_calls = 0
            elif self.failure_count >= self.config.failure_threshold:
                self.state = CircuitState.OPEN
    
    def _reset(self) -> None:
        """Reset circuit breaker to closed state."""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.half_open_calls = 0
        self.last_failure_time = None
    
    def get_state(self) -> Dict[str, Any]:
        """Get current state information."""
        with self._lock:
            return {
                "name": self.config.name,
                "state": self.state.value,
                "failure_count": self.failure_count,
                "success_count": self.success_count,
                "last_failure_time": self.last_failure_time.isoformat() if self.last_failure_time else None,
            }


T = TypeVar("T")


class RetryConfig:
    """Retry configuration.
    
    Attributes:
        max_attempts: Maximum number of retry attempts
        base_delay: Initial delay between retries (seconds)
        max_delay: Maximum delay between retries (seconds)
        exponential_base: Exponential backoff multiplier
        retryable_exceptions: Exception types to retry
        on_retry: Callback function on retry
    """
    
    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        retryable_exceptions: Optional[List[type]] = None,
        on_retry: Optional[Callable[[int, Exception], None]] = None,
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.retryable_exceptions = retryable_exceptions or [Exception]
        self.on_retry = on_retry
    
    def calculate_delay(self, attempt: int) -> float:
        """Calculate delay for retry attempt with jitter."""
        delay = self.base_delay * (self.exponential_base ** (attempt - 1))
        delay = min(delay, self.max_delay)
        # Add jitter (±25%)
        jitter = delay * 0.25 * (2 * random.random() - 1)
        return delay + jitter


class RetryExecutor:
    """Execute functions with retry logic."""
    
    def __init__(self, config: RetryConfig):
        self.config = config
    
    def execute(
        self,
        func: Callable[..., T],
        *args: Any,
        **kwargs: Any
    ) -> T:
        """Execute function with retries."""
        last_exception: Optional[Exception] = None
        
        for attempt in range(1, self.config.max_attempts + 1):
            try:
                return func(*args, **kwargs)
            except tuple(self.config.retryable_exceptions) as e:
                last_exception = e
                
                if attempt == self.config.max_attempts:
                    break
                
                # Call retry callback
                if self.config.on_retry:
                    self.config.on_retry(attempt, e)
                
                # Calculate and wait delay
                delay = self.config.calculate_delay(attempt)
                time.sleep(delay)
        
        # All retries exhausted
        raise last_exception or Exception("All retry attempts failed")
    
    async def execute_async(
        self,
        func: Callable[..., Any],
        *args: Any,
        **kwargs: Any
    ) -> T:
        """Execute async function with retries."""
        last_exception: Optional[Exception] = None
        
        for attempt in range(1, self.config.max_attempts + 1):
            try:
                return await func(*args, **kwargs)
            except tuple(self.config.retryable_exceptions) as e:
                last_exception = e
                
                if attempt == self.config.max_attempts:
                    break
                
                if self.config.on_retry:
                    self.config.on_retry(attempt, e)
                
                delay = self.config.calculate_delay(attempt)
                await asyncio.sleep(delay)
        
        raise last_exception or Exception("All retry attempts failed")


@dataclass
class RateLimitConfig:
    """Rate limiter configuration."""
    max_requests: int = 100
    window_seconds: float = 60.0
    key_func: Optional[Callable[[], str]] = None


class RateLimiter:
    """Token bucket rate limiter."""
    
    def __init__(self, config: RateLimitConfig):
        self.config = config
        self._buckets: Dict[str, List[datetime]] = {}
        self._lock = threading.RLock()
    
    def is_allowed(self, key: Optional[str] = None) -> bool:
        """Check if request is allowed under rate limit."""
        if key is None and self.config.key_func:
            key = self.config.key_func()
        if key is None:
            key = "default"
        
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=self.config.window_seconds)
        
        with self._lock:
            # Get or create bucket
            if key not in self._buckets:
                self._buckets[key] = []
            
            # Remove old entries
            self._buckets[key] = [
                ts for ts in self._buckets[key]
                if ts > window_start
            ]
            
            # Check if under limit
            if len(self._buckets[key]) < self.config.max_requests:
                self._buckets[key].append(now)
                return True
            
            return False
    
    def get_remaining(self, key: Optional[str] = None) -> int:
        """Get remaining requests in current window."""
        if key is None and self.config.key_func:
            key = self.config.key_func()
        if key is None:
            key = "default"
        
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=self.config.window_seconds)
        
        with self._lock:
            if key not in self._buckets:
                return self.config.max_requests
            
            # Clean old entries
            self._buckets[key] = [
                ts for ts in self._buckets[key]
                if ts > window_start
            ]
            
            return max(0, self.config.max_requests - len(self._buckets[key]))


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
def acquire(self, timeout: Optional[float] = None):
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
    
    def get_metrics(self) -> Dict[str, int]:
        """Get current bulkhead metrics."""
        with self._lock:
            return {
                "max_concurrent": self.max_concurrent,
                "available": self._semaphore._value,  # type: ignore
                "queue_size": self._queue_size,
                "max_queue": self.max_queue,
            }


# Decorators for easy usage

def circuit_breaker(config: Optional[CircuitBreakerConfig] = None):
    """Decorator to add circuit breaker to function."""
    breaker = CircuitBreaker(config or CircuitBreakerConfig())
    
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            if not breaker.can_execute():
                raise Exception(f"Circuit breaker '{breaker.config.name}' is OPEN")
            
            try:
                result = func(*args, **kwargs)
                breaker.record_success()
                return result
            except Exception as e:
                breaker.record_failure()
                raise e
        
        wrapper._circuit_breaker = breaker  # type: ignore
        return wrapper
    return decorator


def retry(config: Optional[RetryConfig] = None):
    """Decorator to add retry logic to function."""
    executor = RetryExecutor(config or RetryConfig())
    
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            return executor.execute(func, *args, **kwargs)
        return wrapper
    return decorator


def rate_limit(config: Optional[RateLimitConfig] = None):
    """Decorator to add rate limiting to function."""
    limiter = RateLimiter(config or RateLimitConfig())
    
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            if not limiter.is_allowed():
                raise Exception("Rate limit exceeded")
            return func(*args, **kwargs)
        return wrapper
    return decorator


# Global registry
_circuit_breakers: Dict[str, CircuitBreaker] = {}


def get_circuit_breaker(name: str, config: Optional[CircuitBreakerConfig] = None) -> CircuitBreaker:
    """Get or create circuit breaker by name."""
    if name not in _circuit_breakers:
        cfg = config or CircuitBreakerConfig(name=name)
        _circuit_breakers[name] = CircuitBreaker(cfg)
    return _circuit_breakers[name]


def get_all_circuit_breaker_states() -> List[Dict[str, Any]]:
    """Get states of all circuit breakers."""
    return [cb.get_state() for cb in _circuit_breakers.values()]


__all__ = [
    "CircuitBreaker",
    "CircuitBreakerConfig",
    "CircuitState",
    "RetryConfig",
    "RetryExecutor",
    "RateLimiter",
    "RateLimitConfig",
    "Bulkhead",
    "circuit_breaker",
    "retry",
    "rate_limit",
    "get_circuit_breaker",
    "get_all_circuit_breaker_states",
]

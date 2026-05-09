import functools
import time
from collections.abc import Callable
from typing import Any, TypeVar, cast

from .logging import StructuredLogger
from .metrics import MetricsCollector
from .tracing import Tracer

F = TypeVar("F", bound=Callable[..., Any])
_global_metrics = MetricsCollector()
_global_tracer = Tracer()
_global_logger = StructuredLogger()


def get_metrics() -> MetricsCollector:
    """Get the global metrics collector."""
    return _global_metrics


def get_tracer() -> Tracer:
    """Get the global tracer."""
    return _global_tracer


def get_logger() -> StructuredLogger:
    """Get the global logger."""
    return _global_logger


# Decorators for easy instrumentation
def timed(metric_name: str, labels: dict[str, str] | None = None) -> Callable[[F], F]:
    """Decorator to time function execution and record as histogram.

    Example:
        @timed("job_duration_ms", labels={"type": "export"})
        def process_export():
            pass
    """

    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            try:
                return func(*args, **kwargs)
            finally:
                duration_ms = (time.time() - start) * 1000
                _global_metrics.histogram(metric_name, duration_ms, labels)

        return cast("F", wrapper)

    return decorator


def traced(span_name: str | None = None) -> Callable[[F], F]:
    """Decorator to create a span for function execution.

    Example:
        @traced("validate_import")
        def validate_data(data):
            pass
    """

    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            name = span_name or func.__name__
            with _global_tracer.span(name, attributes={"function": func.__name__}):
                return func(*args, **kwargs)

        return cast("F", wrapper)

    return decorator


def logged(operation: str, level: str = "info") -> Callable[[F], F]:
    """Decorator to log function entry and exit.

    Example:
        @logged("processing receipt", "info")
        def process_receipt(image):
            pass
    """

    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            _global_logger.log(level, f"Starting: {operation}")
            try:
                result = func(*args, **kwargs)
                _global_logger.log(level, f"Completed: {operation}")
                return result
            except Exception as e:
                _global_logger.error(f"Failed: {operation}", error=e)
                raise

        return cast("F", wrapper)

    return decorator

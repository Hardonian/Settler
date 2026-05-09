import functools
import time
from collections.abc import Callable
from typing import Any, TypeVar, cast

from settler_workhorse.observability.logging import get_logger
from settler_workhorse.observability.metrics import get_metrics
from settler_workhorse.observability.tracing import get_tracer

F = TypeVar("F", bound=Callable[..., Any])


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
                get_metrics().histogram(metric_name, duration_ms, labels)

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
            with get_tracer().span(name, attributes={"function": func.__name__}):
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
            get_logger().log(level, f"Starting: {operation}")
            try:
                result = func(*args, **kwargs)
                get_logger().log(level, f"Completed: {operation}")
                return result
            except Exception as e:
                get_logger().error(f"Failed: {operation}", error=e)
                raise

        return cast("F", wrapper)

    return decorator

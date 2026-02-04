"""Structured logging configuration for Settler Workhorse."""

import logging
import sys
import uuid
from typing import TYPE_CHECKING, Any

import structlog

if TYPE_CHECKING:
    from structlog.types import Processor

from settler_workhorse.config import Settings, get_settings


def configure_logging(settings: Settings | None = None) -> None:
    """Configure structured logging for the application.

    Args:
        settings: Application settings
    """
    settings = settings or get_settings()

    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.log_level.upper()),
    )

    # Define processors based on environment
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.ExtraAdder(),
    ]

    if settings.is_development:
        # Pretty output for development
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]
    else:
        # JSON output for production
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper())
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None, **context: Any) -> structlog.stdlib.BoundLogger:
    """Get a structured logger with optional context.

    Args:
        name: Logger name
        **context: Additional context to bind

    Returns:
        Configured logger
    """
    logger = structlog.get_logger(name)
    if context:
        logger = logger.bind(**context)
    return logger


def generate_correlation_id() -> str:
    """Generate a unique correlation ID for request tracing.

    Returns:
        UUID string
    """
    return str(uuid.uuid4())


def bind_context(**kwargs: Any) -> None:
    """Bind context variables to the current logging context.

    Args:
        **kwargs: Key-value pairs to bind
    """
    structlog.contextvars.bind_contextvars(**kwargs)


def clear_context() -> None:
    """Clear all bound context variables."""
    structlog.contextvars.clear_contextvars()


class LogContext:
    """Context manager for temporary logging context."""

    def __init__(self, **kwargs: Any):
        self.kwargs = kwargs
        self.token: Any | None = None

    def __enter__(self) -> "LogContext":
        """Bind the context values for the duration of the block."""
        bind_context(**self.kwargs)
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Clear the context values when exiting the block."""
        clear_context()

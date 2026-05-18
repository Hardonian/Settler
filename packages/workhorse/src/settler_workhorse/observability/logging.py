import json
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from settler_workhorse.observability.context import (
    _current_correlation_id,
    _current_span_id,
    _current_trace_id,
)


@dataclass
class LogEntry:
    """Structured log entry with context."""

    timestamp: datetime
    level: str
    message: str
    trace_id: str | None = None
    span_id: str | None = None
    correlation_id: str | None = None
    job_type: str | None = None
    job_id: str | None = None
    context: dict[str, Any] = field(default_factory=dict)
    error: dict[str, Any] | None = None


class StructuredLogger:
    """Structured JSON logger with correlation IDs.

    Provides context-rich logging with automatic trace/span/correlation
    ID injection for distributed systems debugging.

    Example:
        logger = StructuredLogger()

        # With job context
        with logger.job_context("export_csv", "job-123"):
            logger.info("Starting export", {"records": 1000})
            logger.warning("Large batch detected", {"size": 50000})
            logger.error("Export failed", error=e, context={"retry": 1})
    """

    LEVELS = {"debug": 10, "info": 20, "warning": 30, "error": 40, "critical": 50}

    def __init__(self, min_level: str = "info", output_file: str | None = None):
        self.min_level = self.LEVELS.get(min_level, 20)
        self.output_file = output_file
        self._entries: list[LogEntry] = []
        self._current_job_type: ContextVar[str | None] = ContextVar("job_type", default=None)
        self._current_job_id: ContextVar[str | None] = ContextVar("job_id", default=None)

    def _should_log(self, level: str) -> bool:
        return self.LEVELS.get(level, 20) >= self.min_level

    def _create_entry(
        self,
        level: str,
        message: str,
        context: dict[str, Any] | None = None,
        error: Exception | None = None,
    ) -> LogEntry:
        """Create a log entry with context."""
        try:
            trace_id = _current_trace_id.get()
        except LookupError:
            trace_id = None

        try:
            span_id = _current_span_id.get()
        except LookupError:
            span_id = None

        try:
            correlation_id = _current_correlation_id.get()
        except LookupError:
            correlation_id = None

        try:
            job_type = self._current_job_type.get()
        except LookupError:
            job_type = None

        try:
            job_id = self._current_job_id.get()
        except LookupError:
            job_id = None

        error_dict = None
        if error:
            error_dict = {
                "type": type(error).__name__,
                "message": str(error),
                "traceback": (
                    getattr(error, "__traceback__", None).__str__()
                    if hasattr(error, "__traceback__")
                    else None
                ),
            }

        return LogEntry(
            timestamp=datetime.now(UTC),
            level=level,
            message=message,
            trace_id=trace_id,
            span_id=span_id,
            correlation_id=correlation_id,
            job_type=job_type,
            job_id=job_id,
            context=context or {},
            error=error_dict,
        )

    def _output(self, entry: LogEntry):
        """Output a log entry."""
        self._entries.append(entry)

        # JSON output
        log_dict = {
            "timestamp": entry.timestamp.isoformat(),
            "level": entry.level,
            "message": entry.message,
            "trace_id": entry.trace_id,
            "span_id": entry.span_id,
            "correlation_id": entry.correlation_id,
            "job_type": entry.job_type,
            "job_id": entry.job_id,
            "context": entry.context,
        }
        if entry.error:
            log_dict["error"] = entry.error

        log_line = json.dumps(log_dict, default=str)

        # Console output
        print(log_line, flush=True)

        # File output
        if self.output_file:
            try:
                with open(self.output_file, "a") as f:
                    f.write(log_line + "\n")
            except Exception:
                pass  # Don't fail on logging errors

    def debug(self, message: str, context: dict[str, Any] | None = None):
        """Log a debug message."""
        if self._should_log("debug"):
            self._output(self._create_entry("debug", message, context))

    def info(self, message: str, context: dict[str, Any] | None = None):
        """Log an info message."""
        if self._should_log("info"):
            self._output(self._create_entry("info", message, context))

    def warning(self, message: str, context: dict[str, Any] | None = None):
        """Log a warning message."""
        if self._should_log("warning"):
            self._output(self._create_entry("warning", message, context))

    def error(
        self,
        message: str,
        error: Exception | None = None,
        context: dict[str, Any] | None = None,
    ):
        """Log an error message."""
        if self._should_log("error"):
            self._output(self._create_entry("error", message, context, error))

    def critical(
        self,
        message: str,
        error: Exception | None = None,
        context: dict[str, Any] | None = None,
    ):
        """Log a critical message."""
        if self._should_log("critical"):
            self._output(self._create_entry("critical", message, context, error))

    @contextmanager
    def job_context(self, job_type: str, job_id: str):
        """Set job context for logging."""
        token_type = self._current_job_type.set(job_type)
        token_id = self._current_job_id.set(job_id)

        try:
            yield self
        finally:
            self._current_job_type.reset(token_type)
            self._current_job_id.reset(token_id)

    @contextmanager
    def correlation_context(self, correlation_id: str):
        """Set correlation ID for distributed tracing."""
        token = _current_correlation_id.set(correlation_id)
        try:
            yield self
        finally:
            _current_correlation_id.reset(token)

    def get_entries(self) -> list[LogEntry]:
        """Get all logged entries."""
        return self._entries.copy()


_global_logger = StructuredLogger()


def get_logger() -> StructuredLogger:
    """Get the global logger."""
    return _global_logger

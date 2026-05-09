import uuid
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from .context import _current_span_id, _current_trace_id


@dataclass
class Span:
    """A trace span representing an operation."""

    name: str
    span_id: str
    trace_id: str
    parent_id: str | None = None
    start_time: datetime = field(default_factory=lambda: datetime.now(UTC))
    end_time: datetime | None = None
    attributes: dict[str, Any] = field(default_factory=dict)
    events: list[dict[str, Any]] = field(default_factory=list)
    status: str = "unset"  # unset, ok, error
    error_message: str | None = None

    @property
    def duration_ms(self) -> float | None:
        """Calculate span duration in milliseconds."""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds() * 1000
        return None


class Tracer:
    """OpenTelemetry-compatible distributed tracer.

    Provides span-based tracing with parent-child relationships,
    attributes, events, and context propagation.

    Example:
        tracer = Tracer()

        with tracer.span("process_job", attributes={"job_type": "export"}) as span:
            # Do work
            span.add_event("validation_complete", {"records": 100})
            # More work
    """

    def __init__(self, service_name: str = "settler-workhorse"):
        self.service_name = service_name
        self._spans: list[Span] = []
        self._active_spans: dict[str, Span] = {}

    def _generate_id(self) -> str:
        """Generate a unique span/trace ID."""
        return uuid.uuid4().hex[:16]

    @contextmanager
    def span(
        self,
        name: str,
        attributes: dict[str, Any] | None = None,
        parent_id: str | None = None,
    ):
        """Create a new span as a context manager."""
        trace_id = self.get_trace_id() or self._generate_id()
        span_id = self._generate_id()

        span = Span(
            name=name,
            span_id=span_id,
            trace_id=trace_id,
            parent_id=parent_id or self.get_span_id(),
            attributes=attributes or {},
        )

        self._spans.append(span)
        self._active_spans[span_id] = span

        # Set context
        token_trace = _current_trace_id.set(trace_id)
        token_span = _current_span_id.set(span_id)

        try:
            yield span
            span.status = "ok"
        except Exception as e:
            span.status = "error"
            span.error_message = str(e)
            raise
        finally:
            span.end_time = datetime.now(UTC)
            del self._active_spans[span_id]
            _current_trace_id.reset(token_trace)
            _current_span_id.reset(token_span)

    def get_trace_id(self) -> str | None:
        """Get current trace ID from context."""
        try:
            return _current_trace_id.get()
        except LookupError:
            return None

    def get_span_id(self) -> str | None:
        """Get current span ID from context."""
        try:
            return _current_span_id.get()
        except LookupError:
            return None

    def get_spans(self) -> list[Span]:
        """Get all recorded spans."""
        return self._spans.copy()

    def to_dict(self) -> list[dict[str, Any]]:
        """Export spans as a list of dictionaries."""
        return [
            {
                "name": s.name,
                "span_id": s.span_id,
                "trace_id": s.trace_id,
                "parent_id": s.parent_id,
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat() if s.end_time else None,
                "duration_ms": s.duration_ms,
                "attributes": s.attributes,
                "events": s.events,
                "status": s.status,
                "error_message": s.error_message,
            }
            for s in self._spans
        ]

    def clear(self):
        """Clear all recorded spans."""
        self._spans.clear()
        self._active_spans.clear()

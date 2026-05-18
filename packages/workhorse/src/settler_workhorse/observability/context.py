from contextvars import ContextVar

# Context variables for distributed tracing
_current_trace_id: ContextVar[str] = ContextVar("trace_id")
_current_span_id: ContextVar[str] = ContextVar("span_id")
_current_correlation_id: ContextVar[str | None] = ContextVar("correlation_id", default=None)

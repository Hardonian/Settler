"""Enterprise-grade observability for the Settler workhorse.

Provides Prometheus metrics, OpenTelemetry tracing, structured logging,
and performance profiling hooks for production ML/AI workloads.
"""

from settler_workhorse.observability.context import (
    _current_correlation_id,
    _current_span_id,
    _current_trace_id,
)
from settler_workhorse.observability.decorators import logged, timed, traced
from settler_workhorse.observability.health import HealthChecker
from settler_workhorse.observability.logging import LogEntry, StructuredLogger, get_logger
from settler_workhorse.observability.metrics import (
    Metric,
    MetricsCollector,
    MetricType,
    get_metrics,
)
from settler_workhorse.observability.profiling import PerformanceProfiler
from settler_workhorse.observability.tracing import Span, Tracer, get_tracer

# Export public API
__all__ = [
    # Classes
    "MetricsCollector",
    "Tracer",
    "Span",
    "StructuredLogger",
    "PerformanceProfiler",
    "HealthChecker",
    "Metric",
    "LogEntry",
    "MetricType",
    # Functions
    "get_metrics",
    "get_tracer",
    "get_logger",
    "timed",
    "traced",
    "logged",
    # Context
    "_current_trace_id",
    "_current_span_id",
    "_current_correlation_id",
]

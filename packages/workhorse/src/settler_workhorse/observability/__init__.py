"""Enterprise-grade observability for the Settler workhorse.

Provides Prometheus metrics, OpenTelemetry tracing, structured logging,
and performance profiling hooks for production ML/AI workloads.
"""

from .context import _current_correlation_id, _current_span_id, _current_trace_id
from .decorators import get_logger, get_metrics, get_tracer, logged, timed, traced
from .health import HealthChecker
from .logging import LogEntry, StructuredLogger
from .metrics import Metric, MetricsCollector, MetricType
from .profiling import PerformanceProfiler
from .tracing import Span, Tracer

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

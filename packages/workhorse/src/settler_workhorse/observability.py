"""
Enterprise-grade observability for the Settler workhorse.

Provides Prometheus metrics, OpenTelemetry tracing, structured logging,
and performance profiling hooks for production ML/AI workloads.
"""

import functools
import json
import os
import time
import uuid
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Protocol, TypeVar, cast

# Context variables for distributed tracing
_current_trace_id: ContextVar[str] = ContextVar('trace_id')
_current_span_id: ContextVar[str] = ContextVar('span_id')
_current_correlation_id: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)


class MetricType(Enum):
    """Types of metrics supported."""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"


@dataclass
class Metric:
    """A single metric data point."""
    name: str
    value: float
    metric_type: MetricType
    labels: Dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    description: str = ""


@dataclass
class Span:
    """A trace span representing an operation."""
    name: str
    span_id: str
    trace_id: str
    parent_id: Optional[str] = None
    start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    attributes: Dict[str, Any] = field(default_factory=dict)
    events: List[Dict[str, Any]] = field(default_factory=list)
    status: str = "unset"  # unset, ok, error
    error_message: Optional[str] = None

    @property
    def duration_ms(self) -> Optional[float]:
        """Calculate span duration in milliseconds."""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds() * 1000
        return None


@dataclass
class LogEntry:
    """Structured log entry with context."""
    timestamp: datetime
    level: str
    message: str
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    correlation_id: Optional[str] = None
    job_type: Optional[str] = None
    job_id: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    error: Optional[Dict[str, Any]] = None


class MetricsCollector:
    """
    Prometheus-compatible metrics collector.
    
    Supports counters, gauges, histograms, and summaries with
    dimensional labels for high-cardinality environments.
    
    Example:
        metrics = MetricsCollector()
        
        # Counter
        metrics.counter("jobs_completed", labels={"type": "reconciliation"})
        
        # Gauge
        metrics.gauge("queue_depth", value=42, labels={"queue": "high_priority"})
        
        # Histogram
        metrics.histogram("job_duration_ms", value=1500, labels={"type": "export"})
    """
    
    def __init__(self, prefix: str = "settler"):
        self.prefix = prefix
        self._counters: Dict[str, Dict[frozenset, float]] = {}
        self._gauges: Dict[str, Dict[frozenset, float]] = {}
        self._histograms: Dict[str, List[tuple]] = {}
        self._metric_descriptions: Dict[str, str] = {}
    
    def _make_key(self, name: str) -> str:
        return f"{self.prefix}_{name}"
    
    def _freeze_labels(self, labels: Dict[str, str]) -> frozenset:
        return frozenset(labels.items()) if labels else frozenset()
    
    def register(self, name: str, metric_type: MetricType, description: str):
        """Register a metric with metadata."""
        key = self._make_key(name)
        self._metric_descriptions[key] = description
        
        if metric_type == MetricType.COUNTER and key not in self._counters:
            self._counters[key] = {}
        elif metric_type == MetricType.GAUGE and key not in self._gauges:
            self._gauges[key] = {}
        elif metric_type == MetricType.HISTOGRAM and key not in self._histograms:
            self._histograms[key] = []
    
    def counter(self, name: str, value: float = 1, labels: Optional[Dict[str, str]] = None):
        """Increment a counter metric."""
        key = self._make_key(name)
        frozen = self._freeze_labels(labels or {})
        
        if key not in self._counters:
            self._counters[key] = {}
        
        self._counters[key][frozen] = self._counters[key].get(frozen, 0) + value
    
    def gauge(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Set a gauge metric to a specific value."""
        key = self._make_key(name)
        frozen = self._freeze_labels(labels or {})
        
        if key not in self._gauges:
            self._gauges[key] = {}
        
        self._gauges[key][frozen] = value
    
    def histogram(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Record a value in a histogram."""
        key = self._make_key(name)
        frozen_labels = self._freeze_labels(labels or {})
        
        if key not in self._histograms:
            self._histograms[key] = []
        
        self._histograms[key].append((value, frozen_labels))
    
    def get_counter(self, name: str, labels: Optional[Dict[str, str]] = None) -> float:
        """Get current counter value."""
        key = self._make_key(name)
        frozen = self._freeze_labels(labels or {})
        return self._counters.get(key, {}).get(frozen, 0)
    
    def get_gauge(self, name: str, labels: Optional[Dict[str, str]] = None) -> float:
        """Get current gauge value."""
        key = self._make_key(name)
        frozen = self._freeze_labels(labels or {})
        return self._gauges.get(key, {}).get(frozen, 0)
    
    def get_histogram_stats(self, name: str, labels: Optional[Dict[str, str]] = None) -> Dict[str, float]:
        """Get histogram statistics."""
        key = self._make_key(name)
        frozen = self._freeze_labels(labels or {})
        values = [v for v, lbls in self._histograms.get(key, []) if lbls == frozen]
        
        if not values:
            return {"count": 0, "sum": 0, "avg": 0, "min": 0, "max": 0}
        
        return {
            "count": len(values),
            "sum": sum(values),
            "avg": sum(values) / len(values),
            "min": min(values),
            "max": max(values),
        }
    
    def to_prometheus_format(self) -> str:
        """Export metrics in Prometheus exposition format."""
        lines = []
        
        # Counters
        for name, label_values in self._counters.items():
            desc = self._metric_descriptions.get(name, "")
            lines.append(f"# HELP {name} {desc}")
            lines.append(f"# TYPE {name} counter")
            for labels, value in label_values.items():
                label_str = ",".join([f'{k}="{v}"' for k, v in sorted(labels)])
                lines.append(f"{name}{{{label_str}}} {value}")
            lines.append("")
        
        # Gauges
        for name, label_values in self._gauges.items():
            desc = self._metric_descriptions.get(name, "")
            lines.append(f"# HELP {name} {desc}")
            lines.append(f"# TYPE {name} gauge")
            for labels, value in label_values.items():
                label_str = ",".join([f'{k}="{v}"' for k, v in sorted(labels)])
                lines.append(f"{name}{{{label_str}}} {value}")
            lines.append("")
        
        # Histograms (simplified - just count/sum)
        for name, values in self._histograms.items():
            desc = self._metric_descriptions.get(name, "")
            lines.append(f"# HELP {name} {desc}")
            lines.append(f"# TYPE {name} histogram")
            # Group by labels
            by_labels: Dict[frozenset, List[float]] = {}
            for value, labels in values:
                if labels not in by_labels:
                    by_labels[labels] = []
                by_labels[labels].append(value)
            
            for labels, vals in by_labels.items():
                label_str = ",".join([f'{k}="{v}"' for k, v in sorted(labels)])
                lines.append(f"{name}_count{{{label_str}}} {len(vals)}")
                lines.append(f"{name}_sum{{{label_str}}} {sum(vals)}")
            lines.append("")
        
        return "\n".join(lines)
    
    def to_dict(self) -> Dict[str, Any]:
        """Export metrics as a dictionary."""
        return {
            "counters": {
                name: dict((dict(labels), val) for labels, val in label_values.items())
                for name, label_values in self._counters.items()
            },
            "gauges": {
                name: dict((dict(labels), val) for labels, val in label_values.items())
                for name, label_values in self._gauges.items()
            },
            "histograms": {
                name: self.get_histogram_stats(name)
                for name in self._histograms.keys()
            },
        }


class Tracer:
    """
    OpenTelemetry-compatible distributed tracer.
    
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
        self._spans: List[Span] = []
        self._active_spans: Dict[str, Span] = {}
    
    def _generate_id(self) -> str:
        """Generate a unique span/trace ID."""
        return uuid.uuid4().hex[:16]
    
    @contextmanager
    def span(
        self,
        name: str,
        attributes: Optional[Dict[str, Any]] = None,
        parent_id: Optional[str] = None,
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
            span.end_time = datetime.now(timezone.utc)
            del self._active_spans[span_id]
            _current_trace_id.reset(token_trace)
            _current_span_id.reset(token_span)
    
    def get_trace_id(self) -> Optional[str]:
        """Get current trace ID from context."""
        try:
            return _current_trace_id.get()
        except LookupError:
            return None
    
    def get_span_id(self) -> Optional[str]:
        """Get current span ID from context."""
        try:
            return _current_span_id.get()
        except LookupError:
            return None
    
    def get_spans(self) -> List[Span]:
        """Get all recorded spans."""
        return self._spans.copy()
    
    def to_dict(self) -> List[Dict[str, Any]]:
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


class StructuredLogger:
    """
    Structured JSON logger with correlation IDs.
    
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
    
    def __init__(self, min_level: str = "info", output_file: Optional[str] = None):
        self.min_level = self.LEVELS.get(min_level, 20)
        self.output_file = output_file
        self._entries: List[LogEntry] = []
        self._current_job_type: ContextVar[Optional[str]] = ContextVar('job_type', default=None)
        self._current_job_id: ContextVar[Optional[str]] = ContextVar('job_id', default=None)
    
    def _should_log(self, level: str) -> bool:
        return self.LEVELS.get(level, 20) >= self.min_level
    
    def _create_entry(
        self,
        level: str,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        error: Optional[Exception] = None,
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
                "traceback": getattr(error, '__traceback__', None).__str__() if hasattr(error, '__traceback__') else None,
            }
        
        return LogEntry(
            timestamp=datetime.now(timezone.utc),
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
                with open(self.output_file, 'a') as f:
                    f.write(log_line + '\n')
            except Exception:
                pass  # Don't fail on logging errors
    
    def debug(self, message: str, context: Optional[Dict[str, Any]] = None):
        """Log a debug message."""
        if self._should_log("debug"):
            self._output(self._create_entry("debug", message, context))
    
    def info(self, message: str, context: Optional[Dict[str, Any]] = None):
        """Log an info message."""
        if self._should_log("info"):
            self._output(self._create_entry("info", message, context))
    
    def warning(self, message: str, context: Optional[Dict[str, Any]] = None):
        """Log a warning message."""
        if self._should_log("warning"):
            self._output(self._create_entry("warning", message, context))
    
    def error(
        self,
        message: str,
        error: Optional[Exception] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        """Log an error message."""
        if self._should_log("error"):
            self._output(self._create_entry("error", message, context, error))
    
    def critical(
        self,
        message: str,
        error: Optional[Exception] = None,
        context: Optional[Dict[str, Any]] = None,
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
    
    def get_entries(self) -> List[LogEntry]:
        """Get all logged entries."""
        return self._entries.copy()


# Global instances for convenience
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
F = TypeVar('F', bound=Callable[..., Any])


def timed(metric_name: str, labels: Optional[Dict[str, str]] = None) -> Callable[[F], F]:
    """
    Decorator to time function execution and record as histogram.
    
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
        return cast(F, wrapper)
    return decorator


def traced(span_name: Optional[str] = None) -> Callable[[F], F]:
    """
    Decorator to create a span for function execution.
    
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
        return cast(F, wrapper)
    return decorator


def logged(operation: str, level: str = "info") -> Callable[[F], F]:
    """
    Decorator to log function entry and exit.
    
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
        return cast(F, wrapper)
    return decorator


class PerformanceProfiler:
    """
    Performance profiling for hot paths.
    
    Tracks function call counts, total time, and provides
    flamegraph-compatible output.
    
    Example:
        profiler = PerformanceProfiler()
        
        @profiler.profile
        def hot_function():
            pass
        
        # Later
        print(profiler.report())
    """
    
    def __init__(self):
        self._stats: Dict[str, Dict[str, Any]] = {}
    
    def profile(self, func: F) -> F:
        """Decorator to profile a function."""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            name = func.__qualname__
            
            if name not in self._stats:
                self._stats[name] = {"calls": 0, "total_time": 0, "max_time": 0}
            
            start = time.perf_counter()
            try:
                return func(*args, **kwargs)
            finally:
                duration = time.perf_counter() - start
                self._stats[name]["calls"] += 1
                self._stats[name]["total_time"] += duration
                self._stats[name]["max_time"] = max(self._stats[name]["max_time"], duration)
        
        return cast(F, wrapper)
    
    def report(self) -> str:
        """Generate a performance report."""
        if not self._stats:
            return "No profiling data collected"
        
        lines = ["Performance Profile:", "=" * 80]
        lines.append(f"{'Function':<50} {'Calls':>8} {'Total(ms)':>12} {'Avg(ms)':>10} {'Max(ms)':>10}")
        lines.append("-" * 80)
        
        for name, stats in sorted(self._stats.items(), key=lambda x: -x[1]["total_time"]):
            calls = stats["calls"]
            total_ms = stats["total_time"] * 1000
            avg_ms = total_ms / calls if calls > 0 else 0
            max_ms = stats["max_time"] * 1000
            lines.append(f"{name:<50} {calls:>8} {total_ms:>12.2f} {avg_ms:>10.2f} {max_ms:>10.2f}")
        
        return "\n".join(lines)
    
    def to_dict(self) -> Dict[str, Dict[str, Any]]:
        """Export profiling data as dictionary."""
        return {
            name: {
                "calls": stats["calls"],
                "total_ms": stats["total_time"] * 1000,
                "avg_ms": (stats["total_time"] * 1000) / stats["calls"] if stats["calls"] > 0 else 0,
                "max_ms": stats["max_time"] * 1000,
            }
            for name, stats in self._stats.items()
        }


class HealthChecker:
    """
    Health check system for dependencies.
    
    Monitors database, external APIs, and other dependencies
    with configurable check intervals and thresholds.
    
    Example:
        health = HealthChecker()
        
        @health.check("database")
        def check_database():
            # Return True if healthy, False/raise if not
            return db_connection.is_alive()
        
        status = health.status()  # {"database": {"healthy": True, "last_check": ...}}
    """
    
    def __init__(self, check_interval_seconds: float = 30.0):
        self.check_interval = check_interval_seconds
        self._checks: Dict[str, tuple] = {}
        self._results: Dict[str, Dict[str, Any]] = {}
    
    def check(self, name: str):
        """Decorator to register a health check."""
        def decorator(func: Callable[[], bool]):
            self._checks[name] = (func, time.time())
            return func
        return decorator
    
    def run_check(self, name: str) -> Dict[str, Any]:
        """Run a specific health check."""
        if name not in self._checks:
            return {"healthy": False, "error": "Check not registered", "last_check": None}
        
        check_func, _ = self._checks[name]
        
        try:
            result = check_func()
            healthy = bool(result)
            self._results[name] = {
                "healthy": healthy,
                "last_check": datetime.now(timezone.utc).isoformat(),
                "error": None,
            }
        except Exception as e:
            self._results[name] = {
                "healthy": False,
                "last_check": datetime.now(timezone.utc).isoformat(),
                "error": str(e),
            }
        
        return self._results[name]
    
    def status(self) -> Dict[str, Dict[str, Any]]:
        """Get health status of all dependencies."""
        # Run stale checks
        now = time.time()
        for name, (func, last_run) in self._checks.items():
            if name not in self._results or (now - last_run) > self.check_interval:
                self.run_check(name)
                self._checks[name] = (func, now)
        
        return self._results.copy()
    
    def is_healthy(self) -> bool:
        """Check if all dependencies are healthy."""
        status = self.status()
        return all(r.get("healthy", False) for r in status.values())


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

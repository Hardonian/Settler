from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any


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
    labels: dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    description: str = ""


class MetricsCollector:
    """Prometheus-compatible metrics collector.

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
        self._counters: dict[str, dict[frozenset, float]] = {}
        self._gauges: dict[str, dict[frozenset, float]] = {}
        self._histograms: dict[str, list[tuple]] = {}
        self._metric_descriptions: dict[str, str] = {}

    def _make_key(self, name: str) -> str:
        return f"{self.prefix}_{name}"

    def _freeze_labels(self, labels: dict[str, str]) -> frozenset:
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

    def counter(self, name: str, value: float = 1, labels: dict[str, str] | None = None):
        """Increment a counter metric."""
        key = self._make_key(name)
        frozen = self._freeze_labels(labels or {})

        if key not in self._counters:
            self._counters[key] = {}

        self._counters[key][frozen] = self._counters[key].get(frozen, 0) + value

    def gauge(self, name: str, value: float, labels: dict[str, str] | None = None):
        """Set a gauge metric to a specific value."""
        key = self._make_key(name)
        frozen = self._freeze_labels(labels or {})

        if key not in self._gauges:
            self._gauges[key] = {}

        self._gauges[key][frozen] = value

    def histogram(self, name: str, value: float, labels: dict[str, str] | None = None):
        """Record a value in a histogram."""
        key = self._make_key(name)
        frozen_labels = self._freeze_labels(labels or {})

        if key not in self._histograms:
            self._histograms[key] = []

        self._histograms[key].append((value, frozen_labels))

    def get_counter(self, name: str, labels: dict[str, str] | None = None) -> float:
        """Get current counter value."""
        key = self._make_key(name)
        frozen = self._freeze_labels(labels or {})
        return self._counters.get(key, {}).get(frozen, 0)

    def get_gauge(self, name: str, labels: dict[str, str] | None = None) -> float:
        """Get current gauge value."""
        key = self._make_key(name)
        frozen = self._freeze_labels(labels or {})
        return self._gauges.get(key, {}).get(frozen, 0)

    def get_histogram_stats(
        self, name: str, labels: dict[str, str] | None = None
    ) -> dict[str, float]:
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
            by_labels: dict[frozenset, list[float]] = {}
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

    def to_dict(self) -> dict[str, Any]:
        """Export metrics as a dictionary."""
        return {
            "counters": {
                name: {tuple(sorted(labels)): val for labels, val in label_values.items()}
                for name, label_values in self._counters.items()
            },
            "gauges": {
                name: {tuple(sorted(labels)): val for labels, val in label_values.items()}
                for name, label_values in self._gauges.items()
            },
            "histograms": {name: self.get_histogram_stats(name) for name in self._histograms},
        }


_global_metrics = MetricsCollector()


def get_metrics() -> MetricsCollector:
    """Get the global metrics collector."""
    return _global_metrics

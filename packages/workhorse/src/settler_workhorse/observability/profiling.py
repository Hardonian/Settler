import functools
import time
from collections.abc import Callable
from typing import Any, TypeVar, cast

F = TypeVar("F", bound=Callable[..., Any])


class PerformanceProfiler:
    """Performance profiling for hot paths.

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
        self._stats: dict[str, dict[str, Any]] = {}

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

        return cast("F", wrapper)

    def report(self) -> str:
        """Generate a performance report."""
        if not self._stats:
            return "No profiling data collected"

        lines = ["Performance Profile:", "=" * 80]
        lines.append(
            f"{'Function':<50} {'Calls':>8} {'Total(ms)':>12} {'Avg(ms)':>10} {'Max(ms)':>10}"
        )
        lines.append("-" * 80)

        for name, stats in sorted(self._stats.items(), key=lambda x: -x[1]["total_time"]):
            calls = stats["calls"]
            total_ms = stats["total_time"] * 1000
            avg_ms = total_ms / calls if calls > 0 else 0
            max_ms = stats["max_time"] * 1000
            lines.append(f"{name:<50} {calls:>8} {total_ms:>12.2f} {avg_ms:>10.2f} {max_ms:>10.2f}")

        return "\n".join(lines)

    def to_dict(self) -> dict[str, dict[str, Any]]:
        """Export profiling data as dictionary."""
        return {
            name: {
                "calls": stats["calls"],
                "total_ms": stats["total_time"] * 1000,
                "avg_ms": (
                    (stats["total_time"] * 1000) / stats["calls"] if stats["calls"] > 0 else 0
                ),
                "max_ms": stats["max_time"] * 1000,
            }
            for name, stats in self._stats.items()
        }

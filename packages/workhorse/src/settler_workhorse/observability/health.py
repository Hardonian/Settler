import time
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any


class HealthChecker:
    """Health check system for dependencies.

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
        self._checks: dict[str, tuple] = {}
        self._results: dict[str, dict[str, Any]] = {}

    def check(self, name: str):
        """Decorator to register a health check."""

        def decorator(func: Callable[[], bool]):
            self._checks[name] = (func, time.time())
            return func

        return decorator

    def run_check(self, name: str) -> dict[str, Any]:
        """Run a specific health check."""
        if name not in self._checks:
            return {"healthy": False, "error": "Check not registered", "last_check": None}

        check_func, _ = self._checks[name]

        try:
            result = check_func()
            healthy = bool(result)
            self._results[name] = {
                "healthy": healthy,
                "last_check": datetime.now(UTC).isoformat(),
                "error": None,
            }
        except Exception as e:
            self._results[name] = {
                "healthy": False,
                "last_check": datetime.now(UTC).isoformat(),
                "error": str(e),
            }

        return self._results[name]

    def status(self) -> dict[str, dict[str, Any]]:
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

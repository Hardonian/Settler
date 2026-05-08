import asyncio
import time

from settler_workhorse.health.base import HealthCheck
from settler_workhorse.health.models import HealthCheckResult, HealthStatus, SystemHealth


class HealthCheckRegistry:
    """Registry for managing and executing health checks.

    Example:
        registry = HealthCheckRegistry()

        # Register checks
        registry.register(DatabaseHealthCheck(check_fn=db_ping))
        registry.register(RedisHealthCheck())

        # Run all checks
        health = await registry.check_all()

        # Or run specific check
        db_health = await registry.check("database")
    """

    def __init__(self, version: str = "unknown"):
        self.version = version
        self._checks: dict[str, HealthCheck] = {}
        self._start_time = time.time()

    def register(self, check: HealthCheck):
        """Register a health check."""
        self._checks[check.name] = check

    def unregister(self, name: str):
        """Unregister a health check."""
        self._checks.pop(name, None)

    async def check(self, name: str) -> HealthCheckResult | None:
        """Run a specific health check."""
        check = self._checks.get(name)
        if not check:
            return None

        return await check.check()

    async def check_all(self) -> SystemHealth:
        """Run all registered health checks."""
        results = await asyncio.gather(
            *[check.check() for check in self._checks.values()],
            return_exceptions=True,
        )

        checks: list[HealthCheckResult] = []
        for result in results:
            if isinstance(result, Exception):
                checks.append(
                    HealthCheckResult(
                        name="unknown",
                        status=HealthStatus.UNKNOWN,
                        message=f"Check failed with exception: {str(result)}",
                    )
                )
            else:
                checks.append(result)

        # Determine overall status
        critical_unhealthy = any(
            r.status == HealthStatus.UNHEALTHY
            and self._checks.get(r.name, HealthCheck("")).critical
            for r in checks
        )

        any_unhealthy = any(r.status == HealthStatus.UNHEALTHY for r in checks)
        any_degraded = any(r.status == HealthStatus.DEGRADED for r in checks)

        if critical_unhealthy:
            overall_status = HealthStatus.UNHEALTHY
        elif any_unhealthy or any_degraded:
            overall_status = HealthStatus.DEGRADED
        else:
            overall_status = HealthStatus.HEALTHY

        return SystemHealth(
            status=overall_status,
            checks=checks,
            version=self.version,
            uptime_seconds=time.time() - self._start_time,
        )

    def get_check_names(self) -> list[str]:
        """Get names of all registered checks."""
        return list(self._checks.keys())

from datetime import UTC, datetime
from typing import Any

from settler_workhorse.health.models import HealthStatus
from settler_workhorse.health.registry import HealthCheckRegistry


class HealthEndpoint:
    """HTTP endpoint handler for health checks.

    Provides standard Kubernetes-style endpoints:
    - /health/live - Liveness probe
    - /health/ready - Readiness probe
    - /health - Full health check

    Example:
        registry = HealthCheckRegistry()
        endpoint = HealthEndpoint(registry)

        # In your web framework
        @app.get("/health")
        async def health():
            return await endpoint.full_check()
    """

    def __init__(self, registry: HealthCheckRegistry, ready_checks: list[str] | None = None):
        self.registry = registry
        self.ready_checks = ready_checks or []

    async def liveness(self) -> tuple[dict[str, Any], int]:
        """Liveness probe - is the process running?

        Returns simple 200 if process is alive.
        """
        return {
            "status": "alive",
            "timestamp": datetime.now(UTC).isoformat(),
        }, 200

    async def readiness(self) -> tuple[dict[str, Any], int]:
        """Readiness probe - is the service ready to accept traffic?

        Checks critical dependencies only.
        """
        health = await self.registry.check_all()

        # Only check critical services for readiness
        critical_checks = [c for c in health.checks if c.name in self.ready_checks]

        ready = all(c.is_healthy for c in critical_checks)

        status_code = 200 if ready else 503

        return {
            "ready": ready,
            "checks": [
                {
                    "name": c.name,
                    "status": c.status.value,
                    "message": c.message,
                }
                for c in critical_checks
            ],
            "timestamp": health.timestamp.isoformat(),
        }, status_code

    async def full_check(self) -> tuple[dict[str, Any], int]:
        """Full health check with all registered checks.

        Returns detailed health information.
        """
        health = await self.registry.check_all()

        status_code = 200 if health.status == HealthStatus.HEALTHY else 503
        if health.status == HealthStatus.DEGRADED:
            status_code = 200  # Degraded still serves traffic

        return {
            "status": health.status.value,
            "version": health.version,
            "uptime_seconds": health.uptime_seconds,
            "summary": {
                "healthy": health.healthy_count,
                "degraded": health.degraded_count,
                "unhealthy": health.unhealthy_count,
            },
            "checks": [
                {
                    "name": c.name,
                    "status": c.status.value,
                    "message": c.message,
                    "duration_ms": c.duration_ms,
                    "details": c.details,
                }
                for c in health.checks
            ],
            "timestamp": health.timestamp.isoformat(),
        }, status_code

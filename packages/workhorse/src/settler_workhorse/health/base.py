from abc import ABC, abstractmethod

from settler_workhorse.health.models import HealthCheckResult


class HealthCheck(ABC):
    """Abstract base class for health checks."""

    def __init__(self, name: str, critical: bool = True, timeout_seconds: float = 5.0):
        self.name = name
        self.critical = critical
        self.timeout_seconds = timeout_seconds

    @abstractmethod
    async def check(self) -> HealthCheckResult:
        """Execute the health check."""
        pass

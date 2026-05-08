"""Comprehensive health checks and monitoring for the Settler workhorse.

Provides health check endpoints, dependency status, readiness/liveness
probes, and system diagnostics for production operations.
"""

from settler_workhorse.health.base import HealthCheck
from settler_workhorse.health.checks import (
    DatabaseHealthCheck,
    DiskSpaceHealthCheck,
    ExternalAPIHealthCheck,
    MemoryHealthCheck,
    RedisHealthCheck,
)
from settler_workhorse.health.diagnostics import SystemDiagnostics
from settler_workhorse.health.endpoint import HealthEndpoint
from settler_workhorse.health.models import HealthCheckResult, HealthStatus, SystemHealth
from settler_workhorse.health.registry import HealthCheckRegistry

# Export public API
__all__ = [
    # Enums
    "HealthStatus",
    # Classes
    "HealthCheckResult",
    "SystemHealth",
    "HealthCheck",
    "DatabaseHealthCheck",
    "RedisHealthCheck",
    "ExternalAPIHealthCheck",
    "DiskSpaceHealthCheck",
    "MemoryHealthCheck",
    "HealthCheckRegistry",
    "HealthEndpoint",
    "SystemDiagnostics",
]

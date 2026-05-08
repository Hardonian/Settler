import asyncio
import inspect
import time
from collections.abc import Callable
from typing import Any

from settler_workhorse.health.base import HealthCheck
from settler_workhorse.health.models import HealthCheckResult, HealthStatus


class DatabaseHealthCheck(HealthCheck):
    """Health check for database connectivity."""

    def __init__(
        self,
        name: str = "database",
        check_fn: Callable[[], Any] | None = None,
        timeout_seconds: float = 5.0,
    ):
        super().__init__(name, critical=True, timeout_seconds=timeout_seconds)
        self.check_fn = check_fn

    async def check(self) -> HealthCheckResult:
        """Check database connectivity."""
        start = time.perf_counter()

        try:
            if self.check_fn:
                if inspect.iscoroutinefunction(self.check_fn):
                    await asyncio.wait_for(
                        self.check_fn(),
                        timeout=self.timeout_seconds,
                    )
                else:
                    # Run sync function in thread pool
                    loop = asyncio.get_event_loop()
                    await asyncio.wait_for(
                        loop.run_in_executor(None, self.check_fn),
                        timeout=self.timeout_seconds,
                    )

            duration_ms = (time.perf_counter() - start) * 1000

            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.HEALTHY,
                message="Database connection is healthy",
                details={"response_time_ms": duration_ms},
                duration_ms=duration_ms,
            )

        except TimeoutError:
            duration_ms = (time.perf_counter() - start) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNHEALTHY,
                message=f"Database check timed out after {self.timeout_seconds}s",
                details={"timeout": self.timeout_seconds},
                duration_ms=duration_ms,
            )

        except Exception as e:
            duration_ms = (time.perf_counter() - start) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNHEALTHY,
                message=f"Database check failed: {str(e)}",
                details={"error": str(e)},
                duration_ms=duration_ms,
            )


class RedisHealthCheck(HealthCheck):
    """Health check for Redis connectivity."""

    def __init__(
        self,
        name: str = "redis",
        host: str = "localhost",
        port: int = 6379,
        timeout_seconds: float = 3.0,
    ):
        super().__init__(name, critical=False, timeout_seconds=timeout_seconds)
        self.host = host
        self.port = port

    async def check(self) -> HealthCheckResult:
        """Check Redis connectivity."""
        start = time.perf_counter()

        try:
            import redis

            client = redis.Redis(
                host=self.host,
                port=self.port,
                socket_timeout=self.timeout_seconds,
                socket_connect_timeout=self.timeout_seconds,
            )

            # Run in thread pool since redis-py is sync
            loop = asyncio.get_event_loop()
            info = await asyncio.wait_for(
                loop.run_in_executor(None, client.info),
                timeout=self.timeout_seconds,
            )

            duration_ms = (time.perf_counter() - start) * 1000

            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.HEALTHY,
                message="Redis connection is healthy",
                details={
                    "response_time_ms": duration_ms,
                    "version": info.get("redis_version", "unknown"),
                    "used_memory_mb": info.get("used_memory", 0) / (1024 * 1024),
                },
                duration_ms=duration_ms,
            )

        except ImportError:
            duration_ms = (time.perf_counter() - start) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNKNOWN,
                message="Redis package not installed",
                duration_ms=duration_ms,
            )

        except Exception as e:
            duration_ms = (time.perf_counter() - start) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNHEALTHY,
                message=f"Redis check failed: {str(e)}",
                details={"error": str(e)},
                duration_ms=duration_ms,
            )


class ExternalAPIHealthCheck(HealthCheck):
    """Health check for external API dependencies."""

    def __init__(
        self,
        name: str,
        url: str,
        expected_status: int = 200,
        timeout_seconds: float = 10.0,
        critical: bool = False,
    ):
        super().__init__(name, critical=critical, timeout_seconds=timeout_seconds)
        self.url = url
        self.expected_status = expected_status

    async def check(self) -> HealthCheckResult:
        """Check external API availability."""
        start = time.perf_counter()

        try:
            import aiohttp

            async with (
                aiohttp.ClientSession() as session,
                session.get(
                    self.url,
                    timeout=aiohttp.ClientTimeout(total=self.timeout_seconds),
                ) as response,
            ):
                duration_ms = (time.perf_counter() - start) * 1000

                if response.status == self.expected_status:
                    return HealthCheckResult(
                        name=self.name,
                        status=HealthStatus.HEALTHY,
                        message=f"API responded with status {response.status}",
                        details={
                            "status_code": response.status,
                            "response_time_ms": duration_ms,
                            "url": self.url,
                        },
                        duration_ms=duration_ms,
                    )
                else:
                    return HealthCheckResult(
                        name=self.name,
                        status=HealthStatus.DEGRADED,
                        message=f"API responded with unexpected status {response.status}",
                        details={
                            "expected_status": self.expected_status,
                            "actual_status": response.status,
                            "url": self.url,
                        },
                        duration_ms=duration_ms,
                    )

        except ImportError:
            # Fallback to urllib
            try:
                import urllib.request

                loop = asyncio.get_event_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: urllib.request.urlopen(self.url, timeout=self.timeout_seconds),
                    ),
                    timeout=self.timeout_seconds,
                )

                duration_ms = (time.perf_counter() - start) * 1000

                return HealthCheckResult(
                    name=self.name,
                    status=HealthStatus.HEALTHY,
                    message=f"API responded with status {response.status}",
                    details={
                        "status_code": response.status,
                        "response_time_ms": duration_ms,
                        "url": self.url,
                    },
                    duration_ms=duration_ms,
                )

            except Exception as e:
                duration_ms = (time.perf_counter() - start) * 1000
                return HealthCheckResult(
                    name=self.name,
                    status=HealthStatus.UNHEALTHY,
                    message=f"API check failed: {str(e)}",
                    details={"error": str(e), "url": self.url},
                    duration_ms=duration_ms,
                )

        except Exception as e:
            duration_ms = (time.perf_counter() - start) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNHEALTHY,
                message=f"API check failed: {str(e)}",
                details={"error": str(e), "url": self.url},
                duration_ms=duration_ms,
            )


class DiskSpaceHealthCheck(HealthCheck):
    """Health check for disk space."""

    def __init__(
        self,
        name: str = "disk_space",
        path: str = "/",
        warning_threshold_percent: float = 80.0,
        critical_threshold_percent: float = 95.0,
    ):
        super().__init__(name, critical=True, timeout_seconds=5.0)
        self.path = path
        self.warning_threshold = warning_threshold_percent
        self.critical_threshold = critical_threshold_percent

    async def check(self) -> HealthCheckResult:
        """Check disk space availability."""
        start = time.perf_counter()

        try:
            import shutil

            loop = asyncio.get_event_loop()
            stat = await loop.run_in_executor(None, shutil.disk_usage, self.path)

            total = stat.total
            used = stat.used
            free = stat.free
            used_percent = (used / total) * 100

            duration_ms = (time.perf_counter() - start) * 1000

            details = {
                "path": self.path,
                "total_gb": total / (1024**3),
                "used_gb": used / (1024**3),
                "free_gb": free / (1024**3),
                "used_percent": used_percent,
            }

            if used_percent >= self.critical_threshold:
                return HealthCheckResult(
                    name=self.name,
                    status=HealthStatus.UNHEALTHY,
                    message=f"Disk space critical: {used_percent:.1f}% used",
                    details=details,
                    duration_ms=duration_ms,
                )
            elif used_percent >= self.warning_threshold:
                return HealthCheckResult(
                    name=self.name,
                    status=HealthStatus.DEGRADED,
                    message=f"Disk space warning: {used_percent:.1f}% used",
                    details=details,
                    duration_ms=duration_ms,
                )
            else:
                return HealthCheckResult(
                    name=self.name,
                    status=HealthStatus.HEALTHY,
                    message=f"Disk space healthy: {used_percent:.1f}% used",
                    details=details,
                    duration_ms=duration_ms,
                )

        except Exception as e:
            duration_ms = (time.perf_counter() - start) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNKNOWN,
                message=f"Disk space check failed: {str(e)}",
                details={"error": str(e)},
                duration_ms=duration_ms,
            )


class MemoryHealthCheck(HealthCheck):
    """Health check for system memory."""

    def __init__(
        self,
        name: str = "memory",
        warning_threshold_percent: float = 80.0,
        critical_threshold_percent: float = 95.0,
    ):
        super().__init__(name, critical=False, timeout_seconds=3.0)
        self.warning_threshold = warning_threshold_percent
        self.critical_threshold = critical_threshold_percent

    async def check(self) -> HealthCheckResult:
        """Check memory availability."""
        start = time.perf_counter()

        try:
            import psutil

            loop = asyncio.get_event_loop()
            memory = await loop.run_in_executor(None, psutil.virtual_memory)

            used_percent = memory.percent

            duration_ms = (time.perf_counter() - start) * 1000

            details = {
                "total_gb": memory.total / (1024**3),
                "available_gb": memory.available / (1024**3),
                "used_percent": used_percent,
            }

            if used_percent >= self.critical_threshold:
                return HealthCheckResult(
                    name=self.name,
                    status=HealthStatus.DEGRADED,
                    message=f"Memory usage critical: {used_percent:.1f}% used",
                    details=details,
                    duration_ms=duration_ms,
                )
            elif used_percent >= self.warning_threshold:
                return HealthCheckResult(
                    name=self.name,
                    status=HealthStatus.DEGRADED,
                    message=f"Memory usage high: {used_percent:.1f}% used",
                    details=details,
                    duration_ms=duration_ms,
                )
            else:
                return HealthCheckResult(
                    name=self.name,
                    status=HealthStatus.HEALTHY,
                    message=f"Memory usage healthy: {used_percent:.1f}% used",
                    details=details,
                    duration_ms=duration_ms,
                )

        except ImportError:
            duration_ms = (time.perf_counter() - start) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNKNOWN,
                message="psutil not installed, cannot check memory",
                duration_ms=duration_ms,
            )

        except Exception as e:
            duration_ms = (time.perf_counter() - start) * 1000
            return HealthCheckResult(
                name=self.name,
                status=HealthStatus.UNKNOWN,
                message=f"Memory check failed: {str(e)}",
                details={"error": str(e)},
                duration_ms=duration_ms,
            )

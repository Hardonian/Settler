"""
Comprehensive health checks and monitoring for the Settler workhorse.

Provides health check endpoints, dependency status, readiness/liveness
probes, and system diagnostics for production operations.
"""

import asyncio
import inspect
import os
import platform
try:
    import resource
except ImportError:
    resource = None  # Unix-only module
import sys
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Protocol, Set, Tuple, Type, Union


class HealthStatus(Enum):
    """Health check status values."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class HealthCheckResult:
    """Result of a single health check."""
    name: str
    status: HealthStatus
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    duration_ms: float = 0.0
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    @property
    def is_healthy(self) -> bool:
        return self.status == HealthStatus.HEALTHY


@dataclass
class SystemHealth:
    """Overall system health summary."""
    status: HealthStatus
    checks: List[HealthCheckResult]
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    version: str = "unknown"
    uptime_seconds: float = 0.0
    
    @property
    def healthy_count(self) -> int:
        return sum(1 for c in self.checks if c.status == HealthStatus.HEALTHY)
    
    @property
    def degraded_count(self) -> int:
        return sum(1 for c in self.checks if c.status == HealthStatus.DEGRADED)
    
    @property
    def unhealthy_count(self) -> int:
        return sum(1 for c in self.checks if c.status == HealthStatus.UNHEALTHY)


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


class DatabaseHealthCheck(HealthCheck):
    """Health check for database connectivity."""
    
    def __init__(
        self,
        name: str = "database",
        check_fn: Optional[Callable[[], Any]] = None,
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
            
        except asyncio.TimeoutError:
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
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.url,
                    timeout=aiohttp.ClientTimeout(total=self.timeout_seconds),
                ) as response:
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


class HealthCheckRegistry:
    """
    Registry for managing and executing health checks.
    
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
        self._checks: Dict[str, HealthCheck] = {}
        self._start_time = time.time()
    
    def register(self, check: HealthCheck):
        """Register a health check."""
        self._checks[check.name] = check
    
    def unregister(self, name: str):
        """Unregister a health check."""
        self._checks.pop(name, None)
    
    async def check(self, name: str) -> Optional[HealthCheckResult]:
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
        
        checks: List[HealthCheckResult] = []
        for result in results:
            if isinstance(result, Exception):
                checks.append(HealthCheckResult(
                    name="unknown",
                    status=HealthStatus.UNKNOWN,
                    message=f"Check failed with exception: {str(result)}",
                ))
            else:
                checks.append(result)
        
        # Determine overall status
        critical_unhealthy = any(
            r.status == HealthStatus.UNHEALTHY and self._checks.get(r.name, HealthCheck("")).critical
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
    
    def get_check_names(self) -> List[str]:
        """Get names of all registered checks."""
        return list(self._checks.keys())


class HealthEndpoint:
    """
    HTTP endpoint handler for health checks.
    
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
    
    def __init__(self, registry: HealthCheckRegistry, ready_checks: Optional[List[str]] = None):
        self.registry = registry
        self.ready_checks = ready_checks or []
    
    async def liveness(self) -> Tuple[Dict[str, Any], int]:
        """
        Liveness probe - is the process running?
        
        Returns simple 200 if process is alive.
        """
        return {
            "status": "alive",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }, 200
    
    async def readiness(self) -> Tuple[Dict[str, Any], int]:
        """
        Readiness probe - is the service ready to accept traffic?
        
        Checks critical dependencies only.
        """
        health = await self.registry.check_all()
        
        # Only check critical services for readiness
        critical_checks = [
            c for c in health.checks
            if c.name in self.ready_checks
        ]
        
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
    
    async def full_check(self) -> Tuple[Dict[str, Any], int]:
        """
        Full health check with all registered checks.
        
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


class SystemDiagnostics:
    """
    System diagnostics and information gathering.
    
    Provides detailed system information for debugging and monitoring.
    """
    
    @staticmethod
    def get_system_info() -> Dict[str, Any]:
        """Get comprehensive system information."""
        info = {
            "platform": {
                "system": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "machine": platform.machine(),
                "processor": platform.processor(),
            },
            "python": {
                "version": sys.version,
                "implementation": platform.python_implementation(),
            },
            "environment": {
                "pid": os.getpid(),
            },
        }
        
        # Try to get resource usage
        try:
            import psutil
            process = psutil.Process()
            
            info["resources"] = {
                "memory_mb": process.memory_info().rss / (1024 * 1024),
                "cpu_percent": process.cpu_percent(),
                "threads": process.num_threads(),
                "open_files": len(process.open_files()),
                "connections": len(process.connections()),
            }
        except Exception:
            pass
        
        return info
    
    @staticmethod
    def get_resource_limits() -> Dict[str, Any]:
        """Get system resource limits."""
        if resource is None:
            return {"error": "Resource limits not available on Windows"}
        
        try:
            limits = {
                "max_open_files": resource.getrlimit(resource.RLIMIT_NOFILE),
                "max_memory_mb": resource.getrlimit(resource.RLIMIT_AS)[0] / (1024 * 1024) if resource.getrlimit(resource.RLIMIT_AS)[0] > 0 else "unlimited",
                "max_processes": resource.getrlimit(resource.RLIMIT_NPROC),
            }
        except Exception:
            limits = {"error": "Could not retrieve resource limits"}
        
        return limits


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

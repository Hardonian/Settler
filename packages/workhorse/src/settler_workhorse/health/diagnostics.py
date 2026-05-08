import os
import platform
import sys
from typing import Any

try:
    import resource
except ImportError:
    resource = None  # Unix-only module


class SystemDiagnostics:
    """System diagnostics and information gathering.

    Provides detailed system information for debugging and monitoring.
    """

    @staticmethod
    def get_system_info() -> dict[str, Any]:
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
    def get_resource_limits() -> dict[str, Any]:
        """Get system resource limits."""
        if resource is None:
            return {"error": "Resource limits not available on Windows"}

        try:
            limits = {
                "max_open_files": resource.getrlimit(resource.RLIMIT_NOFILE),
                "max_memory_mb": (
                    resource.getrlimit(resource.RLIMIT_AS)[0] / (1024 * 1024)
                    if resource.getrlimit(resource.RLIMIT_AS)[0] > 0
                    else "unlimited"
                ),
                "max_processes": resource.getrlimit(resource.RLIMIT_NPROC),
            }
        except Exception:
            limits = {"error": "Could not retrieve resource limits"}

        return limits

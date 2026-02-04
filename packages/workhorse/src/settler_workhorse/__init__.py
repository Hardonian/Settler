"""Settler Workhorse - Enterprise-grade Python batch processing subsystem.

Provides ML/AI infrastructure, distributed caching, async processing,
observability, health checks, and plugin architecture for reconciliation
workloads at scale.
"""

__version__ = "0.2.0"

# Async Processing
from settler_workhorse.async_pool import (
    AsyncJobProcessor,
    AsyncTaskExecutor,
    ConnectionPool,
    StreamingProcessor,
    batch_process,
    parallel_map,
)

# Caching
from settler_workhorse.cache import (
    CacheBackend,
    DistributedCache,
    FeatureStoreCache,
    HybridCache,
    LocalLRUCache,
    get_cache,
    get_global_cache,
    set_global_cache,
)
from settler_workhorse.config import get_settings

# Health Checks
from settler_workhorse.health import (
    DatabaseHealthCheck,
    ExternalAPIHealthCheck,
    HealthCheckRegistry,
    HealthCheckResult,
    HealthEndpoint,
    HealthStatus,
    RedisHealthCheck,
    SystemHealth,
)

# ML/AI
from settler_workhorse.ml.core import (
    ABTestFramework,
    FeatureVector,
    MLModelConfig,
    SimilaritySearchEngine,
    VectorEmbedding,
)

# Primary exports
from settler_workhorse.models import Job, JobPriority, JobResult, JobStatus, JobType

# Observability
from settler_workhorse.observability import (
    HealthChecker,
    MetricsCollector,
    PerformanceProfiler,
    Span,
    StructuredLogger,
    Tracer,
    get_logger,
    get_metrics,
    get_tracer,
    timed,
    traced,
)

# Plugins
from settler_workhorse.plugins import (
    HandlerRegistry,
    HookManager,
    PluginInfo,
    PluginInterface,
    PluginRegistry,
    get_handler_registry,
    get_plugin_registry,
    hook,
)

# Resilience
from settler_workhorse.resilience import (
    Bulkhead,
    CircuitBreaker,
    RateLimiter,
    RetryExecutor,
    circuit_breaker,
    rate_limit,
    retry,
)
from settler_workhorse.worker import Worker

__all__ = [
    # Version
    "__version__",
    # Core
    "Job",
    "JobStatus",
    "JobPriority",
    "JobType",
    "JobResult",
    "Worker",
    "get_settings",
    # ML
    "VectorEmbedding",
    "SimilaritySearchEngine",
    "MLModelConfig",
    "ABTestFramework",
    "FeatureVector",
    # Resilience
    "CircuitBreaker",
    "RetryExecutor",
    "RateLimiter",
    "Bulkhead",
    "circuit_breaker",
    "retry",
    "rate_limit",
    # Observability
    "MetricsCollector",
    "Tracer",
    "Span",
    "StructuredLogger",
    "PerformanceProfiler",
    "HealthChecker",
    "timed",
    "traced",
    "get_metrics",
    "get_tracer",
    "get_logger",
    # Cache
    "LocalLRUCache",
    "DistributedCache",
    "HybridCache",
    "FeatureStoreCache",
    "CacheBackend",
    "get_cache",
    "get_global_cache",
    "set_global_cache",
    # Async
    "ConnectionPool",
    "AsyncTaskExecutor",
    "AsyncJobProcessor",
    "StreamingProcessor",
    "parallel_map",
    "batch_process",
    # Health
    "HealthStatus",
    "HealthCheckResult",
    "SystemHealth",
    "DatabaseHealthCheck",
    "RedisHealthCheck",
    "ExternalAPIHealthCheck",
    "HealthCheckRegistry",
    "HealthEndpoint",
    # Plugins
    "PluginInterface",
    "PluginInfo",
    "HookManager",
    "PluginRegistry",
    "HandlerRegistry",
    "hook",
    "get_plugin_registry",
    "get_handler_registry",
]

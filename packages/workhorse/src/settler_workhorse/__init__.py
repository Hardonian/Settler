"""
Settler Workhorse - Enterprise-grade Python batch processing subsystem.

Provides ML/AI infrastructure, distributed caching, async processing,
observability, health checks, and plugin architecture for reconciliation
workloads at scale.
"""

__version__ = "0.2.0"

# Core modules
from settler_workhorse import (
    async_pool,
    cache,
    config,
    db,
    health,
    ml,
    models,
    observability,
    plugins,
    resilience,
    utils,
    worker,
)

# Primary exports
from settler_workhorse.models import Job, JobStatus, JobPriority, JobType, JobResult
from settler_workhorse.worker import Worker
from settler_workhorse.config import get_settings

# ML/AI
from settler_workhorse.ml.core import (
    VectorEmbedding,
    SimilaritySearchEngine,
    MLModelConfig,
    ABTestFramework,
    FeatureVector,
)

# Resilience
from settler_workhorse.resilience import (
    CircuitBreaker,
    RetryExecutor,
    RateLimiter,
    Bulkhead,
    circuit_breaker,
    retry,
    rate_limit,
)

# Observability
from settler_workhorse.observability import (
    MetricsCollector,
    Tracer,
    Span,
    StructuredLogger,
    PerformanceProfiler,
    HealthChecker,
    timed,
    traced,
    get_metrics,
    get_tracer,
    get_logger,
)

# Caching
from settler_workhorse.cache import (
    LocalLRUCache,
    DistributedCache,
    HybridCache,
    FeatureStoreCache,
    CacheBackend,
    get_cache,
    get_global_cache,
    set_global_cache,
)

# Async Processing
from settler_workhorse.async_pool import (
    ConnectionPool,
    AsyncTaskExecutor,
    AsyncJobProcessor,
    StreamingProcessor,
    parallel_map,
    batch_process,
)

# Health Checks
from settler_workhorse.health import (
    HealthStatus,
    HealthCheckResult,
    SystemHealth,
    DatabaseHealthCheck,
    RedisHealthCheck,
    ExternalAPIHealthCheck,
    HealthCheckRegistry,
    HealthEndpoint,
)

# Plugins
from settler_workhorse.plugins import (
    PluginInterface,
    PluginInfo,
    HookManager,
    PluginRegistry,
    HandlerRegistry,
    hook,
    get_plugin_registry,
    get_handler_registry,
)

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

import hashlib
from collections.abc import Callable
from functools import wraps
from typing import Any, TypeVar, cast

from .base import CacheBackend, CacheBackendInterface
from .distributed import DistributedCache
from .hybrid import HybridCache
from .local import LocalLRUCache

# Decorator for memoization
F = TypeVar("F", bound=Callable[..., Any])


def cached(
    cache: CacheBackendInterface,
    key_prefix: str = "",
    ttl_seconds: float | None = None,
    key_func: Callable[..., str] | None = None,
    tags: set[str] | None = None,
):
    """Decorator to cache function results.

    Example:
        cache = LocalLRUCache()

        @cached(cache, key_prefix="model", ttl_seconds=300, tags={"models"})
        def expensive_model_training(data):
            # ... expensive computation ...
            return model
    """

    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default: hash of arguments
                key_data = f"{func.__module__}.{func.__name__}:{args}:{sorted(kwargs.items())}"
                cache_key = f"{key_prefix}:{hashlib.md5(key_data.encode()).hexdigest()}"

            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Compute and store
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds, tags)
            return result

        return cast("F", wrapper)

    return decorator


def get_cache(
    backend: CacheBackend = CacheBackend.MEMORY,
    **kwargs,
) -> CacheBackendInterface:
    """Factory function to create cache instances.

    Example:
        # Local cache
        cache = get_cache(CacheBackend.MEMORY, max_size=1000)

        # Redis cache
        cache = get_cache(CacheBackend.REDIS, host="localhost", port=6379)

        # Hybrid cache
        cache = get_cache(CacheBackend.HYBRID, l1_size=1000, redis_host="localhost")
    """
    if backend == CacheBackend.MEMORY:
        return LocalLRUCache(
            max_size=kwargs.get("max_size", 1000),
            max_size_bytes=kwargs.get("max_size_bytes"),
            default_ttl=kwargs.get("default_ttl"),
        )

    elif backend == CacheBackend.REDIS:
        return DistributedCache(
            host=kwargs.get("host", "localhost"),
            port=kwargs.get("port", 6379),
            db=kwargs.get("db", 0),
            password=kwargs.get("password"),
            default_ttl=kwargs.get("default_ttl"),
            key_prefix=kwargs.get("key_prefix", "settler:"),
        )

    elif backend == CacheBackend.HYBRID:
        return HybridCache(
            l1_size=kwargs.get("l1_size", 1000),
            redis_host=kwargs.get("redis_host", "localhost"),
            redis_port=kwargs.get("redis_port", 6379),
            redis_db=kwargs.get("redis_db", 0),
            redis_password=kwargs.get("redis_password"),
            default_ttl=kwargs.get("default_ttl"),
            l1_ttl_ratio=kwargs.get("l1_ttl_ratio", 0.8),
        )

    else:
        raise ValueError(f"Unknown cache backend: {backend}")


# Global cache instance
_global_cache: CacheBackendInterface | None = None


def get_global_cache() -> CacheBackendInterface:
    """Get or create global cache instance."""
    global _global_cache
    if _global_cache is None:
        _global_cache = get_cache(CacheBackend.MEMORY)
    return _global_cache


def set_global_cache(cache: CacheBackendInterface):
    """Set global cache instance."""
    global _global_cache
    _global_cache = cache

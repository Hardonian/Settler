import hashlib
from collections.abc import Callable
from functools import wraps
from typing import Any, TypeVar, cast

from .base import CacheBackendInterface
from .models import CacheBackend
from .local import LocalLRUCache
from .distributed import DistributedCache
from .hybrid import HybridCache

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

# Global cache instance management
_global_cache: CacheBackendInterface | None = None

def get_cache(
    backend: CacheBackend = CacheBackend.MEMORY,
    **kwargs,
) -> CacheBackendInterface:
    """Factory function to get a cache instance."""
    if backend == CacheBackend.MEMORY:
        return LocalLRUCache(**kwargs)
    elif backend == CacheBackend.REDIS:
        return DistributedCache(**kwargs)
    elif backend == CacheBackend.HYBRID:
        return HybridCache(**kwargs)
    else:
        raise ValueError(f"Unknown cache backend: {backend}")

def get_global_cache() -> CacheBackendInterface:
    """Get the global cache instance."""
    global _global_cache
    if _global_cache is None:
        _global_cache = get_cache(CacheBackend.MEMORY)
    return _global_cache

def set_global_cache(cache: CacheBackendInterface):
    """Set the global cache instance."""
    global _global_cache
    _global_cache = cache

"""Multi-layer caching system for the Settler workhorse.

Provides local LRU cache, distributed Redis cache, and feature store
caching with intelligent invalidation strategies for ML/AI workloads.
"""

from .base import (
    CacheBackend,
    CacheBackendInterface,
    CacheEntry,
    CacheStats,
    CacheStrategy,
)
from .distributed import DistributedCache
from .feature import FeatureStoreCache
from .hybrid import HybridCache
from .local import LocalLRUCache
from .utils import cached, get_cache, get_global_cache, set_global_cache

__all__ = [
    # Classes
    "LocalLRUCache",
    "DistributedCache",
    "HybridCache",
    "FeatureStoreCache",
    "CacheEntry",
    "CacheStats",
    "CacheBackend",
    "CacheStrategy",
    # Functions
    "get_cache",
    "get_global_cache",
    "set_global_cache",
    "cached",
    # Base
    "CacheBackendInterface",
]

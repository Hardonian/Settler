"""Multi-layer caching system for the Settler workhorse.

Provides local LRU cache, distributed Redis cache, and feature store
caching with intelligent invalidation strategies for ML/AI workloads.
"""

from .models import CacheBackend, CacheStrategy, CacheEntry, CacheStats
from .base import CacheBackendInterface
from .local import LocalLRUCache
from .distributed import DistributedCache
from .hybrid import HybridCache
from .feature import FeatureStoreCache
from .utils import cached, get_cache, get_global_cache, set_global_cache

__all__ = [
    "CacheBackend",
    "CacheStrategy",
    "CacheEntry",
    "CacheStats",
    "CacheBackendInterface",
    "LocalLRUCache",
    "DistributedCache",
    "HybridCache",
    "FeatureStoreCache",
    "cached",
    "get_cache",
    "get_global_cache",
    "set_global_cache",
]

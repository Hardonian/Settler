"""Multi-layer caching system for the Settler workhorse.

Provides local LRU cache, distributed Redis cache, and feature store
caching with intelligent invalidation strategies for ML/AI workloads.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any


class CacheBackend(Enum):
    """Available cache backends."""

    MEMORY = "memory"
    REDIS = "redis"
    HYBRID = "hybrid"  # L1: Memory, L2: Redis


class CacheStrategy(Enum):
    """Cache invalidation strategies."""

    TTL = "ttl"  # Time-to-live
    LRU = "lru"  # Least recently used
    LFU = "lfu"  # Least frequently used
    FIFO = "fifo"  # First in, first out


@dataclass
class CacheEntry:
    """A single cache entry with metadata."""

    key: str
    value: Any
    created_at: datetime
    expires_at: datetime | None = None
    access_count: int = 0
    last_accessed: datetime = field(default_factory=lambda: datetime.now(UTC))
    size_bytes: int = 0
    tags: set[str] = field(default_factory=set)


@dataclass
class CacheStats:
    """Cache performance statistics."""

    hits: int = 0
    misses: int = 0
    evictions: int = 0
    total_entries: int = 0
    total_size_bytes: int = 0
    hit_rate: float = 0.0
    avg_get_time_ms: float = 0.0
    avg_set_time_ms: float = 0.0


class CacheBackendInterface(ABC):
    """Abstract base class for cache backends."""

    @abstractmethod
    def get(self, key: str) -> Any | None:
        """Get value from cache."""
        pass

    @abstractmethod
    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: float | None = None,
        tags: set[str] | None = None,
    ) -> bool:
        """Set value in cache."""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        pass

    @abstractmethod
    def clear(self) -> bool:
        """Clear all entries from cache."""
        pass

    @abstractmethod
    def invalidate_by_tag(self, tag: str) -> int:
        """Invalidate all entries with a specific tag."""
        pass

    @abstractmethod
    def get_stats(self) -> CacheStats:
        """Get cache statistics."""
        pass

    @abstractmethod
    def keys(self) -> list[str]:
        """Get all keys in cache."""
        pass

    @abstractmethod
    def size(self) -> int:
        """Get number of entries in cache."""
        pass

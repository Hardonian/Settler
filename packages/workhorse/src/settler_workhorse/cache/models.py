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

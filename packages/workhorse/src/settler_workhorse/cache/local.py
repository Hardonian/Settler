import pickle
import threading
import time
from collections import OrderedDict
from datetime import UTC, datetime
from typing import Any

from .base import CacheBackendInterface, CacheEntry, CacheStats


class LocalLRUCache(CacheBackendInterface):
    """Thread-safe in-memory LRU cache.

    Features:
    - O(1) get and set operations
    - Thread-safe with fine-grained locking
    - Automatic eviction based on max size
    - TTL support with lazy expiration
    - Tag-based invalidation

    Example:
        cache = LocalLRUCache(max_size=1000, default_ttl=300)
        cache.set("model:v1", model_data, tags={"models", "v1"})
        data = cache.get("model:v1")
        cache.invalidate_by_tag("v1")  # Clear all v1 entries
    """

    def __init__(
        self,
        max_size: int = 1000,
        max_size_bytes: int | None = None,
        default_ttl: float | None = None,
    ):
        self.max_size = max_size
        self.max_size_bytes = max_size_bytes
        self.default_ttl = default_ttl
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._lock = threading.RLock()
        self._stats = CacheStats()
        self._tag_index: dict[str, set[str]] = {}  # tag -> set of keys

    def _is_expired(self, entry: CacheEntry) -> bool:
        """Check if an entry has expired."""
        if entry.expires_at is None:
            return False
        return datetime.now(UTC) > entry.expires_at

    def _evict_if_needed(self, new_entry_size: int = 0):
        """Evict entries if we're at capacity."""
        while len(self._cache) >= self.max_size or (
            self.max_size_bytes
            and self._stats.total_size_bytes + new_entry_size > self.max_size_bytes
        ):
            if not self._cache:
                break

            # Evict least recently used
            key, entry = self._cache.popitem(last=False)
            self._stats.evictions += 1
            self._stats.total_size_bytes -= entry.size_bytes

            # Remove from tag index
            for tag in entry.tags:
                if tag in self._tag_index:
                    self._tag_index[tag].discard(key)

    def _update_tag_index(self, key: str, tags: set[str]):
        """Update tag index for a key."""
        for tag in tags:
            if tag not in self._tag_index:
                self._tag_index[tag] = set()
            self._tag_index[tag].add(key)

    def _calculate_size(self, value: Any) -> int:
        """Estimate size of a value in bytes."""
        try:
            return len(pickle.dumps(value))
        except Exception:
            return 100  # Default estimate

    def get(self, key: str) -> Any | None:
        """Get value from cache."""
        start = time.perf_counter()

        with self._lock:
            entry = self._cache.get(key)

            if entry is None:
                self._stats.misses += 1
                return None

            if self._is_expired(entry):
                self.delete(key)
                self._stats.misses += 1
                return None

            # Update access stats
            entry.access_count += 1
            entry.last_accessed = datetime.now(UTC)

            # Move to end (most recently used)
            self._cache.move_to_end(key)

            self._stats.hits += 1

            # Update hit rate
            total = self._stats.hits + self._stats.misses
            self._stats.hit_rate = self._stats.hits / total if total > 0 else 0

            # Track timing
            duration_ms = (time.perf_counter() - start) * 1000
            # Simple moving average
            self._stats.avg_get_time_ms = (
                self._stats.avg_get_time_ms * (total - 1) + duration_ms
            ) / total

            return entry.value

    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: float | None = None,
        tags: set[str] | None = None,
    ) -> bool:
        """Set value in cache."""
        start = time.perf_counter()

        with self._lock:
            size = self._calculate_size(value)

            # Check if we need to evict
            if key in self._cache:
                old_size = self._cache[key].size_bytes
                self._stats.total_size_bytes -= old_size
            else:
                self._evict_if_needed(size)

            # Calculate expiration
            ttl = ttl_seconds or self.default_ttl
            expires_at = None
            if ttl:
                expires_at = datetime.now(UTC).timestamp() + ttl
                expires_at = datetime.fromtimestamp(expires_at, tz=UTC)

            # Create entry
            entry = CacheEntry(
                key=key,
                value=value,
                created_at=datetime.now(UTC),
                expires_at=expires_at,
                size_bytes=size,
                tags=tags or set(),
            )

            # Store
            self._cache[key] = entry
            self._cache.move_to_end(key)

            # Update stats
            self._stats.total_size_bytes += size
            self._stats.total_entries = len(self._cache)

            # Update tag index
            self._update_tag_index(key, entry.tags)

            # Track timing
            duration_ms = (time.perf_counter() - start) * 1000
            total_ops = self._stats.hits + self._stats.misses + self._stats.total_entries
            self._stats.avg_set_time_ms = (
                self._stats.avg_set_time_ms * (total_ops - 1) + duration_ms
            ) / total_ops

            return True

    def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        with self._lock:
            entry = self._cache.pop(key, None)
            if entry:
                self._stats.total_size_bytes -= entry.size_bytes
                self._stats.total_entries = len(self._cache)

                # Remove from tag index
                for tag in entry.tags:
                    if tag in self._tag_index:
                        self._tag_index[tag].discard(key)

                return True
            return False

    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return False
            if self._is_expired(entry):
                self.delete(key)
                return False
            return True

    def clear(self) -> bool:
        """Clear all entries from cache."""
        with self._lock:
            self._cache.clear()
            self._tag_index.clear()
            self._stats = CacheStats()
            return True

    def invalidate_by_tag(self, tag: str) -> int:
        """Invalidate all entries with a specific tag."""
        with self._lock:
            keys_to_delete = self._tag_index.get(tag, set()).copy()
            count = 0
            for key in keys_to_delete:
                if self.delete(key):
                    count += 1
            return count

    def get_stats(self) -> CacheStats:
        """Get cache statistics."""
        with self._lock:
            return CacheStats(
                hits=self._stats.hits,
                misses=self._stats.misses,
                evictions=self._stats.evictions,
                total_entries=len(self._cache),
                total_size_bytes=self._stats.total_size_bytes,
                hit_rate=self._stats.hit_rate,
                avg_get_time_ms=self._stats.avg_get_time_ms,
                avg_set_time_ms=self._stats.avg_set_time_ms,
            )

    def keys(self) -> list[str]:
        """Get all keys in cache."""
        with self._lock:
            return list(self._cache.keys())

    def size(self) -> int:
        """Get number of entries in cache."""
        with self._lock:
            return len(self._cache)

import pickle
import threading
import time
from collections import OrderedDict
from datetime import UTC, datetime, timedelta
from typing import Any

from .base import CacheBackendInterface
from .models import CacheEntry, CacheStats

class LocalLRUCache(CacheBackendInterface):
    """Thread-safe in-memory LRU cache."""

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
        if entry.expires_at is None:
            return False
        return datetime.now(UTC) > entry.expires_at

    def _evict_if_needed(self, new_entry_size: int = 0):
        while len(self._cache) >= self.max_size or (
            self.max_size_bytes
            and self._stats.total_size_bytes + new_entry_size > self.max_size_bytes
        ):
            if not self._cache:
                break
            key, entry = self._cache.popitem(last=False)
            self._stats.evictions += 1
            self._stats.total_size_bytes -= entry.size_bytes
            for tag in entry.tags:
                if tag in self._tag_index:
                    self._tag_index[tag].discard(key)

    def _update_tag_index(self, key: str, tags: set[str]):
        for tag in tags:
            if tag not in self._tag_index:
                self._tag_index[tag] = set()
            self._tag_index[tag].add(key)

    def _calculate_size(self, value: Any) -> int:
        try:
            return len(pickle.dumps(value))
        except Exception:
            return 100

    def get(self, key: str) -> Any | None:
        start = time.perf_counter()
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                self._stats.misses += 1
                self._update_hit_rate()
                return None
            if self._is_expired(entry):
                self._delete_internal(key)
                self._stats.misses += 1
                self._update_hit_rate()
                return None
            self._cache.move_to_end(key)
            entry.access_count += 1
            entry.last_accessed = datetime.now(UTC)
            self._stats.hits += 1
            self._update_hit_rate()
            duration_ms = (time.perf_counter() - start) * 1000
            total = self._stats.hits + self._stats.misses
            self._stats.avg_get_time_ms = (
                self._stats.avg_get_time_ms * (total - 1) + duration_ms
            ) / total if total > 0 else 0
            return entry.value

    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: float | None = None,
        tags: set[str] | None = None,
    ) -> bool:
        start = time.perf_counter()
        with self._lock:
            size = self._calculate_size(value)
            if key in self._cache:
                self._stats.total_size_bytes -= self._cache[key].size_bytes
            self._evict_if_needed(size)
            ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
            expires_at = None
            if ttl is not None and ttl > 0:
                expires_at = datetime.now(UTC) + timedelta(seconds=ttl)
            entry_tags = tags or set()
            entry = CacheEntry(
                key=key,
                value=value,
                created_at=datetime.now(UTC),
                expires_at=expires_at,
                size_bytes=size,
                tags=entry_tags,
            )
            self._cache[key] = entry
            self._update_tag_index(key, entry_tags)
            self._stats.total_entries = len(self._cache)
            self._stats.total_size_bytes += size
            duration_ms = (time.perf_counter() - start) * 1000
            total_ops = self._stats.hits + self._stats.misses + self._stats.total_entries
            self._stats.avg_set_time_ms = (
                self._stats.avg_set_time_ms * (total_ops - 1) + duration_ms
            ) / total_ops if total_ops > 0 else 0
            return True

    def _delete_internal(self, key: str) -> bool:
        entry = self._cache.pop(key, None)
        if entry:
            self._stats.total_size_bytes -= entry.size_bytes
            self._stats.total_entries = len(self._cache)
            for tag in entry.tags:
                if tag in self._tag_index:
                    self._tag_index[tag].discard(key)
            return True
        return False

    def delete(self, key: str) -> bool:
        with self._lock:
            return self._delete_internal(key)

    def exists(self, key: str) -> bool:
        with self._lock:
            if key not in self._cache:
                return False
            if self._is_expired(self._cache[key]):
                self._delete_internal(key)
                return False
            return True

    def clear(self) -> bool:
        with self._lock:
            self._cache.clear()
            self._tag_index.clear()
            self._stats = CacheStats()
            return True

    def invalidate_by_tag(self, tag: str) -> int:
        with self._lock:
            if tag not in self._tag_index:
                return 0
            keys_to_delete = list(self._tag_index[tag])
            count = 0
            for key in keys_to_delete:
                if self._delete_internal(key):
                    count += 1
            return count

    def get_stats(self) -> CacheStats:
        with self._lock:
            return CacheStats(
                hits=self._stats.hits,
                misses=self._stats.misses,
                evictions=self._stats.evictions,
                total_entries=self._stats.total_entries,
                total_size_bytes=self._stats.total_size_bytes,
                hit_rate=self._stats.hit_rate,
                avg_get_time_ms=self._stats.avg_get_time_ms,
                avg_set_time_ms=self._stats.avg_set_time_ms,
            )

    def _update_hit_rate(self):
        total = self._stats.hits + self._stats.misses
        if total > 0:
            self._stats.hit_rate = self._stats.hits / total

    def keys(self) -> list[str]:
        with self._lock:
            now = datetime.now(UTC)
            return [
                k for k, v in self._cache.items()
                if v.expires_at is None or now <= v.expires_at
            ]

    def size(self) -> int:
        with self._lock:
            return len(self.keys())

    def cleanup(self):
        """Remove all expired entries."""
        with self._lock:
            expired_keys = [
                key for key, entry in self._cache.items()
                if self._is_expired(entry)
            ]
            for key in expired_keys:
                self._delete_internal(key)

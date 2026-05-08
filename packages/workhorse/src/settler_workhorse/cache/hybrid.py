from typing import Any

from .base import CacheBackendInterface, CacheStats
from .distributed import DistributedCache
from .local import LocalLRUCache


class HybridCache(CacheBackendInterface):
    """Two-tier cache: L1 (fast local) + L2 (distributed Redis).

    Provides optimal performance for hot data while maintaining
    consistency across instances.

    Example:
        cache = HybridCache(
            l1_size=1000,
            redis_host="localhost",
            default_ttl=300,
        )

        # L1 miss, L2 hit: ~0.5ms
        # L1 hit: ~0.01ms
        cache.set("model:v1", data)
    """

    def __init__(
        self,
        l1_size: int = 1000,
        redis_host: str = "localhost",
        redis_port: int = 6379,
        redis_db: int = 0,
        redis_password: str | None = None,
        default_ttl: float | None = None,
        l1_ttl_ratio: float = 0.8,  # L1 TTL is 80% of total TTL
    ):
        self.l1 = LocalLRUCache(max_size=l1_size)
        self.l2 = DistributedCache(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            password=redis_password,
            default_ttl=default_ttl,
        )
        self.default_ttl = default_ttl
        self.l1_ttl_ratio = l1_ttl_ratio

    def _l1_ttl(self, ttl: float | None) -> float | None:
        """Calculate L1 TTL based on ratio."""
        if ttl is None:
            return None
        return ttl * self.l1_ttl_ratio

    def get(self, key: str) -> Any | None:
        """Get value from cache (L1 first, then L2)."""
        # Try L1 first
        value = self.l1.get(key)
        if value is not None:
            return value

        # Try L2, populate L1 on hit
        value = self.l2.get(key)
        if value is not None:
            # Backfill L1 (use shorter TTL)
            ttl = self.default_ttl
            if ttl:
                ttl = self._l1_ttl(ttl)
            self.l1.set(key, value, ttl)

        return value

    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: float | None = None,
        tags: set[str] | None = None,
    ) -> bool:
        """Set value in both cache levels."""
        ttl = ttl_seconds or self.default_ttl

        # Set in L2 (authoritative)
        l2_result = self.l2.set(key, value, ttl, tags)

        # Set in L1 (faster, shorter TTL)
        l1_ttl = self._l1_ttl(ttl)
        self.l1.set(key, value, l1_ttl, tags)

        return l2_result

    def delete(self, key: str) -> bool:
        """Delete from both cache levels."""
        l1_result = self.l1.delete(key)
        l2_result = self.l2.delete(key)
        return l1_result or l2_result

    def exists(self, key: str) -> bool:
        """Check existence in either cache level."""
        return self.l1.exists(key) or self.l2.exists(key)

    def clear(self) -> bool:
        """Clear both cache levels."""
        self.l1.clear()
        self.l2.clear()
        return True

    def invalidate_by_tag(self, tag: str) -> int:
        """Invalidate by tag in both levels."""
        l1_count = self.l1.invalidate_by_tag(tag)
        l2_count = self.l2.invalidate_by_tag(tag)
        return l1_count + l2_count

    def get_stats(self) -> CacheStats:
        """Get combined statistics."""
        l1_stats = self.l1.get_stats()
        l2_stats = self.l2.get_stats()

        total_hits = l1_stats.hits + l2_stats.hits
        total_misses = l1_stats.misses
        total = total_hits + total_misses

        return CacheStats(
            hits=total_hits,
            misses=total_misses,
            evictions=l1_stats.evictions + l2_stats.evictions,
            total_entries=l1_stats.total_entries + l2_stats.total_entries,
            total_size_bytes=l1_stats.total_size_bytes + l2_stats.total_size_bytes,
            hit_rate=total_hits / total if total > 0 else 0,
            avg_get_time_ms=(l1_stats.avg_get_time_ms + l2_stats.avg_get_time_ms) / 2,
            avg_set_time_ms=(l1_stats.avg_set_time_ms + l2_stats.avg_set_time_ms) / 2,
        )

    def keys(self) -> list[str]:
        """Get keys from L2 (authoritative)."""
        return self.l2.keys()

    def size(self) -> int:
        """Get total size across both levels."""
        return self.l1.size() + self.l2.size()

    def sync_l1_from_l2(self, keys: list[str]):
        """Warm L1 cache from L2 for specific keys."""
        for key in keys:
            value = self.l2.get(key)
            if value is not None:
                ttl = self.default_ttl
                if ttl:
                    ttl = self._l1_ttl(ttl)
                self.l1.set(key, value, ttl)

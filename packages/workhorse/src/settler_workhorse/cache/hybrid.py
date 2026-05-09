from typing import Any

from .base import CacheBackendInterface
from .local import LocalLRUCache
from .distributed import DistributedCache
from .models import CacheStats

class HybridCache(CacheBackendInterface):
    """Two-tier cache: L1 (fast local) + L2 (distributed Redis)."""

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

    def _l1_ttl(self, l2_ttl: float | None) -> float | None:
        if l2_ttl is None:
            return None
        return l2_ttl * self.l1_ttl_ratio

    def get(self, key: str) -> Any | None:
        value = self.l1.get(key)
        if value is not None:
            return value
        value = self.l2.get(key)
        if value is not None:
            ttl = self.default_ttl
            if ttl:
                ttl = self._l1_ttl(ttl)
            self.l1.set(key, value, ttl)
            return value
        return None

    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: float | None = None,
        tags: set[str] | None = None,
    ) -> bool:
        l2_success = self.l2.set(key, value, ttl_seconds, tags)
        if l2_success:
            l1_ttl = self._l1_ttl(ttl_seconds or self.default_ttl)
            self.l1.set(key, value, l1_ttl, tags)
            return True
        return False

    def delete(self, key: str) -> bool:
        l1_success = self.l1.delete(key)
        l2_success = self.l2.delete(key)
        return l1_success or l2_success

    def exists(self, key: str) -> bool:
        return self.l1.exists(key) or self.l2.exists(key)

    def clear(self) -> bool:
        l1_success = self.l1.clear()
        l2_success = self.l2.clear()
        return l1_success and l2_success

    def invalidate_by_tag(self, tag: str) -> int:
        l1_count = self.l1.invalidate_by_tag(tag)
        l2_count = self.l2.invalidate_by_tag(tag)
        return max(l1_count, l2_count)

    def get_stats(self) -> CacheStats:
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
        return self.l2.keys()

    def size(self) -> int:
        return self.l1.size() + self.l2.size()

    def sync_l1_from_l2(self, keys: list[str]):
        for key in keys:
            value = self.l2.get(key)
            if value is not None:
                ttl = self.default_ttl
                if ttl:
                    ttl = self._l1_ttl(ttl)
                self.l1.set(key, value, ttl)

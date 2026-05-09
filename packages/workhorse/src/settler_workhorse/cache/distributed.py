import json
import pickle
import threading
import time
from typing import Any

from .base import CacheBackendInterface
from .models import CacheStats
from .local import LocalLRUCache

class DistributedCache(CacheBackendInterface):
    """Distributed cache using Redis for multi-instance deployments."""

    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: str | None = None,
        default_ttl: float | None = None,
        key_prefix: str = "settler:",
        socket_timeout: float = 5.0,
        socket_connect_timeout: float = 5.0,
        max_connections: int = 50,
    ):
        self.host = host
        self.port = port
        self.db = db
        self.password = password
        self.default_ttl = default_ttl
        self.key_prefix = key_prefix
        self.socket_timeout = socket_timeout
        self.socket_connect_timeout = socket_connect_timeout
        self.max_connections = max_connections

        self._client: Any = None
        self._pool: Any = None
        self._local_fallback: LocalLRUCache | None = None
        self._available = False
        self._lock = threading.RLock()
        self._stats = CacheStats()
        self._tag_key_prefix = f"{key_prefix}tags:"

        self._connect()

    def _connect(self):
        try:
            import redis
            self._pool = redis.ConnectionPool(
                host=self.host,
                port=self.port,
                db=self.db,
                password=self.password,
                max_connections=self.max_connections,
                socket_timeout=self.socket_timeout,
                socket_connect_timeout=self.socket_connect_timeout,
            )
            self._client = redis.Redis(connection_pool=self._pool)
            self._client.ping()
            self._available = True
        except ImportError:
            print("Warning: redis package not installed. Using local fallback.")
            self._local_fallback = LocalLRUCache()
            self._available = False
        except Exception as e:
            print(f"Warning: Could not connect to Redis: {e}. Using local fallback.")
            self._local_fallback = LocalLRUCache()
            self._available = False

    def _make_key(self, key: str) -> str:
        return f"{self.key_prefix}{key}"

    def _serialize(self, value: Any) -> bytes:
        try:
            return json.dumps(value, default=str).encode("utf-8")
        except (TypeError, ValueError):
            return pickle.dumps(value)

    def _deserialize(self, data: bytes) -> Any:
        try:
            return json.loads(data.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return pickle.loads(data)

    def _update_tag_index(self, key: str, tags: set[str]):
        if not self._available:
            return
        try:
            for tag in tags:
                tag_key = f"{self._tag_key_prefix}{tag}"
                self._client.sadd(tag_key, key)
        except Exception:
            pass

    def _remove_from_tag_index(self, key: str, tags: set[str]):
        if not self._available:
            return
        try:
            for tag in tags:
                tag_key = f"{self._tag_key_prefix}{tag}"
                self._client.srem(tag_key, key)
        except Exception:
            pass

    def get(self, key: str) -> Any | None:
        start = time.perf_counter()
        if self._available and self._client:
            try:
                data = self._client.get(self._make_key(key))
                if data:
                    self._stats.hits += 1
                    self._update_hit_rate()
                    self._update_timing(start)
                    return self._deserialize(data)
            except Exception:
                pass
        if self._local_fallback:
            value = self._local_fallback.get(key)
            if value is not None:
                self._stats.hits += 1
                self._update_hit_rate()
                self._update_timing(start)
                return value
        self._stats.misses += 1
        self._update_hit_rate()
        return None

    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: float | None = None,
        tags: set[str] | None = None,
    ) -> bool:
        start = time.perf_counter()
        if self._available and self._client:
            try:
                data = self._serialize(value)
                ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
                full_key = self._make_key(key)
                if ttl and ttl > 0:
                    self._client.setex(full_key, int(ttl), data)
                else:
                    self._client.set(full_key, data)
                if tags:
                    self._update_tag_index(key, tags)
                self._stats.total_size_bytes += len(data)
                self._update_set_timing(start)
                return True
            except Exception:
                pass
        if self._local_fallback:
            return self._local_fallback.set(key, value, ttl_seconds, tags)
        return False

    def delete(self, key: str) -> bool:
        if self._available and self._client:
            try:
                return bool(self._client.delete(self._make_key(key)))
            except Exception:
                return False
        if self._local_fallback:
            return self._local_fallback.delete(key)
        return False

    def exists(self, key: str) -> bool:
        if self._available and self._client:
            try:
                return bool(self._client.exists(self._make_key(key)))
            except Exception:
                return False
        if self._local_fallback:
            return self._local_fallback.exists(key)
        return False

    def clear(self) -> bool:
        result = True

        if self._available and self._client:
            try:
                # Delete by pattern
                for key in self._client.scan_iter(match=f"{self.key_prefix}*"):
                    self._client.delete(key)
            except Exception:
                result = False

        if self._local_fallback:
            self._local_fallback.clear()

        return result

    def invalidate_by_tag(self, tag: str) -> int:
        count = 0

        if self._available and self._client:
            try:
                tag_key = f"{self._tag_key_prefix}{tag}"
                keys = self._client.smembers(tag_key)

                for key in keys:
                    key_str = key.decode("utf-8") if isinstance(key, bytes) else key
                    if self.delete(key_str):
                        count += 1

                # Clean up tag set
                self._client.delete(tag_key)

            except Exception:
                pass

        if self._local_fallback:
            count += self._local_fallback.invalidate_by_tag(tag)

        return count

    def get_stats(self) -> CacheStats:
        stats = CacheStats(
            hits=self._stats.hits,
            misses=self._stats.misses,
            hit_rate=self._stats.hit_rate,
            avg_get_time_ms=self._stats.avg_get_time_ms,
            avg_set_time_ms=self._stats.avg_set_time_ms,
        )

        if self._available and self._client:
            try:
                info = self._client.info()
                stats.total_entries = info.get(f"db{self.db}", {}).get("keys", 0)
            except Exception:
                pass

        if self._local_fallback:
            local_stats = self._local_fallback.get_stats()
            stats.total_entries += local_stats.total_entries
            stats.evictions += local_stats.evictions
            stats.total_size_bytes += local_stats.total_size_bytes

        return stats

    def keys(self) -> list[str]:
        keys = []

        if self._available and self._client:
            try:
                for key in self._client.scan_iter(match=f"{self.key_prefix}*"):
                    key_str = key.decode("utf-8") if isinstance(key, bytes) else key
                    keys.append(key_str[len(self.key_prefix) :])
            except Exception:
                pass

        if self._local_fallback:
            keys.extend(self._local_fallback.keys())

        return keys

    def size(self) -> int:
        stats = self.get_stats()
        return stats.total_entries

    def _update_hit_rate(self):
        total = self._stats.hits + self._stats.misses
        if total > 0:
            self._stats.hit_rate = self._stats.hits / total

    def _update_timing(self, start: float):
        duration_ms = (time.perf_counter() - start) * 1000
        total = self._stats.hits + self._stats.misses
        self._stats.avg_get_time_ms = (
            self._stats.avg_get_time_ms * (total - 1) + duration_ms
        ) / total if total > 0 else 0

    def _update_set_timing(self, start: float):
        duration_ms = (time.perf_counter() - start) * 1000
        total_ops = self._stats.hits + self._stats.misses + self._stats.total_entries
        self._stats.avg_set_time_ms = (
            self._stats.avg_set_time_ms * (total_ops - 1) + duration_ms
        ) / total_ops if total_ops > 0 else 0

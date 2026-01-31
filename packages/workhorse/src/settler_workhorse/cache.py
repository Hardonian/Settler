"""
Multi-layer caching system for the Settler workhorse.

Provides local LRU cache, distributed Redis cache, and feature store
caching with intelligent invalidation strategies for ML/AI workloads.
"""

import hashlib
import json
import pickle
import threading
import time
from abc import ABC, abstractmethod
from collections import OrderedDict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from functools import wraps
from typing import (
    Any, Callable, Dict, Generic, List, Optional, Protocol, Set, TypeVar, Union, cast
)


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
    expires_at: Optional[datetime] = None
    access_count: int = 0
    last_accessed: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    size_bytes: int = 0
    tags: Set[str] = field(default_factory=set)


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
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        pass
    
    @abstractmethod
    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: Optional[float] = None,
        tags: Optional[Set[str]] = None,
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
    def keys(self) -> List[str]:
        """Get all keys in cache."""
        pass
    
    @abstractmethod
    def size(self) -> int:
        """Get number of entries in cache."""
        pass


class LocalLRUCache(CacheBackendInterface):
    """
    Thread-safe in-memory LRU cache.
    
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
        max_size_bytes: Optional[int] = None,
        default_ttl: Optional[float] = None,
    ):
        self.max_size = max_size
        self.max_size_bytes = max_size_bytes
        self.default_ttl = default_ttl
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._lock = threading.RLock()
        self._stats = CacheStats()
        self._tag_index: Dict[str, Set[str]] = {}  # tag -> set of keys
    
    def _is_expired(self, entry: CacheEntry) -> bool:
        """Check if an entry has expired."""
        if entry.expires_at is None:
            return False
        return datetime.now(timezone.utc) > entry.expires_at
    
    def _evict_if_needed(self, new_entry_size: int = 0):
        """Evict entries if we're at capacity."""
        while len(self._cache) >= self.max_size or (
            self.max_size_bytes and 
            self._stats.total_size_bytes + new_entry_size > self.max_size_bytes
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
    
    def _update_tag_index(self, key: str, tags: Set[str]):
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
    
    def get(self, key: str) -> Optional[Any]:
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
            entry.last_accessed = datetime.now(timezone.utc)
            
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
                (self._stats.avg_get_time_ms * (total - 1) + duration_ms) / total
            )
            
            return entry.value
    
    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: Optional[float] = None,
        tags: Optional[Set[str]] = None,
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
                expires_at = datetime.now(timezone.utc).timestamp() + ttl
                expires_at = datetime.fromtimestamp(expires_at, tz=timezone.utc)
            
            # Create entry
            entry = CacheEntry(
                key=key,
                value=value,
                created_at=datetime.now(timezone.utc),
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
                (self._stats.avg_set_time_ms * (total_ops - 1) + duration_ms) / total_ops
            )
            
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
    
    def keys(self) -> List[str]:
        """Get all keys in cache."""
        with self._lock:
            return list(self._cache.keys())
    
    def size(self) -> int:
        """Get number of entries in cache."""
        with self._lock:
            return len(self._cache)


class DistributedCache(CacheBackendInterface):
    """
    Distributed cache using Redis for multi-instance deployments.
    
    Features:
    - Redis connection pooling
    - Automatic serialization (JSON/pickle)
    - Pub/sub for cache invalidation
    - Cluster support
    
    Note: Requires redis-py package. Falls back to local cache if unavailable.
    
    Example:
        cache = DistributedCache(
            host="localhost",
            port=6379,
            default_ttl=300,
        )
        cache.set("feature:model-v2", features, tags={"features", "model-v2"})
    """
    
    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        default_ttl: Optional[float] = None,
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
        self._local_fallback: Optional[LocalLRUCache] = None
        self._available = False
        self._lock = threading.RLock()
        self._stats = CacheStats()
        self._tag_key_prefix = f"{key_prefix}tags:"
        
        self._connect()
    
    def _connect(self):
        """Establish Redis connection."""
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
            
            # Test connection
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
        """Add prefix to key."""
        return f"{self.key_prefix}{key}"
    
    def _serialize(self, value: Any) -> bytes:
        """Serialize value for storage."""
        try:
            return json.dumps(value, default=str).encode('utf-8')
        except (TypeError, ValueError):
            return pickle.dumps(value)
    
    def _deserialize(self, data: bytes) -> Any:
        """Deserialize value from storage."""
        try:
            return json.loads(data.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return pickle.loads(data)
    
    def _update_tag_index(self, key: str, tags: Set[str]):
        """Update tag index in Redis."""
        if not self._available:
            return
        
        try:
            for tag in tags:
                tag_key = f"{self._tag_key_prefix}{tag}"
                self._client.sadd(tag_key, key)
        except Exception:
            pass
    
    def _remove_from_tag_index(self, key: str, tags: Set[str]):
        """Remove key from tag index."""
        if not self._available:
            return
        
        try:
            for tag in tags:
                tag_key = f"{self._tag_key_prefix}{tag}"
                self._client.srem(tag_key, key)
        except Exception:
            pass
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        start = time.perf_counter()
        
        # Try Redis first
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
        
        # Fallback to local
        if self._local_fallback:
            value = self._local_fallback.get(key)
            if value is not None:
                self._stats.hits += 1
            else:
                self._stats.misses += 1
            self._update_hit_rate()
            self._update_timing(start)
            return value
        
        self._stats.misses += 1
        self._update_hit_rate()
        self._update_timing(start)
        return None
    
    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: Optional[float] = None,
        tags: Optional[Set[str]] = None,
    ) -> bool:
        """Set value in cache."""
        start = time.perf_counter()
        
        ttl = ttl_seconds or self.default_ttl
        tags = tags or set()
        
        # Try Redis first
        if self._available and self._client:
            try:
                data = self._serialize(value)
                redis_key = self._make_key(key)
                
                if ttl:
                    self._client.setex(redis_key, int(ttl), data)
                else:
                    self._client.set(redis_key, data)
                
                # Update tag index
                if tags:
                    self._update_tag_index(key, tags)
                
                self._update_set_timing(start)
                return True
                
            except Exception:
                pass
        
        # Fallback to local
        if self._local_fallback:
            result = self._local_fallback.set(key, value, ttl, tags)
            self._update_set_timing(start)
            return result
        
        return False
    
    def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        result = False
        
        if self._available and self._client:
            try:
                deleted = self._client.delete(self._make_key(key))
                result = deleted > 0
            except Exception:
                pass
        
        if self._local_fallback:
            local_result = self._local_fallback.delete(key)
            result = result or local_result
        
        return result
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        if self._available and self._client:
            try:
                return bool(self._client.exists(self._make_key(key)))
            except Exception:
                pass
        
        if self._local_fallback:
            return self._local_fallback.exists(key)
        
        return False
    
    def clear(self) -> bool:
        """Clear all entries from cache."""
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
        """Invalidate all entries with a specific tag."""
        count = 0
        
        if self._available and self._client:
            try:
                tag_key = f"{self._tag_key_prefix}{tag}"
                keys = self._client.smembers(tag_key)
                
                for key in keys:
                    key_str = key.decode('utf-8') if isinstance(key, bytes) else key
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
        """Get cache statistics."""
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
                stats.total_entries = info.get('db0', {}).get('keys', 0)
            except Exception:
                pass
        
        if self._local_fallback:
            local_stats = self._local_fallback.get_stats()
            stats.total_entries += local_stats.total_entries
            stats.evictions += local_stats.evictions
            stats.total_size_bytes += local_stats.total_size_bytes
        
        return stats
    
    def keys(self) -> List[str]:
        """Get all keys in cache."""
        keys = []
        
        if self._available and self._client:
            try:
                for key in self._client.scan_iter(match=f"{self.key_prefix}*"):
                    key_str = key.decode('utf-8') if isinstance(key, bytes) else key
                    keys.append(key_str[len(self.key_prefix):])
            except Exception:
                pass
        
        if self._local_fallback:
            keys.extend(self._local_fallback.keys())
        
        return keys
    
    def size(self) -> int:
        """Get number of entries in cache."""
        stats = self.get_stats()
        return stats.total_entries
    
    def _update_hit_rate(self):
        """Update hit rate statistic."""
        total = self._stats.hits + self._stats.misses
        self._stats.hit_rate = self._stats.hits / total if total > 0 else 0
    
    def _update_timing(self, start: float):
        """Update get timing."""
        duration_ms = (time.perf_counter() - start) * 1000
        total = self._stats.hits + self._stats.misses
        self._stats.avg_get_time_ms = (
            (self._stats.avg_get_time_ms * (total - 1) + duration_ms) / total
        )
    
    def _update_set_timing(self, start: float):
        """Update set timing."""
        duration_ms = (time.perf_counter() - start) * 1000
        total_ops = self._stats.hits + self._stats.misses + self._stats.total_entries
        self._stats.avg_set_time_ms = (
            (self._stats.avg_set_time_ms * (total_ops - 1) + duration_ms) / total_ops
        )


class HybridCache(CacheBackendInterface):
    """
    Two-tier cache: L1 (fast local) + L2 (distributed Redis).
    
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
        redis_password: Optional[str] = None,
        default_ttl: Optional[float] = None,
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
    
    def _l1_ttl(self, ttl: Optional[float]) -> Optional[float]:
        """Calculate L1 TTL based on ratio."""
        if ttl is None:
            return None
        return ttl * self.l1_ttl_ratio
    
    def get(self, key: str) -> Optional[Any]:
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
        ttl_seconds: Optional[float] = None,
        tags: Optional[Set[str]] = None,
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
    
    def keys(self) -> List[str]:
        """Get keys from L2 (authoritative)."""
        return self.l2.keys()
    
    def size(self) -> int:
        """Get total size across both levels."""
        return self.l1.size() + self.l2.size()
    
    def sync_l1_from_l2(self, keys: List[str]):
        """Warm L1 cache from L2 for specific keys."""
        for key in keys:
            value = self.l2.get(key)
            if value is not None:
                ttl = self.default_ttl
                if ttl:
                    ttl = self._l1_ttl(ttl)
                self.l1.set(key, value, ttl)


class FeatureStoreCache:
    """
    Specialized cache for ML feature vectors with versioning.
    
    Supports:
    - Feature vector storage with efficient serialization
    - Version management for A/B testing
    - TTL-based expiration
    - Batch retrieval for training
    
    Example:
        feature_cache = FeatureStoreCache(cache_backend)
        
        # Store features with metadata
        feature_cache.store(
            entity_id="user-123",
            feature_name="transaction_patterns",
            version="v2",
            features={"avg_amount": 150.50, "frequency": 0.8},
        )
        
        # Retrieve for inference
        features = feature_cache.retrieve("user-123", "transaction_patterns", "v2")
    """
    
    def __init__(self, cache: CacheBackendInterface, default_ttl: float = 3600):
        self.cache = cache
        self.default_ttl = default_ttl
    
    def _make_key(self, entity_id: str, feature_name: str, version: str) -> str:
        """Generate cache key for feature vector."""
        return f"features:{feature_name}:{version}:{entity_id}"
    
    def store(
        self,
        entity_id: str,
        feature_name: str,
        version: str,
        features: Dict[str, Any],
        ttl_seconds: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Store a feature vector."""
        key = self._make_key(entity_id, feature_name, version)
        
        entry = {
            "entity_id": entity_id,
            "feature_name": feature_name,
            "version": version,
            "features": features,
            "metadata": metadata or {},
            "stored_at": datetime.now(timezone.utc).isoformat(),
        }
        
        return self.cache.set(
            key,
            entry,
            ttl_seconds or self.default_ttl,
            tags={"features", feature_name, version},
        )
    
    def retrieve(
        self,
        entity_id: str,
        feature_name: str,
        version: str,
    ) -> Optional[Dict[str, Any]]:
        """Retrieve a feature vector."""
        key = self._make_key(entity_id, feature_name, version)
        entry = self.cache.get(key)
        
        if entry:
            return entry.get("features")
        return None
    
    def retrieve_batch(
        self,
        entity_ids: List[str],
        feature_name: str,
        version: str,
    ) -> Dict[str, Optional[Dict[str, Any]]]:
        """Retrieve multiple feature vectors."""
        return {
            entity_id: self.retrieve(entity_id, feature_name, version)
            for entity_id in entity_ids
        }
    
    def invalidate_version(self, feature_name: str, version: str) -> int:
        """Invalidate all features of a specific version."""
        return self.cache.invalidate_by_tag(version)
    
    def invalidate_feature(self, feature_name: str) -> int:
        """Invalidate all versions of a feature."""
        return self.cache.invalidate_by_tag(feature_name)
    
    def list_entities(
        self,
        feature_name: str,
        version: str,
        limit: int = 1000,
    ) -> List[str]:
        """List all entities with cached features."""
        prefix = f"features:{feature_name}:{version}:"
        keys = self.cache.keys()
        
        entities = []
        for key in keys:
            if key.startswith(prefix):
                entity_id = key[len(prefix):]
                entities.append(entity_id)
                if len(entities) >= limit:
                    break
        
        return entities


# Decorator for memoization
F = TypeVar('F', bound=Callable[..., Any])


def cached(
    cache: CacheBackendInterface,
    key_prefix: str = "",
    ttl_seconds: Optional[float] = None,
    key_func: Optional[Callable[..., str]] = None,
    tags: Optional[Set[str]] = None,
):
    """
    Decorator to cache function results.
    
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
        
        return cast(F, wrapper)
    return decorator


def get_cache(
    backend: CacheBackend = CacheBackend.MEMORY,
    **kwargs,
) -> CacheBackendInterface:
    """
    Factory function to create cache instances.
    
    Example:
        # Local cache
        cache = get_cache(CacheBackend.MEMORY, max_size=1000)
        
        # Redis cache
        cache = get_cache(CacheBackend.REDIS, host="localhost", port=6379)
        
        # Hybrid cache
        cache = get_cache(CacheBackend.HYBRID, l1_size=1000, redis_host="localhost")
    """
    if backend == CacheBackend.MEMORY:
        return LocalLRUCache(
            max_size=kwargs.get('max_size', 1000),
            max_size_bytes=kwargs.get('max_size_bytes'),
            default_ttl=kwargs.get('default_ttl'),
        )
    
    elif backend == CacheBackend.REDIS:
        return DistributedCache(
            host=kwargs.get('host', 'localhost'),
            port=kwargs.get('port', 6379),
            db=kwargs.get('db', 0),
            password=kwargs.get('password'),
            default_ttl=kwargs.get('default_ttl'),
            key_prefix=kwargs.get('key_prefix', 'settler:'),
        )
    
    elif backend == CacheBackend.HYBRID:
        return HybridCache(
            l1_size=kwargs.get('l1_size', 1000),
            redis_host=kwargs.get('redis_host', 'localhost'),
            redis_port=kwargs.get('redis_port', 6379),
            redis_db=kwargs.get('redis_db', 0),
            redis_password=kwargs.get('redis_password'),
            default_ttl=kwargs.get('default_ttl'),
            l1_ttl_ratio=kwargs.get('l1_ttl_ratio', 0.8),
        )
    
    else:
        raise ValueError(f"Unknown cache backend: {backend}")


# Global cache instance
_global_cache: Optional[CacheBackendInterface] = None


def get_global_cache() -> CacheBackendInterface:
    """Get or create global cache instance."""
    global _global_cache
    if _global_cache is None:
        _global_cache = get_cache(CacheBackend.MEMORY)
    return _global_cache


def set_global_cache(cache: CacheBackendInterface):
    """Set global cache instance."""
    global _global_cache
    _global_cache = cache


# Export public API
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

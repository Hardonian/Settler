from abc import ABC, abstractmethod
from typing import Any
from .models import CacheStats

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

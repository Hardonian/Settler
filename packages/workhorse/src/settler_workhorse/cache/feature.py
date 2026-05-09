from datetime import UTC, datetime
from typing import Any

from .base import CacheBackendInterface

class FeatureStoreCache:
    """Specialized cache for ML feature vectors with versioning."""

    def __init__(self, cache: CacheBackendInterface, default_ttl: float = 3600):
        self.cache = cache
        self.default_ttl = default_ttl

    def _make_key(self, entity_id: str, feature_name: str, version: str) -> str:
        return f"features:{feature_name}:{version}:{entity_id}"

    def store(
        self,
        entity_id: str,
        feature_name: str,
        version: str,
        features: dict[str, Any],
        ttl_seconds: float | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> bool:
        key = self._make_key(entity_id, feature_name, version)
        entry = {
            "entity_id": entity_id,
            "feature_name": feature_name,
            "version": version,
            "features": features,
            "metadata": metadata or {},
            "stored_at": datetime.now(UTC).isoformat(),
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
    ) -> dict[str, Any] | None:
        key = self._make_key(entity_id, feature_name, version)
        entry = self.cache.get(key)
        if entry:
            return entry.get("features")
        return None

    def retrieve_batch(
        self,
        entity_ids: list[str],
        feature_name: str,
        version: str,
    ) -> dict[str, dict[str, Any] | None]:
        """Retrieve multiple feature vectors."""
        return {
            entity_id: self.retrieve(entity_id, feature_name, version) for entity_id in entity_ids
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
    ) -> list[str]:
        """List all entities with cached features."""
        prefix = f"features:{feature_name}:{version}:"
        keys = self.cache.keys()

        entities = []
        for key in keys:
            if key.startswith(prefix):
                entity_id = key[len(prefix) :]
                entities.append(entity_id)
                if len(entities) >= limit:
                    break

        return entities

    def get_metadata(
        self,
        entity_id: str,
        feature_name: str,
        version: str,
    ) -> dict[str, Any] | None:
        key = self._make_key(entity_id, feature_name, version)
        entry = self.cache.get(key)
        if entry:
            return entry.get("metadata")
        return None

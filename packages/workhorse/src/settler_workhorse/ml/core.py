"""
ML Core - Base classes for ML/AI operations.

Enterprise-grade ML infrastructure with:
- Vector embeddings support
- Semantic search
- Feature stores
- Model versioning
- A/B testing framework
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Generic, List, Optional, TypeVar, Union
import hashlib
import json
import numpy as np
from pydantic import BaseModel, Field


class VectorEmbedding(BaseModel):
    """Vector embedding for semantic search.
    
    Attributes:
        id: Unique identifier
        tenant_id: Tenant scope
        entity_type: Type of entity (transaction, receipt, etc.)
        entity_id: Entity identifier
        vector: Embedding vector (e.g., 384-dim for sentence-transformers)
        metadata: Additional metadata
        model_version: Model version used for embedding
        created_at: Timestamp
    """
    id: str
    tenant_id: str
    entity_type: str
    entity_id: str
    vector: List[float]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    model_version: str = "1.0.0"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "vector": self.vector,
            "metadata": self.metadata,
            "model_version": self.model_version,
            "created_at": self.created_at.isoformat(),
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VectorEmbedding":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            tenant_id=data["tenant_id"],
            entity_type=data["entity_type"],
            entity_id=data["entity_id"],
            vector=data["vector"],
            metadata=data.get("metadata", {}),
            model_version=data.get("model_version", "1.0.0"),
            created_at=datetime.fromisoformat(data["created_at"]) if "created_at" in data else datetime.utcnow(),
        )


class MLOperationType(str, Enum):
    """Types of ML operations."""
    EMBEDDING_GENERATION = "embedding_generation"
    SIMILARITY_SEARCH = "similarity_search"
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    CLUSTERING = "clustering"
    ANOMALY_DETECTION = "anomaly_detection"
    FORECASTING = "forecasting"


@dataclass
class MLModelConfig:
    """ML model configuration.
    
    Attributes:
        name: Model name
        version: Model version
        operation_type: Type of operation
        hyperparameters: Model hyperparameters
        feature_columns: Input features
        target_column: Target variable (for supervised learning)
        batch_size: Inference batch size
        confidence_threshold: Minimum confidence for predictions
    """
    name: str
    version: str = "1.0.0"
    operation_type: MLOperationType = MLOperationType.CLASSIFICATION
    hyperparameters: Dict[str, Any] = field(default_factory=dict)
    feature_columns: List[str] = field(default_factory=list)
    target_column: Optional[str] = None
    batch_size: int = 1000
    confidence_threshold: float = 0.8
    
    def get_signature(self) -> str:
        """Generate unique signature for model config."""
        config_str = json.dumps({
            "name": self.name,
            "version": self.version,
            "operation_type": self.operation_type.value,
            "hyperparameters": self.hyperparameters,
            "feature_columns": self.feature_columns,
            "target_column": self.target_column,
        }, sort_keys=True)
        return hashlib.sha256(config_str.encode()).hexdigest()[:16]


class MLModelVersion(BaseModel):
    """ML model version metadata.
    
    Attributes:
        model_name: Base model name
        version: Version string (semver)
        created_at: Creation timestamp
        trained_by: Training job/pipeline ID
        metrics: Model performance metrics
        is_production: Whether this is the production version
        is_canary: Whether this is a canary deployment
        traffic_percentage: Traffic percentage (0-100)
        artifact_path: Path to model artifact
    """
    model_name: str
    version: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    trained_by: Optional[str] = None
    metrics: Dict[str, float] = Field(default_factory=dict)
    is_production: bool = False
    is_canary: bool = False
    traffic_percentage: float = 0.0
    artifact_path: Optional[str] = None
    
    def promote_to_production(self) -> None:
        """Promote this version to production."""
        self.is_production = True
        self.is_canary = False
        self.traffic_percentage = 100.0
    
    def set_canary(self, percentage: float) -> None:
        """Set as canary deployment with traffic percentage."""
        self.is_canary = True
        self.traffic_percentage = max(0.0, min(100.0, percentage))


T = TypeVar("T")


class FeatureVector(BaseModel, Generic[T]):
    """Generic feature vector for ML operations.
    
    Type parameter T defines the entity type (e.g., Transaction, Receipt).
    """
    entity_id: str
    tenant_id: str
    features: Dict[str, Union[float, int, str, bool]]
    feature_version: str = "1.0.0"
    computed_at: datetime = Field(default_factory=datetime.utcnow)
    entity_type: str = "unknown"
    
    def to_numpy(self, feature_names: List[str]) -> np.ndarray:
        """Convert to numpy array with specified feature order."""
        return np.array([self.features.get(name, 0.0) for name in feature_names])
    
    def get_feature_hash(self) -> str:
        """Generate hash of feature values for deduplication."""
        feature_str = json.dumps(self.features, sort_keys=True)
        return hashlib.sha256(feature_str.encode()).hexdigest()[:16]


class MLPipelineStage(ABC):
    """Abstract base class for ML pipeline stages.
    
    All ML operations should inherit from this class to ensure
    consistent interface, observability, and error handling.
    """
    
    def __init__(self, name: str, config: MLModelConfig):
        self.name = name
        self.config = config
        self._initialized = False
    
    @abstractmethod
    def initialize(self) -> None:
        """Initialize the pipeline stage.
        
        Load models, allocate resources, validate configuration.
        """
        pass
    
    @abstractmethod
    def execute(self, inputs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Execute the pipeline stage on inputs.
        
        Args:
            inputs: List of input records
            
        Returns:
            List of output records with predictions/features
        """
        pass
    
    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Check health of the pipeline stage.
        
        Returns:
            Health status dictionary
        """
        pass
    
    def validate_inputs(self, inputs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate and filter inputs.
        
        Returns only valid inputs with required features.
        """
        valid = []
        for inp in inputs:
            if all(col in inp for col in self.config.feature_columns):
                valid.append(inp)
        return valid


class SimilaritySearchEngine:
    """Vector similarity search engine.
    
    Performs efficient similarity search on vector embeddings.
    Supports cosine similarity, Euclidean distance, and dot product.
    """
    
    def __init__(self, metric: str = "cosine"):
        self.metric = metric
        self.embeddings: List[VectorEmbedding] = []
    
    def add_embedding(self, embedding: VectorEmbedding) -> None:
        """Add an embedding to the index."""
        self.embeddings.append(embedding)
    
    def search(
        self,
        query_vector: List[float],
        top_k: int = 10,
        tenant_id: Optional[str] = None,
        entity_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Search for similar embeddings.
        
        Args:
            query_vector: Query embedding vector
            top_k: Number of results to return
            tenant_id: Filter by tenant (optional)
            entity_type: Filter by entity type (optional)
            
        Returns:
            List of results with similarity scores
        """
        query_np = np.array(query_vector)
        
        results = []
        for emb in self.embeddings:
            # Filter by tenant and entity type
            if tenant_id and emb.tenant_id != tenant_id:
                continue
            if entity_type and emb.entity_type != entity_type:
                continue
            
            # Calculate similarity
            emb_np = np.array(emb.vector)
            
            if self.metric == "cosine":
                similarity = np.dot(query_np, emb_np) / (np.linalg.norm(query_np) * np.linalg.norm(emb_np))
            elif self.metric == "euclidean":
                similarity = -np.linalg.norm(query_np - emb_np)  # Negative for sorting
            else:  # dot
                similarity = np.dot(query_np, emb_np)
            
            results.append({
                "embedding": emb,
                "similarity": float(similarity),
            })
        
        # Sort by similarity (descending)
        results.sort(key=lambda x: x["similarity"], reverse=True)
        
        return results[:top_k]
    
    def clear(self) -> None:
        """Clear all embeddings."""
        self.embeddings.clear()


class ABTestFramework:
    """A/B testing framework for ML models.
    
    Manages traffic splitting between model versions.
    """
    
    def __init__(self):
        self.versions: Dict[str, List[MLModelVersion]] = {}
    
    def register_version(self, version: MLModelVersion) -> None:
        """Register a model version."""
        if version.model_name not in self.versions:
            self.versions[version.model_name] = []
        self.versions[version.model_name].append(version)
    
    def get_version_for_request(
        self,
        model_name: str,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> Optional[MLModelVersion]:
        """Select model version for request.
        
        Uses consistent hashing for deterministic routing.
        
        Args:
            model_name: Name of the model
            request_id: Request identifier (for consistent hashing)
            user_id: User identifier (for user-based routing)
            
        Returns:
            Selected model version
        """
        if model_name not in self.versions:
            return None
        
        versions = self.versions[model_name]
        
        # Check for production version
        prod_versions = [v for v in versions if v.is_production]
        if prod_versions:
            return prod_versions[0]
        
        # Use consistent hashing for canary
        if request_id:
            hash_val = int(hashlib.sha256(request_id.encode()).hexdigest(), 16)
            cumulative = 0.0
            for version in versions:
                if version.is_canary:
                    cumulative += version.traffic_percentage
                    if (hash_val % 10000) / 100 < cumulative:
                        return version
        
        # Default to first version
        return versions[0] if versions else None
    
    def get_traffic_split(self, model_name: str) -> Dict[str, float]:
        """Get current traffic split for a model."""
        if model_name not in self.versions:
            return {}
        
        return {
            v.version: v.traffic_percentage
            for v in self.versions[model_name]
        }


# Export all classes
__all__ = [
    "VectorEmbedding",
    "MLOperationType",
    "MLModelConfig",
    "MLModelVersion",
    "FeatureVector",
    "MLPipelineStage",
    "SimilaritySearchEngine",
    "ABTestFramework",
]

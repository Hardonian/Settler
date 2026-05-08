from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum


class PoolState(Enum):
    """States of a connection pool."""

    INITIALIZING = "initializing"
    READY = "ready"
    CLOSING = "closing"
    CLOSED = "closed"
    ERROR = "error"


@dataclass
class PoolStats:
    """Connection pool statistics."""

    total_connections: int = 0
    active_connections: int = 0
    idle_connections: int = 0
    waiting_requests: int = 0
    total_requests: int = 0
    total_failures: int = 0
    avg_wait_time_ms: float = 0.0
    avg_use_time_ms: float = 0.0
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass
class TaskStats:
    """Task execution statistics."""

    tasks_submitted: int = 0
    tasks_completed: int = 0
    tasks_failed: int = 0
    tasks_cancelled: int = 0
    avg_execution_time_ms: float = 0.0
    queue_depth: int = 0
    max_queue_depth: int = 0

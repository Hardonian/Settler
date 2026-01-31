"""Job models and schemas for the workhorse subsystem."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class JobStatus(str, Enum):
    """Job execution status states."""

    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    DEAD = "dead"
    CANCELLED = "cancelled"


class JobType(str, Enum):
    """Supported job types for Python workhorse."""

    CSV_INGESTION = "csv_ingestion"
    JSON_INGESTION = "json_ingestion"
    PDF_REPORT = "pdf_report"
    EXCEL_EXPORT = "excel_export"
    RECONCILIATION_BATCH = "reconciliation_batch"
    ANOMALY_DETECTION = "anomaly_detection"
    DAILY_REPORT = "daily_report"
    DATA_QUALITY_CHECK = "data_quality_check"
    CUSTOM = "custom"

    # Phase 2 - New job types
    INGEST_NORMALIZE = "ingest.normalize"
    RECON_RUN = "recon.run"
    ANOMALY_SCORE = "anomaly.score"
    EVAL_RUN = "eval.run"
    VARIANCE_REPORT = "variance.report"
    TRANSACTION_MATCH = "transaction.match"


class JobPriority(int, Enum):
    """Job priority levels (lower = higher priority)."""

    CRITICAL = 1
    HIGH = 10
    NORMAL = 100
    LOW = 1000


class Job(BaseModel):
    """Job model representing a work unit in the queue."""

    id: UUID
    tenant_id: UUID
    workspace_id: Optional[UUID] = None
    job_type: JobType
    payload: Dict[str, Any] = Field(default_factory=dict)
    status: JobStatus = JobStatus.QUEUED
    priority: int = Field(default=JobPriority.NORMAL, ge=1)
    idempotency_key: Optional[str] = None

    # Execution tracking
    attempts: int = Field(default=0, ge=0)
    max_attempts: int = Field(default=3, ge=1)
    created_at: datetime
    updated_at: Optional[datetime] = None
    available_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Error tracking
    last_error: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

    # Lock tracking
    locked_at: Optional[datetime] = None
    locked_by: Optional[str] = None

    # Result tracking
    result: Optional[Dict[str, Any]] = None
    output_location: Optional[str] = None
    records_processed: Optional[int] = None
    records_failed: Optional[int] = None

    model_config = {"from_attributes": True}


class JobAttempt(BaseModel):
    """Record of a job execution attempt."""

    id: Optional[UUID] = None
    job_id: UUID
    attempt_no: int = Field(ge=1)
    started_at: datetime
    finished_at: Optional[datetime] = None
    ok: Optional[bool] = None
    error: Optional[Dict[str, Any]] = None
    worker_id: Optional[str] = None
    correlation_id: Optional[str] = None

    model_config = {"from_attributes": True}


class DeadLetter(BaseModel):
    """Dead letter queue entry for failed jobs."""

    id: Optional[UUID] = None
    job_id: UUID
    tenant_id: UUID
    workspace_id: Optional[UUID] = None
    job_type: JobType
    payload: Dict[str, Any]
    error: Dict[str, Any]
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class JobEnqueueRequest(BaseModel):
    """Request to enqueue a new job."""

    job_type: JobType
    payload: Dict[str, Any] = Field(default_factory=dict)
    priority: int = Field(default=JobPriority.NORMAL, ge=1)
    idempotency_key: Optional[str] = None
    max_attempts: int = Field(default=3, ge=1)
    delay_seconds: int = Field(default=0, ge=0)

    @field_validator("idempotency_key")
    @classmethod
    def validate_idempotency_key(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 255:
            raise ValueError("idempotency_key must be 255 characters or less")
        return v


class JobResult(BaseModel):
    """Result of job execution."""

    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    records_processed: Optional[int] = None
    records_failed: Optional[int] = None
    output_location: Optional[str] = None
    processing_time_ms: Optional[int] = None


class JobStats(BaseModel):
    """Statistics for job queue monitoring."""

    queued: int
    running: int
    succeeded: int
    failed: int
    dead: int
    cancelled: int

    @property
    def total(self) -> int:
        return (
            self.queued + self.running + self.succeeded + self.failed + self.dead + self.cancelled
        )


class WorkerHeartbeat(BaseModel):
    """Worker heartbeat for health monitoring."""

    worker_id: str
    status: str  # "healthy", "busy", "paused", "shutting_down"
    jobs_processed: int
    jobs_failed: int
    current_job_id: Optional[UUID] = None
    last_heartbeat: datetime
    version: str

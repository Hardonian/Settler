"""Job models and schemas for the workhorse subsystem."""

from datetime import datetime
from enum import Enum
from typing import Any
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

    # Phase 6 - Shared/core jobs
    BATCH_BACKFILL = "batch.backfill"
    REPORT_GENERATE = "report.generate"
    ML_FEATURES_BUILD = "ml.features.build"

    # Phase 6 - Settler-specific jobs
    AUDIT_TRAIL_EXPORT = "audit.trail.export"

    # Phase 7 - Client-facing import/export jobs
    EXPORT_CSV = "export.csv"
    EXPORT_EXCEL = "export.excel"
    EXPORT_PDF = "export.pdf"
    IMPORT_VALIDATE = "import.validate"
    IMPORT_PROCESS = "import.process"

    # Phase 7 - Receipt processing jobs
    RECEIPT_OCR = "receipt.ocr"
    RECEIPT_EXTRACT = "receipt.extract"
    RECEIPT_MATCH = "receipt.match"


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
    workspace_id: UUID | None = None
    job_type: JobType
    payload: dict[str, Any] = Field(default_factory=dict)
    status: JobStatus = JobStatus.QUEUED
    priority: int = Field(default=JobPriority.NORMAL, ge=1)
    idempotency_key: str | None = None

    # Execution tracking
    attempts: int = Field(default=0, ge=0)
    max_attempts: int = Field(default=3, ge=1)
    created_at: datetime
    updated_at: datetime | None = None
    available_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None

    # Error tracking
    last_error: dict[str, Any] | None = None
    error_message: str | None = None

    # Lock tracking
    locked_at: datetime | None = None
    locked_by: str | None = None

    # Result tracking
    result: dict[str, Any] | None = None
    output_location: str | None = None
    records_processed: int | None = None
    records_failed: int | None = None

    model_config = {"from_attributes": True}


class JobAttempt(BaseModel):
    """Record of a job execution attempt."""

    id: UUID | None = None
    job_id: UUID
    attempt_no: int = Field(ge=1)
    started_at: datetime
    finished_at: datetime | None = None
    ok: bool | None = None
    error: dict[str, Any] | None = None
    worker_id: str | None = None
    correlation_id: str | None = None

    model_config = {"from_attributes": True}


class DeadLetter(BaseModel):
    """Dead letter queue entry for failed jobs."""

    id: UUID | None = None
    job_id: UUID
    tenant_id: UUID
    workspace_id: UUID | None = None
    job_type: JobType
    payload: dict[str, Any]
    error: dict[str, Any]
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class JobEnqueueRequest(BaseModel):
    """Request to enqueue a new job."""

    job_type: JobType
    payload: dict[str, Any] = Field(default_factory=dict)
    priority: int = Field(default=JobPriority.NORMAL, ge=1)
    idempotency_key: str | None = None
    max_attempts: int = Field(default=3, ge=1)
    delay_seconds: int = Field(default=0, ge=0)

    @field_validator("idempotency_key")
    @classmethod
    def validate_idempotency_key(cls, v: str | None) -> str | None:
        """Ensure idempotency keys fit within storage constraints."""
        if v is not None and len(v) > 255:
            raise ValueError("idempotency_key must be 255 characters or less")
        return v


class JobResult(BaseModel):
    """Result of job execution."""

    success: bool
    data: dict[str, Any] | None = None
    error: str | None = None
    records_processed: int | None = None
    records_failed: int | None = None
    output_location: str | None = None
    processing_time_ms: int | None = None


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
        """Return total jobs across all statuses."""
        return (
            self.queued + self.running + self.succeeded + self.failed + self.dead + self.cancelled
        )


class WorkerHeartbeat(BaseModel):
    """Worker heartbeat for health monitoring."""

    worker_id: str
    status: str  # "healthy", "busy", "paused", "shutting_down"
    jobs_processed: int
    jobs_failed: int
    current_job_id: UUID | None = None
    last_heartbeat: datetime
    version: str

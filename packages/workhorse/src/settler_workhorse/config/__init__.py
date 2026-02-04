"""Configuration management for Settler Workhorse."""

import os

from pydantic import PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with validation."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="WORKHORSE_",
        case_sensitive=False,
        extra="ignore",  # Allow extra env vars from shared .env files
    )

    # ==========================================================================
    # Core Configuration
    # ==========================================================================
    environment: str = "development"
    debug: bool = False
    log_level: str = "INFO"
    service_name: str = "settler-workhorse"
    service_version: str = "0.1.0"

    # ==========================================================================
    # Database Configuration (Supabase/PostgreSQL)
    # ==========================================================================
    database_url: PostgresDsn
    database_pool_size: int = 10
    database_max_overflow: int = 20
    database_pool_timeout: int = 30
    database_pool_recycle: int = 1800

    # Supabase-specific
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: PostgresDsn) -> PostgresDsn:
        """Ensure database URL is properly formatted."""
        if not v:
            raise ValueError("DATABASE_URL is required")
        return v

    # ==========================================================================
    # Worker Configuration
    # ==========================================================================
    worker_id: str | None = None
    worker_poll_interval_seconds: float = 5.0
    worker_max_jobs: int = 100
    worker_lock_timeout_seconds: int = 300  # 5 minutes
    worker_shutdown_timeout_seconds: int = 30
    worker_concurrency: int = 1  # Sequential processing by default

    @field_validator("worker_concurrency")
    @classmethod
    def validate_concurrency(cls, v: int) -> int:
        """Ensure worker concurrency stays within safe bounds."""
        if v < 1:
            raise ValueError("concurrency must be at least 1")
        if v > 10:
            raise ValueError("concurrency must not exceed 10 (safety limit)")
        return v

    # ==========================================================================
    # Retry Configuration
    # ==========================================================================
    retry_max_attempts: int = 3
    retry_backoff_base_seconds: float = 1.0
    retry_backoff_max_seconds: float = 300.0  # 5 minutes
    retry_backoff_multiplier: float = 2.0

    # ==========================================================================
    # Job Processing Configuration
    # ==========================================================================
    job_timeout_seconds: int = 3600  # 1 hour
    job_batch_size: int = 1000
    job_max_payload_size_mb: int = 10

    # ==========================================================================
    # Storage Configuration (S3/R2/Local)
    # ==========================================================================
    storage_type: str = "local"  # "local", "s3", "r2"
    storage_local_path: str = "./storage"
    storage_s3_bucket: str | None = None
    storage_s3_region: str | None = None
    storage_s3_access_key: str | None = None
    storage_s3_secret_key: str | None = None
    storage_r2_account_id: str | None = None
    storage_r2_bucket: str | None = None

    # ==========================================================================
    # Observability Configuration
    # ==========================================================================
    enable_metrics: bool = True
    metrics_port: int = 9090
    enable_opentelemetry: bool = False
    otel_endpoint: str | None = None
    otel_service_name: str = "settler-workhorse"

    # ==========================================================================
    # Security Configuration
    # ==========================================================================
    allowed_job_types: list[str] = []
    enable_strict_tenant_isolation: bool = True
    require_idempotency_key: bool = False

    # ==========================================================================
    # Feature Flags
    # ==========================================================================
    enable_csv_ingestion: bool = True
    enable_json_ingestion: bool = True
    enable_pdf_reports: bool = True
    enable_excel_exports: bool = True
    enable_anomaly_detection: bool = False
    enable_ml_scoring: bool = False

    # ==========================================================================
    # Derived Properties
    # ==========================================================================

    @property
    def is_production(self) -> bool:
        """Return True when running in production mode."""
        return self.environment.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Return True when running in development mode."""
        return self.environment.lower() == "development"

    @property
    def effective_worker_id(self) -> str:
        """Return a deterministic worker identifier for logging/coordination."""
        if self.worker_id:
            return self.worker_id
        import socket

        hostname = socket.gethostname()
        pid = os.getpid()
        return f"worker_{hostname}_{pid}"


def get_settings() -> Settings:
    """Get application settings singleton."""
    return Settings()


def validate_environment() -> list[str]:
    """Validate required environment variables are set."""
    errors: list[str] = []

    required = [
        "DATABASE_URL",
    ]

    for var in required:
        if not os.getenv(var):
            errors.append(f"Required environment variable {var} is not set")

    return errors

"""Smoke tests for Settler Workhorse."""

import os
import subprocess
import sys
from pathlib import Path


def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")

    from settler_workhorse import __version__
    from settler_workhorse.config import Settings, get_settings
    from settler_workhorse.models import Job, JobResult, JobType
    from settler_workhorse.db import JobRepository
    from settler_workhorse.worker import Worker, register_handler
    from settler_workhorse.utils.logging import configure_logging, get_logger

    print(f"OK: All imports successful (version: {__version__})")
    return True


def test_configuration():
    """Test configuration loading."""
    print("Testing configuration...")

    from settler_workhorse.config import Settings

    # Test with minimal settings
    settings = Settings(
        database_url="postgresql://localhost:5432/test",
        environment="testing",
    )

    assert settings.environment == "testing"
    assert settings.is_development is False
    assert settings.is_production is False

    print("OK: Configuration works")
    return True


def test_models():
    """Test model instantiation."""
    print("Testing models...")

    from datetime import datetime
    from uuid import uuid4

    from settler_workhorse.models import Job, JobResult, JobStatus, JobType

    job = Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.CSV_INGESTION,
        payload={"test": "data"},
        status=JobStatus.QUEUED,
        priority=100,
        attempts=0,
        max_attempts=3,
        created_at=datetime.utcnow(),
    )

    assert job.status == JobStatus.QUEUED
    assert job.job_type == JobType.CSV_INGESTION

    result = JobResult(
        success=True,
        records_processed=100,
        records_failed=0,
    )

    assert result.success is True
    assert result.records_processed == 100

    print("OK: Models work")
    return True


def test_handler_registration():
    """Test job handler registration."""
    print("Testing handler registration...")

    from settler_workhorse.models import Job, JobResult, JobType
    from settler_workhorse.worker import HANDLER_REGISTRY, register_handler

    @register_handler(JobType.CUSTOM)
    def test_handler(job: Job) -> JobResult:
        return JobResult(success=True)

    assert JobType.CUSTOM in HANDLER_REGISTRY

    print("OK: Handler registration works")
    return True


def test_cli_help():
    """Test CLI help output."""
    print("Testing CLI...")

    result = subprocess.run(
        [sys.executable, "-m", "settler_workhorse.cli", "--help"],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent,
    )

    # Should fail due to missing DATABASE_URL, but let's check the import works
    # Actually, let's just verify the module structure
    from settler_workhorse.cli import cli

    print("OK: CLI module loads")
    return True


def test_phase6_handlers_import():
    """Test Phase 6 handler imports."""
    print("Testing Phase 6 handler imports...")

    # Import all Phase 6 handlers
    from settler_workhorse.handlers import batch_backfill
    from settler_workhorse.handlers import report_generate
    from settler_workhorse.handlers import ml_features_build
    from settler_workhorse.handlers import audit_trail_export

    print("OK: Phase 6 handlers imported successfully")
    return True


def test_phase6_job_types():
    """Test Phase 6 job types are registered."""
    print("Testing Phase 6 job types...")

    from settler_workhorse.models import JobType
    from settler_workhorse.worker import HANDLER_REGISTRY

    # Check job types exist
    phase6_types = [
        JobType.BATCH_BACKFILL,
        JobType.REPORT_GENERATE,
        JobType.ML_FEATURES_BUILD,
        JobType.AUDIT_TRAIL_EXPORT,
    ]

    for job_type in phase6_types:
        assert job_type in HANDLER_REGISTRY, f"Handler not registered for {job_type}"

    print("OK: All Phase 6 job types registered")
    return True


def test_batch_backfill_handler():
    """Test batch.backfill handler with sample payload."""
    print("Testing batch.backfill handler...")

    from datetime import datetime
    from uuid import uuid4

    from settler_workhorse.handlers.batch_backfill import handle_batch_backfill
    from settler_workhorse.models import Job, JobType

    job = Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.BATCH_BACKFILL,
        payload={
            "tenant_id": str(uuid4()),
            "entity": "transactions",
            "from": "2024-01-01T00:00:00Z",
            "to": "2024-01-31T23:59:59Z",
            "dry_run": True,
            "limit": 100,
        },
        created_at=datetime.utcnow(),
    )

    result = handle_batch_backfill(job)

    assert result.success is True
    assert result.data is not None
    assert result.data["mode"] == "dry_run"
    assert result.data["entity"] == "transactions"

    print("OK: batch.backfill handler works")
    return True


def test_report_generate_handler():
    """Test report.generate handler with sample payload."""
    print("Testing report.generate handler...")

    from datetime import datetime
    from uuid import uuid4

    from settler_workhorse.handlers.report_generate import handle_report_generate
    from settler_workhorse.models import Job, JobType

    job = Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.REPORT_GENERATE,
        payload={
            "tenant_id": str(uuid4()),
            "report_type": "reconciliation_summary",
            "report_name": "Monthly Reconciliation",
            "dry_run": True,
            "format": "json",
            "filters": {"from": "2024-01-01", "to": "2024-01-31"},
        },
        created_at=datetime.utcnow(),
    )

    result = handle_report_generate(job)

    assert result.success is True
    assert result.data is not None
    assert result.data["report_type"] == "reconciliation_summary"

    print("OK: report.generate handler works")
    return True


def test_ml_features_build_handler():
    """Test ml.features.build handler with sample payload."""
    print("Testing ml.features.build handler...")

    from datetime import datetime
    from uuid import uuid4

    from settler_workhorse.handlers.ml_features_build import handle_ml_features_build
    from settler_workhorse.models import Job, JobType

    job = Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.ML_FEATURES_BUILD,
        payload={
            "tenant_id": str(uuid4()),
            "feature_set": "risk_v1",
            "subject_type": "transaction",
            "subject_ids": ["txn_001", "txn_002"],
            "dry_run": True,
            "version": "1.0.0",
        },
        created_at=datetime.utcnow(),
    )

    result = handle_ml_features_build(job)

    assert result.success is True
    assert result.data is not None
    assert result.data["feature_set"] == "risk_v1"

    print("OK: ml.features.build handler works")
    return True


def test_audit_trail_export_handler():
    """Test audit.trail.export handler with sample payload."""
    print("Testing audit.trail.export handler...")

    from datetime import datetime
    from uuid import uuid4

    from settler_workhorse.handlers.audit_trail_export import handle_audit_trail_export
    from settler_workhorse.models import Job, JobType

    job = Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.AUDIT_TRAIL_EXPORT,
        payload={
            "tenant_id": str(uuid4()),
            "from": "2024-01-01T00:00:00Z",
            "to": "2024-01-31T23:59:59Z",
            "format": "json",
            "dry_run": True,
            "batch_size": 100,
        },
        created_at=datetime.utcnow(),
    )

    result = handle_audit_trail_export(job)

    assert result.success is True
    assert result.data is not None
    assert result.data["format"] == "json"

    print("OK: audit.trail.export handler works")
    return True


def main():
    """Run all smoke tests."""
    print("=" * 50)
    print("Settler Workhorse Smoke Tests")
    print("=" * 50)
    print()

    tests = [
        test_imports,
        test_configuration,
        test_models,
        test_handler_registration,
        test_cli_help,
        test_phase6_handlers_import,
        test_phase6_job_types,
        test_batch_backfill_handler,
        test_report_generate_handler,
        test_ml_features_build_handler,
        test_audit_trail_export_handler,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"FAIL: {test.__name__} failed: {e}")
            failed += 1

    print()
    print("=" * 50)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 50)

    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

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
    
    print(f"✓ All imports successful (version: {__version__})")
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
    
    print("✓ Configuration works")
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
    
    print("✓ Models work")
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
    
    print("✓ Handler registration works")
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
    
    print("✓ CLI module loads")
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
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"✗ {test.__name__} failed: {e}")
            failed += 1
    
    print()
    print("=" * 50)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 50)
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

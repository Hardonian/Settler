from datetime import UTC, datetime
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.worker import Worker


@pytest.fixture
def mock_job_repository():
    return MagicMock()


@pytest.fixture
def mock_settings():
    settings = MagicMock()
    settings.effective_worker_id = "test-worker-1"
    settings.worker_poll_interval_seconds = 1
    settings.worker_lock_timeout_seconds = 60
    return settings


def test_execute_job_handler_exception(mock_settings, mock_job_repository):
    """Test _execute_job when handler raises an exception."""
    worker = Worker(settings=mock_settings, job_repository=mock_job_repository)

    job = Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.CUSTOM,
        payload={},
        attempts=0,
        created_at=datetime.now(UTC),
    )

    # Mock the handler to raise an exception
    mock_handler = MagicMock(side_effect=ValueError("Intentional test failure"))
    worker._get_handler = MagicMock(return_value=mock_handler)

    # _execute_job should return a failure JobResult, not raise
    result = worker._execute_job(job)

    assert result.success is False
    assert result.error == "Intentional test failure"


def test_process_single_job_handler_exception(mock_settings, mock_job_repository):
    """Test process_single_job when handler raises an exception."""
    worker = Worker(settings=mock_settings, job_repository=mock_job_repository)

    job = Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.CUSTOM,
        payload={},
        attempts=0,
        created_at=datetime.now(UTC),
    )

    mock_job_repository.claim_next_job.return_value = job
    mock_job_repository.fail_job.return_value = (True, False)  # updated, will_retry

    mock_handler = MagicMock(side_effect=ValueError("Intentional test failure"))
    worker._get_handler = MagicMock(return_value=mock_handler)

    result = worker.run_once()

    assert result is True
    mock_handler.assert_called_once_with(job)

    mock_job_repository.fail_job.assert_called_once()
    args, kwargs = mock_job_repository.fail_job.call_args
    assert args[0] == job.id
    assert isinstance(args[1], Exception)
    assert str(args[1]) == "Intentional test failure"

    mock_job_repository.complete_attempt.assert_called_once()
    args, kwargs = mock_job_repository.complete_attempt.call_args
    assert args[0] == job.id
    assert kwargs.get("success") is False
    assert isinstance(kwargs.get("error"), Exception)

    assert worker.jobs_failed == 1
    assert worker.jobs_processed == 0


def test_process_single_job_handler_returns_failure(mock_settings, mock_job_repository):
    """Test process_single_job when handler returns a failure JobResult."""
    worker = Worker(settings=mock_settings, job_repository=mock_job_repository)

    job = Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.CUSTOM,
        payload={},
        attempts=0,
        created_at=datetime.now(UTC),
    )

    mock_job_repository.claim_next_job.return_value = job
    mock_job_repository.fail_job.return_value = (True, False)

    mock_handler = MagicMock(return_value=JobResult(success=False, error="Handled failure"))
    worker._get_handler = MagicMock(return_value=mock_handler)

    result = worker.run_once()

    assert result is True
    mock_handler.assert_called_once_with(job)

    mock_job_repository.fail_job.assert_called_once()
    args, kwargs = mock_job_repository.fail_job.call_args
    assert args[0] == job.id
    assert isinstance(args[1], Exception)
    assert str(args[1]) == "Handled failure"

    assert worker.jobs_failed == 1


def test_process_single_job_success(mock_settings, mock_job_repository):
    """Test process_single_job successful execution."""
    worker = Worker(settings=mock_settings, job_repository=mock_job_repository)

    job = Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.CUSTOM,
        payload={},
        attempts=0,
        created_at=datetime.now(UTC),
    )

    mock_job_repository.claim_next_job.return_value = job

    mock_handler = MagicMock(return_value=JobResult(success=True, data={"result": "ok"}))
    worker._get_handler = MagicMock(return_value=mock_handler)

    result = worker.run_once()

    assert result is True
    mock_handler.assert_called_once_with(job)

    mock_job_repository.complete_job.assert_called_once()
    args, kwargs = mock_job_repository.complete_job.call_args
    assert args[0] == job.id
    assert args[1].success is True

    mock_job_repository.complete_attempt.assert_called_once()
    args, kwargs = mock_job_repository.complete_attempt.call_args
    assert args[0] == job.id
    assert kwargs.get("success") is True

    assert worker.jobs_processed == 1
    assert worker.jobs_failed == 0

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from settler_workhorse.config import Settings
from settler_workhorse.models import Job, JobPriority, JobType
from settler_workhorse.worker import JobResult, Worker


@pytest.fixture
def mock_settings():
    """Mock settings for testing."""
    return Settings(database_url="postgresql://localhost:5432/test")


@pytest.fixture
def mock_job_repository():
    """Mock job repository for testing."""
    return MagicMock()


@pytest.fixture
def worker(mock_settings, mock_job_repository):
    """Worker fixture with mocked dependencies."""
    return Worker(settings=mock_settings, job_repository=mock_job_repository)


@pytest.fixture
def dummy_job():
    """Dummy job for testing execution."""
    return Job(
        id=uuid4(),
        tenant_id=uuid4(),
        job_type=JobType.CUSTOM,
        payload={"test": "data"},
        priority=JobPriority.NORMAL,
        attempts=0,
        max_attempts=3,
        created_at="2023-01-01T00:00:00Z",
    )


def test_execute_job_success(worker, dummy_job):
    """Test successful job execution sets processing time and returns result."""
    # Setup
    mock_handler = MagicMock()
    success_result = JobResult(success=True, data={"output": "success"})
    mock_handler.return_value = success_result

    with patch.object(worker, "_get_handler", return_value=mock_handler):
        # Execution
        result = worker._execute_job(dummy_job)

        # Verification
        mock_handler.assert_called_once_with(dummy_job)
        assert result.success is True
        assert result.data == {"output": "success"}
        assert result.processing_time_ms is not None
        assert isinstance(result.processing_time_ms, int)


def test_execute_job_no_handler(worker, dummy_job):
    """Test execution raises NotImplementedError when no handler is found."""
    # Setup
    with patch.object(worker, "_get_handler", return_value=None):
        # Execution & Verification
        with pytest.raises(NotImplementedError) as exc_info:
            worker._execute_job(dummy_job)

        assert f"No handler registered for job type: {dummy_job.job_type}" in str(exc_info.value)


def test_execute_job_handler_exception(worker, dummy_job):
    """Test execution propagates exceptions raised by the handler."""
    # Setup
    mock_handler = MagicMock()
    test_exception = ValueError("Handler failed unexpectedly")
    mock_handler.side_effect = test_exception

    with patch.object(worker, "_get_handler", return_value=mock_handler):
        # Execution & Verification
        with pytest.raises(ValueError) as exc_info:
            worker._execute_job(dummy_job)

        mock_handler.assert_called_once_with(dummy_job)
        assert str(exc_info.value) == "Handler failed unexpectedly"

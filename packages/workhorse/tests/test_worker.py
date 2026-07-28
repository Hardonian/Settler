import pytest

from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.worker import HANDLER_REGISTRY, register_handler


@pytest.fixture(autouse=True)
def cleanup_registry():
    """Ensure the registry is clean before and after each test."""
    original_registry = dict(HANDLER_REGISTRY)
    yield
    HANDLER_REGISTRY.clear()
    HANDLER_REGISTRY.update(original_registry)


def test_register_handler():
    """Test that register_handler successfully adds a handler to the registry."""
    # Arrange
    job_type = JobType.CSV_INGESTION

    def dummy_handler(job: Job) -> JobResult:
        return JobResult(success=True)

    # Act
    decorated_func = register_handler(job_type)(dummy_handler)

    # Assert
    assert decorated_func == dummy_handler
    assert job_type in HANDLER_REGISTRY
    assert HANDLER_REGISTRY[job_type] == dummy_handler


def test_register_handler_overwrites_existing(caplog):
    """Test that registering a new handler for an existing job type overwrites the previous one."""
    # Arrange
    job_type = JobType.JSON_INGESTION

    def first_handler(job: Job) -> JobResult:
        return JobResult(success=True)

    def second_handler(job: Job) -> JobResult:
        return JobResult(success=False)

    # Act
    register_handler(job_type)(first_handler)
    assert HANDLER_REGISTRY[job_type] == first_handler

    register_handler(job_type)(second_handler)

    # Assert
    assert HANDLER_REGISTRY[job_type] == second_handler

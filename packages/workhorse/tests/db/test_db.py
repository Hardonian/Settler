from datetime import datetime
from unittest.mock import MagicMock
from uuid import uuid4

import psycopg
import pytest

from settler_workhorse.config import Settings
from settler_workhorse.db import JobRepository
from settler_workhorse.models import JobType


def test_claim_next_job_no_jobs():
    """Test claim_next_job when there are no available jobs."""
    mock_pool = MagicMock()
    mock_conn = MagicMock()
    mock_cursor = MagicMock()

    mock_pool.getconn.return_value = mock_conn
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    # Setup cursor to return no rows
    mock_cursor.fetchone.return_value = None

    repo = JobRepository(
        pool=mock_pool, settings=Settings(database_url="postgresql://localhost/test")
    )

    job = repo.claim_next_job(worker_id="test-worker")

    assert job is None
    mock_cursor.execute.assert_called_once()

    # We can check the parameters to ensure it passes the worker ID and a lock cutoff
    params = mock_cursor.execute.call_args[0][1]
    assert params["worker_id"] == "test-worker"
    assert "lock_cutoff" in params


def test_claim_next_job_with_supported_types():
    """Test claim_next_job with job type filtering."""
    mock_pool = MagicMock()
    mock_conn = MagicMock()
    mock_cursor = MagicMock()

    mock_pool.getconn.return_value = mock_conn
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    # Setup cursor to return no rows
    mock_cursor.fetchone.return_value = None

    repo = JobRepository(
        pool=mock_pool, settings=Settings(database_url="postgresql://localhost/test")
    )

    job = repo.claim_next_job(
        worker_id="test-worker", supported_job_types=[JobType.CSV_INGESTION, JobType.PDF_REPORT]
    )

    assert job is None

    # Verify the parameters include the job types
    params = mock_cursor.execute.call_args[0][1]
    assert params["job_types"] == ["csv_ingestion", "pdf_report"]
    assert params["worker_id"] == "test-worker"


def test_claim_next_job_success():
    """Test successful job claim."""
    mock_pool = MagicMock()
    mock_conn = MagicMock()
    mock_cursor = MagicMock()

    mock_pool.getconn.return_value = mock_conn

    cursor_manager = MagicMock()
    cursor_manager.__enter__.return_value = mock_cursor

    tenant_cursor_manager = MagicMock()
    tenant_cursor = MagicMock()
    tenant_cursor_manager.__enter__.return_value = tenant_cursor

    def cursor_side_effect(**kwargs):
        if "row_factory" in kwargs:
            return cursor_manager
        return tenant_cursor_manager

    mock_conn.cursor.side_effect = cursor_side_effect

    # Setup cursor to return a job row
    job_id = uuid4()
    tenant_id = uuid4()
    mock_cursor.fetchone.return_value = {
        "id": job_id,
        "tenant_id": tenant_id,
        "workspace_id": None,
        "job_type": "csv_ingestion",
        "payload": {},
        "status": "running",
        "priority": 100,
        "idempotency_key": None,
        "attempts": 1,
        "max_attempts": 3,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "available_at": None,
        "started_at": datetime.now(),
        "completed_at": None,
        "last_error": None,
        "error_message": None,
        "locked_at": datetime.now(),
        "locked_by": "test-worker",
    }

    repo = JobRepository(
        pool=mock_pool, settings=Settings(database_url="postgresql://localhost/test")
    )

    job = repo.claim_next_job(worker_id="test-worker")

    assert job is not None
    assert job.id == job_id
    assert job.tenant_id == tenant_id
    assert job.status == "running"
    assert job.locked_by == "test-worker"

    # Verify tenant context was set
    tenant_cursor.execute.assert_called_once_with(
        "SELECT set_config('app.current_tenant_id', %s, true)", (str(tenant_id),)
    )

    # Verify commit was called
    mock_conn.commit.assert_called_once()


def test_claim_next_job_database_error():
    """Test claim_next_job handles database errors correctly."""
    mock_pool = MagicMock()
    mock_conn = MagicMock()
    mock_cursor = MagicMock()

    mock_pool.getconn.return_value = mock_conn
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    # Setup cursor to raise an exception
    mock_cursor.execute.side_effect = psycopg.Error("Database connection failed")

    repo = JobRepository(
        pool=mock_pool, settings=Settings(database_url="postgresql://localhost/test")
    )

    with pytest.raises(psycopg.Error):
        repo.claim_next_job(worker_id="test-worker")

    # The pool should still put the connection back in the finally block
    mock_pool.putconn.assert_called_once_with(mock_conn)


def test_claim_next_job_pool_error():
    """Test claim_next_job handles pool errors."""
    mock_pool = MagicMock()

    # Setup pool to raise an exception
    mock_pool.getconn.side_effect = Exception("Pool exhausted")

    repo = JobRepository(
        pool=mock_pool, settings=Settings(database_url="postgresql://localhost/test")
    )

    with pytest.raises(Exception, match="Pool exhausted"):
        repo.claim_next_job(worker_id="test-worker")


def test_claim_next_job_skip_locked():
    """Test claim_next_job explicitly uses SKIP LOCKED in the query."""
    mock_pool = MagicMock()
    mock_conn = MagicMock()
    mock_cursor = MagicMock()

    mock_pool.getconn.return_value = mock_conn
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    # Setup cursor to return no rows
    mock_cursor.fetchone.return_value = None

    repo = JobRepository(
        pool=mock_pool, settings=Settings(database_url="postgresql://localhost/test")
    )

    repo.claim_next_job(worker_id="test-worker")

    # Check that the query uses SKIP LOCKED
    query_str = str(mock_cursor.execute.call_args[0][0])
    assert "FOR UPDATE SKIP LOCKED" in query_str


def test_claim_next_job_tenant_context_error():
    """Test claim_next_job correctly handles errors when setting tenant context."""
    mock_pool = MagicMock()
    mock_conn = MagicMock()
    mock_cursor = MagicMock()

    mock_pool.getconn.return_value = mock_conn
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    # Setup cursor to return a job row
    job_id = uuid4()
    tenant_id = uuid4()

    cursor_manager = MagicMock()
    cursor_manager.__enter__.return_value = mock_cursor

    tenant_cursor_manager = MagicMock()
    tenant_cursor = MagicMock()
    tenant_cursor_manager.__enter__.return_value = tenant_cursor

    def cursor_side_effect(**kwargs):
        if "row_factory" in kwargs:
            mock_cursor.fetchone.return_value = {
                "id": job_id,
                "tenant_id": tenant_id,
                "workspace_id": None,
                "job_type": "csv_ingestion",
                "payload": {},
                "status": "running",
                "priority": 100,
                "idempotency_key": None,
                "attempts": 1,
                "max_attempts": 3,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "available_at": None,
                "started_at": datetime.now(),
                "completed_at": None,
                "last_error": None,
                "error_message": None,
                "locked_at": datetime.now(),
                "locked_by": "test-worker",
            }
            return cursor_manager

        # Simulate error when setting tenant context
        tenant_cursor.execute.side_effect = psycopg.Error("RLS constraint violation")
        return tenant_cursor_manager

    mock_conn.cursor.side_effect = cursor_side_effect

    repo = JobRepository(
        pool=mock_pool, settings=Settings(database_url="postgresql://localhost/test")
    )

    with pytest.raises(psycopg.Error):
        repo.claim_next_job(worker_id="test-worker")

    # The pool should still put the connection back in the finally block
    mock_pool.putconn.assert_called_once_with(mock_conn)

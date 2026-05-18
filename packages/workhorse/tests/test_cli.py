from unittest.mock import MagicMock, patch

import pytest
from click.testing import CliRunner

from settler_workhorse.cli import worker
from settler_workhorse.config import Settings


@pytest.fixture
def runner() -> CliRunner:
    """Fixture to provide a Click CLI runner for testing."""
    return CliRunner()


@pytest.fixture
def mock_ctx_obj() -> dict:
    """Fixture to provide a mocked Click context object containing dummy settings and logger."""
    settings = Settings(
        database_url="postgresql://fake",
        supabase_url="http://fake",
        supabase_key="fake",
        worker_id="test-worker",
    )
    logger = MagicMock()
    return {"settings": settings, "logger": logger}


@patch("settler_workhorse.cli.create_connection_pool")
@patch("settler_workhorse.cli.Worker")
def test_worker_command_max_jobs(
    mock_worker_class: MagicMock,
    mock_pool: MagicMock,
    runner: CliRunner,
    mock_ctx_obj: dict,
) -> None:
    """Test that the worker command runs up to the max_jobs limit and exits properly."""
    with patch("settler_workhorse.db.JobRepository"):
        worker_instance = MagicMock()
        mock_worker_class.return_value = worker_instance
        # Simulate processing one job successfully, then failure (should exit after max_jobs if run_once returns True)
        worker_instance.run_once.return_value = True

        result = runner.invoke(worker, ["--max-jobs", "2"], obj=mock_ctx_obj)

        assert result.exit_code == 0
        assert worker_instance.run_once.call_count == 2
        mock_ctx_obj["logger"].info.assert_any_call("Processed 2 jobs, exiting")


@patch("settler_workhorse.cli.create_connection_pool")
@patch("settler_workhorse.cli.Worker")
def test_worker_command_continuous_interrupt(
    mock_worker_class: MagicMock,
    mock_pool: MagicMock,
    runner: CliRunner,
    mock_ctx_obj: dict,
) -> None:
    """Test that the worker command runs continuously until interrupted."""
    with patch("settler_workhorse.db.JobRepository"):
        worker_instance = MagicMock()
        mock_worker_class.return_value = worker_instance

        # Simulate KeyboardInterrupt on run
        worker_instance.run.side_effect = KeyboardInterrupt()

        result = runner.invoke(worker, [], obj=mock_ctx_obj)

        assert result.exit_code == 0
        worker_instance.run.assert_called_once()
        mock_ctx_obj["logger"].info.assert_any_call("Worker stopped by user")


@patch("settler_workhorse.cli.create_connection_pool")
@patch("settler_workhorse.cli.Worker")
def test_worker_command_overrides(
    mock_worker_class: MagicMock,
    mock_pool: MagicMock,
    runner: CliRunner,
    mock_ctx_obj: dict,
) -> None:
    """Test that the worker command applies the CLI option overrides correctly."""
    with patch("settler_workhorse.db.JobRepository"):
        worker_instance = MagicMock()
        mock_worker_class.return_value = worker_instance
        worker_instance.run_once.return_value = True

        result = runner.invoke(
            worker,
            [
                "--worker-id",
                "custom-worker",
                "--poll-interval",
                "5.5",
                "--max-jobs",
                "1",
            ],
            obj=mock_ctx_obj,
        )

        assert result.exit_code == 0
        settings = mock_ctx_obj["settings"]
        assert settings.worker_id == "custom-worker"
        assert settings.worker_poll_interval_seconds == 5.5

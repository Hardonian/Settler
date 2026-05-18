"""Tests for CLI module."""

import pytest
from unittest.mock import MagicMock, patch
from click.testing import CliRunner
from settler_workhorse.cli import worker

@pytest.fixture
def runner():
    """Returns a Click CLI runner."""
    return CliRunner()

@pytest.fixture
def mock_context_obj():
    """Returns a mock context object matching what the main cli group provides."""
    settings = MagicMock()
    settings.worker_id = "test-worker"
    settings.worker_poll_interval_seconds = 10
    settings.effective_worker_id = "test-worker-eff"

    logger = MagicMock()
    return {"settings": settings, "logger": logger}

@patch('settler_workhorse.cli.create_connection_pool')
@patch('settler_workhorse.db.JobRepository')
@patch('settler_workhorse.cli.Worker')
def test_worker_command_max_jobs(mock_worker_cls, mock_job_repo_cls, mock_pool, runner, mock_context_obj):
    """Test worker command with --max-jobs limits the runs properly."""
    mock_worker = MagicMock()
    mock_worker_cls.return_value = mock_worker

    # run_once returns True 2 times then False, but we stop after max_jobs=2 anyway
    mock_worker.run_once.side_effect = [True, True]

    result = runner.invoke(worker, ['--max-jobs', '2'], obj=mock_context_obj)

    assert result.exit_code == 0
    mock_worker_cls.assert_called_once()
    assert mock_worker.run_once.call_count == 2
    mock_worker.run.assert_not_called()
    mock_context_obj["logger"].info.assert_any_call("Processed 2 jobs, exiting")

@patch('settler_workhorse.cli.create_connection_pool')
@patch('settler_workhorse.db.JobRepository')
@patch('settler_workhorse.cli.Worker')
def test_worker_command_continuous(mock_worker_cls, mock_job_repo_cls, mock_pool, runner, mock_context_obj):
    """Test worker command continuous run mode."""
    mock_worker = MagicMock()
    mock_worker_cls.return_value = mock_worker

    result = runner.invoke(worker, [], obj=mock_context_obj)

    assert result.exit_code == 0
    mock_worker.run.assert_called_once()

@patch('settler_workhorse.cli.create_connection_pool')
@patch('settler_workhorse.db.JobRepository')
@patch('settler_workhorse.cli.Worker')
def test_worker_command_keyboard_interrupt(mock_worker_cls, mock_job_repo_cls, mock_pool, runner, mock_context_obj):
    """Test worker command handles KeyboardInterrupt correctly."""
    mock_worker = MagicMock()
    mock_worker_cls.return_value = mock_worker
    mock_worker.run.side_effect = KeyboardInterrupt()

    result = runner.invoke(worker, [], obj=mock_context_obj)

    assert result.exit_code == 0
    mock_context_obj["logger"].info.assert_any_call("Worker stopped by user")

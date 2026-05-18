from unittest.mock import MagicMock, patch

from click.testing import CliRunner

from settler_workhorse.cli import worker


def test_worker_command_max_jobs():
    """Test worker command with max-jobs option."""
    runner = CliRunner()

    # Mock settings and logger
    mock_settings = MagicMock()
    mock_settings.worker_poll_interval_seconds = 0.1
    mock_logger = MagicMock()

    mock_ctx_obj = {"settings": mock_settings, "logger": mock_logger}

    # Mock DB and worker
    with (
        patch("settler_workhorse.cli.create_connection_pool"),
        patch("settler_workhorse.db.JobRepository"),
        patch("settler_workhorse.cli.Worker") as mock_worker_cls,
    ):
        # Setup mock worker instance
        mock_worker = MagicMock()
        # Have run_once return True (processed a job) to hit max_jobs quickly
        mock_worker.run_once.return_value = True
        mock_worker_cls.return_value = mock_worker

        # Run command with context object
        result = runner.invoke(worker, ["--max-jobs", "2"], obj=mock_ctx_obj)

        # Assertions
        assert result.exit_code == 0
        assert mock_worker.run_once.call_count == 2
        mock_logger.info.assert_any_call("Processed 2 jobs, exiting")


def test_worker_command_max_jobs_sleeps():
    """Test worker command with max-jobs option sleeps when no jobs processed."""
    runner = CliRunner()

    # Mock settings and logger
    mock_settings = MagicMock()
    mock_settings.worker_poll_interval_seconds = 0.01  # short sleep
    mock_logger = MagicMock()

    mock_ctx_obj = {"settings": mock_settings, "logger": mock_logger}

    with (
        patch("settler_workhorse.cli.create_connection_pool"),
        patch("settler_workhorse.db.JobRepository"),
        patch("settler_workhorse.cli.Worker") as mock_worker_cls,
        patch("time.sleep") as mock_sleep,
    ):
        mock_worker = MagicMock()
        # First call returns False (sleeps), next two return True
        mock_worker.run_once.side_effect = [False, True, True]
        mock_worker_cls.return_value = mock_worker

        result = runner.invoke(worker, ["--max-jobs", "2"], obj=mock_ctx_obj)

        assert result.exit_code == 0
        assert mock_worker.run_once.call_count == 3
        mock_sleep.assert_called_once_with(0.01)


def test_worker_command_continuous_run():
    """Test worker command runs continuously when max_jobs is not set."""
    runner = CliRunner()

    # Mock settings and logger
    mock_settings = MagicMock()
    mock_logger = MagicMock()

    mock_ctx_obj = {"settings": mock_settings, "logger": mock_logger}

    with (
        patch("settler_workhorse.cli.create_connection_pool"),
        patch("settler_workhorse.db.JobRepository"),
        patch("settler_workhorse.cli.Worker") as mock_worker_cls,
    ):
        mock_worker = MagicMock()
        mock_worker_cls.return_value = mock_worker

        result = runner.invoke(worker, [], obj=mock_ctx_obj)

        assert result.exit_code == 0
        mock_worker.run.assert_called_once()


def test_worker_command_override_settings():
    """Test worker command overrides settings from CLI options."""
    runner = CliRunner()

    # Mock settings and logger
    mock_settings = MagicMock()
    mock_settings.worker_poll_interval_seconds = 10.0
    mock_settings.worker_id = "default-worker"
    mock_logger = MagicMock()

    mock_ctx_obj = {"settings": mock_settings, "logger": mock_logger}

    with (
        patch("settler_workhorse.cli.create_connection_pool"),
        patch("settler_workhorse.db.JobRepository"),
        patch("settler_workhorse.cli.Worker") as mock_worker_cls,
    ):
        mock_worker = MagicMock()
        mock_worker_cls.return_value = mock_worker

        result = runner.invoke(
            worker,
            ["--worker-id", "custom-worker", "--poll-interval", "5.5"],
            obj=mock_ctx_obj,
        )

        assert result.exit_code == 0
        assert mock_settings.worker_id == "custom-worker"
        assert mock_settings.worker_poll_interval_seconds == 5.5


def test_worker_command_keyboard_interrupt():
    """Test worker command handles KeyboardInterrupt correctly."""
    runner = CliRunner()

    # Mock settings and logger
    mock_settings = MagicMock()
    mock_logger = MagicMock()

    mock_ctx_obj = {"settings": mock_settings, "logger": mock_logger}

    with (
        patch("settler_workhorse.cli.create_connection_pool"),
        patch("settler_workhorse.db.JobRepository"),
        patch("settler_workhorse.cli.Worker") as mock_worker_cls,
    ):
        mock_worker = MagicMock()
        mock_worker.run.side_effect = KeyboardInterrupt()
        mock_worker_cls.return_value = mock_worker

        result = runner.invoke(worker, [], obj=mock_ctx_obj)

        assert result.exit_code == 0
        mock_logger.info.assert_called_with("Worker stopped by user")

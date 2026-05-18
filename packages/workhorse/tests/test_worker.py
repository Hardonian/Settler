"""Tests for the Workhorse worker."""

import signal

from settler_workhorse.config import Settings
from settler_workhorse.worker import Worker


def test_graceful_shutdown() -> None:
    """Test that the worker handles SIGTERM properly."""
    settings = Settings(
        database_url="postgresql://localhost:5432/test",
        environment="testing",
    )
    worker = Worker(settings=settings)
    assert not worker.shutting_down
    worker._handle_shutdown_signal(signal.SIGTERM, None)
    assert worker.shutting_down


def test_graceful_shutdown_sigint() -> None:
    """Test that the worker handles SIGINT properly."""
    settings = Settings(
        database_url="postgresql://localhost:5432/test",
        environment="testing",
    )
    worker = Worker(settings=settings)
    assert not worker.shutting_down
    worker._handle_shutdown_signal(signal.SIGINT, None)
    assert worker.shutting_down

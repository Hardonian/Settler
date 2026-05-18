import logging

from click.testing import CliRunner

from settler_workhorse.cli import health
from settler_workhorse.config import Settings


def test_health_success(mocker):
    """Test successful health check."""
    runner = CliRunner()

    settings = Settings(database_url="postgresql://user:pass@localhost:5432/db")
    logger = logging.getLogger("test")

    mock_pool = mocker.MagicMock()
    mock_conn = mocker.MagicMock()
    mock_cur = mocker.MagicMock()

    mock_pool.connection.return_value.__enter__.return_value = mock_conn
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur
    mock_cur.fetchone.return_value = (1,)

    mocker.patch("settler_workhorse.cli.create_connection_pool", return_value=mock_pool)

    mock_job_repo_cls = mocker.patch("settler_workhorse.db.JobRepository")
    mock_job_repo = mocker.MagicMock()
    mock_job_repo_cls.return_value = mock_job_repo

    mock_stats = mocker.MagicMock()
    mock_stats.queued = 5
    mock_stats.running = 2
    mock_stats.total = 100
    mock_job_repo.get_job_stats.return_value = mock_stats

    result = runner.invoke(health, obj={"settings": settings, "logger": logger})

    assert result.exit_code == 0
    assert "✓ Database connection: OK" in result.output
    assert "✓ Job queue: 5 queued, 2 running" in result.output
    assert "✓ Total jobs: 100" in result.output
    assert "Health check passed ✓" in result.output


def test_health_db_failure(mocker):
    """Test health check when database connection fails."""
    runner = CliRunner()

    settings = Settings(database_url="postgresql://user:pass@localhost:5432/db")
    logger = logging.getLogger("test")

    mock_pool = mocker.MagicMock()
    mock_conn = mocker.MagicMock()
    mock_cur = mocker.MagicMock()

    mock_pool.connection.return_value.__enter__.return_value = mock_conn
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur
    mock_cur.execute.side_effect = Exception("DB Connection Refused")

    mocker.patch("settler_workhorse.cli.create_connection_pool", return_value=mock_pool)

    result = runner.invoke(health, obj={"settings": settings, "logger": logger})

    assert result.exit_code == 1
    assert "✗ Health check failed: DB Connection Refused" in result.output

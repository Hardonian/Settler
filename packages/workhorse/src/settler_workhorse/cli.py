"""CLI entry point for Settler Workhorse."""

import sys
from typing import Optional

import click

from settler_workhorse.config import Settings, get_settings, validate_environment
from settler_workhorse.db import create_connection_pool
from settler_workhorse.utils.logging import configure_logging, get_logger
from settler_workhorse.worker import Worker

# Import handlers to register them
from settler_workhorse.handlers import (  # noqa: F401
    anomaly_score,
    csv_ingestion,
    eval_run,
    ingest_normalize,
    recon_run,
)


@click.group()
@click.option("--env-file", type=click.Path(exists=True), help="Path to .env file")
@click.option("--debug", is_flag=True, help="Enable debug mode")
@click.pass_context
def cli(ctx: click.Context, env_file: Optional[str], debug: bool) -> None:
    """Settler Workhorse - Python batch processing subsystem."""
    # Ensure context object exists
    ctx.ensure_object(dict)

    # Validate environment
    errors = validate_environment()
    if errors:
        for error in errors:
            click.echo(f"Error: {error}", err=True)
        sys.exit(1)

    # Configure logging
    configure_logging()

    ctx.obj["settings"] = get_settings()
    ctx.obj["logger"] = get_logger("cli")


@cli.command()
@click.option("--worker-id", help="Unique worker identifier")
@click.option("--poll-interval", type=float, help="Polling interval in seconds")
@click.option("--max-jobs", type=int, help="Maximum jobs to process before exiting")
@click.pass_context
def worker(
    ctx: click.Context,
    worker_id: Optional[str],
    poll_interval: Optional[float],
    max_jobs: Optional[int],
) -> None:
    """Start the background worker."""
    settings: Settings = ctx.obj["settings"]
    logger = ctx.obj["logger"]

    # Override settings from CLI options
    if worker_id:
        settings.worker_id = worker_id
    if poll_interval:
        settings.worker_poll_interval_seconds = poll_interval

    logger.info(
        "Starting worker",
        worker_id=settings.effective_worker_id,
        poll_interval=settings.worker_poll_interval_seconds,
    )

    # Create worker instance
    pool = create_connection_pool(settings)
    from settler_workhorse.db import JobRepository

    job_repo = JobRepository(pool, settings)
    w = Worker(settings=settings, job_repository=job_repo)

    try:
        if max_jobs:
            # Run limited number of jobs
            processed = 0
            while processed < max_jobs:
                if w.run_once():
                    processed += 1
                else:
                    import time

                    time.sleep(settings.worker_poll_interval_seconds)
            logger.info(f"Processed {processed} jobs, exiting")
        else:
            # Run continuously
            w.run()
    except KeyboardInterrupt:
        logger.info("Worker stopped by user")
        sys.exit(0)


@cli.command()
@click.pass_context
def health(ctx: click.Context) -> None:
    """Check database connectivity and worker health."""
    settings: Settings = ctx.obj["settings"]
    logger = ctx.obj["logger"]

    logger.info("Health check starting")

    try:
        pool = create_connection_pool(settings)

        # Test database connection
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                result = cur.fetchone()
                assert result[0] == 1

        click.echo("✓ Database connection: OK")

        # Check job queue stats
        from settler_workhorse.db import JobRepository

        job_repo = JobRepository(pool, settings)
        stats = job_repo.get_job_stats()

        click.echo(f"✓ Job queue: {stats.queued} queued, {stats.running} running")
        click.echo(f"✓ Total jobs: {stats.total}")

        click.echo("\nHealth check passed ✓")

    except Exception as e:
        click.echo(f"✗ Health check failed: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.option("--tenant-id", required=True, help="Tenant UUID")
@click.option("--job-type", required=True, help="Job type (e.g., csv_ingestion)")
@click.option("--payload", default="{}", help="JSON payload string")
@click.option("--priority", type=int, default=100, help="Job priority (lower = higher)")
@click.option("--idempotency-key", help="Idempotency key for safe retries")
@click.pass_context
def enqueue(
    ctx: click.Context,
    tenant_id: str,
    job_type: str,
    payload: str,
    priority: int,
    idempotency_key: Optional[str],
) -> None:
    """Enqueue a job manually (for testing/admin)."""
    settings: Settings = ctx.obj["settings"]
    logger = ctx.obj["logger"]

    import json
    from uuid import UUID

    from settler_workhorse.db import JobRepository
    from settler_workhorse.models import JobEnqueueRequest, JobType

    try:
        payload_dict = json.loads(payload)
    except json.JSONDecodeError as e:
        click.echo(f"Invalid JSON payload: {e}", err=True)
        sys.exit(1)

    try:
        job_type_enum = JobType(job_type)
    except ValueError:
        click.echo(f"Invalid job type: {job_type}", err=True)
        click.echo(f"Valid types: {[t.value for t in JobType]}", err=True)
        sys.exit(1)

    try:
        pool = create_connection_pool(settings)
        job_repo = JobRepository(pool, settings)

        request = JobEnqueueRequest(
            job_type=job_type_enum,
            payload=payload_dict,
            priority=priority,
            idempotency_key=idempotency_key,
        )

        job = job_repo.enqueue(
            tenant_id=UUID(tenant_id),
            request=request,
        )

        click.echo(f"✓ Job enqueued: {job.id}")
        click.echo(f"  Type: {job.job_type.value}")
        click.echo(f"  Status: {job.status.value}")
        click.echo(f"  Priority: {job.priority}")

    except Exception as e:
        logger.error("Failed to enqueue job", exc_info=True)
        click.echo(f"✗ Failed to enqueue job: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.option("--release-stale", is_flag=True, help="Release stale locks")
@click.option("--lock-timeout", type=int, default=300, help="Lock timeout in seconds")
@click.pass_context
def maintenance(ctx: click.Context, release_stale: bool, lock_timeout: int) -> None:
    """Run maintenance tasks on the job queue."""
    settings: Settings = ctx.obj["settings"]
    logger = ctx.obj["logger"]

    from settler_workhorse.db import JobRepository

    try:
        pool = create_connection_pool(settings)
        job_repo = JobRepository(pool, settings)

        if release_stale:
            released = job_repo.release_stale_locks(lock_timeout)
            click.echo(f"✓ Released {released} stale locks")

        # Show current stats
        stats = job_repo.get_job_stats()
        click.echo(f"\nQueue status:")
        click.echo(f"  Queued: {stats.queued}")
        click.echo(f"  Running: {stats.running}")
        click.echo(f"  Succeeded: {stats.succeeded}")
        click.echo(f"  Failed: {stats.failed}")
        click.echo(f"  Dead: {stats.dead}")

    except Exception as e:
        logger.error("Maintenance failed", exc_info=True)
        click.echo(f"✗ Maintenance failed: {e}", err=True)
        sys.exit(1)


def main() -> None:
    """Main entry point."""
    cli()


if __name__ == "__main__":
    main()

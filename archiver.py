import os
import json
import logging
import psycopg2
import boto3
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def enforce_statement_timeout(cur):
    """Fetches and applies dynamic operator timeouts from control plane infrastructure settings."""
    cur.execute(
        "SELECT max_statement_timeout_ms FROM public.operator_infrastructure_settings WHERE id = 'global'"
    )
    infra_settings = cur.fetchone()
    if infra_settings:
        timeout_ms = infra_settings[0]
        cur.execute(f"SET statement_timeout = {timeout_ms}")
        logger.info(
            f"Enforcing operator control plane statement timeout: {timeout_ms}ms"
        )


def fetch_runs_to_archive(cur, archive_days, limit):
    """Locks and fetches a small chunk of runs to prevent massive WAL bloat and long-held locks."""
    cur.execute(
        """
        SELECT id, tenant_id, created_at
        FROM public.runs
        WHERE status IN ('Completed', 'Completed with Exceptions', 'Failed', 'Failed - Timed Out')
          AND created_at < NOW() - INTERVAL '%s days'
        LIMIT %s
        FOR UPDATE SKIP LOCKED;
    """,
        (archive_days, limit),
    )
    return cur.fetchall()


def archive_runs_to_s3(cur, s3_client, s3_bucket, runs_to_archive):
    """Packages run data with exceptions and uploads to S3, returning the archived run IDs."""
    archived_run_ids = []

    for run_id, tenant_id, created_at in runs_to_archive:
        # Fetch the full run JSON and aggregate its exceptions into a single payload
        cur.execute(
            "SELECT row_to_json(r) FROM public.runs r WHERE id = %s",
            (run_id,),
        )
        run_data = cur.fetchone()[0]

        cur.execute(
            "SELECT COALESCE(json_agg(e), '[]'::json) FROM public.exceptions e WHERE run_id = %s",
            (run_id,),
        )
        exceptions_data = cur.fetchone()[0]

        archive_payload = {
            "archived_at": datetime.now(timezone.utc).isoformat(),
            "run": run_data,
            "exceptions": exceptions_data,
        }

        # Construct the tenant-isolated S3 object key
        object_key = (
            f"tenants/{tenant_id}/runs/{created_at.strftime('%Y/%m')}/{run_id}.json"
        )

        # Network I/O - executing this inside a much smaller locked transaction chunk
        s3_client.put_object(
            Bucket=s3_bucket,
            Key=object_key,
            Body=json.dumps(archive_payload, default=str),
            ContentType="application/json",
        )

        archived_run_ids.append(run_id)

    return archived_run_ids


def purge_archived_runs_and_audit(cur, archived_run_ids):
    """Prunes archived runs and exceptions from the hot database and mints an audit log."""
    cur.execute(
        "DELETE FROM public.exceptions WHERE run_id = ANY(%s)",
        (archived_run_ids,),
    )
    cur.execute("DELETE FROM public.runs WHERE id = ANY(%s)", (archived_run_ids,))

    cur.execute(
        """
        INSERT INTO public.audit_logs (tenant_id, action, details, batch_entity_ids, created_at)
        VALUES ('system', 'RUNS_ARCHIVED_TO_COLD_STORAGE', 'Automated archival chunk sweep completed', %s, NOW())
    """,
        (archived_run_ids,),
    )


def run_archival_sweeper():
    """
    Sweeps for terminal runs older than 30 days.
    Packages the run and its exceptions, uploads to S3 Cold Storage, and removes them from the hot DB.
    """
    db_url = os.environ.get("DATABASE_URL")
    s3_bucket = os.environ.get("ARCHIVE_S3_BUCKET")

    if not db_url or not s3_bucket:
        logger.warning("DATABASE_URL or ARCHIVE_S3_BUCKET missing. Skipping archival.")
        return

    archive_days = int(os.environ.get("ARCHIVE_RETENTION_DAYS", 30))
    max_batch_size = int(os.environ.get("ARCHIVE_BATCH_SIZE", 500))
    chunk_size = int(
        os.environ.get("ARCHIVE_CHUNK_SIZE", 50)
    )  # Process in chunks to release DB locks during S3 network I/O

    # Initialize S3 client for cold storage
    s3_client = boto3.client("s3")
    logger.info(
        f"Starting Archival Sweeper. Retention: {archive_days} days. Max batch: {max_batch_size}, Chunk size: {chunk_size}"
    )

    total_archived = 0

    while total_archived < max_batch_size:
        current_chunk_limit = min(chunk_size, max_batch_size - total_archived)

        with psycopg2.connect(db_url) as conn:
            with conn.cursor() as cur:
                enforce_statement_timeout(cur)

                runs_to_archive = fetch_runs_to_archive(
                    cur, archive_days, current_chunk_limit
                )

                if not runs_to_archive:
                    if total_archived == 0:
                        logger.info("No runs require archiving at this time.")
                    break

                logger.info(
                    f"Archiving chunk of {len(runs_to_archive)} runs to S3 bucket: {s3_bucket}..."
                )

                archived_run_ids = archive_runs_to_s3(
                    cur, s3_client, s3_bucket, runs_to_archive
                )

                purge_archived_runs_and_audit(cur, archived_run_ids)

                conn.commit()
                total_archived += len(archived_run_ids)
                logger.info(
                    f"Successfully archived and purged chunk of {len(archived_run_ids)} runs. Total this run: {total_archived}"
                )

    if total_archived > 0:
        logger.info(f"Archival Sweeper finished. Total archived: {total_archived}")


if __name__ == "__main__":
    run_archival_sweeper()

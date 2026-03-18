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
    batch_size = int(os.environ.get("ARCHIVE_BATCH_SIZE", 500))

    # Initialize S3 client for cold storage
    s3_client = boto3.client("s3")
    logger.info(
        f"Starting Archival Sweeper. Retention: {archive_days} days. Batch size: {batch_size}"
    )

    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            # Utilize the idx_runs_completed_archival index
            cur.execute(
                """
                SELECT id, tenant_id, created_at
                FROM public.runs
                WHERE status IN ('Completed', 'Completed with Exceptions', 'Failed', 'Failed - Timed Out')
                  AND created_at < NOW() - INTERVAL '%s days'
                LIMIT %s
                FOR UPDATE SKIP LOCKED;
            """,
                (archive_days, batch_size),
            )

            runs_to_archive = cur.fetchall()

            if not runs_to_archive:
                logger.info("No runs require archiving at this time.")
                return

            logger.info(
                f"Archiving {len(runs_to_archive)} runs to S3 bucket: {s3_bucket}..."
            )
            archived_run_ids = []

            for run_id, tenant_id, created_at in runs_to_archive:
                # Fetch the full run JSON and aggregate its exceptions into a single payload
                cur.execute(
                    "SELECT row_to_json(r) FROM public.runs r WHERE id = %s", (run_id,)
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

                # Construct the tenant-isolated S3 object key (e.g. tenants/uuid/runs/2025/11/run_uuid.json)
                object_key = f"tenants/{tenant_id}/runs/{created_at.strftime('%Y/%m')}/{run_id}.json"

                # Stream to Cold Storage
                s3_client.put_object(
                    Bucket=s3_bucket,
                    Key=object_key,
                    Body=json.dumps(archive_payload, default=str),
                    ContentType="application/json",
                )

                archived_run_ids.append(run_id)

            # 1. Prune the hot database tables
            cur.execute(
                "DELETE FROM public.exceptions WHERE run_id = ANY(%s)",
                (archived_run_ids,),
            )
            cur.execute(
                "DELETE FROM public.runs WHERE id = ANY(%s)", (archived_run_ids,)
            )

            # 2. Mint a single bulk audit record using the newly added batch_entity_ids array
            cur.execute(
                """
                INSERT INTO public.audit_logs (tenant_id, action, details, batch_entity_ids, created_at)
                VALUES ('system', 'RUNS_ARCHIVED_TO_COLD_STORAGE', 'Automated 30-day archival sweep completed', %s, NOW())
            """,
                (archived_run_ids,),
            )

            conn.commit()
            logger.info(
                f"Successfully archived and purged {len(archived_run_ids)} runs."
            )


if __name__ == "__main__":
    run_archival_sweeper()

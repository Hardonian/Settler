import os
import logging
import psycopg2
from psycopg2.extras import execute_values
import urllib.request
import json

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def run_stale_run_reaper():
    """
    Sweeps for 'Processing' runs that have exceeded the safe execution timeout window.
    Transitions them to 'Failed - Timed Out' and emits an audit trail.
    """
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is required")

    # Threshold for stale processing runs (default: 60 minutes)
    timeout_minutes = int(os.environ.get("REAPER_TIMEOUT_MINUTES", 60))
    logger.info(f"Starting Stale Run Reaper. Threshold: {timeout_minutes} minutes.")

    with psycopg2.connect(db_url) as conn:
        with conn.cursor() as cur:
            # Control Plane Enforcement: Fetch and apply dynamic operator timeouts
            cur.execute(
                "SELECT max_statement_timeout_ms FROM public.operator_infrastructure_settings WHERE id = 'global'"
            )
            infra_settings = cur.fetchone()
            if infra_settings:
                timeout_ms = infra_settings[0]
                # Explicitly constrain this session to the operator's threshold
                cur.execute(f"SET statement_timeout = {timeout_ms}")
                logger.info(
                    f"Enforcing operator control plane statement timeout: {timeout_ms}ms"
                )

            # Highly optimized query using the idx_runs_stale_reaper partial index
            cur.execute(
                """
                SELECT id, tenant_id
                FROM public.runs
                WHERE status = 'Processing'
                  AND created_at < NOW() - INTERVAL '%s minutes'
                FOR UPDATE SKIP LOCKED;
            """,
                (timeout_minutes,),
            )

            stale_runs = cur.fetchall()

            if not stale_runs:
                logger.info("No stale runs found.")
                return

            logger.info(
                f"Found {len(stale_runs)} stale runs. Transitioning to Failed - Timed Out..."
            )

            run_ids = [r[0] for r in stale_runs]
            failure_reason = "System recovered orphaned run after worker timeout."

            # 1. Update the orphaned runs safely
            cur.execute(
                """
                UPDATE public.runs
                SET
                    status = 'Failed - Timed Out',
                    error_details = %s,
                    updated_at = NOW()
                WHERE id = ANY(%s)
            """,
                (failure_reason, run_ids),
            )

            # 2. Bulk insert audit logs using the provenance schema
            audit_records = [
                (r[1], r[0], "SYSTEM_RECOVERY", failure_reason) for r in stale_runs
            ]
            execute_values(
                cur,
                """
                INSERT INTO public.audit_logs (tenant_id, trace_id, action, details, created_at)
                VALUES %s
            """,
                audit_records,
            )

            conn.commit()
            logger.info(f"Successfully recovered {len(stale_runs)} orphaned runs.")

            # Dispatch Critical Operations Alert
            slack_url = os.environ.get("SLACK_WEBHOOK_URL") or os.environ.get(
                "OPS_ALERT_WEBHOOK_URL"
            )
            if slack_url:
                try:
                    alert_payload = {
                        "text": f"*🚨 [CRITICAL] SYSTEM_RECOVERY*\nStale Run Reaper caught and forced timeout on {len(stale_runs)} zombie processing runs.\n```Trace IDs: {run_ids}```"
                    }
                    req = urllib.request.Request(
                        slack_url,
                        data=json.dumps(alert_payload).encode("utf-8"),
                        headers={"Content-Type": "application/json"},
                    )
                    # Fire and forget with 5s timeout
                    urllib.request.urlopen(req, timeout=5)
                    logger.info(
                        "Successfully dispatched Slack alert for system recovery."
                    )
                except Exception as e:
                    logger.error(f"Failed to dispatch external alert: {e}")


if __name__ == "__main__":
    run_stale_run_reaper()

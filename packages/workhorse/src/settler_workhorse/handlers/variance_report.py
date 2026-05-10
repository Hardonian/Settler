"""Variance report generation handler for variance.report jobs.

Generates variance reports from reconciliation results.
Reads from ReconResult, writes to job_results table via RPC.
Safe no-op if no reconciliation data exists.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from settler_workhorse.db import JobRepository
from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.utils.logging import get_logger
from settler_workhorse.worker import register_handler

logger = get_logger("handlers.variance_report")


class VarianceReportError(Exception):
    """Error during variance report generation."""

    pass


def _fetch_recon_results(
    job_repo: JobRepository,
    tenant_id: UUID,
    recon_job_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict[str, Any]]:
    """Fetch reconciliation results from database.

    Args:
        job_repo: Job repository for database access
        tenant_id: Tenant ID for RLS
        recon_job_id: Optional specific recon job ID
        start_date: Optional start date filter
        end_date: Optional end date filter

    Returns:
        List of recon result records
    """
    from psycopg.rows import dict_row

    conditions = ["tenant_id = %(tenant_id)s"]
    params: dict[str, Any] = {"tenant_id": str(tenant_id)}

    if recon_job_id:
        conditions.append("recon_job_id = %(recon_job_id)s")
        params["recon_job_id"] = recon_job_id

    if start_date:
        conditions.append("created_at >= %(start_date)s")
        params["start_date"] = start_date

    if end_date:
        conditions.append("created_at <= %(end_date)s")
        params["end_date"] = end_date

    query = f"""
        SELECT
            id,
            recon_job_id,
            status,
            source_count,
            target_count,
            matched_count,
            unmatched_source_count,
            unmatched_target_count,
            conflict_count,
            total_amount_source,
            total_amount_target,
            total_amount_matched,
            total_amount_unmatched,
            currency,
            confidence_avg,
            duration_ms,
            summary,
            metadata,
            created_at,
            updated_at
        FROM recon_results
        WHERE {" AND ".join(conditions)}
        ORDER BY created_at DESC
        LIMIT 1000;
    """

    try:
        with job_repo._connection() as conn:
            job_repo._set_tenant_context(conn, tenant_id)
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(query, params)
                rows = cur.fetchall()
                return [dict(row) for row in rows] if rows else []
    except Exception as e:
        logger.error("Failed to fetch recon results", error=str(e))
        raise VarianceReportError(f"Database query failed: {e}") from e


def _calculate_variance_metrics(results: list[dict[str, Any]]) -> dict[str, Any]:
    """Calculate variance metrics across reconciliation results.

    Args:
        results: List of recon result records

    Returns:
        Variance metrics summary
    """
    if not results:
        return {
            "total_runs": 0,
            "total_sources": 0,
            "total_targets": 0,
            "total_matched": 0,
            "total_unmatched": 0,
            "variance_amount": 0.0,
            "variance_rate": 0.0,
        }

    total_runs = len(results)
    total_sources = sum(r.get("source_count", 0) or 0 for r in results)
    total_targets = sum(r.get("target_count", 0) or 0 for r in results)
    total_matched = sum(r.get("matched_count", 0) or 0 for r in results)
    total_unmatched_source = sum(r.get("unmatched_source_count", 0) or 0 for r in results)
    total_unmatched_target = sum(r.get("unmatched_target_count", 0) or 0 for r in results)

    # Calculate amount variance
    amount_source = sum(
        float(r.get("total_amount_source") or 0) for r in results if r.get("total_amount_source")
    )
    amount_target = sum(
        float(r.get("total_amount_target") or 0) for r in results if r.get("total_amount_target")
    )
    variance_amount = abs(amount_source - amount_target)

    # Calculate match rate
    total_records = total_sources + total_targets
    variance_rate = 1.0 - (total_matched * 2 / max(total_records, 1))

    # Status breakdown
    status_counts: dict[str, int] = {}
    for r in results:
        status = r.get("status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1

    return {
        "total_runs": total_runs,
        "total_sources": total_sources,
        "total_targets": total_targets,
        "total_matched": total_matched,
        "total_unmatched_source": total_unmatched_source,
        "total_unmatched_target": total_unmatched_target,
        "amount_source": round(amount_source, 2),
        "amount_target": round(amount_target, 2),
        "variance_amount": round(variance_amount, 2),
        "variance_rate": round(variance_rate, 4),
        "match_rate": round(1.0 - variance_rate, 4),
        "status_breakdown": status_counts,
        "currencies": list({r.get("currency") for r in results if r.get("currency")}),
    }


def _store_report_result(
    job_repo: JobRepository,
    job_id: UUID,
    tenant_id: UUID,
    report_data: dict[str, Any],
) -> str:
    """Store report result in job_results table via RPC.

    Args:
        job_repo: Job repository for database access
        job_id: Job ID for linking
        tenant_id: Tenant ID for RLS
        report_data: Report data to store

    Returns:
        Result ID
    """
    try:
        with job_repo._connection() as conn:
            job_repo._set_tenant_context(conn, tenant_id)
            with conn.cursor() as cur:
                # Use the RPC function if available, otherwise direct insert
                cur.execute(
                    """
                    INSERT INTO job_results (
                        job_id,
                        tenant_id,
                        result_data,
                        result_url,
                        created_at
                    ) VALUES (
                        %(job_id)s,
                        %(tenant_id)s,
                        %(result_data)s,
                        %(result_url)s,
                        NOW()
                    )
                    ON CONFLICT (job_id) DO UPDATE SET
                        result_data = EXCLUDED.result_data,
                        result_url = EXCLUDED.result_url,
                        created_at = NOW()
                    RETURNING id;
                    """,
                    {
                        "job_id": str(job_id),
                        "tenant_id": str(tenant_id),
                        "result_data": report_data,
                        "result_url": None,
                    },
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return str(row[0])
                raise VarianceReportError("Failed to store report result")
    except Exception as e:
        logger.error("Failed to store report result", error=str(e))
        raise VarianceReportError(f"Failed to store result: {e}") from e


@register_handler(JobType.VARIANCE_REPORT)
def handle_variance_report(job: Job) -> JobResult:
    """Handle variance report generation job.

    Reads from ReconResult table and generates variance analysis.
    Stores result in job_results table.

    Args:
        job: Job containing report parameters

    Returns:
        Job execution result

    Payload:
        - recon_job_id: Optional specific recon job to analyze
        - start_date: Optional start date (ISO format)
        - end_date: Optional end date (ISO format)
        - include_details: Whether to include detailed breakdown
    """
    from settler_workhorse.config import get_settings
    from settler_workhorse.db import create_connection_pool

    payload = job.payload
    recon_job_id = payload.get("recon_job_id")
    start_date = payload.get("start_date")
    end_date = payload.get("end_date")
    include_details = payload.get("include_details", False)

    # Create repository for DB access
    settings = get_settings()
    pool = create_connection_pool(settings)
    job_repo = JobRepository(pool, settings)

    try:
        # Fetch recon results from database
        results = _fetch_recon_results(
            job_repo=job_repo,
            tenant_id=job.tenant_id,
            recon_job_id=recon_job_id,
            start_date=start_date,
            end_date=end_date,
        )

        # Safe no-op if no data
        if not results:
            logger.info("No reconciliation results found, returning empty report")
            return JobResult(
                success=True,
                data={
                    "total_runs": 0,
                    "message": "No reconciliation results found for report period",
                    "filters": {
                        "recon_job_id": recon_job_id,
                        "start_date": start_date,
                        "end_date": end_date,
                    },
                },
                records_processed=0,
                records_failed=0,
            )

        # Calculate variance metrics
        metrics = _calculate_variance_metrics(results)

        # Build report
        report = {
            "report_id": f"variance_{job.id}_{datetime.utcnow().isoformat()}",
            "generated_at": datetime.utcnow().isoformat(),
            "tenant_id": str(job.tenant_id),
            "job_id": str(job.id),
            "filters": {
                "recon_job_id": recon_job_id,
                "start_date": start_date,
                "end_date": end_date,
            },
            "metrics": metrics,
            "summary": {
                "status": "variance_detected" if metrics["variance_amount"] > 0 else "balanced",
                "severity": (
                    "high"
                    if metrics["variance_rate"] > 0.1
                    else "medium"
                    if metrics["variance_rate"] > 0.05
                    else "low"
                ),
            },
        }

        if include_details:
            report["recon_results"] = results[:100]  # Limit details

        # Store result in job_results table (idempotent via job_id unique constraint)
        result_id = _store_report_result(job_repo, job.id, job.tenant_id, report)
        report["result_id"] = result_id

        logger.info(
            "Variance report generated",
            total_runs=metrics["total_runs"],
            variance_amount=metrics["variance_amount"],
            match_rate=metrics["match_rate"],
        )

        return JobResult(
            success=True,
            data=report,
            records_processed=metrics["total_runs"],
            records_failed=0,
            output_location=f"job_results:{result_id}",
        )

    except VarianceReportError as e:
        logger.error("Variance report generation failed", error=str(e))
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )
    except Exception as e:
        logger.error("Unexpected error in variance report", exc_info=True)
        return JobResult(
            success=False,
            error=f"Unexpected error: {e}",
            records_processed=0,
            records_failed=0,
        )

"""Transaction matching handler for transaction.match jobs.

Runs matching/reconciliation between NormalizedTransaction records.
Reads from NormalizedTransaction, writes to ReconciliationRun and ReconciliationMatch.
Safe no-op if no transactions to match.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from settler_workhorse.db import JobRepository
from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.utils.logging import get_logger
from settler_workhorse.worker import register_handler

logger = get_logger("handlers.transaction_match")


class TransactionMatchError(Exception):
    """Error during transaction matching."""

    pass


def _fetch_transactions(
    job_repo: JobRepository,
    tenant_id: UUID,
    ingestion_id: str | None = None,
    source_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 10000,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Fetch source and target transactions from database.

    Args:
        job_repo: Job repository for database access
        tenant_id: Tenant ID for RLS
        ingestion_id: Optional ingestion ID filter
        source_id: Optional source ID filter
        start_date: Optional start date filter
        end_date: Optional end date filter
        limit: Maximum records to fetch

    Returns:
        Tuple of (source_transactions, target_transactions)
    """
    from psycopg.rows import dict_row

    conditions = ["tenant_id = %(tenant_id)s"]
    params: dict[str, Any] = {"tenant_id": str(tenant_id), "limit": limit}

    if ingestion_id:
        conditions.append("ingestion_id = %(ingestion_id)s")
        params["ingestion_id"] = ingestion_id

    if source_id:
        conditions.append("source_id = %(source_id)s")
        params["source_id"] = source_id

    if start_date:
        conditions.append("date >= %(start_date)s")
        params["start_date"] = start_date

    if end_date:
        conditions.append("date <= %(end_date)s")
        params["end_date"] = end_date

    query = f"""
        SELECT
            id,
            ingestion_id,
            raw_record_id,
            external_id,
            amount,
            currency,
            date,
            description,
            category,
            payment_method,
            reference,
            metadata,
            created_at
        FROM normalized_transactions
        WHERE {' AND '.join(conditions)}
        ORDER BY date DESC, amount DESC
        LIMIT %(limit)s;
    """

    try:
        with job_repo._connection() as conn:
            job_repo._set_tenant_context(conn, tenant_id)
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(query, params)
                rows = cur.fetchall()
                transactions = [dict(row) for row in rows] if rows else []

                # Split into sources and targets based on amount sign
                # Positive = source (debit/outflow), Negative = target (credit/inflow)
                # Or use external logic based on metadata/category
                sources = [t for t in transactions if float(t.get("amount", 0)) > 0]
                targets = [t for t in transactions if float(t.get("amount", 0)) <= 0]

                return sources, targets
    except Exception as e:
        logger.error("Failed to fetch transactions", error=str(e))
        raise TransactionMatchError(f"Database query failed: {e}") from e


def _match_transactions(
    sources: list[dict[str, Any]],
    targets: list[dict[str, Any]],
    match_strategy: str = "exact",
    tolerance: float = 0.01,
) -> dict[str, Any]:
    """Match source and target transactions.

    Args:
        sources: Source transactions
        targets: Target transactions
        match_strategy: Matching strategy (exact, fuzzy, tolerance)
        tolerance: Amount tolerance for matching

    Returns:
        Matching results with matches and orphans
    """
    matches = []
    unmatched_sources = []
    unmatched_targets = targets.copy()

    # Build index of targets for efficient matching
    target_index: dict[str, list[dict]] = {}
    for target in targets:
        # Index by absolute amount and date (without time)
        key = f"{abs(float(target.get('amount', 0)))}|{str(target.get('date', ''))[:10]}"
        if key not in target_index:
            target_index[key] = []
        target_index[key].append(target)

    for source in sources:
        source_amount = float(source.get("amount", 0))
        source_date = str(source.get("date", ""))[:10]

        # Try exact match first
        exact_key = f"{abs(source_amount)}|{source_date}"
        match_found = False

        if exact_key in target_index:
            for target in target_index[exact_key]:
                if target in unmatched_targets:
                    # Check tolerance
                    target_amount = abs(float(target.get("amount", 0)))
                    if abs(source_amount - target_amount) <= tolerance:
                        matches.append(
                            {
                                "source_transaction_id": source["id"],
                                "target_transaction_id": target["id"],
                                "match_type": "exact",
                                "confidence": 1.0,
                                "amount_diff": abs(source_amount - target_amount),
                                "date_diff": 0,
                            }
                        )
                        unmatched_targets.remove(target)
                        match_found = True
                        break

        if not match_found:
            unmatched_sources.append(source)

    return {
        "matches": matches,
        "unmatched_sources": unmatched_sources,
        "unmatched_targets": unmatched_targets,
        "match_count": len(matches),
        "source_count": len(sources),
        "target_count": len(targets),
        "match_rate": len(matches) / max(len(sources), 1),
    }


def _create_reconciliation_run(
    job_repo: JobRepository,
    tenant_id: UUID,
    user_id: UUID | None,
    ingestion_id: str | None,
    match_results: dict[str, Any],
) -> str:
    """Create a ReconciliationRun record.

    Args:
        job_repo: Job repository for database access
        tenant_id: Tenant ID for RLS
        user_id: User ID who initiated
        ingestion_id: Associated ingestion ID
        match_results: Matching results

    Returns:
        Reconciliation run ID
    """
    try:
        with job_repo._connection() as conn:
            job_repo._set_tenant_context(conn, tenant_id)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO reconciliation_runs (
                        ingestion_id,
                        tenant_id,
                        user_id,
                        name,
                        status,
                        source_count,
                        target_count,
                        matched_count,
                        unmatched_source_count,
                        unmatched_target_count,
                        confidence_avg,
                        metadata,
                        created_at,
                        updated_at
                    ) VALUES (
                        %(ingestion_id)s,
                        %(tenant_id)s,
                        %(user_id)s,
                        %(name)s,
                        'completed',
                        %(source_count)s,
                        %(target_count)s,
                        %(matched_count)s,
                        %(unmatched_source_count)s,
                        %(unmatched_target_count)s,
                        %(confidence_avg)s,
                        %(metadata)s,
                        NOW(),
                        NOW()
                    )
                    RETURNING id;
                    """,
                    {
                        "ingestion_id": ingestion_id,
                        "tenant_id": str(tenant_id),
                        "user_id": str(user_id) if user_id else None,
                        "name": f"Auto-matching run {datetime.utcnow().isoformat()}",
                        "source_count": match_results["source_count"],
                        "target_count": match_results["target_count"],
                        "matched_count": match_results["match_count"],
                        "unmatched_source_count": len(match_results["unmatched_sources"]),
                        "unmatched_target_count": len(match_results["unmatched_targets"]),
                        "confidence_avg": match_results["match_rate"],
                        "metadata": {
                            "match_strategy": "exact",
                            "auto_generated": True,
                        },
                    },
                )
                row = cur.fetchone()
                conn.commit()
                if row:
                    return str(row[0])
                raise TransactionMatchError("Failed to create reconciliation run")
    except Exception as e:
        logger.error("Failed to create reconciliation run", error=str(e))
        raise TransactionMatchError(f"Failed to create run: {e}") from e


def _create_reconciliation_matches(
    job_repo: JobRepository,
    tenant_id: UUID,
    run_id: str,
    matches: list[dict[str, Any]],
) -> int:
    """Create ReconciliationMatch records for matched transactions.

    Args:
        job_repo: Job repository for database access
        tenant_id: Tenant ID for RLS
        run_id: Reconciliation run ID
        matches: List of match records

    Returns:
        Number of matches created
    """
    if not matches:
        return 0

    try:
        with job_repo._connection() as conn:
            job_repo._set_tenant_context(conn, tenant_id)
            with conn.cursor() as cur:
                inserted = 0
                for match in matches:
                    cur.execute(
                        """
                        INSERT INTO reconciliation_matches (
                            run_id,
                            source_transaction_id,
                            target_transaction_id,
                            tenant_id,
                            match_type,
                            confidence,
                            match_reason,
                            amount_diff,
                            date_diff,
                            metadata,
                            created_at,
                            updated_at
                        ) VALUES (
                            %(run_id)s,
                            %(source_transaction_id)s,
                            %(target_transaction_id)s,
                            %(tenant_id)s,
                            %(match_type)s,
                            %(confidence)s,
                            %(match_reason)s,
                            %(amount_diff)s,
                            %(date_diff)s,
                            %(metadata)s,
                            NOW(),
                            NOW()
                        )
                        ON CONFLICT (run_id, source_transaction_id) DO UPDATE SET
                            target_transaction_id = EXCLUDED.target_transaction_id,
                            confidence = EXCLUDED.confidence,
                            updated_at = NOW()
                        RETURNING id;
                        """,
                        {
                            "run_id": run_id,
                            "source_transaction_id": match["source_transaction_id"],
                            "target_transaction_id": match["target_transaction_id"],
                            "tenant_id": str(tenant_id),
                            "match_type": match["match_type"],
                            "confidence": match["confidence"],
                            "match_reason": "Automated amount+date match",
                            "amount_diff": match["amount_diff"],
                            "date_diff": match["date_diff"],
                            "metadata": {"auto_matched": True},
                        },
                    )
                    row = cur.fetchone()
                    if row:
                        inserted += 1

                conn.commit()
                return inserted
    except Exception as e:
        logger.error("Failed to create reconciliation matches", error=str(e))
        raise TransactionMatchError(f"Failed to create matches: {e}") from e


@register_handler(JobType.TRANSACTION_MATCH)
def handle_transaction_match(job: Job) -> JobResult:
    """Handle transaction matching job.

    Reads NormalizedTransaction records, matches them,
    and creates ReconciliationRun + ReconciliationMatch records.

    Args:
        job: Job containing matching parameters

    Returns:
        Job execution result

    Payload:
        - ingestion_id: Optional ingestion ID to filter transactions
        - source_id: Optional source ID to filter transactions
        - start_date: Optional start date filter
        - end_date: Optional end date filter
        - match_strategy: Matching strategy (exact, fuzzy)
        - tolerance: Amount tolerance for matching
    """
    from settler_workhorse.config import get_settings
    from settler_workhorse.db import create_connection_pool

    payload = job.payload
    ingestion_id = payload.get("ingestion_id")
    source_id = payload.get("source_id")
    start_date = payload.get("start_date")
    end_date = payload.get("end_date")
    match_strategy = payload.get("match_strategy", "exact")
    tolerance = payload.get("tolerance", 0.01)

    # Create repository for DB access
    settings = get_settings()
    pool = create_connection_pool(settings)
    job_repo = JobRepository(pool, settings)

    try:
        # Fetch transactions from database
        sources, targets = _fetch_transactions(
            job_repo=job_repo,
            tenant_id=job.tenant_id,
            ingestion_id=ingestion_id,
            source_id=source_id,
            start_date=start_date,
            end_date=end_date,
        )

        total_transactions = len(sources) + len(targets)

        # Safe no-op if no transactions
        if total_transactions == 0:
            logger.info("No transactions found for matching")
            return JobResult(
                success=True,
                data={
                    "total_transactions": 0,
                    "message": "No transactions found for matching",
                    "filters": {
                        "ingestion_id": ingestion_id,
                        "source_id": source_id,
                        "start_date": start_date,
                        "end_date": end_date,
                    },
                },
                records_processed=0,
                records_failed=0,
            )

        logger.info(
            "Fetched transactions for matching",
            sources=len(sources),
            targets=len(targets),
        )

        # Run matching algorithm
        match_results = _match_transactions(
            sources=sources,
            targets=targets,
            match_strategy=match_strategy,
            tolerance=tolerance,
        )

        # Create reconciliation run record
        run_id = _create_reconciliation_run(
            job_repo=job_repo,
            tenant_id=job.tenant_id,
            user_id=job.workspace_id,  # Using workspace_id as user_id proxy
            ingestion_id=ingestion_id,
            match_results=match_results,
        )

        # Create match records
        matches_created = _create_reconciliation_matches(
            job_repo=job_repo,
            tenant_id=job.tenant_id,
            run_id=run_id,
            matches=match_results["matches"],
        )

        logger.info(
            "Transaction matching completed",
            run_id=run_id,
            matches=matches_created,
            match_rate=match_results["match_rate"],
        )

        return JobResult(
            success=True,
            data={
                "reconciliation_run_id": run_id,
                "total_transactions": total_transactions,
                "source_count": match_results["source_count"],
                "target_count": match_results["target_count"],
                "matches_created": matches_created,
                "match_rate": match_results["match_rate"],
                "unmatched_sources": len(match_results["unmatched_sources"]),
                "unmatched_targets": len(match_results["unmatched_targets"]),
                "filters": {
                    "ingestion_id": ingestion_id,
                    "source_id": source_id,
                    "start_date": start_date,
                    "end_date": end_date,
                },
            },
            records_processed=matches_created,
            records_failed=len(match_results["unmatched_sources"])
            + len(match_results["unmatched_targets"]),
            output_location=f"reconciliation_runs:{run_id}",
        )

    except TransactionMatchError as e:
        logger.error("Transaction matching failed", error=str(e))
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )
    except Exception as e:
        logger.error("Unexpected error in transaction matching", exc_info=True)
        return JobResult(
            success=False,
            error=f"Unexpected error: {e}",
            records_processed=0,
            records_failed=0,
        )

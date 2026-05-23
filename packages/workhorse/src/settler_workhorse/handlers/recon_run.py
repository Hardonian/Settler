"""Reconciliation run handler for recon.run jobs.

Executes reconciliation batches between source and target datasets.
Safe no-op if no datasets provided.
"""

from datetime import datetime
from dateutil.parser import parse as parse_date
from typing import Any

from dateutil import parser as date_parser

from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.utils.logging import get_logger
from settler_workhorse.worker import register_handler

logger = get_logger("handlers.recon_run")


class ReconciliationError(Exception):
    """Error during reconciliation."""

    pass


def reconcile_datasets(
    source_records: list[dict[str, Any]],
    target_records: list[dict[str, Any]],
    match_keys: list[str],
    options: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Reconcile two datasets using match keys.

    Args:
        source_records: Source dataset records
        target_records: Target dataset records
        match_keys: Fields to use for matching (e.g., ["external_id", "amount"])
        options: Reconciliation options (tolerance, fuzzy matching, etc.)

    Returns:
        Reconciliation result with matches, mismatches, and orphans
    """
    opts = options or {}
    tolerance = opts.get("amount_tolerance", 0.01)
    case_sensitive = opts.get("case_sensitive", False)

    # Build indices for efficient matching
    source_index: dict[str, list[dict]] = {}
    for record in source_records:
        key = _build_match_key(record, match_keys, case_sensitive)
        if key not in source_index:
            source_index[key] = []
        source_index[key].append(record)

    target_index: dict[str, list[dict]] = {}
    for record in target_records:
        key = _build_match_key(record, match_keys, case_sensitive)
        if key not in target_index:
            target_index[key] = []
        target_index[key].append(record)

    # Match records
    matched = []
    mismatched = []
    source_orphans = []
    target_orphans = []

    # Process source records
    for key, source_batch in source_index.items():
        target_batch = target_index.get(key, [])

        if not target_batch:
            # Source orphans
            for record in source_batch:
                source_orphans.append(
                    {
                        "source_record": record,
                        "reason": "no_target_match",
                    }
                )
        else:
            # Attempt to match within batches
            for src in source_batch:
                match_found = False
                for tgt in target_batch:
                    if _records_match(src, tgt, tolerance, opts):
                        matched.append(
                            {
                                "source": src,
                                "target": tgt,
                                "match_confidence": 1.0,
                            }
                        )
                        target_batch.remove(tgt)
                        match_found = True
                        break

                if not match_found:
                    mismatched.append(
                        {
                            "source": src,
                            "target_matches": target_batch,
                            "reason": "amount_mismatch",
                        }
                    )

    # Remaining target records are orphans
    for _key, batch in target_index.items():
        for record in batch:
            # Check if already matched
            already_matched = any(m["target"] == record for m in matched)
            if not already_matched:
                target_orphans.append(
                    {
                        "target_record": record,
                        "reason": "no_source_match",
                    }
                )

    return {
        "total_source": len(source_records),
        "total_target": len(target_records),
        "matched": len(matched),
        "mismatched": len(mismatched),
        "source_orphans": len(source_orphans),
        "target_orphans": len(target_orphans),
        "match_rate": len(matched) / max(len(source_records), 1),
        "details": {
            "matched": matched[:10],  # Sample
            "source_orphans": source_orphans[:10],
            "target_orphans": target_orphans[:10],
        },
    }


def _build_match_key(
    record: dict[str, Any],
    keys: list[str],
    case_sensitive: bool = False,
) -> str:
    """Build match key from record using specified fields.

    Args:
        record: Record dictionary
        keys: Field names to include in key
        case_sensitive: Whether to preserve case

    Returns:
        Match key string
    """
    parts = []
    for key in keys:
        val = record.get(key, "")
        if val is None:
            val = ""
        val_str = str(val).strip()
        if not case_sensitive:
            val_str = val_str.lower()
        parts.append(val_str)
    return "|".join(parts)


def _records_match(
    source: dict[str, Any],
    target: dict[str, Any],
    tolerance: float = 0.01,
    options: dict[str, Any] | None = None,
) -> bool:
    """Check if two records match within tolerance.

    Args:
        source: Source record
        target: Target record
        tolerance: Amount tolerance for numeric comparison
        options: Additional matching options

    Returns:
        True if records match
    """
    opts = options or {}

    # Check amount if present in both
    src_amount = source.get("amount")
    tgt_amount = target.get("amount")

    if src_amount is not None and tgt_amount is not None:
        try:
            src_val = float(src_amount)
            tgt_val = float(tgt_amount)
            if abs(src_val - tgt_val) > tolerance:
                return False
        except (ValueError, TypeError):
            # Non-numeric amounts, compare as strings
            if str(src_amount) != str(tgt_amount):
                return False

    # Check date if present in both
    src_date = source.get("date")
    tgt_date = target.get("date")

    if src_date and tgt_date and str(src_date) != str(tgt_date):
        # Simple string comparison for dates (assume normalized)
        # Optionally: use date tolerance
        date_tolerance_days = opts.get("date_tolerance_days", 0)
        if date_tolerance_days == 0:
            return False

        try:
            src_dt = date_parser.parse(str(src_date), fuzzy=True)
            tgt_dt = date_parser.parse(str(tgt_date), fuzzy=True)
            diff_days = abs((src_dt - tgt_dt).days)
            if diff_days > date_tolerance_days:
                return False
        except (ValueError, TypeError):
            # If dates are unparseable and string comparison failed, they don't match
            return False

    return True


@register_handler(JobType.RECON_RUN)
def handle_recon_run(job: Job) -> JobResult:
    """Handle reconciliation run job.

    Args:
        job: Job containing reconciliation payload

    Returns:
        Job execution result
    """
    payload = job.payload
    source_data = payload.get("source_data", [])
    target_data = payload.get("target_data", [])
    match_keys = payload.get("match_keys", ["external_id"])
    options = payload.get("options", {})

    # Safe no-op if no data
    if not source_data and not target_data:
        logger.info("No datasets provided, returning empty reconciliation")
        return JobResult(
            success=True,
            data={
                "total_source": 0,
                "total_target": 0,
                "matched": 0,
                "match_rate": 0.0,
                "message": "No input datasets - safe no-op",
            },
            records_processed=0,
            records_failed=0,
        )

    # Validate match keys
    if not match_keys:
        return JobResult(
            success=False,
            error="match_keys must be specified for reconciliation",
            records_processed=0,
            records_failed=0,
        )

    try:
        result = reconcile_datasets(
            source_records=source_data,
            target_records=target_data,
            match_keys=match_keys,
            options=options,
        )

        return JobResult(
            success=True,
            data={
                "total_source": result["total_source"],
                "total_target": result["total_target"],
                "matched": result["matched"],
                "mismatched": result["mismatched"],
                "source_orphans": result["source_orphans"],
                "target_orphans": result["target_orphans"],
                "match_rate": result["match_rate"],
                "reconciliation_id": f"recon_{job.id}_{datetime.utcnow().isoformat()}",
            },
            records_processed=result["matched"],
            records_failed=result["mismatched"]
            + result["source_orphans"]
            + result["target_orphans"],
            output_location=payload.get("output_path"),
        )

    except Exception as e:
        logger.error("Reconciliation failed", exc_info=True)
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

"""Anomaly scoring handler for anomaly.score jobs.

Scores records for anomalies using statistical methods.
Safe no-op if no input data provided.
"""

from contextlib import suppress
from typing import Any

from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.utils.logging import get_logger
from settler_workhorse.worker import register_handler

logger = get_logger("handlers.anomaly_score")


class AnomalyScoringError(Exception):
    """Error during anomaly scoring."""

    pass


def calculate_zscore(value: float, mean: float, std: float) -> float:
    """Calculate z-score for a value.

    Args:
        value: Value to score
        mean: Population mean
        std: Population standard deviation

    Returns:
        Z-score (0 if std is 0)
    """
    if std == 0:
        return 0.0
    return (value - mean) / std


def detect_amount_anomalies(
    records: list[dict[str, Any]],
    options: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Detect anomalies in amount values.

    Args:
        records: Records with amount field
        options: Detection options (threshold, method, etc.)

    Returns:
        Anomaly detection results
    """
    opts = options or {}
    threshold = opts.get("zscore_threshold", 3.0)
    method = opts.get("method", "zscore")  # zscore, iqr, mad

    # Extract amounts
    amounts = []
    for record in records:
        amount = record.get("amount")
        if amount is not None:
            with suppress(ValueError, TypeError):
                amounts.append(float(amount))

    if len(amounts) < 2:
        return {
            "total_records": len(records),
            "anomalies_detected": 0,
            "anomaly_rate": 0.0,
            "method": method,
            "threshold": threshold,
            "anomalies": [],
            "statistics": {
                "mean": amounts[0] if amounts else 0,
                "std": 0,
                "min": min(amounts) if amounts else 0,
                "max": max(amounts) if amounts else 0,
            },
        }

    # Calculate statistics
    mean = sum(amounts) / len(amounts)
    variance = sum((x - mean) ** 2 for x in amounts) / len(amounts)
    std = variance**0.5

    # Pre-compute for other methods
    sorted_amounts = sorted(amounts)

    # IQR pre-computation
    q1_idx = len(sorted_amounts) // 4
    q3_idx = 3 * len(sorted_amounts) // 4
    q1 = sorted_amounts[q1_idx]
    q3 = sorted_amounts[q3_idx]
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    # MAD pre-computation
    median = sorted_amounts[len(sorted_amounts) // 2]
    mad = sum(abs(x - median) for x in amounts) / len(amounts)

    # Detect anomalies
    anomalies = []
    for idx, record in enumerate(records):
        amount = record.get("amount")
        if amount is None:
            continue

        try:
            val = float(amount)
            score = 0.0

            if method == "zscore":
                score = abs(calculate_zscore(val, mean, std))
            elif method == "iqr":
                if val < lower_bound or val > upper_bound:
                    score = 999.0  # Flag as anomaly
            elif method == "mad" and mad > 0:
                score = abs(val - median) / mad

            if score > threshold:
                anomalies.append(
                    {
                        "record_index": idx,
                        "record": record,
                        "field": "amount",
                        "value": val,
                        "score": score,
                        "severity": "high" if score > threshold * 2 else "medium",
                    }
                )

        except (ValueError, TypeError) as e:
            logger.warning(f"Could not score record {idx}", error=str(e))

    return {
        "total_records": len(records),
        "anomalies_detected": len(anomalies),
        "anomaly_rate": len(anomalies) / max(len(records), 1),
        "method": method,
        "threshold": threshold,
        "anomalies": anomalies[:20],  # Limit output
        "statistics": {
            "mean": mean,
            "std": std,
            "min": min(amounts),
            "max": max(amounts),
            "count": len(amounts),
        },
    }


def detect_temporal_anomalies(
    records: list[dict[str, Any]],
    options: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Detect temporal anomalies (gaps, duplicates, outliers).

    Args:
        records: Records with date field
        options: Detection options

    Returns:
        Temporal anomaly results
    """
    opts = options or {}

    # Extract dates
    dates = []
    for record in records:
        date_val = record.get("date")
        if date_val:
            dates.append(str(date_val))

    anomalies = []

    # Check for duplicate dates
    date_counts: dict[str, int] = {}
    for d in dates:
        date_counts[d] = date_counts.get(d, 0) + 1

    duplicate_threshold = opts.get("duplicate_threshold", 10)
    for date, count in date_counts.items():
        if count > duplicate_threshold:
            anomalies.append(
                {
                    "type": "duplicate_date",
                    "date": date,
                    "count": count,
                    "severity": "medium",
                }
            )

    return {
        "total_records": len(records),
        "date_count": len(dates),
        "unique_dates": len(date_counts),
        "anomalies_detected": len(anomalies),
        "anomalies": anomalies,
    }


@register_handler(JobType.ANOMALY_SCORE)
def handle_anomaly_score(job: Job) -> JobResult:
    """Handle anomaly scoring job.

    Args:
        job: Job containing scoring payload

    Returns:
        Job execution result
    """
    payload = job.payload
    records = payload.get("records", [])
    score_type = payload.get("score_type", "amount")  # amount, temporal, all
    options = payload.get("options", {})

    # Safe no-op if no data
    if not records:
        logger.info("No records provided, returning empty scoring")
        return JobResult(
            success=True,
            data={
                "total_records": 0,
                "anomalies_detected": 0,
                "anomaly_rate": 0.0,
                "score_type": score_type,
                "message": "No input records - safe no-op",
            },
            records_processed=0,
            records_failed=0,
        )

    try:
        results = {}

        if score_type in ("amount", "all"):
            results["amount"] = detect_amount_anomalies(records, options)

        if score_type in ("temporal", "all"):
            results["temporal"] = detect_temporal_anomalies(records, options)

        # Aggregate results
        total_anomalies = sum(r.get("anomalies_detected", 0) for r in results.values())

        return JobResult(
            success=True,
            data={
                "total_records": len(records),
                "anomalies_detected": total_anomalies,
                "anomaly_rate": total_anomalies / max(len(records), 1),
                "score_type": score_type,
                "results": results,
                "scoring_id": f"anomaly_{job.id}",
            },
            records_processed=len(records),
            records_failed=0,
            output_location=payload.get("output_path"),
        )

    except Exception as e:
        logger.error("Anomaly scoring failed", exc_info=True)
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

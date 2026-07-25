"""Dataset evaluation handler for eval.run jobs.

Evaluates dataset quality, completeness, and schema compliance.
Safe no-op if no dataset provided.
"""

from contextlib import suppress
from typing import Any

from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.utils.logging import get_logger
from settler_workhorse.worker import register_handler

logger = get_logger("handlers.eval_run")


class EvaluationError(Exception):
    """Error during dataset evaluation."""

    pass


def evaluate_completeness(
    records: list[dict[str, Any]],
    required_fields: list[str] | None = None,
) -> dict[str, Any]:
    """Evaluate data completeness across records.

    Args:
        records: Dataset records
        required_fields: Fields that must be present

    Returns:
        Completeness metrics
    """
    required = required_fields or ["amount", "date", "description"]

    if not records:
        return {
            "total_records": 0,
            "field_completeness": {},
            "overall_completeness": 0.0,
        }

    # Calculate per-field completeness
    field_stats: dict[str, dict[str, Any]] = {}
    for field in required:
        field_stats[field] = {"present": 0, "missing": 0, "null": 0}

    # Also track all fields found
    all_fields: set = set()

    for record in records:
        for field in required:
            if field in record:
                if record[field] is None or record[field] == "":
                    field_stats[field]["null"] += 1
                else:
                    field_stats[field]["present"] += 1
            else:
                field_stats[field]["missing"] += 1

        all_fields.update(record.keys())

    # Calculate percentages
    total = len(records)
    field_completeness = {}
    for field, stats in field_stats.items():
        field_completeness[field] = {
            "present_rate": stats["present"] / total,
            "null_rate": stats["null"] / total,
            "missing_rate": stats["missing"] / total,
            "details": stats,
        }

    # Overall completeness = average of present rates
    overall = sum(fc["present_rate"] for fc in field_completeness.values()) / len(
        field_completeness
    )

    return {
        "total_records": total,
        "field_completeness": field_completeness,
        "overall_completeness": overall,
        "fields_found": list(all_fields),
    }


def evaluate_schema_compliance(
    records: list[dict[str, Any]],
    schema: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Evaluate records against expected schema.

    Args:
        records: Dataset records
        schema: Expected schema definition

    Returns:
        Schema compliance metrics
    """
    if not schema:
        # Default schema expectations
        schema = {
            "required_fields": ["amount", "date"],
            "field_types": {
                "amount": ["number", "float", "int"],
                "date": ["string", "datetime"],
                "description": ["string"],
            },
        }

    violations = []
    type_mismatches = []

    required = schema.get("required_fields", [])
    field_types = schema.get("field_types", {})

    for idx, record in enumerate(records):
        # Check required fields
        for field in required:
            if field not in record or record[field] is None:
                violations.append(
                    {
                        "record_index": idx,
                        "field": field,
                        "violation": "missing_required",
                    }
                )

        # Check field types
        for field, expected_types in field_types.items():
            if field in record and record[field] is not None:
                val = record[field]
                actual_type = _get_type_name(val)
                if actual_type not in expected_types:
                    type_mismatches.append(
                        {
                            "record_index": idx,
                            "field": field,
                            "expected": expected_types,
                            "actual": actual_type,
                            "value_preview": str(val)[:50],
                        }
                    )

    total_checks = len(records) * (len(required) + len(field_types))
    total_violations = len(violations) + len(type_mismatches)

    return {
        "total_records": len(records),
        "violations": violations[:20],
        "type_mismatches": type_mismatches[:20],
        "violation_count": len(violations),
        "type_mismatch_count": len(type_mismatches),
        "compliance_rate": 1.0 - (total_violations / max(total_checks, 1)),
        "schema_version": schema.get("version", "unknown"),
    }


def evaluate_consistency(
    records: list[dict[str, Any]],
    options: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Evaluate data consistency (duplicates, ranges, etc.).

    Args:
        records: Dataset records
        options: Consistency check options

    Returns:
        Consistency metrics
    """
    opts = options or {}

    # Check for duplicates based on specified keys
    duplicate_keys = opts.get("duplicate_keys", ["external_id"])

    seen: dict[str, int] = {}
    duplicates = []

    for idx, record in enumerate(records):
        key_parts = []
        for dk in duplicate_keys:
            val = record.get(dk, "")
            key_parts.append(str(val))
        key = "|".join(key_parts)

        if key in seen:
            duplicates.append(
                {
                    "record_index": idx,
                    "duplicate_of": seen[key],
                    "key": key,
                }
            )
        else:
            seen[key] = idx

    # Amount range check
    amounts = []
    for record in records:
        amount = record.get("amount")
        if amount is not None:
            with suppress(ValueError, TypeError):
                amounts.append(float(amount))

    amount_stats = {}
    if amounts:
        total = 0.0
        neg_count = 0
        zero_count = 0
        min_amt = amounts[0]
        max_amt = amounts[0]

        for a in amounts:
            total += a
            if a < 0:
                neg_count += 1
            elif a == 0:
                zero_count += 1
            if a < min_amt:
                min_amt = a
            elif a > max_amt:
                max_amt = a

        amount_stats = {
            "min": min_amt,
            "max": max_amt,
            "mean": total / len(amounts),
            "negative_count": neg_count,
            "zero_count": zero_count,
        }

    return {
        "total_records": len(records),
        "duplicate_count": len(duplicates),
        "duplicates": duplicates[:10],
        "duplicate_rate": len(duplicates) / max(len(records), 1),
        "amount_statistics": amount_stats,
    }


def _get_type_name(value: Any) -> str:
    """Get standardized type name for a value.

    Args:
        value: Value to check

    Returns:
        Type name string
    """
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "int"
    if isinstance(value, float):
        return "float"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    return "unknown"


@register_handler(JobType.EVAL_RUN)
def handle_eval_run(job: Job) -> JobResult:
    """Handle dataset evaluation job.

    Args:
        job: Job containing evaluation payload

    Returns:
        Job execution result
    """
    payload = job.payload
    records = payload.get("records", [])
    eval_types = payload.get(
        "eval_types", ["completeness"]
    )  # completeness, schema, consistency, all
    schema = payload.get("schema")
    options = payload.get("options", {})

    # Safe no-op if no data
    if not records:
        logger.info("No records provided, returning empty evaluation")
        return JobResult(
            success=True,
            data={
                "total_records": 0,
                "eval_types": eval_types,
                "message": "No input records - safe no-op",
            },
            records_processed=0,
            records_failed=0,
        )

    # Normalize eval_types
    if "all" in eval_types:
        eval_types = ["completeness", "schema", "consistency"]

    try:
        results = {}

        if "completeness" in eval_types:
            results["completeness"] = evaluate_completeness(
                records,
                required_fields=options.get("required_fields"),
            )

        if "schema" in eval_types:
            results["schema"] = evaluate_schema_compliance(records, schema)

        if "consistency" in eval_types:
            results["consistency"] = evaluate_consistency(records, options)

        # Calculate overall score
        scores = []
        if "completeness" in results:
            scores.append(results["completeness"]["overall_completeness"])
        if "schema" in results:
            scores.append(results["schema"]["compliance_rate"])
        if "consistency" in results:
            # Consistency score = 1 - duplicate_rate
            scores.append(1.0 - results["consistency"]["duplicate_rate"])

        overall_score = sum(scores) / len(scores) if scores else 0.0

        return JobResult(
            success=True,
            data={
                "total_records": len(records),
                "overall_score": overall_score,
                "eval_types": eval_types,
                "results": results,
                "evaluation_id": f"eval_{job.id}",
            },
            records_processed=len(records),
            records_failed=0,
            output_location=payload.get("output_path"),
        )

    except Exception as e:
        logger.error("Evaluation failed", exc_info=True)
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

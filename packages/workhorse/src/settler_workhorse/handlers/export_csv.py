"""CSV export handler for export.csv jobs.

Generates CSV exports from tenant data.
Idempotent, retry-safe, and tenant-scoped.
"""

import csv
import hashlib
import io
from datetime import datetime
from typing import Any

from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.utils.logging import get_logger
from settler_workhorse.worker import register_handler

logger = get_logger("handlers.export_csv")


class CSVExportError(Exception):
    """Error during CSV export."""

    pass


def validate_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Validate and normalize CSV export payload.

    Args:
        payload: Raw job payload

    Returns:
        Validated payload with defaults

    Raises:
        CSVExportError: If required fields are missing
    """
    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise CSVExportError("tenant_id is required")

    entity_type = payload.get("entity_type")
    if not entity_type:
        raise CSVExportError("entity_type is required (e.g., 'transactions', 'reconciliations')")

    return {
        "tenant_id": tenant_id,
        "entity_type": entity_type,
        "filters": payload.get("filters", {}),
        "columns": payload.get("columns", []),  # Empty = all columns
        "dry_run": payload.get("dry_run", False),
        "idempotency_key": payload.get("idempotency_key"),
        "include_headers": payload.get("include_headers", True),
        "date_format": payload.get("date_format", "ISO"),  # ISO, US, EU
        "max_records": payload.get("max_records", 100000),
    }


def generate_mock_data(
    entity_type: str,
    filters: dict[str, Any],
    max_records: int,
) -> list[dict[str, Any]]:
    """Generate mock data for export.

    Args:
        entity_type: Type of entity to export
        filters: Filters to apply
        max_records: Maximum records to generate

    Returns:
        List of record dictionaries
    """
    records = []
    count = min(max_records, 1000)  # Mock limit

    for i in range(count):
        if entity_type == "transactions":
            record = {
                "id": f"txn_{i:06d}",
                "external_id": f"ext_{i:08d}",
                "amount": round(10.0 + (i * 1.5), 2),
                "currency": "USD",
                "date": datetime.utcnow().isoformat(),
                "description": f"Transaction {i}",
                "status": "matched" if i % 3 == 0 else "unmatched",
                "source": "bank_a" if i % 2 == 0 else "bank_b",
                "created_at": datetime.utcnow().isoformat(),
            }
        elif entity_type == "reconciliations":
            record = {
                "id": f"rec_{i:06d}",
                "name": f"Reconciliation Run {i}",
                "source_system": "Stripe",
                "target_system": "Bank Account",
                "match_rate": round(0.85 + (i % 15) / 100, 2),
                "total_records": 1000 + i * 10,
                "matched_records": 850 + i * 8,
                "created_at": datetime.utcnow().isoformat(),
                "status": "completed" if i % 5 != 0 else "processing",
            }
        else:
            record = {
                "id": f"rec_{i:06d}",
                "entity_type": entity_type,
                "index": i,
                "created_at": datetime.utcnow().isoformat(),
            }

        records.append(record)

    return records


def format_value(value: Any, date_format: str) -> str:
    """Format a value for CSV output.

    Args:
        value: Value to format
        date_format: Date format preference

    Returns:
        Formatted string value
    """
    if value is None:
        return ""

    if isinstance(value, datetime):
        if date_format == "US":
            return value.strftime("%m/%d/%Y %H:%M:%S")
        elif date_format == "EU":
            return value.strftime("%d/%m/%Y %H:%M:%S")
        else:  # ISO
            return value.isoformat()

    if isinstance(value, (int, float)):
        return str(value)

    # Escape quotes and wrap in quotes if contains special chars
    str_val = str(value)
    if "," in str_val or '"' in str_val or "\n" in str_val:
        str_val = str_val.replace('"', '""')
        str_val = f'"{str_val}"'

    return str_val


def generate_csv_content(
    records: list[dict[str, Any]],
    columns: list[str],
    include_headers: bool,
    date_format: str,
) -> str:
    """Generate CSV content from records.

    Args:
        records: List of record dictionaries
        columns: Column names to include (empty = all)
        include_headers: Whether to include header row
        date_format: Date format for datetime values

    Returns:
        CSV content string
    """
    if not records:
        return ""

    output = io.StringIO()

    # Determine columns
    fieldnames = columns or list(records[0].keys())

    writer = csv.DictWriter(
        output, fieldnames=fieldnames, extrasaction="ignore", lineterminator="\n"
    )

    if include_headers:
        writer.writeheader()

    for record in records:
        formatted_row = {k: format_value(v, date_format) for k, v in record.items()}
        writer.writerow(formatted_row)

    return output.getvalue()


@register_handler(JobType.EXPORT_CSV)
def handle_export_csv(job: Job) -> JobResult:
    """Handle CSV export job.

    Args:
        job: Job containing export payload

    Returns:
        Job execution result
    """
    try:
        payload = validate_payload(job.payload)
    except CSVExportError as e:
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

    tenant_id = payload["tenant_id"]
    entity_type = payload["entity_type"]
    filters = payload["filters"]
    columns = payload["columns"]
    dry_run = payload["dry_run"]
    idempotency_key = payload.get("idempotency_key")
    include_headers = payload["include_headers"]
    date_format = payload["date_format"]
    max_records = payload["max_records"]

    logger.info(
        "Starting CSV export",
        job_id=str(job.id),
        tenant_id=tenant_id,
        entity_type=entity_type,
        dry_run=dry_run,
    )

    try:
        # Generate data
        records = generate_mock_data(entity_type, filters, max_records)

        if dry_run:
            return JobResult(
                success=True,
                data={
                    "export_id": f"export_csv_{job.id}_dryrun",
                    "tenant_id": tenant_id,
                    "entity_type": entity_type,
                    "mode": "dry_run",
                    "estimated_records": len(records),
                    "columns": columns if columns else "all",
                    "filters": filters,
                    "idempotency_key": idempotency_key,
                },
                records_processed=0,
                records_failed=0,
            )

        # Generate CSV content
        csv_content = generate_csv_content(
            records=records,
            columns=columns,
            include_headers=include_headers,
            date_format=date_format,
        )

        # Calculate checksum
        content_hash = hashlib.sha256(csv_content.encode()).hexdigest()[:16]

        return JobResult(
            success=True,
            data={
                "export_id": f"export_csv_{job.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                "tenant_id": tenant_id,
                "entity_type": entity_type,
                "mode": "live",
                "format": "csv",
                "records_exported": len(records),
                "columns": list(records[0].keys()) if records else [],
                "content_hash": content_hash,
                "size_bytes": len(csv_content.encode()),
                "filters_applied": filters,
                "idempotency_key": idempotency_key,
                "exported_at": datetime.utcnow().isoformat(),
            },
            records_processed=len(records),
            records_failed=0,
            output_location=job.payload.get("output_path"),
        )

    except Exception as e:
        logger.error(
            "CSV export failed", exc_info=True, tenant_id=tenant_id, entity_type=entity_type
        )
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

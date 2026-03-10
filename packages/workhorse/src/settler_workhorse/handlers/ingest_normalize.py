"""Data normalization handler for ingest.normalize jobs.

Normalizes CSV/JSON data into canonical format for downstream processing.
Safe no-op if no input data exists.
"""

from typing import Any

from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.utils.logging import get_logger
from settler_workhorse.worker import register_handler

logger = get_logger("handlers.ingest_normalize")

IMPORT_WORKBENCH_CONTRACT = {
    "schema_uri": "contracts/ingestion/import-workbench.schema.json",
    "version": "1.0.0",
}


class NormalizationError(Exception):
    """Error during data normalization."""

    pass


def normalize_csv_data(
    records: list[dict[str, Any]],
    schema_version: str = "v1",
    options: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Normalize CSV records to canonical format.

    Args:
        records: List of record dictionaries from CSV
        schema_version: Target schema version
        options: Normalization options (date_format, currency, etc.)

    Returns:
        Normalization result with canonical records
    """
    canonical_records = []
    errors = []
    diagnostics: list[dict[str, Any]] = []
    defaulted_currency_count = 0

    for idx, record in enumerate(records):
        try:
            # Extract and normalize fields
            normalized = {
                "_source_row": idx + 1,
                "_schema_version": schema_version,
            }

            # Amount normalization
            amount = record.get("amount")
            if amount is not None:
                try:
                    normalized["amount"] = float(amount)
                except (ValueError, TypeError):
                    errors.append({"row": idx + 1, "field": "amount", "error": "Invalid amount"})
                    diagnostics.append(
                        {
                            "severity": "blocking",
                            "stage": "normalize",
                            "code": "invalid_amount",
                            "message": "Invalid amount",
                            "row_number": idx + 1,
                        }
                    )
                    normalized["amount"] = None

            # Date normalization
            date_val = record.get("date")
            if date_val:
                # Keep as ISO string if already valid, otherwise mark for parsing
                normalized["date"] = str(date_val)

            # Description normalization
            desc = record.get("description", "")
            normalized["description"] = str(desc).strip() if desc else None

            # External ID normalization
            ext_id = record.get("external_id")
            if ext_id:
                normalized["external_id"] = str(ext_id).strip()

            # Currency normalization (default to USD)
            currency = record.get("currency", "USD")
            normalized_currency = str(currency).upper() if currency else "USD"
            if not currency:
                defaulted_currency_count += 1
                diagnostics.append(
                    {
                        "severity": "info",
                        "stage": "normalize",
                        "code": "currency_defaulted",
                        "message": "Currency defaulted to USD",
                        "row_number": idx + 1,
                    }
                )
            normalized["currency"] = normalized_currency

            canonical_records.append(normalized)

        except Exception as e:
            errors.append({"row": idx + 1, "error": str(e)})
            diagnostics.append(
                {
                    "severity": "warning",
                    "stage": "normalize",
                    "code": "row_normalization_failure",
                    "message": str(e),
                    "row_number": idx + 1,
                }
            )
            logger.warning(f"Failed to normalize row {idx + 1}", error=str(e))

    input_count = len(records)
    output_count = len(canonical_records)
    quality_gates = [
        {
            "gate": "non_empty_import",
            "severity": "blocking",
            "passed": input_count > 0,
            "message": "Input contains rows" if input_count > 0 else "Input is empty",
        },
        {
            "gate": "normalization_success_ratio",
            "severity": "warning",
            "passed": input_count > 0 and output_count / input_count >= 0.8,
            "message": (
                "Normalization ratio acceptable"
                if input_count > 0 and output_count / input_count >= 0.8
                else "Normalization ratio below threshold"
            ),
            "metric": {"input_count": input_count, "output_count": output_count, "threshold": 0.8},
        },
    ]

    return {
        "input_count": input_count,
        "output_count": output_count,
        "schema_version": schema_version,
        "errors": errors[:50],  # Limit error reporting
        "diagnostics": diagnostics[:50],
        "quality_gates": quality_gates,
        "defaulted_field_counts": {"currency": defaulted_currency_count},
        "sample_output": canonical_records[:5] if canonical_records else [],
    }


def normalize_json_data(
    data: Any,
    schema_version: str = "v1",
    options: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Normalize JSON data to canonical format.

    Args:
        data: JSON data (dict or list)
        schema_version: Target schema version
        options: Normalization options

    Returns:
        Normalization result
    """
    opts = options or {}

    # Handle different JSON structures
    if isinstance(data, list):
        # List of records - normalize as CSV-like data
        return normalize_csv_data(data, schema_version, opts)
    elif isinstance(data, dict):
        # Single record or nested structure
        records = data.get("records", [data]) if "records" in data else [data]
        return normalize_csv_data(records, schema_version, opts)
    else:
        return {
            "input_count": 1,
            "output_count": 0,
            "schema_version": schema_version,
            "errors": [{"error": "Unsupported JSON structure"}],
            "sample_output": [],
        }


@register_handler(JobType.INGEST_NORMALIZE)
def handle_ingest_normalize(job: Job) -> JobResult:
    """Handle data normalization job.

    Args:
        job: Job containing normalization payload

    Returns:
        Job execution result
    """
    payload = job.payload
    source_format = payload.get("source_format", "csv")  # csv, json
    source_data = payload.get("source_data")
    schema_version = payload.get("schema_version", "v1")
    options = payload.get("options", {})

    # Safe no-op if no data
    if not source_data:
        logger.info("No source data provided, returning empty normalization")
        return JobResult(
            success=True,
            data={
                "input_count": 0,
                "output_count": 0,
                "schema_version": schema_version,
                "message": "No input data - safe no-op",
                "contract": IMPORT_WORKBENCH_CONTRACT,
            },
            records_processed=0,
            records_failed=0,
        )

    try:
        if source_format == "csv":
            if isinstance(source_data, list):
                result = normalize_csv_data(source_data, schema_version, options)
            else:
                raise NormalizationError("CSV data must be a list of records")
        elif source_format == "json":
            result = normalize_json_data(source_data, schema_version, options)
        else:
            raise NormalizationError(f"Unsupported source format: {source_format}")

        return JobResult(
            success=True,
            data={
                "input_count": result["input_count"],
                "output_count": result["output_count"],
                "schema_version": result["schema_version"],
                "errors_count": len(result["errors"]),
                "diagnostics": result.get("diagnostics", []),
                "quality_gates": result.get("quality_gates", []),
                "defaulted_field_counts": result.get("defaulted_field_counts", {}),
                "sample_output": result["sample_output"],
                "can_proceed": not any(
                    gate.get("severity") == "blocking" and not gate.get("passed")
                    for gate in result.get("quality_gates", [])
                ),
                "contract": IMPORT_WORKBENCH_CONTRACT,
            },
            records_processed=result["output_count"],
            records_failed=len(result["errors"]),
            output_location=payload.get("output_path"),
        )

    except Exception as e:
        logger.error("Normalization failed", exc_info=True)
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

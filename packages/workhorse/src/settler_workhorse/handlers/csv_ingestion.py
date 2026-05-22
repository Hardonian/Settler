"""CSV ingestion handler with robust parsing and validation."""

import io
from datetime import datetime
from typing import Any

import chardet
import pandas as pd
from dateutil import parser as date_parser

from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.utils.logging import get_logger
from settler_workhorse.worker import register_handler

logger = get_logger("handlers.csv")


def detect_encoding(content: bytes) -> str:
    """Detect file encoding using chardet.

    Args:
        content: File content as bytes

    Returns:
        Detected encoding
    """
    result = chardet.detect(content)
    encoding = result.get("encoding", "utf-8")
    confidence = result.get("confidence", 0)

    logger.debug(f"Detected encoding: {encoding} (confidence: {confidence:.2%})")

    # Fallback for low confidence
    if confidence < 0.5:
        return "utf-8"

    return encoding


def parse_date_robust(value: Any) -> datetime | None:
    """Parse date from various formats.

    Args:
        value: Date value to parse

    Returns:
        Parsed datetime or None
    """
    if pd.isna(value) or value is None:
        return None

    if isinstance(value, datetime):
        return value

    try:
        # Use dateutil for flexible parsing
        parsed = date_parser.parse(str(value), fuzzy=True)
        return parsed
    except (ValueError, TypeError):
        return None


def auto_detect_columns(df: pd.DataFrame) -> dict[str, str]:
    """Auto-detect column mappings from DataFrame headers.

    Args:
        df: Input DataFrame

    Returns:
        Dictionary mapping standard fields to column names
    """
    mapping = {}
    headers = [str(h).lower().strip() for h in df.columns]

    # Amount patterns
    amount_patterns = [
        "amount",
        "total",
        "value",
        "sum",
        "price",
        "cost",
        "debit",
        "credit",
        "transaction_amount",
    ]
    for i, header in enumerate(headers):
        if any(p in header for p in amount_patterns):
            mapping["amount"] = df.columns[i]
            break

    # Date patterns
    date_patterns = [
        "date",
        "time",
        "timestamp",
        "created",
        "transaction_date",
        "posted_date",
        "value_date",
    ]
    for i, header in enumerate(headers):
        if any(p in header for p in date_patterns):
            mapping["date"] = df.columns[i]
            break

    # Description patterns
    desc_patterns = [
        "description",
        "desc",
        "memo",
        "note",
        "details",
        "narration",
        "reference",
        "transaction_description",
    ]
    for i, header in enumerate(headers):
        if any(p in header for p in desc_patterns):
            mapping["description"] = df.columns[i]
            break

    # ID patterns
    id_patterns = [
        "id",
        "transaction_id",
        "external_id",
        "reference",
        "ref",
        "transaction_reference",
    ]
    for i, header in enumerate(headers):
        if any(p in header for p in id_patterns):
            mapping["external_id"] = df.columns[i]
            break

    # Currency patterns
    curr_patterns = ["currency", "curr", "ccy", "currency_code"]
    for i, header in enumerate(headers):
        if any(p in header for p in curr_patterns):
            mapping["currency"] = df.columns[i]
            break

    logger.info(f"Auto-detected columns: {mapping}")
    return mapping


def normalize_amount(value: Any) -> float | None:
    """Normalize amount value to float.

    Args:
        value: Amount value

    Returns:
        Normalized amount or None
    """
    if pd.isna(value) or value is None:
        return None

    if isinstance(value, (int, float)):
        return abs(float(value))

    # Clean string value
    str_val = str(value).strip()
    # Remove currency symbols and whitespace
    cleaned = "".join(c for c in str_val if c.isdigit() or c in ".,-")

    # Handle parentheses for negative
    if "(" in str_val and ")" in str_val:
        cleaned = "-" + cleaned

    try:
        # Determine decimal separator
        if "," in cleaned and "." in cleaned:
            # 1,234.56 -> US format
            if cleaned.rfind(",") < cleaned.rfind("."):
                cleaned = cleaned.replace(",", "")
            else:
                # 1.234,56 -> European format
                cleaned = cleaned.replace(".", "").replace(",", ".")
        elif "," in cleaned:
            # Ambiguous - check if likely decimal
            parts = cleaned.split(",")
            if len(parts) == 2 and len(parts[1]) <= 2:
                cleaned = cleaned.replace(",", ".")
            else:
                cleaned = cleaned.replace(",", "")

        amount = float(cleaned)
        return abs(amount)
    except (ValueError, TypeError):
        return None


def process_csv(
    content: bytes,
    column_mapping: dict[str, str] | None = None,
    default_currency: str = "USD",
    skip_rows: int = 0,
) -> dict[str, Any]:
    """Process CSV content with robust parsing.

    Args:
        content: CSV file content as bytes
        column_mapping: Optional manual column mapping
        default_currency: Default currency code
        skip_rows: Number of header rows to skip

    Returns:
        Processing results with normalized records
    """
    # Detect encoding
    encoding = detect_encoding(content)

    # Read CSV with pandas for robust parsing
    try:
        df = pd.read_csv(
            io.BytesIO(content),
            encoding=encoding,
            skiprows=skip_rows,
            dtype=str,  # Read all as strings initially
            keep_default_na=True,
        )
    except pd.errors.EmptyDataError as e:
        raise ValueError("CSV file is empty") from e
    except pd.errors.ParserError as e:
        raise ValueError(f"Failed to parse CSV: {e}") from e

    if len(df) == 0:
        raise ValueError("CSV file contains no data rows")

    logger.info(f"Loaded {len(df)} rows from CSV")

    # Auto-detect columns if not provided
    if not column_mapping:
        column_mapping = auto_detect_columns(df)

    # Validate required mappings
    if "amount" not in column_mapping:
        raise ValueError("Could not detect amount column. Please provide manual mapping.")
    if "date" not in column_mapping:
        raise ValueError("Could not detect date column. Please provide manual mapping.")

    # Process records
    records = []
    errors = []

    for idx, row in df.iterrows():
        try:
            record = {
                "row_number": int(idx) + 1,
                "source_data": row.to_dict(),
            }

            # Extract amount
            amount_col = column_mapping.get("amount")
            if amount_col and amount_col in row:
                amount = normalize_amount(row[amount_col])
                if amount is None or amount <= 0:
                    raise ValueError(f"Invalid amount: {row[amount_col]}")
                record["amount"] = amount
            else:
                raise ValueError("Missing amount value")

            # Extract date
            date_col = column_mapping.get("date")
            if date_col and date_col in row:
                date = parse_date_robust(row[date_col])
                if date is None:
                    raise ValueError(f"Invalid date: {row[date_col]}")
                record["date"] = date.isoformat()
            else:
                raise ValueError("Missing date value")

            # Optional fields
            if "description" in column_mapping:
                desc_col = column_mapping["description"]
                record["description"] = str(row.get(desc_col, "")).strip() or None

            if "external_id" in column_mapping:
                id_col = column_mapping["external_id"]
                record["external_id"] = str(row.get(id_col, "")).strip() or None

            if "currency" in column_mapping:
                curr_col = column_mapping["currency"]
                currency = str(row.get(curr_col, default_currency)).strip().upper()
                record["currency"] = currency if len(currency) == 3 else default_currency
            else:
                record["currency"] = default_currency

            records.append(record)

        except Exception as e:
            errors.append(
                {
                    "row": int(idx) + 1,
                    "error": str(e),
                }
            )

    return {
        "total_rows": len(df),
        "successful": len(records),
        "failed": len(errors),
        "records": records,
        "errors": errors[:100],  # Limit error details
        "column_mapping": column_mapping,
    }


@register_handler(JobType.CSV_INGESTION)
def handle_csv_ingestion(job: Job) -> JobResult:
    """Handle CSV ingestion job.

    Args:
        job: Job containing CSV ingestion payload

    Returns:
        Job execution result
    """
    payload = job.payload

    # Get file content from storage
    file_path = payload.get("file_path")
    file_url = payload.get("file_url")
    file_content_b64 = payload.get("file_content_base64")

    if file_content_b64:
        import base64
        import httpx

        content = base64.b64decode(file_content_b64)
    elif file_path:
        # TODO: Implement storage service integration
        raise NotImplementedError("File path storage not yet implemented")
    elif file_url:
        import httpx
        try:
            logger.info(f"Downloading CSV from URL: {file_url}")
            response = httpx.get(file_url, timeout=30.0)
            response.raise_for_status()
            content = response.content
        except httpx.HTTPStatusError as e:
            return JobResult(
                success=False,
                error=f"Failed to download CSV: HTTP {e.response.status_code}",
            )
        except httpx.RequestError as e:
            return JobResult(
                success=False,
                error=f"Failed to download CSV: {str(e)}",
            )
    else:
        return JobResult(
            success=False,
            error="No file content provided (file_path, file_url, or file_content_base64 required)",
        )

    try:
        result = process_csv(
            content=content,
            column_mapping=payload.get("column_mapping"),
            default_currency=payload.get("default_currency", "USD"),
            skip_rows=payload.get("skip_rows", 0),
        )

        return JobResult(
            success=True,
            data={
                "total_rows": result["total_rows"],
                "column_mapping_detected": result["column_mapping"],
                "sample_records": result["records"][:5],
            },
            records_processed=result["successful"],
            records_failed=result["failed"],
            output_location=payload.get("output_path"),
        )

    except Exception as e:
        logger.error("CSV processing failed", exc_info=True)
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

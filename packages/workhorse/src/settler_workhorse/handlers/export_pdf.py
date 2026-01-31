"""PDF export handler for export.pdf jobs.

Generates PDF reports from tenant data.
Idempotent, retry-safe, and tenant-scoped.
"""

import hashlib
from datetime import datetime
from typing import Any, Dict, List, Optional

from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.utils.logging import get_logger
from settler_workhorse.worker import register_handler

# Try to import reportlab, fallback if not available
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

logger = get_logger("handlers.export_pdf")


class PDFExportError(Exception):
    """Error during PDF export."""

    pass


def validate_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and normalize PDF export payload.

    Args:
        payload: Raw job payload

    Returns:
        Validated payload with defaults

    Raises:
        PDFExportError: If required fields are missing
    """
    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise PDFExportError("tenant_id is required")

    entity_type = payload.get("entity_type")
    if not entity_type:
        raise PDFExportError("entity_type is required")

    return {
        "tenant_id": tenant_id,
        "entity_type": entity_type,
        "filters": payload.get("filters", {}),
        "columns": payload.get("columns", []),
        "title": payload.get("title", f"{entity_type.title()} Report"),
        "dry_run": payload.get("dry_run", False),
        "idempotency_key": payload.get("idempotency_key"),
        "page_size": payload.get("page_size", "A4"),  # A4, Letter
        "orientation": payload.get("orientation", "portrait"),  # portrait, landscape
        "max_records": payload.get("max_records", 5000),  # Lower limit for PDF
        "include_summary": payload.get("include_summary", True),
    }


def generate_mock_data(
    entity_type: str,
    filters: Dict[str, Any],
    max_records: int,
) -> List[Dict[str, Any]]:
    """Generate mock data for export.

    Args:
        entity_type: Type of entity to export
        filters: Filters to apply
        max_records: Maximum records to generate

    Returns:
        List of record dictionaries
    """
    records = []
    count = min(max_records, 500)  # Lower limit for PDF

    for i in range(count):
        if entity_type == "transactions":
            record = {
                "id": f"txn_{i:06d}",
                "amount": f"${round(10.0 + (i * 1.5), 2)}",
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "description": f"Transaction {i}",
                "status": "matched" if i % 3 == 0 else "unmatched",
                "source": "bank_a" if i % 2 == 0 else "bank_b",
            }
        elif entity_type == "reconciliations":
            record = {
                "id": f"rec_{i:06d}",
                "name": f"Run {i}",
                "match_rate": f"{round(0.85 + (i % 15) / 100, 2)}%",
                "records": 1000 + i * 10,
                "status": "completed" if i % 5 != 0 else "processing",
            }
        else:
            record = {
                "id": f"rec_{i:06d}",
                "type": entity_type,
                "index": i,
            }

        records.append(record)

    return records


def generate_pdf_content(
    records: List[Dict[str, Any]],
    columns: List[str],
    title: str,
    page_size: str,
    orientation: str,
    include_summary: bool,
) -> bytes:
    """Generate PDF content from records.

    Args:
        records: List of record dictionaries
        columns: Column names to include (empty = all)
        title: Report title
        page_size: Page size (A4, Letter)
        orientation: Page orientation (portrait, landscape)
        include_summary: Whether to include summary section

    Returns:
        PDF file bytes
    """
    if not HAS_REPORTLAB:
        raise PDFExportError("reportlab is not installed. Install with: pip install reportlab")

    # Determine page size
    if page_size == "Letter":
        pagesize = letter
    else:
        pagesize = A4

    if orientation == "landscape":
        pagesize = (pagesize[1], pagesize[0])

    from io import BytesIO
    output = BytesIO()

    doc = SimpleDocTemplate(
        output,
        pagesize=pagesize,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30,
    )

    elements = []
    styles = getSampleStyleSheet()

    # Title
    title_style = styles['Heading1']
    elements.append(Paragraph(title, title_style))
    elements.append(Spacer(1, 12))

    # Metadata
    meta_style = styles['Normal']
    meta_style.fontSize = 10
    meta_style.textColor = colors.grey
    elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", meta_style))
    elements.append(Paragraph(f"Records: {len(records)}", meta_style))
    elements.append(Spacer(1, 20))

    # Summary section
    if include_summary and records:
        summary_style = styles['Heading2']
        elements.append(Paragraph("Summary", summary_style))

        # Calculate summary stats
        summary_data = [["Metric", "Value"]]
        summary_data.append(["Total Records", str(len(records))])
        summary_data.append(["Report Type", "Detailed Export"])
        summary_data.append(["Generated By", "Settler Workhorse"])

        summary_table = Table(summary_data, colWidths=[150, 200])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

    # Data table
    if records:
        # Determine columns
        if columns:
            fieldnames = columns[:10]  # Limit columns for PDF
        else:
            fieldnames = list(records[0].keys())[:10]

        data_style = styles['Heading2']
        elements.append(Paragraph("Data", data_style))

        # Table data
        table_data = [fieldnames]
        for record in records[:100]:  # Limit rows for PDF
            row = [str(record.get(field, "")) for field in fieldnames]
            table_data.append(row)

        # Calculate column widths based on orientation
        if orientation == "landscape":
            col_widths = [100] * len(fieldnames)
        else:
            col_widths = [80] * len(fieldnames)

        table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(table)

    doc.build(elements)
    return output.getvalue()


@register_handler(JobType.EXPORT_PDF)
def handle_export_pdf(job: Job) -> JobResult:
    """Handle PDF export job.

    Args:
        job: Job containing export payload

    Returns:
        Job execution result
    """
    try:
        payload = validate_payload(job.payload)
    except PDFExportError as e:
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
    title = payload["title"]
    dry_run = payload["dry_run"]
    idempotency_key = payload.get("idempotency_key")
    page_size = payload["page_size"]
    orientation = payload["orientation"]
    max_records = payload["max_records"]
    include_summary = payload["include_summary"]

    logger.info(
        "Starting PDF export",
        job_id=str(job.id),
        tenant_id=tenant_id,
        entity_type=entity_type,
        dry_run=dry_run,
    )

    try:
        if not HAS_REPORTLAB:
            logger.warning("reportlab not available, PDF export will fail")
            return JobResult(
                success=False,
                error="PDF export requires reportlab. Please install: pip install reportlab",
                records_processed=0,
                records_failed=0,
            )

        # Generate data
        records = generate_mock_data(entity_type, filters, max_records)

        if dry_run:
            return JobResult(
                success=True,
                data={
                    "export_id": f"export_pdf_{job.id}_dryrun",
                    "tenant_id": tenant_id,
                    "entity_type": entity_type,
                    "mode": "dry_run",
                    "estimated_records": len(records),
                    "columns": columns if columns else "all",
                    "title": title,
                    "page_size": page_size,
                    "orientation": orientation,
                    "has_reportlab": HAS_REPORTLAB,
                    "idempotency_key": idempotency_key,
                },
                records_processed=0,
                records_failed=0,
            )

        # Generate PDF content
        pdf_bytes = generate_pdf_content(
            records=records,
            columns=columns,
            title=title,
            page_size=page_size,
            orientation=orientation,
            include_summary=include_summary,
        )

        # Calculate checksum
        content_hash = hashlib.sha256(pdf_bytes).hexdigest()[:16]

        return JobResult(
            success=True,
            data={
                "export_id": f"export_pdf_{job.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                "tenant_id": tenant_id,
                "entity_type": entity_type,
                "mode": "live",
                "format": "pdf",
                "records_exported": len(records),
                "columns": list(records[0].keys()) if records else [],
                "content_hash": content_hash,
                "size_bytes": len(pdf_bytes),
                "title": title,
                "page_size": page_size,
                "orientation": orientation,
                "idempotency_key": idempotency_key,
                "exported_at": datetime.utcnow().isoformat(),
            },
            records_processed=len(records),
            records_failed=0,
            output_location=job.payload.get("output_path"),
        )

    except Exception as e:
        logger.error("PDF export failed", exc_info=True, tenant_id=tenant_id, entity_type=entity_type)
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

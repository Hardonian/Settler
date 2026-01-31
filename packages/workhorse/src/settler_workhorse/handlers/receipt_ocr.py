"""Receipt OCR handler for receipt.ocr jobs.

Extracts text and data from receipt images.
Idempotent, retry-safe, and tenant-scoped.
"""

import base64
import hashlib
import io
from datetime import datetime
from typing import Any, Dict, List, Optional

from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.utils.logging import get_logger
from settler_workhorse.worker import register_handler

# Try to import OCR libraries
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# Try to import pytesseract for OCR
try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

logger = get_logger("handlers.receipt_ocr")


class ReceiptOCRError(Exception):
    """Error during receipt OCR."""

    pass


def validate_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and normalize receipt OCR payload.

    Args:
        payload: Raw job payload

    Returns:
        Validated payload with defaults

    Raises:
        ReceiptOCRError: If required fields are missing
    """
    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise ReceiptOCRError("tenant_id is required")

    image_content_base64 = payload.get("image_content_base64")
    image_url = payload.get("image_url")

    if not image_content_base64 and not image_url:
        raise ReceiptOCRError("Either image_content_base64 or image_url is required")

    return {
        "tenant_id": tenant_id,
        "image_content_base64": image_content_base64,
        "image_url": image_url,
        "receipt_id": payload.get("receipt_id"),
        "ocr_engine": payload.get("ocr_engine", "tesseract"),  # tesseract, mock
        "preprocess": payload.get("preprocess", True),
        "extract_structure": payload.get("extract_structure", True),
        "dry_run": payload.get("dry_run", False),
        "idempotency_key": payload.get("idempotency_key"),
        "language": payload.get("language", "eng"),  # eng, fra, deu, etc.
    }


def preprocess_image(image: "Image.Image") -> "Image.Image":
    """Preprocess image for better OCR.

    Args:
        image: PIL Image

    Returns:
        Preprocessed image
    """
    if not HAS_PIL:
        return image

    # Convert to grayscale
    image = image.convert("L")

    # Increase contrast
    from PIL import ImageEnhance
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)

    # Sharpen
    from PIL import ImageFilter
    image = image.filter(ImageFilter.SHARPEN)

    return image


def extract_text_tesseract(image: "Image.Image", language: str) -> str:
    """Extract text using Tesseract OCR.

    Args:
        image: PIL Image
        language: OCR language code

    Returns:
        Extracted text
    """
    if not HAS_TESSERACT:
        raise ReceiptOCRError("Tesseract not installed. Install with: pip install pytesseract")

    try:
        text = pytesseract.image_to_string(image, lang=language)
        return text
    except Exception as e:
        logger.error("Tesseract OCR failed", error=str(e))
        raise ReceiptOCRError(f"OCR failed: {e}")


def extract_structure_from_text(text: str) -> Dict[str, Any]:
    """Extract structured data from receipt text.

    Args:
        text: Raw OCR text

    Returns:
        Structured receipt data
    """
    lines = text.split('\n')
    lines = [line.strip() for line in lines if line.strip()]

    # Simple heuristics for receipt data extraction
    merchant_name = lines[0] if lines else "Unknown"
    date = None
    total = None
    items = []

    import re

    # Look for date patterns
    date_patterns = [
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',  # MM/DD/YYYY or DD/MM/YY
        r'(\d{4}-\d{2}-\d{2})',  # YYYY-MM-DD
    ]

    for line in lines:
        for pattern in date_patterns:
            match = re.search(pattern, line)
            if match:
                date = match.group(1)
                break
        if date:
            break

    # Look for total amount
    total_patterns = [
        r'total[:\s]*[$]?([\d,]+\.\d{2})',
        r'amount[:\s]*[$]?([\d,]+\.\d{2})',
        r'[$]?([\d,]+\.\d{2})\s*$',
    ]

    for line in lines:
        line_lower = line.lower()
        for pattern in total_patterns:
            match = re.search(pattern, line_lower, re.IGNORECASE)
            if match:
                try:
                    total = float(match.group(1).replace(',', ''))
                    break
                except ValueError:
                    continue
        if total:
            break

    # Look for line items (simple heuristic: lines with prices)
    item_pattern = r'(.+?)\s+[$]?([\d,]+\.\d{2})'
    for line in lines[1:-1]:  # Skip first (merchant) and last (total)
        match = re.search(item_pattern, line)
        if match and 'total' not in line.lower():
            items.append({
                "description": match.group(1).strip(),
                "amount": float(match.group(2).replace(',', '')),
            })

    return {
        "merchant_name": merchant_name,
        "date": date,
        "total_amount": total,
        "currency": "USD",  # Default, could be detected
        "items": items[:20],  # Limit items
        "raw_text_preview": text[:500] + "..." if len(text) > 500 else text,
    }


def mock_ocr(image_bytes: bytes) -> Dict[str, Any]:
    """Mock OCR for testing without Tesseract.

    Args:
        image_bytes: Image bytes

    Returns:
        Mock OCR results
    """
    return {
        "merchant_name": "Mock Merchant Store",
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "total_amount": 42.99,
        "currency": "USD",
        "items": [
            {"description": "Item 1", "amount": 19.99},
            {"description": "Item 2", "amount": 15.00},
            {"description": "Tax", "amount": 3.00},
            {"description": "Tip", "amount": 5.00},
        ],
        "raw_text_preview": "Mock Merchant Store\nItem 1 $19.99\nItem 2 $15.00\nTax $3.00\nTip $5.00\nTotal $42.99",
        "confidence": 0.95,
        "mock": True,
    }


@register_handler(JobType.RECEIPT_OCR)
def handle_receipt_ocr(job: Job) -> JobResult:
    """Handle receipt OCR job.

    Args:
        job: Job containing OCR payload

    Returns:
        Job execution result
    """
    try:
        payload = validate_payload(job.payload)
    except ReceiptOCRError as e:
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

    tenant_id = payload["tenant_id"]
    image_content_base64 = payload["image_content_base64"]
    ocr_engine = payload["ocr_engine"]
    preprocess = payload["preprocess"]
    extract_structure = payload["extract_structure"]
    dry_run = payload["dry_run"]
    idempotency_key = payload.get("idempotency_key")
    language = payload["language"]
    receipt_id = payload.get("receipt_id")

    logger.info(
        "Starting receipt OCR",
        job_id=str(job.id),
        tenant_id=tenant_id,
        receipt_id=receipt_id,
        ocr_engine=ocr_engine,
        dry_run=dry_run,
    )

    try:
        # Decode image
        if image_content_base64:
            try:
                image_bytes = base64.b64decode(image_content_base64)
            except Exception:
                return JobResult(
                    success=False,
                    error="Invalid base64 image content",
                    records_processed=0,
                    records_failed=0,
                )
        else:
            # Would fetch from URL in production
            return JobResult(
                success=False,
                error="Image URL fetching not implemented",
                records_processed=0,
                records_failed=0,
            )

        # Calculate checksum
        content_hash = hashlib.sha256(image_bytes).hexdigest()[:16]

        if dry_run:
            return JobResult(
                success=True,
                data={
                    "ocr_id": f"receipt_ocr_{job.id}_dryrun",
                    "tenant_id": tenant_id,
                    "receipt_id": receipt_id,
                    "mode": "dry_run",
                    "size_bytes": len(image_bytes),
                    "content_hash": content_hash,
                    "ocr_engine": ocr_engine,
                    "has_pil": HAS_PIL,
                    "has_tesseract": HAS_TESSERACT,
                    "idempotency_key": idempotency_key,
                },
                records_processed=0,
                records_failed=0,
            )

        # Perform OCR
        if ocr_engine == "mock":
            extracted_data = mock_ocr(image_bytes)
            raw_text = extracted_data["raw_text_preview"]
        else:
            if not HAS_PIL:
                return JobResult(
                    success=False,
                    error="PIL (Pillow) not installed. Install with: pip install Pillow",
                    records_processed=0,
                    records_failed=0,
                )

            if not HAS_TESSERACT:
                return JobResult(
                    success=False,
                    error="Tesseract not installed. Install with: pip install pytesseract",
                    records_processed=0,
                    records_failed=0,
                )

            # Load image
            image = Image.open(io.BytesIO(image_bytes))

            # Preprocess
            if preprocess:
                image = preprocess_image(image)

            # Extract text
            raw_text = extract_text_tesseract(image, language)

            # Extract structure
            if extract_structure:
                extracted_data = extract_structure_from_text(raw_text)
            else:
                extracted_data = {"raw_text": raw_text}

        return JobResult(
            success=True,
            data={
                "ocr_id": f"receipt_ocr_{job.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                "tenant_id": tenant_id,
                "receipt_id": receipt_id,
                "mode": "live",
                "content_hash": content_hash,
                "size_bytes": len(image_bytes),
                "ocr_engine": ocr_engine,
                "language": language,
                "extracted_data": extracted_data,
                "idempotency_key": idempotency_key,
                "processed_at": datetime.utcnow().isoformat(),
            },
            records_processed=1,
            records_failed=0,
            output_location=job.payload.get("output_path"),
        )

    except Exception as e:
        logger.error("Receipt OCR failed", exc_info=True, tenant_id=tenant_id, receipt_id=receipt_id)
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

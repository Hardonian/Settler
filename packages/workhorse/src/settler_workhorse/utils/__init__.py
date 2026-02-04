"""Utility functions for Settler Workhorse."""

import hashlib
import secrets
from typing import Any
from uuid import UUID


def generate_idempotency_key(prefix: str = "job") -> str:
    """Generate a unique idempotency key.

    Args:
        prefix: Key prefix

    Returns:
        Unique idempotency key
    """
    token = secrets.token_hex(16)
    return f"{prefix}_{token}"


def calculate_exponential_backoff(
    attempt: int,
    base_seconds: float = 1.0,
    max_seconds: float = 300.0,
    multiplier: float = 2.0,
) -> float:
    """Calculate exponential backoff delay.

    Args:
        attempt: Attempt number (1-indexed)
        base_seconds: Base delay in seconds
        max_seconds: Maximum delay in seconds
        multiplier: Exponential multiplier

    Returns:
        Delay in seconds
    """
    delay = base_seconds * (multiplier ** (attempt - 1))
    return min(delay, max_seconds)


def format_duration(seconds: float) -> str:
    """Format a duration in human-readable form.

    Args:
        seconds: Duration in seconds

    Returns:
        Human-readable duration string
    """
    if seconds < 1:
        return f"{seconds * 1000:.0f}ms"
    elif seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{minutes}m {secs}s"
    else:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        return f"{hours}h {minutes}m"


def truncate_string(value: str | None, max_length: int = 100) -> str | None:
    """Truncate a string to maximum length.

    Args:
        value: String to truncate
        max_length: Maximum length

    Returns:
        Truncated string
    """
    if not value or len(value) <= max_length:
        return value
    return value[: max_length - 3] + "..."


def safe_json_dumps(obj: Any, max_length: int = 10000) -> str:
    """Safely serialize object to JSON with length limit.

    Args:
        obj: Object to serialize
        max_length: Maximum length of output

    Returns:
        JSON string (possibly truncated)
    """
    import json

    try:
        result = json.dumps(obj, default=str)
        return truncate_string(result, max_length) or "{}"
    except (TypeError, ValueError) as e:
        return f'{{"error": "Failed to serialize: {e}"}}'


def hash_payload(payload: dict[str, Any]) -> str:
    """Create a hash of a payload for comparison.

    Args:
        payload: Payload dictionary

    Returns:
        SHA-256 hash hex digest
    """
    import json

    canonical = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode()).hexdigest()[:16]


def parse_uuid(value: str | None) -> UUID | None:
    """Safely parse a UUID string.

    Args:
        value: UUID string

    Returns:
        UUID object or None if invalid
    """
    if not value:
        return None
    try:
        return UUID(value)
    except ValueError:
        return None


def is_valid_uuid(value: Any) -> bool:
    """Check if value is a valid UUID.

    Args:
        value: Value to check

    Returns:
        True if valid UUID
    """
    if isinstance(value, UUID):
        return True
    if not isinstance(value, str):
        return False
    try:
        UUID(value)
        return True
    except ValueError:
        return False

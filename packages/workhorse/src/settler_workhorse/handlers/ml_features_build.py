"""ML features builder handler for ml.features.build jobs.

Computes and stores features used by scoring/eval jobs.
Idempotent, retry-safe, and tenant-scoped.
"""

import hashlib
import json
from datetime import datetime
from typing import Any

from settler_workhorse.models import Job, JobResult, JobType
from settler_workhorse.utils.logging import get_logger
from settler_workhorse.worker import register_handler

logger = get_logger("handlers.ml_features_build")


class FeaturesBuildError(Exception):
    """Error during ML features building."""

    pass


def validate_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Validate and normalize features build payload.

    Args:
        payload: Raw job payload

    Returns:
        Validated payload with defaults

    Raises:
        FeaturesBuildError: If required fields are missing
    """
    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise FeaturesBuildError("tenant_id is required")

    feature_set = payload.get("feature_set", "default")
    subject_type = payload.get("subject_type", "transaction")

    return {
        "tenant_id": tenant_id,
        "feature_set": feature_set,
        "subject_type": subject_type,
        "subject_ids": payload.get("subject_ids", []),  # Empty = all
        "version": payload.get("version", "1.0.0"),
        "dry_run": payload.get("dry_run", False),
        "idempotency_key": payload.get("idempotency_key"),
        "feature_config": payload.get("feature_config", {}),
        "batch_size": payload.get("batch_size", 1000),
    }


def compute_features_for_subject(
    subject_type: str,
    subject_id: str,
    feature_set: str,
    feature_config: dict[str, Any],
) -> dict[str, Any]:
    """Compute features for a single subject.

    Args:
        subject_type: Type of subject (transaction, account, etc.)
        subject_id: Subject identifier
        feature_set: Name of feature set to compute
        feature_config: Feature computation configuration

    Returns:
        Feature vector for the subject
    """
    # In production, this would query the database and compute real features
    # For now, generate realistic mock features based on subject type

    if subject_type == "transaction":
        return _compute_transaction_features(subject_id, feature_config)
    elif subject_type == "account":
        return _compute_account_features(subject_id, feature_config)
    elif subject_type == "reconciliation":
        return _compute_reconciliation_features(subject_id, feature_config)
    else:
        return _compute_generic_features(subject_id, feature_config)


def _compute_transaction_features(subject_id: str, config: dict[str, Any]) -> dict[str, Any]:
    """Compute features for a transaction."""
    # Generate deterministic mock features based on subject_id hash
    hash_val = int(hashlib.md5(subject_id.encode()).hexdigest(), 16)

    base_amount = 100 + (hash_val % 10000) / 10

    return {
        "subject_id": subject_id,
        "subject_type": "transaction",
        "computed_at": datetime.utcnow().isoformat(),
        "features": {
            # Amount-based features
            "amount_magnitude": float(base_amount),
            "amount_log": float(__import__("math").log10(max(base_amount, 1))),
            "amount_roundness": 1.0 if base_amount % 100 == 0 else 0.0,
            # Temporal features
            "hour_of_day": hash_val % 24,
            "day_of_week": hash_val % 7,
            "is_weekend": 1.0 if hash_val % 7 in [5, 6] else 0.0,
            "is_business_hours": 1.0 if 9 <= (hash_val % 24) <= 17 else 0.0,
            # Risk features
            "velocity_24h": float(hash_val % 50),
            "unique_counterparties": float(hash_val % 10),
            "recurring_pattern_score": float((hash_val % 100) / 100),
            # Match quality features (if reconciliation context)
            "match_confidence": float((hash_val % 1000) / 1000),
            "has_external_id": 1.0 if hash_val % 3 == 0 else 0.0,
            "description_length": float(20 + (hash_val % 100)),
        },
        "feature_version": "1.0.0",
    }


def _compute_account_features(subject_id: str, config: dict[str, Any]) -> dict[str, Any]:
    """Compute features for an account."""
    hash_val = int(hashlib.md5(subject_id.encode()).hexdigest(), 16)

    return {
        "subject_id": subject_id,
        "subject_type": "account",
        "computed_at": datetime.utcnow().isoformat(),
        "features": {
            "transaction_volume_30d": float(100 + (hash_val % 1000)),
            "avg_transaction_amount": float(50 + (hash_val % 500)),
            "transaction_frequency": float(hash_val % 30),
            "balance_volatility": float((hash_val % 100) / 100),
            "days_since_last_activity": float(hash_val % 30),
            "unique_categories": float(hash_val % 15),
        },
        "feature_version": "1.0.0",
    }


def _compute_reconciliation_features(subject_id: str, config: dict[str, Any]) -> dict[str, Any]:
    """Compute features for a reconciliation run."""
    hash_val = int(hashlib.md5(subject_id.encode()).hexdigest(), 16)

    match_rate = (hash_val % 1000) / 1000

    return {
        "subject_id": subject_id,
        "subject_type": "reconciliation",
        "computed_at": datetime.utcnow().isoformat(),
        "features": {
            "match_rate": float(match_rate),
            "unmatched_count": float(hash_val % 50),
            "variance_amount": float((hash_val % 10000) / 100),
            "source_record_count": float(100 + (hash_val % 1000)),
            "target_record_count": float(100 + (hash_val % 900)),
            "processing_time_seconds": float(10 + (hash_val % 300)),
            "rule_complexity_score": float((hash_val % 100) / 100),
            "anomaly_flag": 1.0 if match_rate < 0.8 else 0.0,
        },
        "feature_version": "1.0.0",
    }


def _compute_generic_features(subject_id: str, config: dict[str, Any]) -> dict[str, Any]:
    """Compute generic features for unknown subject types."""
    hash_val = int(hashlib.md5(subject_id.encode()).hexdigest(), 16)

    return {
        "subject_id": subject_id,
        "subject_type": "generic",
        "computed_at": datetime.utcnow().isoformat(),
        "features": {
            "hash_feature_1": float(hash_val % 100),
            "hash_feature_2": float((hash_val >> 32) % 100),
            "hash_feature_3": float((hash_val >> 64) % 100),
        },
        "feature_version": "1.0.0",
    }


def build_features_batch(
    tenant_id: str,
    subject_type: str,
    subject_ids: list[str],
    feature_set: str,
    feature_config: dict[str, Any],
    batch_size: int,
) -> dict[str, Any]:
    """Build features for a batch of subjects.

    Args:
        tenant_id: Tenant ID for scoping
        subject_type: Type of subjects
        subject_ids: List of subject IDs (empty = compute for all)
        feature_set: Name of feature set
        feature_config: Feature computation config
        batch_size: Max batch size

    Returns:
        Batch results with computed features
    """
    # In production, this would:
    # 1. Query database for subjects if subject_ids is empty
    # 2. Compute features for each subject
    # 3. Store features in dedicated table or job_results
    # 4. Return reference to stored features

    if not subject_ids:
        # Simulate fetching subjects
        subject_ids = [f"{subject_type}_{i}" for i in range(min(batch_size, 100))]

    results = []
    errors = []

    for idx, subject_id in enumerate(subject_ids[:batch_size]):
        try:
            features = compute_features_for_subject(
                subject_type, subject_id, feature_set, feature_config
            )
            results.append(features)
        except Exception as e:
            errors.append(
                {
                    "subject_id": subject_id,
                    "error": str(e),
                    "index": idx,
                }
            )

    return {
        "subjects_processed": len(results),
        "subjects_failed": len(errors),
        "subject_type": subject_type,
        "feature_set": feature_set,
        "features": results,
        "errors": errors[:10],  # Limit error reporting
    }


@register_handler(JobType.ML_FEATURES_BUILD)
def handle_ml_features_build(job: Job) -> JobResult:
    """Handle ML features build job.

    Args:
        job: Job containing features build payload

    Returns:
        Job execution result
    """
    try:
        payload = validate_payload(job.payload)
    except FeaturesBuildError as e:
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

    tenant_id = payload["tenant_id"]
    feature_set = payload["feature_set"]
    subject_type = payload["subject_type"]
    subject_ids = payload["subject_ids"]
    version = payload["version"]
    dry_run = payload["dry_run"]
    idempotency_key = payload.get("idempotency_key")
    feature_config = payload["feature_config"]
    batch_size = payload["batch_size"]

    logger.info(
        "Starting ML features build",
        job_id=str(job.id),
        tenant_id=tenant_id,
        feature_set=feature_set,
        subject_type=subject_type,
        dry_run=dry_run,
    )

    try:
        if dry_run:
            # Dry run - estimate work
            estimated_subjects = len(subject_ids) if subject_ids else batch_size
            return JobResult(
                success=True,
                data={
                    "build_id": f"features_{job.id}_dryrun",
                    "tenant_id": tenant_id,
                    "feature_set": feature_set,
                    "subject_type": subject_type,
                    "version": version,
                    "mode": "dry_run",
                    "estimated_subjects": estimated_subjects,
                    "estimated_features_per_subject": len(feature_config.get("features", [])) or 10,
                    "idempotency_key": idempotency_key,
                },
                records_processed=0,
                records_failed=0,
            )

        # Build features
        batch_result = build_features_batch(
            tenant_id=tenant_id,
            subject_type=subject_type,
            subject_ids=subject_ids,
            feature_set=feature_set,
            feature_config=feature_config,
            batch_size=batch_size,
        )

        # Generate content hash for deduplication
        content_hash = hashlib.sha256(
            json.dumps(batch_result["features"][:5], sort_keys=True).encode()
        ).hexdigest()[:16]

        return JobResult(
            success=True,
            data={
                "build_id": f"features_{job.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                "tenant_id": tenant_id,
                "feature_set": feature_set,
                "subject_type": subject_type,
                "version": version,
                "mode": "live",
                "subjects_processed": batch_result["subjects_processed"],
                "subjects_failed": batch_result["subjects_failed"],
                "feature_names": (
                    list(batch_result["features"][0]["features"].keys())
                    if batch_result["features"]
                    else []
                ),
                "content_hash": content_hash,
                "idempotency_key": idempotency_key,
                "computed_at": datetime.utcnow().isoformat(),
                "sample_features": batch_result["features"][:3] if batch_result["features"] else [],
            },
            records_processed=batch_result["subjects_processed"],
            records_failed=batch_result["subjects_failed"],
            output_location=job.payload.get("output_path"),
        )

    except Exception as e:
        logger.error(
            "ML features build failed",
            exc_info=True,
            tenant_id=tenant_id,
            feature_set=feature_set,
        )
        return JobResult(
            success=False,
            error=str(e),
            records_processed=0,
            records_failed=0,
        )

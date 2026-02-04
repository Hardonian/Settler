"""Job handlers package.

This module imports and registers all job handlers.
Handlers are auto-registered via the @register_handler decorator.
"""

# Import handlers to register them
# Phase 6 - Shared/core handlers
# Phase 6 - Settler-specific handlers
# Phase 7 - Client-facing import/export handlers
# Phase 7 - Receipt processing handlers
from settler_workhorse.handlers import (
    anomaly_score,  # noqa: F401
    audit_trail_export,  # noqa: F401
    batch_backfill,  # noqa: F401
    csv_ingestion,  # noqa: F401
    eval_run,  # noqa: F401
    export_csv,  # noqa: F401
    export_excel,  # noqa: F401
    export_pdf,  # noqa: F401
    import_validate,  # noqa: F401
    ingest_normalize,  # noqa: F401
    ml_features_build,  # noqa: F401
    receipt_ocr,  # noqa: F401
    recon_run,  # noqa: F401
    report_generate,  # noqa: F401
    transaction_match,  # noqa: F401
    variance_report,  # noqa: F401
)

__all__ = []

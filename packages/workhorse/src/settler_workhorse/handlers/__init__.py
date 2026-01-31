"""Job handlers package.

This module imports and registers all job handlers.
Handlers are auto-registered via the @register_handler decorator.
"""

# Import handlers to register them
from settler_workhorse.handlers import csv_ingestion  # noqa: F401
from settler_workhorse.handlers import ingest_normalize  # noqa: F401
from settler_workhorse.handlers import recon_run  # noqa: F401
from settler_workhorse.handlers import anomaly_score  # noqa: F401
from settler_workhorse.handlers import eval_run  # noqa: F401
from settler_workhorse.handlers import variance_report  # noqa: F401
from settler_workhorse.handlers import transaction_match  # noqa: F401

# Phase 6 - Shared/core handlers
from settler_workhorse.handlers import batch_backfill  # noqa: F401
from settler_workhorse.handlers import report_generate  # noqa: F401
from settler_workhorse.handlers import ml_features_build  # noqa: F401

# Phase 6 - Settler-specific handlers
from settler_workhorse.handlers import audit_trail_export  # noqa: F401

# Phase 7 - Client-facing import/export handlers
from settler_workhorse.handlers import export_csv  # noqa: F401
from settler_workhorse.handlers import export_excel  # noqa: F401
from settler_workhorse.handlers import export_pdf  # noqa: F401
from settler_workhorse.handlers import import_validate  # noqa: F401

# Phase 7 - Receipt processing handlers
from settler_workhorse.handlers import receipt_ocr  # noqa: F401

__all__ = []

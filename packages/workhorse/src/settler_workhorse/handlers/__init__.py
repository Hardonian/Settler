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

__all__ = []

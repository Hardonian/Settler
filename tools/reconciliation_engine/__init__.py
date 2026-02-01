"""Reconciliation Truth & Proof Engine for Settler.

A deterministic, explainable, and auditable reconciliation system.

Example:
    >>> from reconciliation_engine import ReconciliationEngine
    >>> engine = ReconciliationEngine(
    ...     source_records=stripe_data,
    ...     target_records=shopify_data,
    ...     match_keys=["external_id", "amount", "date"]
    ... )
    >>> result = engine.reconcile()
    >>> print(f"Match rate: {result.match_rate:.2%}")
"""

from reconciliation_engine.engine import (
    InvariantChecker,
    InvariantViolation,
    MatchRule,
    MatchStatus,
    ReconciliationEngine,
    ReconciliationResult,
    Severity,
    TruthTableEntry,
    reconcile,
)

__version__ = "1.0.0"
__all__ = [
    "ReconciliationEngine",
    "ReconciliationResult",
    "TruthTableEntry",
    "MatchStatus",
    "MatchRule",
    "InvariantViolation",
    "InvariantChecker",
    "Severity",
    "reconcile",
]

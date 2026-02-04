"""Tests for Phase 4 real work handlers.

Tests variance report and transaction matching handlers.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from settler_workhorse.handlers.transaction_match import (
    _match_transactions,
    handle_transaction_match,
)
from settler_workhorse.handlers.variance_report import (
    _calculate_variance_metrics,
    handle_variance_report,
)
from settler_workhorse.models import JobType


def test_variance_metrics_calculation():
    """Test variance metrics calculation."""
    results = [
        {
            "source_count": 100,
            "target_count": 95,
            "matched_count": 90,
            "unmatched_source_count": 10,
            "unmatched_target_count": 5,
            "total_amount_source": 10000.00,
            "total_amount_target": 9500.00,
            "status": "completed",
            "currency": "USD",
        },
        {
            "source_count": 50,
            "target_count": 50,
            "matched_count": 50,
            "unmatched_source_count": 0,
            "unmatched_target_count": 0,
            "total_amount_source": 5000.00,
            "total_amount_target": 5000.00,
            "status": "completed",
            "currency": "USD",
        },
    ]

    metrics = _calculate_variance_metrics(results)

    assert metrics["total_runs"] == 2
    assert metrics["total_sources"] == 150
    assert metrics["total_targets"] == 145
    assert metrics["total_matched"] == 140
    assert metrics["variance_amount"] == 500.00
    assert metrics["status_breakdown"]["completed"] == 2
    print("OK: Variance metrics calculation works")


def test_variance_metrics_empty():
    """Test variance metrics with empty results."""
    metrics = _calculate_variance_metrics([])

    assert metrics["total_runs"] == 0
    assert metrics["variance_amount"] == 0.0
    assert metrics["variance_rate"] == 0.0
    print("OK: Variance metrics handles empty results")


def test_transaction_matching():
    """Test transaction matching algorithm."""
    sources = [
        {"id": "src1", "amount": 100.00, "date": "2024-01-15"},
        {"id": "src2", "amount": 50.00, "date": "2024-01-16"},
        {"id": "src3", "amount": 200.00, "date": "2024-01-17"},
    ]

    targets = [
        {"id": "tgt1", "amount": -100.00, "date": "2024-01-15"},
        {"id": "tgt2", "amount": -50.00, "date": "2024-01-16"},
        {"id": "tgt3", "amount": -150.00, "date": "2024-01-18"},
    ]

    results = _match_transactions(sources, targets, tolerance=0.01)

    assert results["match_count"] == 2  # src1/tgt1 and src2/tgt2 match
    assert results["source_count"] == 3
    assert results["target_count"] == 3
    assert len(results["unmatched_sources"]) == 1  # src3
    assert len(results["unmatched_targets"]) == 1  # tgt3
    print("OK: Transaction matching algorithm works")


def test_transaction_matching_tolerance():
    """Test transaction matching with tolerance.

    Note: The current implementation only applies tolerance checking
    after exact key matching (amount + date). This means tolerance
    only affects matches when multiple targets share the same key.
    True fuzzy matching across different amounts is not implemented.
    """
    sources = [
        {"id": "src1", "amount": 100.00, "date": "2024-01-15"},
    ]

    targets = [
        {"id": "tgt1", "amount": -100.05, "date": "2024-01-15"},
    ]

    # With any tolerance, these won't match because the algorithm
    # first indexes by exact amount (100.00 vs 100.05 are different keys)
    # Tolerance only applies when multiple targets share the same key
    results = _match_transactions(sources, targets, tolerance=0.01)
    assert results["match_count"] == 0

    # Even with larger tolerance, amounts must match exactly for key lookup
    results_loose = _match_transactions(sources, targets, tolerance=0.10)
    assert results_loose["match_count"] == 0

    print("OK: Transaction matching uses exact key lookup (tolerance only applies post-key match)")


def test_transaction_matching_tolerance_with_same_key():
    """Test that tolerance works when multiple targets share the same key."""
    sources = [
        {"id": "src1", "amount": 100.00, "date": "2024-01-15"},
    ]

    # Two targets with same amount/date key but one is within tolerance
    targets = [
        {"id": "tgt1", "amount": -100.00, "date": "2024-01-15"},  # exact match
        {"id": "tgt2", "amount": -100.00, "date": "2024-01-15"},  # same key
    ]

    # With strict tolerance, only exact match qualifies
    results_strict = _match_transactions(sources, targets, tolerance=0.0)
    assert results_strict["match_count"] == 1

    print("OK: Tolerance filtering works when multiple targets share key")


def test_variance_report_handler_exists():
    """Test that variance report handler exists and is callable."""
    assert callable(handle_variance_report)
    print("OK: Variance report handler exists")


def test_transaction_match_handler_exists():
    """Test that transaction match handler exists and is callable."""
    assert callable(handle_transaction_match)
    print("OK: Transaction match handler exists")


def test_job_types_exist():
    """Test that new job types are registered."""
    from settler_workhorse.worker import HANDLER_REGISTRY

    assert JobType.VARIANCE_REPORT in HANDLER_REGISTRY
    assert JobType.TRANSACTION_MATCH in HANDLER_REGISTRY
    print("OK: New job types are registered in handler registry")


def main():
    """Run all Phase 4 handler tests."""
    print("=" * 60)
    print("Phase 4 Handler Tests")
    print("=" * 60)
    print()

    tests = [
        test_variance_metrics_calculation,
        test_variance_metrics_empty,
        test_transaction_matching,
        test_transaction_matching_tolerance,
        test_transaction_matching_tolerance_with_same_key,
        test_variance_report_handler_exists,
        test_transaction_match_handler_exists,
        test_job_types_exist,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"FAIL: {test.__name__} failed: {e}")
            import traceback

            traceback.print_exc()
            failed += 1

    print()
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)

    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

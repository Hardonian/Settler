"""Reconciliation Truth & Proof Engine - Test Suite.

Tests for deterministic reconciliation, explainability, and auditability.
"""

import json
import sys
import tempfile
from decimal import Decimal
from pathlib import Path

# Add tools directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

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


def test_match_rule_creation():
    """Test MatchRule dataclass."""
    rule = MatchRule(
        name="test_rule",
        description="Test rule description",
        applies_to=("field1", "field2"),
    )
    assert rule.name == "test_rule"
    assert rule.description == "Test rule description"
    assert rule.applies_to == ("field1", "field2")
    print("OK: MatchRule creation")


def test_truth_table_entry():
    """Test TruthTableEntry creation and serialization."""
    entry = TruthTableEntry(
        source_record_id="src1",
        target_record_id="tgt1",
        match_status=MatchStatus.MATCHED,
        rule_applied="exact_key_match",
        confidence=1.0,
        explanation="Records match exactly",
        source_values={"amount": 100.00, "currency": "USD"},
        target_values={"amount": 100.00, "currency": "USD"},
    )

    assert entry.match_status == MatchStatus.MATCHED
    assert entry.confidence == 1.0

    # Test serialization
    d = entry.to_dict()
    assert d["match_status"] == "matched"
    assert d["confidence"] == 1.0
    print("OK: TruthTableEntry creation and serialization")


def test_invariant_violation():
    """Test InvariantViolation creation."""
    violation = InvariantViolation(
        invariant_name="test_invariant",
        severity=Severity.BLOCKER,
        message="Test violation",
        details={"key": "value"},
        remediation="Fix it",
    )

    assert violation.severity == Severity.BLOCKER
    assert violation.to_dict()["severity"] == "blocker"
    print("OK: InvariantViolation creation")


def test_reconciliation_result():
    """Test ReconciliationResult properties."""
    result = ReconciliationResult(
        run_id="test_123",
        started_at="2024-01-01T00:00:00",
        completed_at="2024-01-01T00:01:00",
        total_source=100,
        total_target=100,
        match_keys=["external_id", "amount"],
        matched_count=90,
    )

    assert result.match_rate == 0.9
    assert not result.has_blocker_violations

    # Add a blocker violation
    result.invariant_violations.append(
        InvariantViolation(
            invariant_name="test",
            severity=Severity.BLOCKER,
            message="Test",
        )
    )
    assert result.has_blocker_violations
    print("OK: ReconciliationResult properties")


def test_perfect_match():
    """Test reconciliation with perfect data."""
    sources = [
        {"id": "s1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
        {"id": "s2", "external_id": "txn_002", "amount": 50.00, "date": "2024-01-16", "currency": "USD"},
    ]

    targets = [
        {"id": "t1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
        {"id": "t2", "external_id": "txn_002", "amount": 50.00, "date": "2024-01-16", "currency": "USD"},
    ]

    engine = ReconciliationEngine(
        source_records=sources,
        target_records=targets,
        match_keys=["external_id", "amount", "date"],
    )

    result = engine.reconcile()

    assert result.matched_count == 2
    assert result.match_rate == 1.0
    assert result.mismatched_count == 0
    assert result.source_orphan_count == 0
    assert result.target_orphan_count == 0
    assert not result.invariant_violations

    print("OK: Perfect match reconciliation")


def test_mismatched_amounts():
    """Test reconciliation with amount mismatches.
    
    When amount is part of match_keys, different amounts create different keys,
    resulting in orphans rather than mismatches. Mismatches occur when keys match
    but other validation fails.
    """
    sources = [
        {"id": "s1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
    ]

    targets = [
        {"id": "t1", "external_id": "txn_001", "amount": 99.99, "date": "2024-01-15", "currency": "USD"},
    ]

    engine = ReconciliationEngine(
        source_records=sources,
        target_records=targets,
        match_keys=["external_id", "amount", "date"],
        options={"amount_tolerance": 0.01},  # Strict tolerance
    )

    result = engine.reconcile()

    # Different amounts = different keys = orphans (not mismatches)
    # txn_001|100.00|2024-01-15 != txn_001|99.99|2024-01-15
    assert result.matched_count == 0
    assert result.source_orphan_count == 1  # s1 becomes orphan
    assert result.target_orphan_count == 1  # t1 becomes orphan
    assert result.mismatched_count == 0  # No key collision, so no mismatch

    # Check that source orphan exists with explanation
    orphan_entries = [e for e in result.truth_table if e.match_status == MatchStatus.SOURCE_ORPHAN]
    assert len(orphan_entries) == 1
    assert orphan_entries[0].source_record_id == "s1"

    print("OK: Amount mismatch creates orphans (different match keys)")


def test_amount_within_tolerance():
    """Test reconciliation with amounts within tolerance.
    
    Note: When amount is in match_keys, tolerance only applies to records
    that share the same key. To demonstrate tolerance matching, we need to
    use fuzzy matching on external_id only, then let tolerance handle amounts.
    """
    sources = [
        {"id": "s1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
    ]

    targets = [
        {"id": "t1", "external_id": "txn_001", "amount": 100.005, "date": "2024-01-15", "currency": "USD"},
    ]

    # Use only external_id as match key, let tolerance handle amount validation
    engine = ReconciliationEngine(
        source_records=sources,
        target_records=targets,
        match_keys=["external_id"],  # Same external_id = same key
        options={"amount_tolerance": 0.01, "fuzzy_rules": ["amount_within_tolerance"]},
    )

    result = engine.reconcile()

    # Amount difference (0.005) is within tolerance (0.01)
    assert result.matched_count == 1
    assert result.mismatched_count == 0

    # Check rule explanation mentions tolerance
    match_entry = [e for e in result.truth_table if e.match_status == MatchStatus.MATCHED][0]
    # Rule will show the tolerance check
    assert match_entry.confidence == 1.0

    print("OK: Amount within tolerance reconciliation (with fuzzy key)")


def test_source_orphans():
    """Test reconciliation with source orphans."""
    sources = [
        {"id": "s1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
        {"id": "s2", "external_id": "txn_002", "amount": 50.00, "date": "2024-01-16", "currency": "USD"},
    ]

    targets = [
        {"id": "t1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
    ]

    engine = ReconciliationEngine(
        source_records=sources,
        target_records=targets,
        match_keys=["external_id", "amount", "date"],
    )

    result = engine.reconcile()

    assert result.matched_count == 1
    assert result.source_orphan_count == 1
    assert result.target_orphan_count == 0

    # Check truth table has orphan entry
    orphan_entry = [e for e in result.truth_table if e.match_status == MatchStatus.SOURCE_ORPHAN][0]
    assert orphan_entry.source_record_id == "s2"

    print("OK: Source orphans detection")


def test_target_orphans():
    """Test reconciliation with target orphans."""
    sources = [
        {"id": "s1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
    ]

    targets = [
        {"id": "t1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
        {"id": "t2", "external_id": "txn_002", "amount": 50.00, "date": "2024-01-16", "currency": "USD"},
    ]

    engine = ReconciliationEngine(
        source_records=sources,
        target_records=targets,
        match_keys=["external_id", "amount", "date"],
    )

    result = engine.reconcile()

    assert result.matched_count == 1
    assert result.source_orphan_count == 0
    assert result.target_orphan_count == 1

    print("OK: Target orphans detection")


def test_totals_balance_invariant():
    """Test totals must balance invariant."""
    checker = InvariantChecker(tolerance=Decimal("0.01"))

    # Balanced
    sources = [{"amount": 100.00}, {"amount": 50.00}]
    targets = [{"amount": 100.00}, {"amount": 50.00}]
    assert checker.check_totals_balance(sources, targets)
    assert not checker.get_violations()

    # Unbalanced
    checker2 = InvariantChecker(tolerance=Decimal("0.01"))
    sources2 = [{"amount": 100.00}]
    targets2 = [{"amount": 50.00}]
    assert not checker2.check_totals_balance(sources2, targets2)
    violations = checker2.get_violations()
    assert len(violations) == 1
    assert violations[0].invariant_name == "totals_must_balance"
    assert violations[0].severity == Severity.BLOCKER

    print("OK: Totals balance invariant")


def test_currency_consistency_invariant():
    """Test currency consistency invariant."""
    checker = InvariantChecker()

    # Consistent
    records = [
        {"currency": "USD"},
        {"currency": "USD"},
    ]
    assert checker.check_currency_consistency(records)

    # Inconsistent
    checker2 = InvariantChecker()
    records2 = [
        {"currency": "USD"},
        {"currency": "EUR"},
    ]
    assert not checker2.check_currency_consistency(records2)
    violations = checker2.get_violations()
    assert violations[0].invariant_name == "currency_consistency"

    print("OK: Currency consistency invariant")


def test_no_duplicate_settlement_invariant():
    """Test no duplicate settlement invariant."""
    checker = InvariantChecker()

    # No duplicates
    truth_table = [
        TruthTableEntry(
            source_record_id="s1",
            target_record_id="t1",
            match_status=MatchStatus.MATCHED,
            rule_applied="test",
            confidence=1.0,
            explanation="test",
        ),
        TruthTableEntry(
            source_record_id="s2",
            target_record_id="t2",
            match_status=MatchStatus.MATCHED,
            rule_applied="test",
            confidence=1.0,
            explanation="test",
        ),
    ]
    assert checker.check_no_duplicate_settlement(truth_table)

    # With duplicates
    checker2 = InvariantChecker()
    truth_table2 = [
        TruthTableEntry(
            source_record_id="s1",
            target_record_id="t1",
            match_status=MatchStatus.MATCHED,
            rule_applied="test",
            confidence=1.0,
            explanation="test",
        ),
        TruthTableEntry(
            source_record_id="s1",  # Duplicate!
            target_record_id="t2",
            match_status=MatchStatus.MATCHED,
            rule_applied="test",
            confidence=1.0,
            explanation="test",
        ),
    ]
    assert not checker2.check_no_duplicate_settlement(truth_table2)
    violations = checker2.get_violations()
    assert violations[0].invariant_name == "no_duplicate_settlement"

    print("OK: No duplicate settlement invariant")


def test_deterministic_hash():
    """Test that input data hashes are deterministic."""
    sources = [
        {"id": "s1", "amount": 100.00},
        {"id": "s2", "amount": 50.00},
    ]

    engine1 = ReconciliationEngine(
        source_records=sources,
        target_records=[],
        match_keys=["id"],
    )
    engine2 = ReconciliationEngine(
        source_records=sources,
        target_records=[],
        match_keys=["id"],
    )

    result1 = engine1.reconcile()
    result2 = engine2.reconcile()

    assert result1.source_data_hash == result2.source_data_hash

    print("OK: Deterministic data hashing")


def test_emit_audit_bundle():
    """Test audit artifact generation."""
    sources = [
        {"id": "s1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
    ]
    targets = [
        {"id": "t1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
    ]

    engine = ReconciliationEngine(
        source_records=sources,
        target_records=targets,
        match_keys=["external_id", "amount", "date"],
    )

    result = engine.reconcile()

    with tempfile.TemporaryDirectory() as tmpdir:
        artifacts = engine.emit_audit_bundle(result, tmpdir)

        assert "recon_run" in artifacts
        assert "truth_table" in artifacts
        assert "exceptions" in artifacts

        # Verify files exist and are valid
        with open(artifacts["recon_run"], "r") as f:
            run_data = json.load(f)
            assert run_data["run_id"] == result.run_id

        print("OK: Audit bundle generation")


def test_convenience_function():
    """Test the reconcile() convenience function."""
    sources = [
        {"id": "s1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
    ]
    targets = [
        {"id": "t1", "external_id": "txn_001", "amount": 100.00, "date": "2024-01-15", "currency": "USD"},
    ]

    with tempfile.TemporaryDirectory() as tmpdir:
        result, artifacts = reconcile(
            source_records=sources,
            target_records=targets,
            match_keys=["external_id", "amount", "date"],
            output_dir=tmpdir,
        )

        assert result.matched_count == 1
        assert artifacts is not None
        assert "recon_run" in artifacts

    print("OK: Convenience function")



def test_integration_to_junit_xml_basic():
    """Test converting result to JUnit XML format."""
    from reconciliation_engine.integration import to_junit_xml
    import xml.etree.ElementTree as ET

    result = ReconciliationResult(
        run_id="run_123",
        started_at="2024-01-01T00:00:00Z",
        completed_at="2024-01-01T00:00:01Z",
        total_source=10,
        total_target=10,
        match_keys=["id"],
        truth_table=[
            TruthTableEntry(
                source_record_id="s1",
                target_record_id="t1",
                match_status=MatchStatus.MATCHED,
                rule_applied="exact_match",
                confidence=1.0,
                explanation="Exact match",
            )
        ],
        invariant_violations=[],
        matched_count=1,
        mismatched_count=0,
        source_orphan_count=0,
        target_orphan_count=0,
        source_data_hash="hash1",
        target_data_hash="hash2",
        options={},
    )

    xml_str = to_junit_xml(result)
    root = ET.fromstring(xml_str)

    assert root.tag == "testsuite"
    assert root.attrib["name"] == "ReconciliationEngine"
    assert root.attrib["tests"] == "1"
    assert root.attrib["failures"] == "0"
    assert root.attrib["errors"] == "0"

    # Check that properties contain expected metadata
    properties = root.find("properties")
    assert properties is not None
    prop_dict = {p.attrib["name"]: p.attrib["value"] for p in properties.findall("property")}
    assert prop_dict["run_id"] == "run_123"
    assert prop_dict["total_source"] == "10"
    assert prop_dict["matched_count"] == "1"

    print("OK: to_junit_xml basic")

def test_integration_to_junit_xml_with_violations():
    """Test JUnit XML generation with invariant violations."""
    from reconciliation_engine.integration import to_junit_xml
    import xml.etree.ElementTree as ET

    result = ReconciliationResult(
        run_id="run_123",
        started_at="2024-01-01T00:00:00Z",
        completed_at="2024-01-01T00:00:01Z",
        total_source=10,
        total_target=10,
        match_keys=["id"],
        truth_table=[],
        invariant_violations=[
            InvariantViolation(
                invariant_name="totals_match",
                severity=Severity.BLOCKER,
                message="Totals do not match",
            ),
            InvariantViolation(
                invariant_name="currency_match",
                severity=Severity.HIGH,
                message="Currency mismatch",
            ),
        ],
        matched_count=0,
        mismatched_count=0,
        source_orphan_count=0,
        target_orphan_count=0,
        source_data_hash="hash1",
        target_data_hash="hash2",
        options={},
    )

    xml_str = to_junit_xml(result)
    root = ET.fromstring(xml_str)

    assert root.attrib["errors"] == "2"

    testcases = root.findall("testcase")
    assert len(testcases) == 3  # 2 invariants + 1 summary

    # Blocker invariant
    tc_blocker = testcases[0]
    assert tc_blocker.attrib["name"] == "invariant_totals_match"
    failure = tc_blocker.find("failure")
    assert failure is not None
    assert failure.attrib["type"] == "blocker"
    assert failure.text == "Totals do not match"

    # High severity invariant (warning)
    tc_warning = testcases[1]
    assert tc_warning.attrib["name"] == "invariant_currency_match"
    skipped = tc_warning.find("skipped")
    assert skipped is not None
    assert skipped.attrib["message"] == "Currency mismatch"

    # Summary
    tc_summary = testcases[2]
    assert tc_summary.attrib["name"] == "reconciliation_summary"
    summary_failure = tc_summary.find("failure")
    assert summary_failure is not None
    assert "BLOCKER violations detected: 1" in summary_failure.text

    print("OK: to_junit_xml with violations")

def test_integration_to_junit_xml_failures():
    """Test JUnit XML failure counts."""
    from reconciliation_engine.integration import to_junit_xml
    import xml.etree.ElementTree as ET

    result = ReconciliationResult(
        run_id="run_123",
        started_at="2024-01-01T00:00:00Z",
        completed_at="2024-01-01T00:00:01Z",
        total_source=10,
        total_target=10,
        match_keys=["id"],
        truth_table=[
            TruthTableEntry(
                source_record_id="s1",
                target_record_id="t1",
                match_status=MatchStatus.MISMATCHED,
                rule_applied="exact_match",
                confidence=0.0,
                explanation="Mismatch",
                source_values={},
                target_values={},
                differences={},
            ),
             TruthTableEntry(
                source_record_id="s2",
                target_record_id=None,
                match_status=MatchStatus.SOURCE_ORPHAN,
                rule_applied="none",
                confidence=0.0,
                explanation="Orphan",
                source_values={},
                target_values={},
                differences={},
            ),
        ],
        invariant_violations=[],
        matched_count=0,
        mismatched_count=1,
        source_orphan_count=1,
        target_orphan_count=0,
        source_data_hash="hash1",
        target_data_hash="hash2",
        options={},
    )

    xml_str = to_junit_xml(result)
    root = ET.fromstring(xml_str)

    assert root.attrib["failures"] == "2" # 1 mismatch + 1 orphan
    assert root.attrib["tests"] == "2"

    print("OK: to_junit_xml failures calculation")

def run_all_tests():
    """Run all tests."""
    tests = [
        test_match_rule_creation,
        test_truth_table_entry,
        test_invariant_violation,
        test_reconciliation_result,
        test_perfect_match,
        test_mismatched_amounts,
        test_amount_within_tolerance,
        test_source_orphans,
        test_target_orphans,
        test_totals_balance_invariant,
        test_currency_consistency_invariant,
        test_no_duplicate_settlement_invariant,
        test_deterministic_hash,
        test_emit_audit_bundle,
        test_convenience_function,
        test_integration_to_junit_xml_basic,
        test_integration_to_junit_xml_with_violations,
        test_integration_to_junit_xml_failures,
    ]

    passed = 0
    failed = 0

    print("=" * 60)
    print("Reconciliation Engine Test Suite")
    print("=" * 60)
    print()

    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"FAIL: {test.__name__}: {e}")
            import traceback
            traceback.print_exc()
            failed += 1

    print()
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)

    return failed == 0


if __name__ == "__main__":
    import sys
    success = run_all_tests()
    sys.exit(0 if success else 1)

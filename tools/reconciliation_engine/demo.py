"""Demo script showing successful reconciliation, forced mismatch, and explanations.

This demonstrates the Reconciliation Truth & Proof Engine capabilities:
1. Successful reconciliation with full audit trail
2. Forced mismatch scenario with clear explanations
3. Invariant violation detection
"""

import json
import sys
import tempfile
from pathlib import Path

# Add tools directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from reconciliation_engine.engine import ReconciliationEngine, reconcile
from reconciliation_engine.integration import (
    emit_readylayer_report,
    to_readylayer_format,
)


def demo_successful_reconciliation():
    """Demo 1: Perfect reconciliation with full audit trail."""
    print("\n" + "=" * 70)
    print("DEMO 1: Successful Reconciliation")
    print("=" * 70)

    # Sample Stripe transactions (sources)
    stripe_data = [
        {
            "id": "stripe_001",
            "external_id": "pi_3O1234567890",
            "amount": 100.00,
            "currency": "USD",
            "date": "2024-01-15",
            "description": "Payment for Invoice #1234",
        },
        {
            "id": "stripe_002",
            "external_id": "pi_3O0987654321",
            "amount": 250.00,
            "currency": "USD",
            "date": "2024-01-16",
            "description": "Payment for Invoice #1235",
        },
        {
            "id": "stripe_003",
            "external_id": "pi_3O5555555555",
            "amount": 75.50,
            "currency": "USD",
            "date": "2024-01-17",
            "description": "Payment for Invoice #1236",
        },
    ]

    # Sample Shopify transactions (targets)
    shopify_data = [
        {
            "id": "shopify_001",
            "external_id": "pi_3O1234567890",
            "amount": 100.00,
            "currency": "USD",
            "date": "2024-01-15",
            "description": "Order #1001",
        },
        {
            "id": "shopify_002",
            "external_id": "pi_3O0987654321",
            "amount": 250.00,
            "currency": "USD",
            "date": "2024-01-16",
            "description": "Order #1002",
        },
        {
            "id": "shopify_003",
            "external_id": "pi_3O5555555555",
            "amount": 75.50,
            "currency": "USD",
            "date": "2024-01-17",
            "description": "Order #1003",
        },
    ]

    print(f"Source records: {len(stripe_data)}")
    print(f"Target records: {len(shopify_data)}")
    print(f"Match keys: external_id, amount, date")

    # Run reconciliation
    engine = ReconciliationEngine(
        source_records=stripe_data,
        target_records=shopify_data,
        match_keys=["external_id", "amount", "date"],
        options={"amount_tolerance": 0.01},
    )

    result = engine.reconcile()

    print(f"\n[OK] Reconciliation Complete: {result.run_id}")
    print(f"   Match Rate: {result.match_rate:.2%}")
    print(f"   Matched: {result.matched_count}")
    print(f"   Mismatched: {result.mismatched_count}")
    print(f"   Orphans: {result.source_orphan_count} source, {result.target_orphan_count} target")

    if result.invariant_violations:
        print(f"\n   [WARN]  Invariant Violations: {len(result.invariant_violations)}")
        for v in result.invariant_violations:
            print(f"      - {v.invariant_name}: {v.message}")
    else:
        print(f"\n   [OK] No invariant violations")

    # Show sample truth table entries
    print(f"\n   Sample Truth Table Entries:")
    for i, entry in enumerate(result.truth_table[:2]):
        print(f"      Entry {i+1}:")
        print(f"        - Status: {entry.match_status.value}")
        print(f"        - Rule: {entry.rule_applied}")
        print(f"        - Explanation: {entry.explanation}")

    return result


def demo_forced_mismatch():
    """Demo 2: Forced mismatch with clear explanation."""
    print("\n" + "=" * 70)
    print("DEMO 2: Forced Mismatch (Amount Discrepancy)")
    print("=" * 70)

    # Source has one amount that doesn't match
    stripe_data = [
        {
            "id": "stripe_m1",
            "external_id": "pi_mismatch_001",
            "amount": 100.00,
            "currency": "USD",
            "date": "2024-01-15",
        },
    ]

    # Target has different amount for same transaction
    shopify_data = [
        {
            "id": "shopify_m1",
            "external_id": "pi_mismatch_001",
            "amount": 99.00,  # DISCREPANCY!
            "currency": "USD",
            "date": "2024-01-15",
        },
    ]

    print(f"Source: external_id=pi_mismatch_001, amount=100.00")
    print(f"Target: external_id=pi_mismatch_001, amount=99.00 (DISCREPANCY)")
    print(f"Tolerance: 0.01")

    engine = ReconciliationEngine(
        source_records=stripe_data,
        target_records=shopify_data,
        match_keys=["external_id"],  # Only match on external_id, let tolerance handle amount
        options={"amount_tolerance": 0.01},
    )

    result = engine.reconcile()

    print(f"\n[FAIL] Reconciliation Failed to Match")
    print(f"   Match Rate: {result.match_rate:.2%}")
    print(f"   Mismatched: {result.mismatched_count}")
    print(f"   Source Orphans: {result.source_orphan_count}")
    print(f"   Target Orphans: {result.target_orphan_count}")

    # Show the detailed explanation - look for mismatches or orphans
    if result.mismatched_count > 0:
        entry = [e for e in result.truth_table if e.match_status.value == "mismatched"][0]
        entry_type = "MISMATCH"
    elif result.source_orphan_count > 0:
        entry = [e for e in result.truth_table if e.match_status.value == "source_orphan"][0]
        entry_type = "ORPHAN"
    else:
        entry = result.truth_table[0] if result.truth_table else None
        entry_type = "OTHER"

    if entry:
        print(f"\n   [INFO] Explanation ({entry_type}):")
        print(f"      - Source Record: {entry.source_record_id}")
        print(f"      - Target Record: {entry.target_record_id}")
        if entry_type == "MISMATCH":
            print(f"      - Match Key: external_id matched (pi_mismatch_001)")
            print(f"      - Failure: Amount difference exceeds tolerance")
        else:
            print(f"      - Match Key: Different amounts created different keys")
            print(f"      - Result: Orphan (no match found)")
        print(f"      - Rule Applied: {entry.rule_applied}")

    return result


def demo_invariant_violations():
    """Demo 3: Invariant violation detection."""
    print("\n" + "=" * 70)
    print("DEMO 3: Invariant Violation Detection")
    print("=" * 70)

    # Currency mismatch scenario
    stripe_data = [
        {"id": "s1", "external_id": "txn_001", "amount": 100.00, "currency": "USD", "date": "2024-01-15"},
        {"id": "s2", "external_id": "txn_002", "amount": 50.00, "currency": "EUR", "date": "2024-01-16"},  # EUR!
    ]

    shopify_data = [
        {"id": "t1", "external_id": "txn_001", "amount": 100.00, "currency": "USD", "date": "2024-01-15"},
        {"id": "t2", "external_id": "txn_002", "amount": 50.00, "currency": "EUR", "date": "2024-01-16"},  # EUR!
    ]

    print("Scenario 1: Currency Consistency (Multiple Currencies)")
    print(f"   Source: USD, EUR")
    print(f"   Target: USD, EUR")

    engine = ReconciliationEngine(
        source_records=stripe_data,
        target_records=shopify_data,
        match_keys=["external_id", "amount", "date"],
    )

    result = engine.reconcile()

    print(f"\n   Invariant Violations Detected:")
    for v in result.invariant_violations:
        severity_emoji = "[BLOCKER]" if v.severity.value == "blocker" else "[HIGH]"
        print(f"   {severity_emoji} {v.invariant_name} ({v.severity.value})")
        print(f"      Message: {v.message}")
        if v.remediation:
            print(f"      Remediation: {v.remediation}")

    # Totals imbalance scenario
    print("\n   ---")
    print("\nScenario 2: Totals Imbalance")

    stripe_imbalanced = [
        {"id": "s1", "external_id": "txn_001", "amount": 1000.00, "currency": "USD", "date": "2024-01-15"},
    ]

    shopify_imbalanced = [
        {"id": "t1", "external_id": "txn_001", "amount": 900.00, "currency": "USD", "date": "2024-01-15"},  # $100 short!
    ]

    print(f"   Source Total: $1000.00")
    print(f"   Target Total: $900.00")

    engine2 = ReconciliationEngine(
        source_records=stripe_imbalanced,
        target_records=shopify_imbalanced,
        match_keys=["external_id", "amount", "date"],
    )

    result2 = engine2.reconcile()

    for v in result2.invariant_violations:
        if v.invariant_name == "totals_must_balance":
            severity_emoji = "[BLOCKER]"
            print(f"\n   {severity_emoji} {v.invariant_name} ({v.severity.value})")
            print(f"      Message: {v.message}")
            print(f"      Details: {v.details}")

    return result, result2


def demo_audit_artifacts():
    """Demo 4: Full audit bundle generation."""
    print("\n" + "=" * 70)
    print("DEMO 4: Audit Bundle Generation")
    print("=" * 70)

    # Sample data with mixed results
    sources = [
        {"id": "s1", "external_id": "txn_001", "amount": 100.00, "currency": "USD", "date": "2024-01-15"},
        {"id": "s2", "external_id": "txn_002", "amount": 50.00, "currency": "USD", "date": "2024-01-16"},
        {"id": "s3", "external_id": "txn_003", "amount": 75.00, "currency": "USD", "date": "2024-01-17"},  # Orphan
    ]

    targets = [
        {"id": "t1", "external_id": "txn_001", "amount": 100.00, "currency": "USD", "date": "2024-01-15"},
        {"id": "t2", "external_id": "txn_002", "amount": 50.00, "currency": "USD", "date": "2024-01-16"},
        {"id": "t4", "external_id": "txn_004", "amount": 25.00, "currency": "USD", "date": "2024-01-18"},  # Orphan
    ]

    print(f"Source records: 3 (1 orphan)")
    print(f"Target records: 3 (1 orphan)")

    engine = ReconciliationEngine(
        source_records=sources,
        target_records=targets,
        match_keys=["external_id", "amount", "date"],
    )

    result = engine.reconcile()

    # Generate audit bundle
    with tempfile.TemporaryDirectory() as tmpdir:
        artifacts = engine.emit_audit_bundle(result, tmpdir)

        print(f"\n   Generated Audit Artifacts:")
        for name, path in artifacts.items():
            size = Path(path).stat().st_size
            print(f"      [FILE] {name}: {path}")
            print(f"         Size: {size} bytes")

        # Show recon_run.json sample
        with open(artifacts["recon_run"], "r") as f:
            run_data = json.load(f)
            print(f"\n   recon_run.json preview:")
            print(f"      - Run ID: {run_data['run_id']}")
            print(f"      - Source Hash: {run_data['source_data_hash']}")
            print(f"      - Target Hash: {run_data['target_data_hash']}")
            print(f"      - Match Rate: {run_data['match_rate']:.2%}")

        # Show exceptions.md preview
        with open(artifacts["exceptions"], "r") as f:
            content = f.read()
            print(f"\n   recon_exceptions.md preview:")
            lines = content.split("\n")[:15]
            for line in lines:
                print(f"      {line}")
            print(f"      ...")

    return result, artifacts


def demo_integration():
    """Demo 5: ReadyLayer integration."""
    print("\n" + "=" * 70)
    print("DEMO 5: ReadyLayer Integration")
    print("=" * 70)

    # Create scenario with both success and issues
    sources = [
        {"id": "s1", "external_id": "txn_001", "amount": 100.00, "currency": "USD", "date": "2024-01-15"},
        {"id": "s2", "external_id": "txn_002", "amount": 50.00, "currency": "USD", "date": "2024-01-16"},
    ]

    targets = [
        {"id": "t1", "external_id": "txn_001", "amount": 100.00, "currency": "USD", "date": "2024-01-15"},
        {"id": "t2", "external_id": "txn_002", "amount": 50.00, "currency": "USD", "date": "2024-01-16"},
    ]

    engine = ReconciliationEngine(
        source_records=sources,
        target_records=targets,
        match_keys=["external_id", "amount", "date"],
    )

    result = engine.reconcile()

    # Convert to ReadyLayer format
    readylayer = to_readylayer_format(result)

    print(f"\n   ReadyLayer Format Output:")
    print(f"      Component: {readylayer['component']}")
    print(f"      Status: {readylayer['status']}")
    print(f"      Checks: {len(readylayer['checks'])}")

    for check in readylayer['checks']:
        emoji = "[OK]" if check['status'] == 'pass' else "[WARN]" if check['status'] == 'warn' else "[FAIL]"
        print(f"      {emoji} {check['name']}: {check['status']} ({check['message']})")

    # Generate full integration reports
    with tempfile.TemporaryDirectory() as tmpdir:
        reports = emit_readylayer_report(result, tmpdir, formats=["readylayer", "github", "junit"])

        print(f"\n   Generated Integration Reports:")
        for name, path in reports.items():
            print(f"      [FILE] {name}: {path}")

    return result, readylayer


def main():
    """Run all demos."""
    print("\n" + "=" * 70)
    print("RECONCILIATION TRUTH & PROOF ENGINE - DEMONSTRATION")
    print("=" * 70)
    print("\nThis demo showcases:")
    print("  1. Successful reconciliation with full audit trail")
    print("  2. Forced mismatch scenario with clear explanations")
    print("  3. Invariant violation detection (BLOCKER/HIGH)")
    print("  4. Audit bundle generation (JSON, CSV, Markdown)")
    print("  5. ReadyLayer CI/CD integration")

    # Run all demos
    demo_successful_reconciliation()
    demo_forced_mismatch()
    demo_invariant_violations()
    demo_audit_artifacts()
    demo_integration()

    print("\n" + "=" * 70)
    print("DEMONSTRATION COMPLETE")
    print("=" * 70)
    print("\nThe Reconciliation Truth & Proof Engine provides:")
    print("  [+] Deterministic, reproducible results")
    print("  [+] Complete explainability for every match decision")
    print("  [+] Audit-grade artifacts (JSON, CSV, Markdown)")
    print("  [+] Invariant enforcement with BLOCKER/HIGH severity")
    print("  [+] CI/CD integration via ReadyLayer format")
    print("\nAll reconciliation outputs are human-readable and machine-verifiable.")


if __name__ == "__main__":
    main()

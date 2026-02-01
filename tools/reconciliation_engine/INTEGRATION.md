# Reconciliation Engine Integration Guide

## Overview

The Reconciliation Truth & Proof Engine provides deterministic, explainable reconciliation with full audit trails. It integrates seamlessly with the existing Settler workhorse system.

## Integration Points

### 1. As a Drop-in Replacement for Existing Reconciliation

```python
from settler_workhorse.handlers.recon_run import reconcile_datasets  # Old
from reconciliation_engine import reconcile  # New

# Old way
result = reconcile_datasets(sources, targets, keys, options)

# New way - with audit trail
result, artifacts = reconcile(
    source_records=sources,
    target_records=targets,
    match_keys=keys,
    options=options,
    output_dir="./audit_output"
)
```

### 2. Integration with Job Handlers

Replace the existing `recon_run.py` handler:

```python
from reconciliation_engine import ReconciliationEngine

@register_handler(JobType.RECON_RUN)
def handle_recon_run(job: Job) -> JobResult:
    engine = ReconciliationEngine(
        source_records=payload["source_data"],
        target_records=payload["target_data"],
        match_keys=payload["match_keys"],
        options=payload.get("options", {})
    )

    result = engine.reconcile()

    # Emit audit artifacts
    artifacts = engine.emit_audit_bundle(result, job.output_path)

    # Check for blocker violations
    if result.has_blocker_violations:
        return JobResult(
            success=False,
            error=f"BLOCKER violations: {[v.message for v in result.invariant_violations]}",
            ...
        )

    return JobResult(success=True, ...)
```

### 3. CI/CD Integration

The engine emits ReadyLayer-compatible reports:

```python
from reconciliation_engine.integration import emit_readylayer_report

# After reconciliation
reports = emit_readylayer_report(
    result,
    output_path="./ci_reports",
    formats=["readylayer", "github", "junit"]
)
```

GitHub Actions workflow:

```yaml
- name: Reconcile
  run: |
    python -m reconciliation_engine.cli \
      --source stripe.json \
      --target shopify.json \
      --keys external_id amount date \
      --output ./audit \
      --ci-mode

- name: Check for violations
  if: failure()
  run: |
    echo "BLOCKER violations detected - check recon_exceptions.md"
```

### 4. Database Integration

Store truth table in `reconciliation_matches`:

```python
# In transaction_match handler
for entry in result.truth_table:
    if entry.match_status == MatchStatus.MATCHED:
        cur.execute("""
            INSERT INTO reconciliation_matches (
                run_id, source_transaction_id, target_transaction_id,
                match_type, confidence, match_reason, ...
            ) VALUES (...)
        """, {
            "run_id": run_id,
            "source_transaction_id": entry.source_record_id,
            "target_transaction_id": entry.target_record_id,
            "match_type": entry.rule_applied,
            "confidence": entry.confidence,
            "match_reason": entry.explanation,
        })
```

## Invariants

The engine enforces four key invariants:

1. **totals_must_balance** (BLOCKER): Sum of source amounts must equal sum of target amounts
2. **currency_consistency** (BLOCKER): All records must use the same currency
3. **no_orphaned_transactions** (HIGH): Every transaction should have a match
4. **no_duplicate_settlement** (BLOCKER): No transaction matched more than once

## Exit Codes

- `0`: Success, no invariant violations
- `1`: Success with warnings or non-blocker violations
- `2`: BLOCKER violations (CI should fail)
- `3`: File not found
- `4`: JSON parse error
- `5`: Other error

## Artifact Format

### recon_run.json

```json
{
  "run_id": "recon_20240115_120000_a1b2c3d4",
  "started_at": "2024-01-15T12:00:00",
  "completed_at": "2024-01-15T12:00:01",
  "total_source": 100,
  "total_target": 100,
  "matched_count": 95,
  "match_rate": 0.95,
  "invariant_violations": [],
  "truth_table": [...]
}
```

### recon_truth_table.csv

| source_record_id | target_record_id | match_status  | rule_applied    | confidence | explanation                                                                                 |
| ---------------- | ---------------- | ------------- | --------------- | ---------- | ------------------------------------------------------------------------------------------- |
| stripe_001       | shopify_001      | matched       | exact_key_match | 1.0        | Records matched using rule: external_id_exact_match + amount_exact_match + date_exact_match |
| stripe_002       | null             | source_orphan | none            | 0.0        | No target records found with key: pi_3O0987654321\|250.00\|2024-01-16                       |

### recon_exceptions.md

Human-readable markdown report with:

- Summary statistics
- Invariant violations (with severity icons)
- Detailed exception lists
- Remediation guidance

### policy_violations.json

Structured JSON for automated processing:

```json
[
  {
    "invariant_name": "totals_must_balance",
    "severity": "blocker",
    "message": "Source total (1000.00) does not match target total (900.00)",
    "details": { "difference": 100.0 },
    "remediation": "Review unmatched transactions"
  }
]
```

## Migration Path

### Phase 1: Parallel Operation

Run both old and new reconciliation, compare results:

```python
old_result = old_reconcile(sources, targets, keys)
new_result, _ = reconcile(sources, targets, keys)

assert old_result["matched"] == new_result.matched_count
```

### Phase 2: Gradual Cutover

Use feature flag to control rollout:

```python
if feature_flags.get("use_truth_engine", False):
    result, artifacts = reconcile(...)
else:
    result = old_reconcile(...)
```

### Phase 3: Full Replacement

Remove old reconciliation code, use engine exclusively.

## Testing

Run the test suite:

```bash
cd tools/reconciliation_engine
python test_engine.py
```

Run the demo:

```bash
python demo.py
```

## CLI Usage

Basic reconciliation:

```bash
python -m reconciliation_engine.cli \
  --source examples/stripe_transactions.json \
  --target examples/shopify_transactions.json \
  --keys external_id amount date \
  --output ./audit
```

With tolerance and date flexibility:

```bash
python -m reconciliation_engine.cli \
  --source sources.json \
  --target targets.json \
  --keys external_id amount \
  --tolerance 0.05 \
  --date-tolerance 1 \
  --output ./audit
```

CI mode (fails on BLOCKER):

```bash
python -m reconciliation_engine.cli \
  --source sources.json \
  --target targets.json \
  --keys external_id \
  --ci-mode \
  --quiet
```

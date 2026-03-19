# What Works Today

**Last Updated:** 2026-03-19  
**Purpose:** Operator-facing reference for workflows that are live in the current console.

---

## Core Operating Model

Settler currently operates as a tenant-scoped reconciliation control plane with three primary entities:

- **Run definition (`recon_job`)**: Configuration for source/target adapters, strategy, and rules.
- **Persisted result (`recon_result`)**: Latest evaluated outcome for that run definition.
- **Exception (`drift_event`)**: Operator decision item derived from reconciliation outcomes.

Additional provenance fields are available when captured:

- **Run snapshot (`run_snapshot`)**: Snapshot-backed configuration and rule-version context.

---

## Functional Workflows

### 1. Run Monitoring and Execution History

**Status:** ✅ Functional  
**Primary route:** `/console/runs`

Supported today:

- Tenant-scoped run list with canonical execution states
- Run detail view with progress, summary counts, and stage timeline
- Result provenance context (latest result + prior-result comparison)

---

### 2. Reconciliation Result Inspection

**Status:** ✅ Functional  
**Primary route:** `/console/reconciliations?runId=<run-id>`

Supported today:

- Run-scoped result inspection for completed runs
- Matched/unmatched/conflict outcome framing
- Cross-linking back to run detail and exception queue

---

### 3. Exception Decision Workflow

**Status:** ✅ Functional  
**Primary routes:** `/console/exceptions`, `/console/exceptions/<exception-id>`

Supported today:

- Run-scoped exception queues
- Workflow states: `pending`, `investigating`, `resolved`, `ignored`
- Operator actions: resolve, ignore, reopen
- Decision detail and audit trail history

---

### 4. Effective Configuration Visibility

**Status:** ✅ Functional  
**Primary route:** `/console/runs/<run-id>`

Supported today:

- Snapshot-backed vs live-definition configuration source disclosure
- Recorded rule coverage and rule-version lock visibility (when snapshot data exists)
- Explicit note when configuration falls back to current run definition

---

## Verification Checklist

Use this quick sequence after `pnpm dev`:

1. Open `/console/runs` and confirm run history loads.
2. Open any run detail and confirm:
   - `Result Provenance` section is present,
   - `Effective Configuration` shows snapshot/live source,
   - `Exception Workflow` counts are visible.
3. Open `/console/exceptions?runId=<run-id>` and verify status filters (`pending`, `investigating`, `resolved`, `ignored`) return expected records.
4. Open `/console/reconciliations?runId=<run-id>` and confirm result inspection surface renders for that run.

---

## Notes on Scope

- This document lists currently operational console workflows only.
- See [Intentional Boundaries](./INTENTIONAL_BOUNDARIES.md) for intentionally incomplete areas.

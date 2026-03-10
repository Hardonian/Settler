# Settler Operator Demo Guide

This guide walks an operator through a reproducible end-to-end demo.

## Command

```bash
pnpm demo:settler
```

## What the demo pipeline does

1. **Load dataset**
   - Seeds deterministic Stripe + QuickBooks records into `examples/demo-data/dataset.json`.
2. **Execute reconciliation**
   - Runs the deterministic reconciliation demo and writes artifacts to `examples/demo-output/`.
3. **Trigger anomaly**
   - Evaluates run quality and emits anomaly events (match-rate drop + synthetic API error spike).
4. **Show alert**
   - Prints the live alert feed to the terminal.
5. **Inspect run**
   - Prints run id, records processed, and match rate for operator review.
6. **Replay run**
   - Replays the evidence file and verifies deterministic replay integrity.

The pipeline writes a structured summary to:

- `examples/demo-output/operator-demo-artifacts.json`

## Operator UX walkthrough

After running the command, start the web app and open:

- `/console/operator`

Use the page to demonstrate:

- **Operator dashboard** for system health, recent runs, manual review pressure, error spikes, and alert history.
- **Run explorer** with tenant/status filtering and pagination.
- **Real-time alert stream** (auto-refresh every 15 seconds) for:
  - reconciliation failure elevations,
  - match-rate drops,
  - API error spikes.

## Verification expectations

A successful demo shows:

- `Replay Verified: OK` in the terminal.
- Alert lines printed during the demo pipeline.
- `operator-demo-artifacts.json` containing step evidence and alerts.

## Failure handling

- If replay fails, the command exits non-zero and should be treated as a launch blocker.
- If web data is partially unavailable, `/console/operator` degrades gracefully and displays availability status.

# Reconciliation Intelligence Engine

Continuous Financial Truth Layer for Settler with real-time anomaly detection, drift monitoring, and explainable alerts.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           RECONCILIATION INTELLIGENCE ENGINE                │
├─────────────────────────────────────────────────────────────┤
│  Drift Detector  │  Anomaly Classifier  │  Rule Health     │
│                  │                      │  Scorer          │
├──────────────────┼──────────────────────┼──────────────────┤
│ • Match rate     │ • Volume spikes      │ • Accuracy       │
│ • Confidence     │ • Value anomalies    │ • Precision      │
│ • Volume trends  │ • Timing issues      │ • Recall         │
│ • Rule usage     │ • Pattern changes    │ • F1 Score       │
│ • Timing drift   │ • Quality issues     │ • Trend analysis │
└──────────────────┴──────────────────────┴──────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │    Alert Generator       │
              │  • anomaly_alert.json    │
              │  • anomaly_alert.md      │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  Compliance Snapshot     │
              │  • Frozen audit bundle   │
              │  • Immutable hash chain  │
              │  • Attestations          │
              └──────────────────────────┘
```

## Quick Start

```typescript
import { ReconciliationIntel } from "./index";

// Initialize engine
const intel = new ReconciliationIntel({
  drift_window_size: 7,
  enable_compliance_mode: true,
  alert_auto_acknowledge_low: true,
});

// Process reconciliation run
const result = intel.processRun(
  "run_001",
  "stripe",
  "quickbooks",
  truthTable,
  invariantPassed,
  violations
);

// Check for drift
console.log(result.drift_reports);

// View anomalies
console.log(result.anomalies);

// Review rule health
console.log(result.rule_health);

// Export alerts
intel.exportArtifacts("./output/", result);
```

## Anomaly Detection

### Volume Anomalies

- Detects transaction count spikes/drops
- Severity: low → critical
- Financial impact estimation included

### Value Anomalies

- Identifies amount discrepancies
- Tracks surplus/shortfall patterns
- Currency-aware analysis

### Timing Anomalies

- Monitors processing duration changes
- SLA compliance tracking
- Infrastructure health indicators

### Pattern Anomalies

- Detects unusual matching patterns
- Rule usage shift detection
- Data quality trend analysis

## Rule Health Scoring

Each reconciliation rule receives a health score (0-100) based on:

- **Accuracy Rate** (30%): Correct matches / Total invocations
- **Precision** (25%): True positives / (TP + FP)
- **Recall** (25%): True positives / (TP + FN)
- **Confidence** (20%): Average match confidence

### Health Categories

- **Healthy (80-100)**: Rule performing well
- **At Risk (60-79)**: Needs monitoring
- **Critical (<60)**: Requires immediate action

### Auto-Recommendations

- `refine`: Adjust thresholds or criteria
- `retire`: Deprecate ineffective rules
- `monitor`: Track performance closely
- `promote`: Standardize best practices

## Alert Artifacts

### anomaly_alert.json

```json
{
  "alert_id": "alert_1234567890_0001",
  "alert_type": "drift",
  "severity": "high",
  "status": "active",
  "title": "Drift Detected: Match Rate Declining",
  "what_changed": "Match rate declining at 15.2% per reconciliation...",
  "why_it_matters": "Unmatched transactions require manual review...",
  "confidence_score": 0.85,
  "recommended_action": "Review source data quality...",
  "created_at": "2026-01-31T12:00:00Z"
}
```

### anomaly_alert.md

Human-readable report with:

- Executive summary
- Alert breakdown by severity
- Financial impact analysis
- Recommended actions

## Compliance Snapshots

Generate immutable audit bundles:

```typescript
const snapshot = intel.generateComplianceSnapshot(
  "2026-01-01",
  "2026-01-31",
  "finance_controller@company.com"
);

// Verify integrity
const isValid = intel.complianceBuilder.verifyIntegrity(snapshot);

// Replay verification
const replay = await intel.replayComplianceSnapshot(snapshot);
console.log(replay.checks);
```

### Snapshot Contents

- **Immutable Hash**: Tamper-evident fingerprint
- **Truth Tables**: All reconciliation records
- **Proof Chain**: Verification links
- **Attestations**: Signed approvals
- **Summary Statistics**: Aggregated metrics

## Artifacts Generated

| Artifact                   | Purpose                 | Format   |
| -------------------------- | ----------------------- | -------- |
| `anomaly_alert.json`       | Machine-readable alerts | JSON     |
| `anomaly_alert.md`         | Human review            | Markdown |
| `rule_health_report.json`  | Rule performance        | JSON     |
| `drift_report.json`        | Drift analysis          | JSON     |
| `compliance_snapshot.json` | Audit bundle            | JSON     |
| `compliance_snapshot.md`   | Audit summary           | Markdown |

## Configuration

```typescript
const intel = new ReconciliationIntel({
  // Drift detection window size (reconciliation runs)
  drift_window_size: 7,

  // Auto-suppress low severity alerts
  alert_auto_acknowledge_low: true,

  // Enable compliance snapshot features
  enable_compliance_mode: true,

  // Anomaly detection thresholds
  anomaly_thresholds: {
    volume: 1.5, // 1.5x baseline = anomaly
    value: 0.1, // 10% variance = anomaly
    timing: 300000, // 5min variance = anomaly (ms)
  },
});
```

## Integration with Reconciliation Engine

The intelligence engine consumes output from the Reconciliation Truth & Proof Engine:

```
reconciliation_engine/          reconciliation_intel/
├── recon_run.json      ───>    ├── processRun()
├── truth_table.csv             ├── detectDrift()
└── exceptions.md               ├── classifyAnomalies()
                                ├── scoreRuleHealth()
                                └── generateAlerts()
```

## Monitoring Dashboard

Get system status:

```typescript
const status = intel.getStatus();
// {
//   runs_processed: 150,
//   drift_detected: true,
//   active_alerts: 3,
//   critical_alerts: 0,
//   overall_health: 87,
//   compliance_enabled: true
// }
```

## Exit Codes

When used in CI/CD pipelines:

- `0`: All systems healthy, no critical alerts
- `1`: Active drift or high severity anomalies
- `2`: Critical alert triggered - immediate action required

## Version

Current: v1.0.0

---

_Part of the Settler Continuous Financial Truth Layer_

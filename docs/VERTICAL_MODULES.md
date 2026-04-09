# Vertical Modules

Industry-specific modules for specialized use cases.

## LegalTech Module

### Contract Diff

Compare contract versions to identify changes:

```javascript
const diff = await settler.legaltech.diffContracts(contract1, contract2);

// Returns:
// {
//   added: ["New clause 5.2"],
//   removed: ["Old clause 3.1"],
//   modified: [...],
//   riskScore: 0.75
// }
```

### Obligation Mapping

Map obligations between contracts using reconciliation engine.

### Risk Scoring

AI-powered risk assessment for contract changes.

## EdTech Module

### QTI Validation

Validate Question and Test Interoperability format:

```javascript
const result = await settler.edtech.validateQTI(qtiContent);

// Returns:
// {
//   valid: true,
//   errors: [],
//   warnings: []
// }
```

### Learning Outcome Mapping

Map learning outcomes between syllabus and assessments.

### LMS Compatibility

Check compatibility with:

- Canvas
- Blackboard
- Moodle
- Brightspace

## FinTech Module

### Ledger Reconciliation

Reconcile accounting ledgers:

```javascript
const result = await settler.fintech.reconcileLedgers(sourceEntries, targetEntries);

// Returns:
// {
//   matched: [...],
//   unmatchedSource: [...],
//   unmatchedTarget: [...],
//   balanceDrift: 0
// }
```

### Accounting Drift Detection

Detect discrepancies in accounting data.

### Financial Mapping Templates

Pre-built templates for common financial integrations.

## Compliance Module

### Policy Comparison

Compare privacy policies and detect changes:

```javascript
const diff = await settler.compliance.comparePrivacyPolicies(policy1, policy2);

// Returns:
// {
//   added: [...],
//   removed: [...],
//   modified: [...],
//   complianceScore: 95,
//   violations: [...]
// }
```

### Privacy Drift Detection

Monitor privacy policy changes over time.

### Data Retention Audit

Audit data retention compliance.

### DPIA Helper

Generate Data Protection Impact Assessments.

---

**For API details, see [API_REFERENCE.md](./API_REFERENCE.md)**

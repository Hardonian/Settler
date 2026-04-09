# Persona-Based Messaging

## Developers

### Value Proposition

**"Spend zero time on data correctness plumbing. Focus on building features."**

### Key Features

- RESTful API with OpenAPI spec
- SDKs (JS, Python, Go, Ruby)
- Starter kits and examples
- Interactive playground
- Comprehensive documentation

### ROI Framing

- **Time Saved:** 30-40% of data engineering time
- **Incidents Prevented:** 15-20% reduction in production incidents
- **Developer Velocity:** Ship features faster

### Example Workflows

```javascript
// Create reconciliation job
const job = await settler.recon.jobs.create({
  name: "Stripe Reconciliation",
  sourceAdapter: "stripe",
  targetAdapter: "internal_ledger",
});

// Execute and get results
const result = await settler.recon.jobs.execute(job.id);
console.log(result.summary); // { matched: 100, unmatched: 5 }
```

---

## Operators

### Value Proposition

**"Autonomous operations that self-heal, self-optimize, and self-monitor."**

### Key Features

- Self-healing through drift detection
- Self-optimizing through usage analysis
- Self-monitoring through audit trails
- Workflow orchestration
- Multi-agent fallback

### ROI Framing

- **Uptime:** 99.9%+ availability
- **Incident Reduction:** 50% fewer data quality incidents
- **Operational Efficiency:** 60% reduction in manual operations

### Example Workflows

- Automated monthly reconciliation
- Drift detection and auto-repair
- Workflow orchestration
- Audit report generation

---

## Product Teams

### Value Proposition

**"Ship data features faster with industry-specific modules."**

### Key Features

- Vertical modules (LegalTech, FinTech, EdTech, Compliance)
- Pre-built templates
- Workflow recipes
- Industry-specific solutions

### ROI Framing

- **Time to Market:** 50% faster feature delivery
- **Quality:** Industry-specific solutions reduce errors
- **Competitive Advantage:** Vertical modules create moats

### Example Workflows

- LegalTech: Contract diff and obligation mapping
- FinTech: Ledger reconciliation and accounting drift
- EdTech: QTI validation and LMS compatibility
- Compliance: Policy comparison and privacy drift

---

## Legal/Compliance

### Value Proposition

**"Automated compliance with comprehensive audit trails."**

### Key Features

- Policy comparison
- Privacy drift detection
- Data retention audit
- DPIA helper
- Comprehensive audit logs

### ROI Framing

- **Compliance Risk:** 80% reduction in compliance violations
- **Audit Efficiency:** 70% faster audit preparation
- **Regulatory Readiness:** GDPR, CCPA, HIPAA compliant

### Example Workflows

- Privacy policy comparison
- Data retention compliance audit
- DPIA generation
- Regulatory reporting

---

## Finance

### Value Proposition

**"Automated financial reconciliation with real-time visibility."**

### Key Features

- Ledger reconciliation
- Accounting drift detection
- Financial mapping templates
- Real-time cash flow visibility

### ROI Framing

- **Reconciliation Time:** 90% reduction in manual reconciliation
- **Error Reduction:** 95% reduction in reconciliation errors
- **Cost Savings:** Millions saved in reconciliation errors

### Example Workflows

- Monthly ledger reconciliation
- Real-time payment reconciliation
- Accounting drift detection
- Financial reporting

---

## Data Engineering

### Value Proposition

**"Unified OS for all data operations — not just ETL."**

### Key Features

- reconciliation engine core
- Workflow orchestration
- Schema drift detection
- Data contract versioning
- OpenAPI diff pipelines

### ROI Framing

- **Infrastructure Cost:** 40% reduction in data infrastructure
- **Developer Productivity:** 50% increase in data team velocity
- **Reliability:** 99.9% uptime for data operations

### Example Workflows

- Schema drift detection
- OpenAPI contract versioning
- Batch reconciliation
- Data pipeline orchestration

---

## Enterprise IT

### Value Proposition

**"Enterprise-grade data operations with SSO, RBAC, and audit logs."**

### Key Features

- OIDC SSO (Okta, Entra ID, Google Workspace) — configuration-gated; SAML not GA in this repository path
- RBAC
- Comprehensive audit logs
- BYOK encryption
- Dedicated tenants
- SLA guarantees

### ROI Framing

- **Security:** SOC 2, GDPR, HIPAA compliant
- **Governance:** Complete audit trail
- **Scalability:** Petabyte-scale operations
- **Reliability:** 99.99% uptime SLA

### Example Workflows

- Enterprise data reconciliation
- Compliance audit trails
- Multi-region deployment
- Custom integrations

---

**Next:** [GTM Foundation](./GTM_FOUNDATION.md)

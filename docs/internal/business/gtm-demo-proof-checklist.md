# Settler Demo & Proof Alignment Checklist

**Classification:** Internal - Strategic  
**Date:** January 2026  
**Purpose:** Ensure demos, docs, and console UI demonstrate structural proof (determinism, auditability, enforcement), not marketing claims

---

## Proof Strategy Philosophy

**Not testimonials. Not case studies. Structural proof:**

1. **Determinism:** Same inputs produce same outputs, always
2. **Auditability:** Every decision is recorded, reconstructible, exportable
3. **Enforcement:** System-level guarantees, not human promises
4. **Historical Depth:** Years of reconciliation history improves accuracy

---

## Demo Checklist

### Pre-Demo Preparation

- [ ] **Demo tenant configured:** Seedable demo data, resettable demo tenant
- [ ] **Sample data ready:** Multi-platform transactions (Stripe, Shopify, QuickBooks)
- [ ] **Audit logs populated:** Complete audit trail visible
- [ ] **Exception queue ready:** Unmatched transactions surfaced
- [ ] **Compliance docs ready:** SOC 2, GDPR, CCPA documentation

---

### Demo Flow: Deterministic Reconciliation (5 minutes)

**Goal:** Show that same inputs produce same outputs, always

**Actions:**
- [ ] Run reconciliation with sample data
- [ ] Show results (matched, unmatched, exceptions)
- [ ] Run same reconciliation again with identical inputs
- [ ] Show identical results
- [ ] Explain: "Same inputs produce same outputs, always. No randomness. This is deterministic behavior."

**Key Points to Emphasize:**
- ✅ Deterministic guarantees
- ✅ No randomness
- ✅ Same inputs = same outputs
- ❌ Avoid: "Works most of the time" language

**What to Show:**
- Reconciliation results (matched count, unmatched count)
- Exception queue (unmatched transactions)
- Audit logs (complete history)

**What NOT to Show:**
- Feature demos
- UI tours
- "Look how easy it is" narratives

---

### Demo Flow: Audit Trail (5 minutes)

**Goal:** Show that every decision is recorded, reconstructible, auditable

**Actions:**
- [ ] Navigate to audit logs
- [ ] Show complete history of all decisions
- [ ] Show export capabilities (JSON, CSV, PDF)
- [ ] Show compliance exports (GDPR, CCPA)
- [ ] Explain: "Every decision is recorded. You can reconstruct what happened, when, why. This is compliance-ready from day one."

**Key Points to Emphasize:**
- ✅ Complete audit trail
- ✅ Reconstructible history
- ✅ Compliance-ready exports
- ❌ Avoid: Vague "audit trail" claims

**What to Show:**
- Audit log entries (timestamp, action, user, details)
- Export formats (JSON, CSV, PDF)
- Compliance exports (GDPR, CCPA)
- Historical depth (years of reconciliation history)

**What NOT to Show:**
- Marketing claims
- Vague promises
- "Works most of the time" language

---

### Demo Flow: Enforcement (3 minutes)

**Goal:** Show that unmatched transactions surface automatically, system-level enforcement

**Actions:**
- [ ] Show unmatched transactions surfaced automatically
- [ ] Show exception handling (exception queue)
- [ ] Show exception details (why unmatched, what's missing)
- [ ] Explain: "System-level enforcement, not human promises. Rules are enforced, not suggested."

**Key Points to Emphasize:**
- ✅ Automatic exception handling
- ✅ System-level enforcement
- ✅ No human promises
- ❌ Avoid: "Manual review" language

**What to Show:**
- Exception queue (unmatched transactions)
- Exception details (matching rules, tolerance, date ranges)
- Exception resolution (how to handle exceptions)

**What NOT to Show:**
- Manual workflows
- "You need to configure" language
- "Tuning reconciliation" narratives

---

### Demo Flow: Compliance (2 minutes)

**Goal:** Show SOC 2 infrastructure, GDPR exports, compliance-ready

**Actions:**
- [ ] Show SOC 2 infrastructure (planned Q3 2026)
- [ ] Show GDPR export capabilities
- [ ] Show compliance documentation
- [ ] Explain: "Compliance-ready from day one. SOC 2 infrastructure, GDPR exports, complete audit trails."

**Key Points to Emphasize:**
- ✅ SOC 2 infrastructure (planned Q3 2026)
- ✅ GDPR/CCPA exports
- ✅ Compliance-ready
- ❌ Avoid: "SOC 2 certified" (not yet certified)

**What to Show:**
- Security documentation (SOC 2 prep, security questionnaire)
- Compliance exports (GDPR, CCPA)
- Compliance documentation (DPA, security FAQ)

**What NOT to Show:**
- "SOC 2 certified" claims (not yet certified)
- Vague "compliance-ready" language

---

### Demo Flow: Integration (2 minutes)

**Goal:** Show 50+ platform adapters, custom adapters available

**Actions:**
- [ ] Show platform adapters list (50+ platforms)
- [ ] Show adapter configuration (OAuth, API keys)
- [ ] Show custom adapters (enterprise feature)
- [ ] Explain: "50+ platform adapters maintained, updated, tested. You don't maintain them."

**Key Points to Emphasize:**
- ✅ 50+ platform adapters
- ✅ We maintain adapters
- ✅ Custom adapters available
- ❌ Avoid: "Works with everything" claims

**What to Show:**
- Adapter list (Stripe, Shopify, QuickBooks, etc.)
- Adapter configuration (OAuth flows, API keys)
- Custom adapters (enterprise feature)

**What NOT to Show:**
- "Works with any platform" claims
- Vague "integration" language

---

### Demo Flow: Real-Time (2 minutes)

**Goal:** Show webhook-based reconciliation, near-real-time results

**Actions:**
- [ ] Show webhook configuration
- [ ] Show webhook-based reconciliation
- [ ] Show near-real-time results
- [ ] Explain: "Webhook-based reconciliation with near-real-time results. Scheduled jobs available for batch processing."

**Key Points to Emphasize:**
- ✅ Webhook-based reconciliation
- ✅ Near-real-time results
- ✅ Scheduled jobs available
- ❌ Avoid: "Real-time" claims (webhook delays exist)

**What to Show:**
- Webhook configuration
- Webhook-based reconciliation results
- Scheduled jobs (cron expressions)

**What NOT to Show:**
- "Real-time" claims (webhook delays exist)
- "Instant" claims (API rate limits exist)

---

## Documentation Checklist

### Core Documentation

- [ ] **Deterministic behavior:** Explicitly document that same inputs produce same outputs
- [ ] **Audit trail:** Document complete audit trail capabilities
- [ ] **Compliance:** Document SOC 2, GDPR, CCPA, PCI-DSS readiness
- [ ] **Enforcement:** Document system-level enforcement mechanisms
- [ ] **Limitations:** Explicitly document what Settler cannot do

**Avoid:**
- Marketing claims
- Vague promises
- "Works most of the time" language

**Focus:**
- Truth-aligned documentation
- Sets correct expectations
- Structural proof, not marketing claims

---

### API Documentation

- [ ] **Deterministic guarantees:** Document deterministic behavior in API docs
- [ ] **Audit trail:** Document audit trail endpoints
- [ ] **Compliance:** Document compliance export endpoints
- [ ] **Enforcement:** Document enforcement mechanisms
- [ ] **Limitations:** Document API limitations (rate limits, quotas)

**Avoid:**
- "100% accurate" claims
- "Works with everything" claims
- Vague "real-time" claims

**Focus:**
- Deterministic behavior
- Audit trail capabilities
- Compliance exports
- System limitations

---

### Security Documentation

- [ ] **SOC 2:** Document SOC 2 Type II infrastructure (planned Q3 2026)
- [ ] **GDPR/CCPA:** Document GDPR/CCPA compliance, export capabilities
- [ ] **PCI-DSS:** Document PCI-DSS ready infrastructure
- [ ] **Encryption:** Document encryption at rest and in transit
- [ ] **Access control:** Document RBAC, RLS, tenant isolation

**Avoid:**
- "SOC 2 certified" claims (not yet certified)
- Vague "secure" language
- "100% secure" claims

**Focus:**
- SOC 2 infrastructure (planned Q3 2026)
- GDPR/CCPA compliance
- Security questionnaire for enterprise

---

## Console UI Checklist

### Audit Logs

- [ ] **Prominent access:** Audit log access visible in navigation
- [ ] **Complete history:** All decisions recorded, visible
- [ ] **Export capabilities:** Export audit logs (JSON, CSV, PDF)
- [ ] **Compliance exports:** GDPR/CCPA export capabilities
- [ ] **Historical depth:** Years of reconciliation history visible

**Avoid:**
- Hiding audit logs
- Making audit logs hard to find
- Limiting audit log access

**Focus:**
- Transparency
- Auditability
- Compliance-ready

---

### Deterministic Indicators

- [ ] **Deterministic behavior:** Show that reconciliation is deterministic
- [ ] **Same inputs = same outputs:** Visual indicators of deterministic behavior
- [ ] **No randomness:** Explicitly state no randomness
- [ ] **Guarantees:** Show deterministic guarantees

**Avoid:**
- "Works most of the time" language
- Vague "accurate" claims
- "100% accurate" claims

**Focus:**
- Deterministic behavior
- Same inputs = same outputs
- No randomness

---

### Compliance Indicators

- [ ] **SOC 2 status:** Show SOC 2 Type II infrastructure (planned Q3 2026)
- [ ] **GDPR/CCPA:** Show GDPR/CCPA compliance status
- [ ] **PCI-DSS:** Show PCI-DSS ready status
- [ ] **Compliance docs:** Link to compliance documentation

**Avoid:**
- "SOC 2 certified" claims (not yet certified)
- Vague "compliance-ready" language
- "100% compliant" claims

**Focus:**
- SOC 2 infrastructure (planned Q3 2026)
- GDPR/CCPA compliance
- Compliance documentation

---

### Enforcement Indicators

- [ ] **System-level enforcement:** Show that rules are enforced, not suggested
- [ ] **Exception handling:** Show unmatched transactions surfaced automatically
- [ ] **Exception queue:** Show exception queue, exception details
- [ ] **Enforcement mechanisms:** Show enforcement mechanisms (RLS, quotas, etc.)

**Avoid:**
- "Manual review" language
- "You need to configure" language
- "Tuning reconciliation" narratives

**Focus:**
- System-level enforcement
- Automatic exception handling
- Enforcement mechanisms

---

## Proof Point Validation

### Determinism Proof

**What to show:**
- Same inputs produce same outputs
- No randomness
- Deterministic guarantees

**What NOT to show:**
- "Works most of the time" language
- Vague "accurate" claims
- "100% accurate" claims

**Validation:**
- Run same reconciliation twice, show identical results
- Document deterministic behavior in API docs
- Show deterministic indicators in console UI

---

### Auditability Proof

**What to show:**
- Complete audit trail
- Reconstructible history
- Compliance-ready exports

**What NOT to show:**
- Vague "audit trail" claims
- Limited audit log access
- No export capabilities

**Validation:**
- Show complete audit log history
- Show export capabilities (JSON, CSV, PDF)
- Show compliance exports (GDPR, CCPA)

---

### Enforcement Proof

**What to show:**
- System-level enforcement
- Automatic exception handling
- Enforcement mechanisms

**What NOT to show:**
- "Manual review" language
- "You need to configure" language
- "Tuning reconciliation" narratives

**Validation:**
- Show unmatched transactions surfaced automatically
- Show exception queue, exception details
- Show enforcement mechanisms (RLS, quotas, etc.)

---

### Compliance Proof

**What to show:**
- SOC 2 infrastructure (planned Q3 2026)
- GDPR/CCPA compliance
- Compliance documentation

**What NOT to show:**
- "SOC 2 certified" claims (not yet certified)
- Vague "compliance-ready" language
- "100% compliant" claims

**Validation:**
- Show SOC 2 infrastructure (planned Q3 2026)
- Show GDPR/CCPA export capabilities
- Show compliance documentation (DPA, security FAQ)

---

## Demo Failure Modes

### What NOT to Do

**❌ Feature demos:**
- "Look at all these features!"
- "This is so easy to use!"
- "You can do X, Y, Z!"

**❌ UI tours:**
- "Here's the dashboard!"
- "Here's the settings page!"
- "Here's how you configure things!"

**❌ "Look how easy it is" narratives:**
- "It's so simple!"
- "Anyone can use it!"
- "No technical knowledge required!"

**❌ Marketing claims:**
- "100% accurate"
- "Works with everything"
- "Real-time reconciliation"

---

### What TO Do

**✅ Structural proof:**
- Show deterministic behavior
- Show audit trail
- Show enforcement mechanisms
- Show compliance capabilities

**✅ System behavior:**
- "Reconciliation happens automatically"
- "Exceptions surface automatically"
- "Audit trails generated automatically"

**✅ Truth-aligned language:**
- "Deterministic reconciliation"
- "Compliance-ready infrastructure"
- "System-level enforcement"

---

**Document Status:** Complete  
**Next Review:** Quarterly  
**Owner:** Sales & Product Team

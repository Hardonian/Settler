# Reality Audit: Promised vs. Implemented

| Claim | Where it’s stated | Evidence in code | Status | Fix plan | Owner | ETA |
|-------|-------------------|------------------|--------|----------|-------|-----|
| **50+ Platforms** | Marketing / Copy | `packages/adapters` has ~30 files, but many are stubs/drivers. Only Stripe, Shopify, PayPal seem enhanced. | **False** | Reduce claim to "Top 5 Platforms + Adapter SDK" or implement connectors. | Eng | Q1 |
| **Deterministic Reconciliation** | Landing Page | `ReconCoreEngine.ts` uses basic amount matching (1% variance). No strict invariant checks. | **Partial** | Implement strict ID/metadata matching + exact amount checks. Add "Explainability". | Eng | W2 |
| **Audit-Grade Audit Trail** | Docs | `ReconCoreEngine.ts` logs to `reconAudit`. Good foundation. | **True** | Enhance with cryptographic linking or immutable logs if needed for "Audit-Grade". | Eng | Done |
| **SOC2 Type II** | Footer / Badges | No evidence of controls in repo (expected). | **False** | Change to "Designed for SOC2" or "Controls mapped". | Legal/Eng | Immediate |
| **Instant Setup** | Onboarding | Ingestion is mocked in `ReconCoreEngine`. | **False** | Implement `ingestData` with demo mode. | Eng | W1 |
| **AI Suggestions** | Features | `ml-matching-engine.ts` exists but integration is TODO in core engine. | **Partial** | Enable as optional layer after deterministic pass. | Eng | W3 |
| **99.9% SLA** | Pricing | `ReconCoreEngine` has basic error handling but no redundancy/circuit breaker evidence in ingestion. | **Aspirational** | Add circuit breakers, retries, and dead letter queues. | Eng | Q2 |

## Gap Analysis

### Critical (Must Fix for Launch/Demo)
1.  **Ingestion Stub:** `ingestData` returns empty arrays. The engine does nothing.
2.  **Matching Logic:** "1% variance" is not deterministic enough for financial reconciliation. Needs strict rules.
3.  **Missing Normalization:** No adapter normalization layer connected to the engine.

### Major (Fix for Beta)
1.  **Compliance Claims:** Overstated. Needs truthful badge updates.
2.  **UI Feedback:** Match reasons are basic string concatenation.

### Minor (Roadmap)
1.  **AI Layer:** Can be deferred.
2.  **Long-tail Adapters:** Can be community-driven.

# Go-To-Market Strategy

## Positioning

Settler is the reconciliation platform for businesses that move money across multiple
payment rails. Where teams currently rely on spreadsheets, manual exports, and ad-hoc
scripts, Settler provides automated matching, cryptographically verifiable audit trails,
and real-time exception management.

**Tagline:** Reconcile every rail. Prove every cent.

## Target Segments

### Primary: Mid-market fintech and marketplace operators

- 2–10 payment rails (Stripe, PayPal, Adyen, ACH, FedNow).
- $10M–$500M annual payment volume.
- Finance team of 2–8 people currently running reconciliation manually.
- Pain: settlement discrepancies discovered weeks late, audit findings, chargeback
  leakage.

### Secondary: Enterprise treasury and accounting teams

- 10+ rails, multiple subsidiaries.
- Compliance requirements (SOX, PCI DSS, SOC 2).
- Need provable audit trails and automated exception escalation.

### Tertiary: Accounting firms and auditors

- Serve multiple clients who each reconcile independently.
- Value: standardised proofpack format reduces per-client audit time.

## Distribution Channels

### 1. Developer-led adoption (open core)

- Free tier with single-rail reconciliation.
- Self-hosted or cloud — lowers procurement friction.
- Developer documentation, API reference, and quickstart guides drive organic discovery.
- Target: GitHub stars, npm downloads, community contributions.

### 2. Content and SEO

- Technical blog posts on reconciliation challenges, Merkle proof verification, and
  payment rail specifics.
- Comparison content: spreadsheets vs. Settler, custom scripts vs. Settler.
- Target keywords: "payment reconciliation software", "settlement matching",
  "financial audit automation".

### 3. Product-led growth (PLG)

- Free tier → Pro upgrade triggered by multi-rail or volume threshold.
- In-product upgrade prompts when users hit limits.
- Self-serve checkout via Stripe.

### 4. Enterprise outbound

- Direct outreach to CFOs and Head of Finance at target companies.
- Proof-of-concept with their real data (anonymised).
- Custom pricing, SLA, and deployment options.

## Launch Sequence

### Phase 1: Developer community (current)

- Open-source reconciliation core.
- Public API documentation and quickstart.
- Community Discord / GitHub Discussions.

### Phase 2: Pro tier launch

- Usage-based billing for multi-rail reconciliation.
- Proofpack export and verification.
- Landing page, pricing page, and self-serve signup.

### Phase 3: Enterprise motion

- SCIM, SSO, IP allowlisting, custom domains.
- Dedicated onboarding and support.
- SOC 2 Type II certification.

## Key Metrics

| Metric                        | Target (Year 1) |
| ----------------------------- | --------------- |
| Free-tier signups             | 500+            |
| Pro conversions               | 50+             |
| Enterprise contracts          | 5+              |
| Annual recurring revenue      | $500K+          |
| Reconciliation runs processed | 1M+             |

## Competitive Landscape

| Competitor                  | Weakness Settler Exploits                              |
| --------------------------- | ------------------------------------------------------ |
| Manual spreadsheets         | No audit trail, error-prone, doesn't scale             |
| Custom internal scripts     | Fragile, no cryptographic verification, team-dependent |
| Enterprise ERP modules      | Expensive, slow to deploy, single-vendor lock-in       |
| Generic accounting software | Not built for multi-rail payment reconciliation        |

## Pricing Strategy

- **Free:** Single rail, community support. Designed for developer adoption.
- **Pro:** Per-transaction metering. Scales with customer volume. Predictable unit
  economics.
- **Enterprise:** Annual contract. Includes SLA, dedicated support, and compliance
  features. Priced on committed volume with overage.

---

_For investor context see [INVESTOR_OVERVIEW.md](INVESTOR_OVERVIEW.md)._
_For product details see [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md)._

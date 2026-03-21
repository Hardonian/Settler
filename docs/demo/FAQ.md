# Demo FAQ

Common questions during and after demos. Honest answers grounded in current product reality.

---

**Is this sample data, or does it reflect how the product actually works?**

Both. The account is seeded with representative data — not real customer transactions — but
every workflow is real: the reconciliation engine ran against the seeded records, the matches
were produced by the actual matching logic, and the audit trail reflects real system events.
The degraded connector, fuzzy matches, and unmatched records all reflect scenarios the product
genuinely handles. This is not frontend theatre.

---

**Can this connect to our systems?**

Yes, if your system is on the supported connector list. Current integrations include Stripe,
PayPal, Shopify, Amazon Seller, eBay, Etsy, QuickBooks, Xero, NetSuite, Freshbooks, Plaid
(bank), Chargebee, Recurly, Avalara, TaxJar, and 40+ others.

For systems not on that list, the Enterprise tier includes a custom integrations framework.
CSV/JSON upload is also available for any system that can export data.

---

**What does a mismatch or exception look like?**

In the demo, you can see three types on the run detail page:

- **Exact match** — same reference, amount, and date. Confidence >97%. Auto-resolved.
- **Fuzzy match** — same reference and date, small amount difference (e.g., processing fee
  deducted). Confidence 82–94%. Flagged for review with the amount difference shown.
- **Unmatched** — no counterpart found on the other side. Shown with a reason: "pending
  payout," "bank fee with no processor source," etc.

Your team only sees the fuzzy and unmatched rows — not the 89 that resolved cleanly.

---

**How are access and audit handled?**

Every action across the account is logged in the audit trail: who connected a source, when
a run was triggered, who exported a report, what changed. Entries include user ID, timestamp,
and IP address. This log is immutable and accessible to account admins.

For sharing access, the Viewer role is read-only: it cannot trigger runs, export data, modify
connectors, or invite users. Access is scoped to the tenant — no visibility into other accounts.

---

**What happens to our data?**

Settler normalizes and stores transaction records to run reconciliation. You control data
retention policy. On Enterprise, data residency options are available. Export and deletion
are available at any time. GDPR and CCPA compliance is supported.

Settler does not share your financial data with third parties. Connector credentials are
encrypted at rest.

---

**What happens after the demo?**

Nothing automatic. The demo account stays isolated. If you want to proceed:

- We can scope a pilot: connect one of your real sources, run one month of reconciliation,
  and validate the match rate against your current baseline.
- Or start with the API documentation and TypeScript SDK to evaluate the integration surface.

No contract required to pilot. Enterprise pricing is available on request.

---

**How long does setup take?**

Connecting a Stripe account: ~15 minutes (OAuth flow + one reconciliation job config).
Connecting a bank account via Plaid: ~10 minutes.
First reconciliation run: completes in minutes for up to 10K records.

---

**What is the match rate in practice?**

Depends on your data. The demo account shows 91% exact auto-match for a Stripe-to-bank
scenario. In practice, match rates vary by business type, how clean your reference data is,
and how many platforms you're reconciling across. Fuzzy matching and custom rules can push
auto-resolution higher in most cases.

We don't quote a single number — the right answer is to run a pilot against your real data.

---

**Does Settler guarantee SOC 2 or other certifications?**

SOC 2 Type II is planned for Q3 2026. It is not certified today. GDPR and CCPA compliance
is supported. Settler does not currently hold HIPAA or FedRAMP certification.

---

**Can we white-label or embed this?**

White-label reports are available on Enterprise. The reconciliation engine is API-first,
so results can be consumed by your own frontend. Full UI white-labeling is not a current
product feature.

---

*For more detail on what Settler does and does not do, see `docs/CANONICAL_PRODUCT_NARRATIVE.md`.*

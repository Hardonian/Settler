# Frequently Asked Questions (FAQ)

**Last Updated:** January 2026

---

## General

### What is Settler?

Settler is a Open Source Reconciliation Engine platform that automates financial data matching across payment processors, e-commerce platforms, and accounting systems. We reduce hours of manual reconciliation work.

### Who is Settler for?

Settler is designed for:

- **SaaS companies** processing recurring revenue across multiple platforms
- **E-commerce businesses** needing order-to-payment reconciliation
- **Marketplaces** handling multi-party transactions
- **Financial services** requiring compliance and audit trails

### What makes Settler different?

1. **Deterministic Math:** No floating-point errors in financial calculations
2. **Event-Sourced Architecture:** Complete audit trail and replay capability
3. **Developer-First:** API-first design with comprehensive SDKs
4. **Multi-Platform:** Unified reconciliation across all major platforms
5. **Compliance-Ready:** Built-in audit trails and deterministic reporting

---

## Security & Privacy

### How is my data secured?

- **Encryption at Rest:** AES-256 encryption for all sensitive data
- **Encryption in Transit:** TLS 1.3 for all connections
- **Multi-Tenant Isolation:** Row-level security (RLS) ensures data isolation
- **Access Control:** API keys with scoped permissions
- **Audit Logs:** Immutable audit trails for all operations

### Where is my data stored?

Data is stored in PostgreSQL databases hosted on Supabase. Data residency options available for Enterprise customers.

### Do you store credit card information?

No. We use Stripe for payment processing. Stripe handles all credit card data. We are designed to minimize credit card data storage.

### How do I report a security vulnerability?

Email security@settler.io with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

See [SECURITY.md](../SECURITY.md) for details.

---

## Data Ownership & Privacy

### Who owns my data?

You own your data. We process it on your behalf as a data processor.

### Can I export my data?

Yes. Use the data export API or contact support@settler.io for assistance.

### Can I delete my data?

Yes. You can delete your account and all associated data via the dashboard or API. Data deletion is permanent and cannot be undone.

### Do you share my data with third parties?

No. We do not sell your data. We only share data with:

- Service providers (hosting, payment processing) under strict agreements
- Legal requirements (when required by law)
- Business transfers (in connection with merger/acquisition)

See [Privacy Policy](../LEGAL/PRIVACY_POLICY.md) for details.

---

## Pricing & Billing

### What are your pricing tiers?

- **Starter:** $99/month — 100K reconciliations/month
- **Professional:** $499/month — 1M reconciliations/month
- **Enterprise:** Custom pricing — Unlimited usage

See [Product Overview](./PRODUCT_OVERVIEW.md) for details.

### What happens if I exceed my tier limits?

Options:

1. Automatic upgrade to next tier
2. Overage charges at tier rates
3. Service throttling (configurable)

### Can I change my plan?

Yes. Upgrade or downgrade anytime from the billing dashboard. Changes take effect at the start of the next billing period.

### Do you offer refunds?

Refunds are handled case-by-case. Contact support@settler.io for refund requests.

### What payment methods do you accept?

Credit cards, ACH (Enterprise), wire transfer (Enterprise).

---

## Technical

### What APIs do you support?

Currently:

- Stripe (payment processor)
- Shopify (e-commerce)
- Database adapters (PostgreSQL, MySQL)

Planned (Q1-Q3 2026):

- QuickBooks, Xero (accounting)
- PayPal, Square (payments)
- NetSuite (ERP)
- WooCommerce (e-commerce)

### Do you have SDKs?

Yes:

- **TypeScript/JavaScript** (`@settler/sdk`) — Available
- **Python** (`settler-python`) — Planned
- **Go** (`settler-go`) — Planned
- **Ruby** (`settler-ruby`) — Planned

### What are your API rate limits?

Rate limits vary by tier:

- **Starter:** 100 requests/15 minutes
- **Professional:** 500 requests/15 minutes
- **Enterprise:** Custom limits

### Do you support webhooks?

Yes. Webhooks are available for:

- Reconciliation job completion
- Receipt parsing completion
- Feature flag changes
- Billing events

### What is your uptime SLA?

- **Starter/Professional:** Best effort (no SLA)
- **Enterprise:** Custom SLA (typically 99.9% uptime)

---

## Compliance

### Are you SOC 2 certified?

SOC 2 Type II certification is planned for Q3 2026. We're currently working toward certification.

### Are you GDPR compliant?

Yes. We comply with GDPR requirements:

- Data minimization
- Right to access (data export API)
- Right to erasure (data deletion API)
- Data Processing Agreement (DPA) available

### Are you HIPAA compliant?

Not currently. HIPAA compliance available for Enterprise customers on request.

### Do you have a DPA (Data Processing Agreement)?

Yes. DPA available for Enterprise customers. Contact enterprise@settler.io.

---

## Support

### How do I get support?

- **Email:** support@settler.io
- **Documentation:** [settler.dev/docs](https://settler.dev/docs)
- **Community:** GitHub Discussions (planned)

### What are your support SLAs?

- **Starter/Professional:** Email support (24-48 hour response)
- **Enterprise:** Dedicated support (custom SLA)

### Do you offer training?

Yes. Training available for Enterprise customers. Contact enterprise@settler.io.

---

## Open Source

### Is Settler open source?

Settler follows an open-core model:

- **OSS Components:** `@settler/protocol` (MIT License)
- **Commercial Platform:** Proprietary SaaS platform

See [LICENSING_OVERVIEW.md](./LICENSING_OVERVIEW.md) for details.

### Can I self-host Settler?

Self-hosting available for Enterprise customers. Contact enterprise@settler.io.

### Can I contribute to Settler?

Yes. Contributions welcome for OSS components. See [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## Limits & Quotas

### What are the usage limits?

Limits vary by tier:

- **Reconciliations:** 100K/month (Starter) to Unlimited (Enterprise)
- **Receipt Parses:** 10K/month (Starter) to Unlimited (Enterprise)
- **Feature Flag Evaluations:** 1M/month (Starter) to Unlimited (Enterprise)

### What happens if I hit my limit?

See "What happens if I exceed my tier limits?" above.

### Can I request higher limits?

Yes. Contact support@settler.io or upgrade to Enterprise for custom limits.

---

## Troubleshooting

### I'm getting authentication errors

- Verify your API key is correct
- Check API key hasn't been revoked
- Ensure API key has required permissions
- Check API key format (`rk_...`)

### Reconciliation jobs are failing

- Check adapter configuration (credentials, endpoints)
- Verify source/target data is accessible
- Review job logs in Developer Console
- Contact support@settler.io with job ID

### Receipt parsing accuracy is low

- Ensure receipt image is clear and high resolution
- Check receipt format is supported (PDF, PNG, JPG)
- Review confidence scores in Developer Console
- Contact support@settler.io for assistance

---

## Still Have Questions?

- **Email:** support@settler.io
- **Documentation:** [settler.dev/docs](https://settler.dev/docs)
- **Enterprise Sales:** enterprise@settler.io

---

**This FAQ is updated regularly. Last updated: January 2026.**

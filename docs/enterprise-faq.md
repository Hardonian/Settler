# Enterprise FAQ

**Last Updated:** January 2026  
**Audience:** Enterprise Customers, Procurement Teams, Security Teams

---

## General Questions

### What is Settler?

Settler is a Reconciliation-as-a-Service (RaaS) platform that automates financial and event data reconciliation across fragmented SaaS and e-commerce ecosystems. Think "Stripe for reconciliation"—dead-simple onboarding, pure API, usage-based pricing, and composable adapters for every platform.

### How is Settler different from legacy reconciliation solutions?

**Key Differentiators:**
- ⚡ **Fast:** 5-minute integration vs. 3-6 month implementations
- 🔒 **Safe:** SOC 2 Type II ready, GDPR compliant, enterprise security
- 🚀 **API-First:** Everything accessible via REST API, no vendor lock-in
- 🔮 **Future-Proof:** Cloud-native, serverless, scales automatically

**Comparison:**
- **BlackLine:** $100K+/year, 3-6 month setup, UI-heavy
- **Settler:** $1K-$10K+/month, 5-minute setup, API-first

### What platforms does Settler support?

**Built-in Adapters:**
- Stripe (payments)
- Shopify (orders)
- QuickBooks (accounting)
- PayPal (payments)
- Square (payments)
- Xero (accounting)
- NetSuite (ERP)

**Custom Adapters:**
- We can build custom adapters for any platform with an API
- Community adapters available via GitHub
- Adapter SDK for building your own adapters

### How long does implementation take?

**Typical Timeline:**
- **Simple Use Case (2-3 platforms):** 3-5 days
- **Standard Enterprise (5-10 platforms):** 1-2 weeks
- **Complex Enterprise (10+ platforms, custom adapters):** 2-4 weeks

**Factors Affecting Timeline:**
- Number of platforms to integrate
- Custom adapter requirements
- Security/compliance reviews
- Team availability

---

## Security & Compliance

### Is Settler SOC 2 Type II certified?

**Status:** In Progress (Target: Q2 2026)

**Current State:**
- All SOC 2 controls implemented from day one
- Access controls (RBAC, MFA)
- Encryption (at rest, in transit)
- Logging and monitoring
- Incident response procedures

**Certification Timeline:**
- Audit started: Q1 2026
- Target certification: Q2 2026
- Annual audits thereafter

**For Customers:**
- We can provide security questionnaires
- We can schedule security review calls
- We can provide audit reports (once certified)

### Is Settler GDPR compliant?

**Yes, GDPR compliant by design:**

**Data Processing:**
- Data minimization (only collect necessary data)
- Right to access (data export API)
- Right to erasure (data deletion API)
- Data Processing Agreement (DPA) available

**Data Residency:**
- EU data stored in EU regions (Enterprise)
- Data transfer agreements (SCCs) in place
- Compliance with local data protection laws

**Customer Rights:**
- Export all data via API (`GET /api/v1/users/{id}/data-export`)
- Delete all data via API (`DELETE /api/v1/users/{id}/data`)
- Request data processing information

### Is Settler PCI-DSS compliant?

**Status:** Not applicable (we don't store card data)

**Scope Reduction:**
- We never store payment card data
- We only pass through webhook data (if customers send card data)
- We use tokenization when possible

**If Required:**
- We can pursue PCI-DSS Level 1 certification (on-demand)
- Timeline: 6-12 months
- Cost: Included in Enterprise plan

### Is Settler HIPAA compliant?

**Status:** HIPAA-ready (on-demand)

**If Required:**
- Business Associate Agreement (BAA) available
- End-to-end encryption for PHI
- Access controls and audit logs
- Breach notification (72-hour SLA)

**Timeline:**
- BAA available immediately
- Full HIPAA compliance: 3-6 months
- Cost: Included in Enterprise plan

### What encryption is used?

**Encryption at Rest:**
- AES-256 encryption (default)
- Database encryption (managed by cloud provider)
- Object storage encryption (SSE-S3 or SSE-KMS)
- Customer-managed keys available (Enterprise)

**Encryption in Transit:**
- TLS 1.3 only (TLS 1.2 deprecated)
- Strong cipher suites only
- Perfect Forward Secrecy (PFS) enabled
- HSTS headers enforced

**Application-Level:**
- API keys encrypted before storage
- Credentials encrypted before storage
- Key rotation supported without downtime

### How is access controlled?

**Authentication:**
- API keys (scoped by permissions)
- OAuth 2.0 (GitHub, Google, Microsoft)
- SSO (SAML, OIDC) - Enterprise
- Multi-factor authentication (MFA) required

**Authorization:**
- Role-based access control (RBAC)
- Resource-level permissions (per job, per adapter)
- IP allowlisting (Enterprise)
- Audit logs for all access

**Roles:**
- **Owner:** Full access
- **Admin:** Manage users, jobs, settings
- **Developer:** Create/edit jobs, view reports
- **Viewer:** Read-only access

### What audit logging is available?

**What's Logged:**
- All API requests (endpoint, method, user, IP, timestamp)
- Authentication events (logins, failures, MFA)
- Authorization events (permission denials)
- Configuration changes (job creation, updates, deletions)
- Data access (PII, sensitive data)
- Security events (failed logins, suspicious activity)

**Log Retention:**
- 7 days (Free tier)
- 30 days (Starter)
- 90 days (Growth)
- 1 year (Scale)
- Custom (Enterprise, up to 7 years)

**Log Access:**
- Queryable via API (`GET /api/v1/audit-logs`)
- Exportable (JSON, CSV)
- Immutable (append-only)
- Encrypted at rest

### What's your breach notification policy?

**Detection:**
- 24/7 monitoring via automated security tools
- Intrusion detection systems (IDS)
- Anomaly detection for unusual access patterns

**Response Timeline:**
- **Detection:** 0-1 hour
- **Containment:** 1-4 hours
- **Investigation:** 4-24 hours
- **Notification:** 24-72 hours

**Customer Notification:**
- Email to registered account email
- In-app notification banner
- Public disclosure on status page (for public incidents)
- Detailed incident report

**Regulatory Compliance:**
- GDPR: 72-hour notification to supervisory authority
- SOC 2: Documented in security log
- HIPAA: 60-day notification (if applicable)

---

## Technical Questions

### What's the API rate limit?

**Standard Limits:**
- Free: 100 requests/15 min
- Starter: 500 requests/15 min
- Growth: 2,000 requests/15 min
- Scale: 10,000 requests/15 min

**Enterprise:**
- Custom rate limits (typically 10,000+ requests/15 min)
- Burst capacity available
- Contact your account manager for specifics

### What's the API latency?

**Performance Metrics:**
- **API Response Time:** <50ms (p95)
- **Reconciliation Processing:** <100ms per transaction (p95)
- **Report Generation:** <1 second for 10K transactions

**SLA:**
- Standard: 99.9% uptime
- Enterprise: 99.99% uptime (custom SLA available)

### Can we self-host Settler?

**Yes, self-hosted option available:**

**License:** AGPL v3 (open source)

**What's Included:**
- Core reconciliation engine
- Adapter SDK
- API server
- Basic dashboard

**What's Not Included:**
- Managed infrastructure
- Enterprise features (SSO, dedicated infrastructure)
- Compliance certifications (SOC 2, PCI-DSS)
- Support SLA

**Deployment:**
- Docker Compose (development)
- Kubernetes (production)
- Deployment guides available

**Contact:** enterprise@settler.io for deployment guides

### How do webhooks work?

**Webhook Flow:**
1. Reconciliation event occurs (matched, mismatch, error)
2. Settler sends HTTP POST to your webhook URL
3. Your server processes the webhook
4. Your server returns 200 OK (or Settler retries)

**Webhook Security:**
- Webhook secrets to verify signatures
- HTTPS only (enforced)
- Idempotency recommended (handle duplicate events)

**Retry Logic:**
- Automatic retries (exponential backoff)
- Up to 3 retries
- Dead letter queue for failed webhooks

**Webhook Events:**
- `reconciliation.matched` - Transaction matched successfully
- `reconciliation.mismatch` - Transaction mismatch detected
- `reconciliation.error` - Error during reconciliation

### Can we export all our data?

**Yes, GDPR-compliant data export:**

**Export API:**
```bash
GET /api/v1/users/{id}/data-export
```

**Export Formats:**
- JSON (default)
- CSV (for reports)

**What's Exported:**
- All reconciliation jobs
- All reconciliation reports
- All audit logs
- All configuration data
- All user data

**Export Limits:**
- No limits (Enterprise)
- Large exports may be delivered via S3 link

### How do we handle data deletion?

**Data Deletion API:**
```bash
DELETE /api/v1/users/{id}/data
```

**What's Deleted:**
- All reconciliation jobs
- All reconciliation reports
- All audit logs (after retention period)
- All configuration data
- All user data

**Grace Period:**
- 30-day grace period (recoverable)
- Permanent deletion after 30 days

**Compliance:**
- GDPR right to erasure compliant
- Deletion logged in audit trail
- Confirmation email sent

---

## Billing & Pricing

### How is Enterprise pricing calculated?

**Pricing Factors:**
- Transaction volume (reconciliations/month)
- Number of platforms/adapters
- Custom adapters required
- Compliance requirements (SOC 2, PCI-DSS, HIPAA)
- Support SLA requirements
- Dedicated infrastructure needs

**Typical Range:**
- $1,000-$10,000+/month
- Custom contracts available
- Annual billing discounts (10-15%)

**Contact:** sales@settler.io for custom pricing

### Are there setup fees?

**Standard Onboarding:**
- No setup fees
- Included in Enterprise plan

**Additional Costs:**
- Custom adapters: $500 one-time + $50/month
- Extensive customization: Quoted separately
- Training sessions: Included (up to 4 hours)

### What payment methods are accepted?

**Payment Methods:**
- Credit card (Stripe)
- ACH (US customers)
- Wire transfer (Enterprise)
- Purchase orders (Enterprise, net 30)

**Billing Cycle:**
- Monthly (default)
- Annual (10-15% discount)
- Custom (Enterprise)

### What happens if we exceed our plan limits?

**Enterprise Customers:**
- Custom limits (discussed during onboarding)
- Overage charges discussed and approved before billing
- No surprise charges

**Standard Plans:**
- Automatic overage billing ($0.01 per reconciliation)
- No service interruption
- Usage alerts available

### Can we get a discount for annual billing?

**Yes:**
- Annual billing: 10-15% discount
- Equivalent to 1-2 months free
- Custom contracts available

**Contact:** sales@settler.io for annual pricing

---

## Support & Service

### What support is included?

**Enterprise Support:**
- Dedicated account manager
- 1-hour SLA (critical issues)
- 4-hour SLA (high priority)
- 24/7 support available
- Slack channel (#settler-enterprise)
- Phone support (Enterprise)

**Standard Support:**
- Email support (24-hour response)
- Documentation and guides
- Community support (Discord)

### What's the support SLA?

**Enterprise SLAs:**
- **Critical:** 1-hour response (system down, data breach)
- **High:** 4-hour response (job failures, API errors)
- **Medium:** 24-hour response (configuration questions)
- **Low:** 72-hour response (feature requests)

**Standard SLAs:**
- **High:** 24-hour response
- **Medium:** 72-hour response
- **Low:** 7-day response

### Do you offer training?

**Yes, training included:**

**Onboarding Training:**
- Dashboard training (1 hour)
- API integration training (1 hour)
- Troubleshooting training (30 min)
- Q&A session (30 min)

**Additional Training:**
- Advanced features (custom)
- Best practices workshop (custom)
- Team training sessions (custom)

**Training Materials:**
- Video tutorials
- Documentation
- Code examples
- Integration guides

### What's included in onboarding?

**Standard Onboarding (1-2 weeks):**
- Kickoff call (requirements gathering)
- Account setup and access provisioning
- Adapter configuration
- Reconciliation job setup
- API integration support
- Testing and validation
- Go-live support
- Training sessions
- Documentation handoff

**Enterprise Onboarding (custom):**
- Custom timeline based on requirements
- Dedicated account manager
- Custom adapters (if needed)
- Security review
- Compliance documentation
- Extended training

---

## Integration Questions

### How do we integrate Settler?

**Integration Options:**

**1. REST API:**
```typescript
import Settler from '@settler/sdk';

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const job = await client.jobs.create({ /* config */ });
```

**2. Webhooks:**
```typescript
app.post('/webhooks/reconcile', async (req, res) => {
  const { event, data } = req.body;
  // Handle reconciliation events
});
```

**3. Scheduled Jobs:**
- Cron-based automatic reconciliation
- Configurable schedules
- Email/Slack notifications

### What programming languages are supported?

**Official SDKs:**
- TypeScript/JavaScript (official)
- Python (community)
- Ruby (community)
- Go (community)

**REST API:**
- Any language (standard REST API)
- OpenAPI/Swagger documentation
- Code examples available

### Can we use Settler with our existing systems?

**Yes, API-first design:**

**Integration Points:**
- REST API (any system)
- Webhooks (event-driven)
- Scheduled jobs (batch processing)
- Data export (for BI tools)

**Common Integrations:**
- Stripe + Shopify + QuickBooks
- Multiple payment providers
- Custom ERP systems
- Data warehouses (via export)

### Do you offer white-label options?

**Yes, Enterprise feature:**

**White-Label Options:**
- Custom branding on reports
- Custom domain (Enterprise)
- Custom email templates
- Custom webhook endpoints

**Contact:** enterprise@settler.io for white-label options

---

## Contact

**Sales:** sales@settler.io  
**Enterprise:** enterprise@settler.io  
**Security:** security@settler.io  
**Support:** support@settler.io

**Phone:** (Coming soon for Enterprise)

---

**This FAQ is updated quarterly. Last update: January 2026.**

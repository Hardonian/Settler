# Enterprise Onboarding Guide

**Last Updated:** January 2026  
**Audience:** Enterprise Customers, Implementation Teams, Project Managers

---

## Overview

This guide walks enterprise customers through the onboarding process for Settler, from initial setup to production deployment. Typical onboarding takes **1-2 weeks** depending on complexity.

### Onboarding Timeline

| Phase             | Duration   | Activities                                         |
| ----------------- | ---------- | -------------------------------------------------- |
| **Kickoff**       | Day 1      | Initial call, requirements gathering, access setup |
| **Configuration** | Days 2-5   | Adapter setup, job configuration, testing          |
| **Integration**   | Days 6-10  | API integration, webhook setup, monitoring         |
| **Production**    | Days 11-14 | Go-live, monitoring, optimization                  |
| **Handoff**       | Day 15+    | Documentation, training, support transition        |

---

## Phase 1: Kickoff (Day 1)

### Pre-Kickoff Checklist

**Before the kickoff call, please prepare:**

- [ ] List of platforms to reconcile (Stripe, Shopify, QuickBooks, etc.)
- [ ] Sample data from each platform (anonymized)
- [ ] Current reconciliation process documentation
- [ ] Technical contact information (developers, DevOps)
- [ ] Security/compliance requirements (SOC 2, GDPR, etc.)
- [ ] Expected transaction volume (per day/month)
- [ ] Integration preferences (API, webhooks, scheduled jobs)

### Kickoff Call Agenda (60 minutes)

**1. Introductions (5 min)**

- Project stakeholders
- Roles and responsibilities
- Communication channels

**2. Requirements Gathering (30 min)**

- Reconciliation use cases
- Platform integrations needed
- Matching rules and logic
- Reporting requirements
- Compliance needs

**3. Technical Architecture (15 min)**

- Current infrastructure
- Integration approach (API, webhooks)
- Security requirements
- Data residency preferences

**4. Next Steps (10 min)**

- Access provisioning
- Configuration tasks
- Timeline and milestones
- Q&A

### Access Setup

**Enterprise Account Creation:**

1. Account manager creates enterprise account
2. SSO configuration (if applicable)
3. API keys generated (scoped by environment)
4. Access granted to dashboard and API

**Initial Access:**

- **Dashboard:** `https://app.settler.io`
- **API:** `https://api.settler.io`
- **Documentation:** `https://docs.settler.io`
- **Support Portal:** `https://support.settler.io`

**API Keys Provided:**

- **Production:** `sk_live_...` (for production use)
- **Staging:** `sk_test_...` (for testing)
- **Read-only:** `sk_live_..._readonly` (for monitoring)

---

## Phase 2: Configuration (Days 2-5)

### Step 1: Adapter Configuration

**Configure adapters for each platform:**

#### Stripe Adapter

```typescript
// Example: Stripe adapter configuration
const stripeConfig = {
  adapter: "stripe",
  config: {
    apiKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET, // Optional
  },
};
```

**Setup Steps:**

1. Create Stripe API key (with read permissions)
2. Configure webhook endpoint (if using real-time reconciliation)
3. Test adapter connection via API

**API Test:**

```bash
curl -X POST https://api.settler.io/api/v1/adapters/stripe/test \
  -H "X-API-Key: sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "sk_test_..."}'
```

#### Shopify Adapter

```typescript
// Example: Shopify adapter configuration
const shopifyConfig = {
  adapter: "shopify",
  config: {
    apiKey: process.env.SHOPIFY_API_KEY,
    shopDomain: "your-shop.myshopify.com",
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET, // Optional
  },
};
```

**Setup Steps:**

1. Create Shopify private app (with read permissions)
2. Configure webhook endpoint (if using real-time reconciliation)
3. Test adapter connection via API

#### QuickBooks Adapter

```typescript
// Example: QuickBooks adapter configuration
const quickbooksConfig = {
  adapter: "quickbooks",
  config: {
    clientId: process.env.QB_CLIENT_ID,
    clientSecret: process.env.QB_CLIENT_SECRET,
    realmId: process.env.QB_REALM_ID,
    accessToken: process.env.QB_ACCESS_TOKEN,
    refreshToken: process.env.QB_REFRESH_TOKEN,
  },
};
```

**Setup Steps:**

1. Create QuickBooks app (via Intuit Developer)
2. Complete OAuth flow (get access/refresh tokens)
3. Test adapter connection via API

### Step 2: Reconciliation Job Configuration

**Create your first reconciliation job:**

```typescript
import Settler from "@settler/sdk";

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Create reconciliation job
const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
      shopDomain: "your-shop.myshopify.com",
    },
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
      { field: "date", type: "range", days: 1 },
    ],
    conflictResolution: "last-wins",
  },
  schedule: "0 2 * * *", // Daily at 2 AM UTC
});
```

**Matching Rules Explained:**

| Rule Type | Description                    | Use Case                        |
| --------- | ------------------------------ | ------------------------------- |
| **exact** | Exact match required           | Order IDs, transaction IDs      |
| **fuzzy** | Fuzzy matching (threshold 0-1) | Customer names, descriptions    |
| **range** | Match within date/amount range | Date tolerance, amount rounding |

**Conflict Resolution Strategies:**

| Strategy       | Description                 | Use Case                |
| -------------- | --------------------------- | ----------------------- |
| **first-wins** | Use first value encountered | Historical data         |
| **last-wins**  | Use most recent value       | Real-time updates       |
| **manual**     | Flag for manual review      | High-value transactions |

### Step 3: Testing

**Test Reconciliation Job:**

```typescript
// Run job manually
const execution = await client.jobs.run(job.id);

// Wait for completion
const report = await client.reports.get(job.id, {
  executionId: execution.id,
});

console.log(report.summary);
// {
//   matched: 145,
//   unmatched: 3,
//   errors: 1,
//   accuracy: 98.7%
// }
```

**Validation Checklist:**

- [ ] Job runs successfully
- [ ] Matching rules work as expected
- [ ] Unmatched transactions are flagged correctly
- [ ] Reports are accurate
- [ ] Error handling works (test with invalid data)

---

## Phase 3: Integration (Days 6-10)

### Step 1: API Integration

**Integrate Settler into your application:**

```typescript
// Example: Express.js webhook handler
import express from "express";
import Settler from "@settler/sdk";

const app = express();
const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Webhook endpoint for reconciliation events
app.post("/webhooks/reconcile", async (req, res) => {
  const { event, data } = req.body;

  switch (event) {
    case "reconciliation.matched":
      // Handle matched transaction
      await handleMatchedTransaction(data);
      break;

    case "reconciliation.mismatch":
      // Handle mismatch (alert finance team)
      await alertFinanceTeam(data);
      break;

    case "reconciliation.error":
      // Handle error (log, retry, etc.)
      await handleError(data);
      break;
  }

  res.json({ received: true });
});
```

### Step 2: Webhook Configuration

**Configure webhooks for real-time reconciliation:**

```typescript
// Create webhook endpoint
const webhook = await settler.webhooks.create({
  url: "https://your-app.com/webhooks/reconcile",
  events: ["reconciliation.matched", "reconciliation.mismatch", "reconciliation.error"],
  secret: process.env.WEBHOOK_SECRET, // Optional
});

// Verify webhook signature
function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

**Webhook Security Best Practices:**

- ✅ Use webhook secrets to verify signatures
- ✅ Use HTTPS only for webhook endpoints
- ✅ Implement idempotency (handle duplicate events)
- ✅ Set up retry logic for failed webhook deliveries

### Step 3: Monitoring & Alerting

**Set up monitoring for reconciliation jobs:**

```typescript
// Monitor job execution
async function monitorJob(jobId: string) {
  const job = await settler.jobs.get(jobId);

  if (job.status === "failed") {
    // Alert team
    await sendAlert({
      severity: "high",
      message: `Job ${jobId} failed`,
      details: job.error,
    });
  }

  // Check for unmatched transactions
  const report = await settler.reports.get(jobId);
  if (report.summary.unmatched > 0) {
    // Alert finance team
    await sendAlert({
      severity: "medium",
      message: `${report.summary.unmatched} unmatched transactions`,
      details: report.unmatched,
    });
  }
}

// Run monitoring every hour
setInterval(() => monitorJob(jobId), 60 * 60 * 1000);
```

**Monitoring Checklist:**

- [ ] Job execution monitoring (success/failure)
- [ ] Unmatched transaction alerts
- [ ] Error rate monitoring
- [ ] API latency monitoring
- [ ] Webhook delivery monitoring

---

## Phase 4: Production (Days 11-14)

### Step 1: Pre-Production Checklist

**Before going live, verify:**

- [ ] All adapters configured and tested
- [ ] Reconciliation jobs running successfully
- [ ] Matching rules validated with production data
- [ ] Webhooks configured and tested
- [ ] Monitoring and alerting set up
- [ ] Team trained on dashboard and API
- [ ] Support contacts documented
- [ ] Rollback plan prepared

### Step 2: Go-Live

**Production Deployment Steps:**

1. **Switch to Production API Keys:**

   ```bash
   export SETTLER_API_KEY="sk_live_..."
   ```

2. **Update Webhook URLs:**

   ```typescript
   await settler.webhooks.update(webhookId, {
     url: "https://your-production-app.com/webhooks/reconcile",
   });
   ```

3. **Enable Scheduled Jobs:**

   ```typescript
   await settler.jobs.update(jobId, {
     status: "active",
   });
   ```

4. **Monitor First Execution:**
   - Watch dashboard for first reconciliation
   - Verify reports are accurate
   - Check for any errors or warnings

### Step 3: Post-Go-Live Monitoring

**First 24 Hours:**

- Monitor job executions every hour
- Review reconciliation reports
- Check for unmatched transactions
- Verify webhook deliveries

**First Week:**

- Daily reconciliation report review
- Weekly team sync on results
- Optimize matching rules if needed
- Document any issues or improvements

---

## Phase 5: Handoff (Day 15+)

### Documentation

**Documentation Provided:**

- [ ] API reference documentation
- [ ] Integration guides for your platforms
- [ ] Dashboard user guide
- [ ] Troubleshooting guide
- [ ] Best practices document

### Training

**Training Sessions:**

- [ ] Dashboard training (1 hour)
- [ ] API integration training (1 hour)
- [ ] Troubleshooting training (30 min)
- [ ] Q&A session (30 min)

### Support Transition

**Support Channels:**

- **Email:** support@settler.io
- **Slack:** #settler-support (Enterprise)
- **Phone:** (Enterprise only)
- **Dashboard:** In-app support chat

**Support SLAs:**

- **Critical Issues:** 1-hour response (Enterprise)
- **High Priority:** 4-hour response (Enterprise)
- **Medium Priority:** 24-hour response
- **Low Priority:** 72-hour response

---

## Enterprise Onboarding FAQ

### General Questions

**Q: How long does onboarding take?**  
A: Typical onboarding takes 1-2 weeks, depending on complexity. Simple use cases (2-3 platforms) can be completed in 3-5 days.

**Q: Do we need dedicated technical resources?**  
A: Yes, we recommend having a developer or DevOps engineer available for integration work (approximately 20-40 hours total).

**Q: Can we use our existing infrastructure?**  
A: Yes! Settler is API-first and integrates with your existing systems. No infrastructure changes required on your end.

**Q: What if we need custom adapters?**  
A: We can develop custom adapters for your platforms. Typical timeline: 2-4 weeks. Cost: $500 one-time + $50/month maintenance.

### Security & Compliance

**Q: Is Settler SOC 2 Type II certified?**  
A: We're actively pursuing SOC 2 Type II certification (target: Q2 2026). All SOC 2 controls are implemented from day one.

**Q: Can we use our own encryption keys?**  
A: Yes, Enterprise customers can use customer-managed encryption keys (AWS KMS, GCP KMS).

**Q: Do you support data residency requirements?**  
A: Yes, Enterprise customers can choose EU or US data regions. VPC peering and private endpoints available.

**Q: How do you handle breach notifications?**  
A: We have a 24-hour breach notification SLA. Affected customers are notified via email and in-app notifications.

### Technical Questions

**Q: What's the API rate limit?**  
A: Enterprise customers have custom rate limits (typically 10,000+ requests/15 min). Contact your account manager for specifics.

**Q: Can we self-host Settler?**  
A: Yes, the self-hosted core is available under AGPL v3 license. Contact enterprise@settler.io for deployment guides.

**Q: How do we handle webhook failures?**  
A: Settler automatically retries failed webhook deliveries (exponential backoff, up to 3 retries). You can also implement idempotency on your end.

**Q: Can we export all our data?**  
A: Yes, you can export all data via our data export API (GDPR compliant). Data is available in JSON or CSV format.

### Billing & Pricing

**Q: How is pricing calculated?**  
A: Enterprise pricing is custom based on volume and requirements. Typical range: $1,000-$10,000+/month.

**Q: Are there setup fees?**  
A: No setup fees for standard onboarding. Custom adapters or extensive customization may incur additional costs.

**Q: Can we get a discount for annual billing?**  
A: Yes, annual billing typically includes a 10-15% discount. Contact your account manager for details.

**Q: What happens if we exceed our plan limits?**  
A: Enterprise customers have custom limits. Overage charges are discussed and approved before billing.

---

## Support & Resources

### Getting Help

**During Onboarding:**

- **Account Manager:** Your dedicated point of contact
- **Technical Support:** support@settler.io
- **Slack Channel:** #settler-enterprise (invite-only)

**After Onboarding:**

- **Support Portal:** https://support.settler.io
- **Documentation:** https://docs.settler.io
- **API Reference:** https://docs.settler.io/api
- **Status Page:** https://status.settler.io

### Additional Resources

- [API Reference](./api.md)
- [Adapter Guide](./adapters.md)
- [Security Policy](../SECURITY.md)
- [Enterprise Battlecard](./enterprise-battlecard.md)
- [Troubleshooting Guide](./troubleshooting.md)

---

**Questions? Contact your account manager or support@settler.io**

**This guide is updated quarterly. Last update: January 2026.**

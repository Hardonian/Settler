# Sample Support Interactions

**Ready-to-use support templates for common customer scenarios.**

---

## Billing & Pricing

### Scenario: Customer wants to understand overage charges

**Customer Email:**

> Hi, I'm on the Starter plan ($29/month) and got charged $45 this month. Can you explain the overage charges?

**Support Response:**

Hi {{customer_name}},

Thanks for reaching out! I'm happy to explain your billing.

**Your Plan:** Starter ($29/month)  
**Included:** 10,000 reconciliations/month  
**Your Usage:** 12,000 reconciliations  
**Overage:** 2,000 reconciliations × $0.01 = $20  
**Total:** $29 + $20 = $49

**What happened:** You exceeded your plan limit by 2,000 reconciliations. We automatically bill overages at $0.01 per reconciliation to avoid service interruption.

**Options:**

1. **Upgrade to Growth** ($99/month) — Includes 100,000 reconciliations (no overages at your current volume)
2. **Optimize usage** — Review your jobs to see if you can reduce reconciliation frequency
3. **Stay on Starter** — Continue with overage billing (works if occasional spikes)

[View your usage dashboard →](https://settler.io/dashboard/usage)  
[Upgrade your plan →](https://settler.io/dashboard/billing)

Let me know if you'd like help optimizing your usage or have questions about upgrading!

Best,  
{{support_agent_name}}  
Settler Support

---

### Scenario: Customer wants a refund

**Customer Email:**

> I signed up yesterday and realized Settler isn't right for my use case. Can I get a refund?

**Support Response:**

Hi {{customer_name}},

I'm sorry to hear Settler isn't a good fit. We offer a **30-day money-back guarantee** for all paid plans, so you're eligible for a full refund.

**Refund Process:**

1. I'll process your refund now (takes 5-7 business days to appear)
2. Your account will remain active until the end of your billing period
3. You'll receive a confirmation email once the refund is processed

**Before you go:** Would you mind sharing what didn't work? Your feedback helps us improve. If there's a specific issue, I'm happy to help troubleshoot.

**Alternative:** If you'd like to keep testing, you can downgrade to our free tier (1,000 reconciliations/month) and upgrade again when you're ready.

Refund processed! You'll receive a confirmation email shortly.

Best,  
{{support_agent_name}}  
Settler Support

---

### Scenario: Customer wants to downgrade

**Customer Email:**

> My usage has decreased. Can I downgrade from Growth to Starter?

**Support Response:**

Hi {{customer_name}},

Absolutely! You can downgrade anytime. Here's what happens:

**Current Plan:** Growth ($99/month) — 100,000 reconciliations/month  
**New Plan:** Starter ($29/month) — 10,000 reconciliations/month  
**Effective Date:** End of current billing period ({{billing_end_date}})  
**Prorated Refund:** $70 (for remaining days in billing period)

**Important:** Make sure your monthly usage stays under 10,000 reconciliations to avoid overage charges ($0.01 per reconciliation beyond limit).

[View your usage →](https://settler.io/dashboard/usage)  
[Downgrade now →](https://settler.io/dashboard/billing/downgrade)

**Before downgrading:** Would you like me to review your usage patterns? I can help identify if there are any optimizations to reduce reconciliation volume.

Let me know if you have questions!

Best,  
{{support_agent_name}}  
Settler Support

---

## Integration & Technical

### Scenario: Customer can't connect Shopify adapter

**Customer Email:**

> I'm getting an error when trying to connect Shopify. Error: "Invalid API credentials"

**Support Response:**

Hi {{customer_name}},

Let's get Shopify connected! This error usually means the API credentials aren't quite right. Here's how to fix it:

**Step 1: Get Your Shopify API Credentials**

1. Go to your Shopify admin → Settings → Apps and sales channels
2. Click "Develop apps" → "Create an app"
3. Name it "Settler Reconciliation"
4. Configure admin API scopes:
   - ✅ `read_orders`
   - ✅ `read_customers`
   - ✅ `read_products`
5. Install the app and copy:
   - **API Key** (starts with `shpat_`)
   - **API Secret** (starts with `shpss_`)
   - **Shop Domain** (e.g., `your-shop.myshopify.com`)

**Step 2: Use the Correct Format**

```typescript
{
  adapter: "shopify",
  config: {
    apiKey: "shpat_...", // Not the admin API key!
    shopDomain: "your-shop.myshopify.com", // Include .myshopify.com
  },
}
```

**Common Mistakes:**

- ❌ Using admin API key instead of app API key
- ❌ Missing `.myshopify.com` in shop domain
- ❌ Wrong API scopes (need `read_orders`)

**Still stuck?** Share a screenshot of your Shopify app settings (redact the secret!) and I'll help troubleshoot.

[View Shopify adapter docs →](https://docs.settler.io/adapters/shopify)

Best,  
{{support_agent_name}}  
Settler Support

---

### Scenario: Customer's reconciliation accuracy is low

**Customer Email:**

> My reconciliation is only matching 70% of transactions. How can I improve accuracy?

**Support Response:**

Hi {{customer_name}},

70% accuracy is below our typical 95-99% range. Let's improve it! Here are the most common fixes:

**1. Review Unmatched Transactions**
[View unmatched transactions →](https://settler.io/dashboard/jobs/{{job_id}}/unmatched)

Look for patterns:

- Are amounts slightly different? (e.g., $100.00 vs $100.01)
- Are dates off? (e.g., order date vs payment date)
- Are IDs formatted differently? (e.g., "ORD-123" vs "123")

**2. Adjust Matching Rules**

**If amounts are slightly off:**

```typescript
{
  field: "amount",
  type: "exact",
  tolerance: 0.01, // Allow $0.01 difference
}
```

**If dates are off:**

```typescript
{
  field: "date",
  type: "range",
  days: 2, // Allow 2-day window
}
```

**If IDs are formatted differently:**

```typescript
{
  field: "order_id",
  type: "fuzzy", // Fuzzy matching for similar IDs
  threshold: 0.8,
}
```

**3. Check Data Quality**

- Are both platforms receiving all transactions?
- Are there webhook failures?
- Are transactions being created in both systems?

**Quick Win:** I can review your job configuration and suggest specific rule changes. Share your job ID (`{{job_id}}`) and I'll take a look!

[View matching rules docs →](https://docs.settler.io/matching-rules)

Best,  
{{support_agent_name}}  
Settler Support

---

### Scenario: Customer's webhooks aren't working

**Customer Email:**

> I set up webhooks but I'm not receiving reconciliation events. What's wrong?

**Support Response:**

Hi {{customer_name}},

Let's troubleshoot your webhooks! Here's a step-by-step checklist:

**1. Verify Webhook Endpoint**

- Is your endpoint publicly accessible? (no localhost)
- Does it return `200 OK`?
- Is it using HTTPS? (required for security)

**2. Check Webhook Configuration**
[View your webhooks →](https://settler.io/dashboard/webhooks)

Make sure:

- ✅ URL is correct (no typos)
- ✅ Events are selected (`reconciliation.completed`, `reconciliation.mismatch`)
- ✅ Secret is set (for signature verification)

**3. Test Your Endpoint**

```bash
curl -X POST https://your-endpoint.com/webhooks/settler \
  -H "Content-Type: application/json" \
  -H "settler-signature: test" \
  -d '{"event":"test","data":{}}'
```

**4. Check Webhook Logs**
[View webhook delivery logs →](https://settler.io/dashboard/webhooks/{{webhook_id}}/logs)

Look for:

- ❌ Failed deliveries (4xx/5xx responses)
- ❌ Timeout errors
- ❌ Invalid signature errors

**5. Verify Signature Verification**

```typescript
import Settler from "@settler/sdk";

app.post("/webhooks/settler", async (req, res) => {
  const signature = req.headers["settler-signature"];
  const isValid = settler.webhooks.verify(req.body, signature, process.env.WEBHOOK_SECRET);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Process webhook...
});
```

**Common Issues:**

- ❌ Endpoint not publicly accessible
- ❌ Endpoint returning non-200 status
- ❌ Signature verification failing
- ❌ Webhook secret mismatch

**Still stuck?** Share your webhook ID (`{{webhook_id}}`) and I'll check the delivery logs.

[View webhook docs →](https://docs.settler.io/webhooks)

Best,  
{{support_agent_name}}  
Settler Support

---

## Compliance & Security

### Scenario: Customer needs SOC 2 documentation

**Customer Email:**

> We're going through a SOC 2 audit. Can you provide SOC 2 documentation?

**Support Response:**

Hi {{customer_name}},

Great question! Here's our compliance status:

**Current Status:**

- ✅ **SOC 2 Type II audit in progress** — Certification expected Q2 2026
- ✅ **SOC 2 controls implemented** — We follow SOC 2 controls today
- ✅ **Security documentation** — Available upon request

**Available Now:**

1. **Security Overview** — [settler.io/security](https://settler.io/security)
2. **Data Processing Agreement (DPA)** — [Request DPA →](https://settler.io/legal/dpa)
3. **Security Questionnaire** — [Request questionnaire →](mailto:security@settler.io)

**For Enterprise Customers:**

- ✅ **SOC 2 Type II report** — Available Q2 2026 (included in Enterprise)
- ✅ **Custom security reviews** — Available on request
- ✅ **Dedicated security contact** — security@settler.io

**What We Can Provide:**

- Security architecture overview
- Data encryption details (AES-256 at rest, TLS 1.3 in transit)
- Access control policies (RBAC, API keys)
- Audit logging capabilities (7-year retention)
- Incident response procedures

**Next Steps:**

1. **Request DPA** — [settler.io/legal/dpa](https://settler.io/legal/dpa)
2. **Request Security Questionnaire** — Email security@settler.io
3. **Schedule Security Call** — [settler.io/contact/security](https://settler.io/contact/security)

**For urgent SOC 2 needs:** If you need SOC 2 certification immediately, we can discuss Enterprise options with accelerated certification timeline.

Let me know what specific documentation you need, and I'll get it to you ASAP!

Best,  
{{support_agent_name}}  
Settler Support

---

### Scenario: Customer needs GDPR data export

**Customer Email:**

> We need to export all our data for GDPR compliance. How do we do this?

**Support Response:**

Hi {{customer_name}},

We make GDPR data export easy! Here are your options:

**Option 1: Self-Service API Export**

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

// Export all your data
const exportData = await settler.users.exportData({
  userId: "your_user_id",
  format: "json", // or "csv"
});

// Download the export
console.log(exportData.data); // JSON object with all your data
```

**Option 2: Dashboard Export**

1. Go to [Settings → Data Export](https://settler.io/dashboard/settings/data-export)
2. Click "Request Data Export"
3. You'll receive an email with download link (processed within 24 hours)

**What's Included:**

- ✅ All reconciliation jobs and configurations
- ✅ All reconciliation reports and results
- ✅ All webhook configurations
- ✅ All API keys (masked)
- ✅ All audit logs
- ✅ All user account data

**Export Formats:**

- JSON (machine-readable)
- CSV (for Excel/spreadsheets)
- PDF (human-readable report)

**Data Retention:**

- We retain your data according to your plan's retention period
- You can request deletion at any time via API or dashboard

**Request Deletion:**

```typescript
// Delete all your data
await settler.users.deleteData({
  userId: "your_user_id",
  confirm: true, // Required for deletion
});
```

**Important:** Data deletion is permanent and cannot be undone. You'll receive a confirmation email before deletion.

[Request data export →](https://settler.io/dashboard/settings/data-export)  
[View GDPR docs →](https://docs.settler.io/compliance/gdpr)

Best,  
{{support_agent_name}}  
Settler Support

---

### Scenario: Customer wants to know about PCI-DSS compliance

**Customer Email:**

> Do you store credit card data? Are you PCI-DSS compliant?

**Support Response:**

Hi {{customer_name}},

Great security question! Here's our PCI-DSS stance:

**Short Answer:** We **never store credit card data**, so PCI-DSS scope is minimal.

**What We Store:**

- ✅ Transaction IDs, amounts, dates, metadata
- ✅ Platform API keys (encrypted)
- ❌ **Never** credit card numbers
- ❌ **Never** bank account numbers
- ❌ **Never** CVV codes

**How It Works:**

1. Your platforms (Stripe, Shopify, etc.) process payments
2. They send transaction data to Settler (no card data)
3. We reconcile transactions (matching IDs, amounts, dates)
4. We never see or store card data

**PCI-DSS Status:**

- ✅ **PCI-DSS Level 1** — Available for Enterprise customers (Q3 2026)
- ✅ **PCI-DSS scope reduction** — We never store card data
- ✅ **Secure infrastructure** — TLS 1.3, encrypted storage

**If You Send Card Data:**
If you accidentally send card data via webhooks, we:

- ✅ Pass it through without storage
- ✅ Log the event (for security monitoring)
- ✅ Alert you to remove card data from webhooks

**For Enterprise Customers:**

- ✅ **PCI-DSS Level 1 certification** — Available Q3 2026
- ✅ **Custom PCI-DSS review** — Available on request
- ✅ **Dedicated security contact** — security@settler.io

**Best Practice:** Never send card data to Settler. Your payment processors (Stripe, PayPal, etc.) handle card data—we just reconcile the transaction records.

[View security page →](https://settler.io/security)  
[Request PCI-DSS documentation →](mailto:security@settler.io)

Best,  
{{support_agent_name}}  
Settler Support

---

## General Support Best Practices

### Response Time SLAs

- **Free Tier:** Community support (Discord, GitHub)
- **Starter:** Email support (24-hour response)
- **Growth:** Priority email support (4-hour response)
- **Scale:** Priority support (1-hour SLA)
- **Enterprise:** Dedicated account manager (1-hour SLA)

### Tone Guidelines

- ✅ **Friendly and helpful** — We're here to solve problems
- ✅ **Technical but accessible** — Explain clearly, provide code examples
- ✅ **Proactive** — Suggest optimizations and best practices
- ✅ **Empathetic** — Acknowledge frustrations, celebrate wins

### Escalation Triggers

- Billing disputes → Escalate to billing team
- Security concerns → Escalate to security team
- Enterprise inquiries → Escalate to sales team
- Technical bugs → Escalate to engineering team

---

**Last Updated:** January 2026  
**Review Frequency:** Monthly

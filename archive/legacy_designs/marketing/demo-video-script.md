# Settler Demo Video Script

**Duration:** 2-3 minutes  
**Target Audience:** Developers and Finance Teams

---

## Script

**[0:00-0:15] Introduction**

"Hi, I'm Scott, founder of Settler. If you're manually reconciling Stripe and Shopify in spreadsheets, this video is for you.

Settler automates payment reconciliation across all your platforms—Stripe, Shopify, QuickBooks, and 50+ more. Let me show you how it works."

**[0:15-0:30] The Problem**

"Here's the problem: You have orders in Shopify, payments in Stripe, and accounting in QuickBooks. Manually matching these takes hours every day, and it's error-prone.

Settler solves this with a simple API integration that takes 5 minutes."

**[0:30-1:00] Quick Demo**

"Let me show you. First, I'll install the SDK:

```bash
npm install @settler/sdk
```

Then, I'll create a reconciliation job:

```typescript
const job = await settler.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: { adapter: "shopify", config: { apiKey: "..." } },
  target: { adapter: "stripe", config: { apiKey: "..." } },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});
```

That's it. Now let's run it and see the results."

**[1:00-1:30] Results**

"Here are the results:

- 1,250 transactions matched automatically
- 3 unmatched transactions (shown in exception queue)
- 99.8% accuracy

The unmatched transactions are flagged for review. I can resolve them in bulk or individually."

**[1:30-2:00] Features**

"Settler includes:

- Real-time reconciliation via webhooks
- Exception queue for unmatched items
- Complete audit trail for compliance
- Multi-currency support
- Scheduled reconciliations

You can export results to CSV or sync directly to QuickBooks."

**[2:00-2:15] Pricing**

"Pricing is simple:

- Free tier: 1,000 reconciliations/month
- Starter: $29/month for 10,000
- Growth: $99/month for 100,000

No credit card required to start."

**[2:15-2:30] Call to Action**

"Ready to automate your reconciliation? Sign up at settler.io—it takes 5 minutes.

Thanks for watching!"

---

## Visuals

- **0:00-0:15:** Settler logo, founder intro
- **0:15-0:30:** Problem illustration (spreadsheets, manual work)
- **0:30-1:00:** Code editor with SDK installation and job creation
- **1:00-1:30:** Dashboard showing results (matched, unmatched, accuracy)
- **1:30-2:00:** Feature highlights (webhooks, exceptions, audit trail)
- **2:00-2:15:** Pricing page
- **2:15-2:30:** Sign-up CTA

---

## Key Messages

1. **5-minute integration** (not 5 days)
2. **99%+ accuracy** (not 85-95%)
3. **Real-time reconciliation** (not batch)
4. **Exception queue** (not manual review)
5. **Free to start** (no credit card)

---

**Production Notes:**

- Record in 1080p
- Use screen recording for code/dashboard
- Add captions/subtitles
- Optimize for mobile viewing

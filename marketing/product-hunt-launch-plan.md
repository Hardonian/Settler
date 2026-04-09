# Product Hunt Launch Plan

**Target Date:** Month 4  
**Goal:** Top 5 Product of the Day

---

## Pre-Launch (Weeks -4 to -1)

### Week -4: Preparation

**Content:**

- [ ] Landing page optimized
- [ ] Demo video (2-3 minutes)
- [ ] Product screenshots (5-10)
- [ ] Product description (400 words)
- [ ] Founder story
- [ ] Early supporters list (50+)

**Marketing:**

- [ ] Blog post: "How we built Settler"
- [ ] Twitter/X thread preview
- [ ] Email to waitlist
- [ ] LinkedIn post

### Week -3: Early Supporters

**Recruit:**

- [ ] 50+ early supporters (friends, customers, community)
- [ ] Coordinate upvote timing
- [ ] Prepare thank-you messages
- [ ] Create supporter assets (social media graphics)

### Week -2: Final Prep

**Content:**

- [ ] Finalize demo video
- [ ] Prepare launch day social media posts
- [ ] Write launch day blog post
- [ ] Prepare email templates

**Testing:**

- [ ] Test signup flow
- [ ] Test API endpoints
- [ ] Verify documentation
- [ ] Check mobile responsiveness

### Week -1: Countdown

**Announcements:**

- [ ] "Launching on Product Hunt next week" post
- [ ] Email to waitlist
- [ ] Remind early supporters
- [ ] Finalize launch day schedule

---

## Launch Day (Day 0)

### Timeline

**12:01 AM PST:** Post on Product Hunt

- Product name: "Settler - Reconciliation-as-a-Service API"
- Tagline: "Automate payment reconciliation across Stripe, Shopify, QuickBooks, and 50+ platforms"
- Description: [400-word description]
- Maker: Scott Hardie
- Topics: Developer Tools, Fintech, SaaS

**12:05 AM PST:** Early Supporters Upvote

- Coordinate with 50+ supporters
- Upvote within first hour
- Comment with testimonials

**8:00 AM PST:** Social Media Blitz

- Twitter/X announcement thread
- LinkedIn post
- Hacker News "Show HN"
- Indie Hackers post
- Reddit (r/SaaS, r/ecommerce)

**10:00 AM PST:** Email to Waitlist

- Launch announcement email
- Direct link to Product Hunt
- Ask for upvotes

**2:00 PM PST:** Follow-Up

- Engage with comments
- Answer questions
- Share updates

**6:00 PM PST:** Final Push

- Remind supporters
- Share progress
- Engage with community

---

## Post-Launch (Days 1-7)

### Day 1: Follow-Up

**Actions:**

- [ ] Thank all supporters
- [ ] Respond to all comments
- [ ] Share results (rank, upvotes)
- [ ] Blog post: "Product Hunt Launch Results"

### Day 2-7: Engagement

**Actions:**

- [ ] Continue engaging with comments
- [ ] Share customer testimonials
- [ ] Post updates
- [ ] Thank new signups

---

## Success Metrics

**Targets:**

- Top 5 Product of the Day
- 500+ upvotes
- 500+ signups
- 50+ paying customers (10% conversion)
- $2,500 MRR from Product Hunt

---

## Launch Day Checklist

**Before Launch:**

- [ ] Landing page live and optimized
- [ ] Demo video ready
- [ ] Product screenshots ready
- [ ] Early supporters coordinated
- [ ] Social media posts scheduled
- [ ] Email templates ready
- [ ] Team briefed

**Launch Day:**

- [ ] Post at 12:01 AM PST
- [ ] Early supporters upvote
- [ ] Social media posts go live
- [ ] Email to waitlist
- [ ] Monitor comments/questions
- [ ] Engage with community

**After Launch:**

- [ ] Thank supporters
- [ ] Respond to comments
- [ ] Share results
- [ ] Follow up with signups

---

## Product Hunt Post Content

### Title

**Settler - Reconciliation-as-a-Service API**

### Tagline

**Automate payment reconciliation across Stripe, Shopify, QuickBooks, and 50+ platforms**

### Description

Settler is reconciliation-as-a-Service—a single API that automates payment reconciliation across fragmented SaaS and e-commerce ecosystems.

**The Problem:**
Modern businesses operate across 10+ platforms: Stripe for payments, Shopify for orders, QuickBooks for accounting. Finance teams spend 2-3 hours daily manually reconciling transactions in spreadsheets. This causes:

- Revenue leakage from unmatched transactions
- Compliance risks (manual reconciliation fails audits)
- Operational overhead (hours wasted on repetitive work)

**The Solution:**
Settler automates reconciliation with a 5-minute API integration:

1. Connect your platforms (Stripe, Shopify, QuickBooks, etc.)
2. Configure matching rules (order ID, amount, timestamp)
3. Automatic reconciliation runs in real-time or on schedule
4. Review exceptions in the exception queue
5. Export to accounting or sync directly

**Key Features:**

- ⚡ 5-minute integration (not 5 days)
- 🔄 Real-time reconciliation (not batch)
- 🔌 Composable adapters (Stripe, Shopify, PayPal, QuickBooks, Square, 50+ more)
- 🔒 Compliance-ready (SOC 2, GDPR, PCI-DSS)
- 📊 Complete audit trail
- 🌍 Multi-currency support

**Pricing:**

- Free: 1,000 reconciliations/month
- Starter: $29/month (10,000/month)
- Growth: $99/month (100,000/month)
- Scale: $299/month (1,000,000/month)

**Try It:**

```bash
npm install @settler/sdk
```

```typescript
import Settler from "@settler/sdk";

const settler = new Settler({ apiKey: "sk_test_..." });

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

await settler.jobs.run(job.data.id);
const report = await settler.reports.get(job.data.id);
console.log(`Matched: ${report.data.summary.matched}`);
```

**Who It's For:**

- E-commerce businesses reconciling orders with payments
- SaaS companies matching subscription events
- Finance teams automating reconciliation workflows
- Developers building financial data pipelines

**Get Started:**

- Sign up: [settler.io](https://settler.io)
- Docs: [docs.settler.io](https://docs.settler.io)
- GitHub: [github.com/settler/settler](https://github.com/settler/settler)

---

## Social Media Posts

### Twitter/X Thread

```
🚀 Launching Settler on Product Hunt today!

Settler automates payment reconciliation across Stripe, Shopify, QuickBooks, and 50+ platforms.

5-minute integration. 99%+ accuracy. Real-time matching.

👉 [Product Hunt Link]

Thread 🧵

1/ What is Settler?
Reconciliation-as-a-Service API. Instead of manually matching transactions in spreadsheets, Settler does it automatically via API.

2/ The Problem
Finance teams spend 2-3 hours daily manually reconciling:
- Stripe payments
- Shopify orders
- QuickBooks accounting

This causes revenue leakage, compliance risks, and operational overhead.

3/ The Solution
Settler automates reconciliation:
✅ Connect platforms via API
✅ Configure matching rules
✅ Automatic reconciliation (real-time or scheduled)
✅ Exception queue for unmatched items
✅ Export to accounting

4/ Key Features
⚡ 5-minute integration
🔄 Real-time reconciliation
🔌 50+ platform adapters
🔒 Compliance-ready (SOC 2, GDPR)
📊 Complete audit trail

5/ Pricing
Free: 1,000/month
Starter: $29/month (10K)
Growth: $99/month (100K)
Scale: $299/month (1M)

6/ Try It
npm install @settler/sdk

See docs: docs.settler.io

7/ We'd love your support!
👉 [Product Hunt Link]

If you're manually reconciling payments, Settler will save you hours every week.

Thanks! 🙏
```

### LinkedIn Post

```
Excited to launch Settler on Product Hunt today! 🚀

Settler automates payment reconciliation across Stripe, Shopify, QuickBooks, and 50+ platforms—eliminating hours of manual spreadsheet work.

**The Problem:**
Finance teams spend 2-3 hours daily manually reconciling transactions. This causes revenue leakage, compliance risks, and doesn't scale.

**The Solution:**
Settler automates reconciliation with a 5-minute API integration. Real-time matching, exception handling, and complete audit trails.

**Key Features:**
- 5-minute integration
- 99%+ accuracy
- Real-time reconciliation
- Exception queue
- Compliance-ready

**Pricing:**
Free tier available (1,000 reconciliations/month). Paid plans start at $29/month.

If you're manually reconciling payments, check out Settler: [Product Hunt Link]

#Fintech #SaaS #DeveloperTools
```

---

## Email Templates

### Launch Day Email to Waitlist

**Subject:** 🚀 Settler Launches on Product Hunt Today!

```
Hi [Name],

Excited to share that Settler is launching on Product Hunt today!

Settler automates payment reconciliation across Stripe, Shopify, QuickBooks, and 50+ platforms—eliminating hours of manual spreadsheet work.

**What Settler Does:**
- Automates reconciliation with a 5-minute API integration
- Real-time matching (not batch processing)
- Exception queue for unmatched items
- Complete audit trail for compliance

**Pricing:**
- Free: 1,000 reconciliations/month
- Starter: $29/month (10,000/month)
- Growth: $99/month (100,000/month)

**We'd love your support:**
👉 [Product Hunt Link]

If you upvote and share, we'd be incredibly grateful!

**Try Settler:**
- Sign up: settler.io
- Docs: docs.settler.io
- GitHub: github.com/settler/settler

Thanks for being part of the Settler community!

Scott Hardie
Founder, Settler
```

---

## Success Criteria

**Minimum Success:**

- Top 10 Product of the Day
- 300+ upvotes
- 300+ signups
- 30+ paying customers

**Target Success:**

- Top 5 Product of the Day
- 500+ upvotes
- 500+ signups
- 50+ paying customers

**Stretch Goal:**

- #1 Product of the Day
- 1,000+ upvotes
- 1,000+ signups
- 100+ paying customers

---

**Last Updated:** 2026-01-15

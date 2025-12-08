# Launch Plan & Growth Loop

**Complete public beta launch package: Product Hunt copy, launch checklist, PR template, blog post outline, and feedback integration**

---

## Table of Contents

1. [Product Hunt Launch](#product-hunt-launch)
2. [Show HN Post](#show-hn-post)
3. [Launch Sequence Checklist](#launch-sequence-checklist)
4. [PR/Announcement Template](#prannouncement-template)
5. [Notion Launch Board](#notion-launch-board)
6. [Getting Started Blog Post](#getting-started-blog-post)
7. [Feedback Integration](#feedback-integration)

---

## Product Hunt Launch

### Product Hunt Post Copy

**Title:** Settler - Reconciliation-as-a-Service API for E-commerce & SaaS

**Tagline:** Automate financial reconciliation across Shopify, Stripe, QuickBooks, and 50+ platforms in 5 minutes.

**Description:**

```
Settler solves the problem of manual reconciliation—the tedious, error-prone process of matching records between different systems.

THE PROBLEM
Every finance team wastes 10-20 hours per week manually matching:
• Shopify orders with Stripe payments
• QuickBooks invoices with PayPal transactions
• Subscription events across billing systems

Manual reconciliation is slow (10+ hours/week), error-prone (5-10% error rate), and doesn't scale.

THE SOLUTION
Settler automates reconciliation with 99%+ accuracy:
✅ Connect systems in 5 minutes via API
✅ Automated matching with configurable rules
✅ Real-time webhook notifications
✅ Complete audit trail and reports

KEY FEATURES
• Pre-built adapters for 50+ platforms (Stripe, Shopify, QuickBooks, PayPal, etc.)
• Configurable matching rules (amount, date, ID, custom logic)
• Confidence scoring and exception handling
• API-first design (use from any language, any framework)
• Usage-based pricing (no per-seat fees)

HOW IT WORKS
1. Install SDK: npm install @settler/sdk
2. Create job: Connect your systems (Shopify → Stripe)
3. Set rules: Define matching criteria
4. Run reconciliation: Get results in seconds
5. Handle exceptions: Review unmatched records via API or dashboard

USE CASES
• E-commerce: Reconcile Shopify orders with Stripe payments
• SaaS: Match subscription events across billing systems
• Finance: Automate accounting reconciliation workflows
• Developers: Build financial data pipelines

PRICING
• Free: 1 job, 100 reconciliations/month
• Starter: $29/mo - 5 jobs, 1,000 reconciliations/month
• Growth: $99/mo - 20 jobs, 10,000 reconciliations/month
• Scale: $299/mo - 100 jobs, 100,000 reconciliations/month

TRY IT FREE
Sign up: settler.io/signup
Documentation: docs.settler.io
GitHub: github.com/settler/settler

Made with ❤️ for developers who hate manual reconciliation.
```

**Gallery Images:**
1. Dashboard screenshot showing reconciliation results
2. API code example (TypeScript)
3. Webhook payload example
4. Report export example

**Maker Comments:**

**Comment 1 (Founder):**
> Hey Product Hunt! 👋 I'm [Founder Name], founder of Settler. We built Settler because we were tired of spending hours manually matching orders to payments. Settler automates this in 5 minutes with 99%+ accuracy. Try it free and let us know what you think!

**Comment 2 (Use Case):**
> We use Settler to reconcile Shopify orders with Stripe payments. It saves us 15 hours per week and eliminated all manual errors. The API is super clean and the webhooks make it easy to integrate into our workflow.

**Comment 3 (Technical):**
> The SDK is really well-designed. TypeScript types, retry logic, webhook signature verification—everything you need is there. Plus, the adapters are open source, so you can see exactly how they work.

---

## Show HN Post

### Show HN: Settler - Reconciliation-as-a-Service API

**Title:** Show HN: Settler – Automate reconciliation across Shopify, Stripe, QuickBooks in 5 minutes

**Post:**

```
Hey HN! 👋

I'm [Founder Name], and I built Settler to solve a problem I faced at my previous startup: spending hours every week manually matching Shopify orders with Stripe payments.

Settler is a reconciliation-as-a-Service API that automates matching records across disconnected systems. Think of it as "Resend for reconciliation"—dead-simple onboarding, pure API, usage-based pricing.

HOW IT WORKS
1. Connect your systems (Shopify → Stripe, QuickBooks → PayPal, etc.)
2. Set matching rules (amount, date, ID, custom logic)
3. Run reconciliation automatically (scheduled or on-demand)
4. Get results via API, webhooks, or dashboard

TECH STACK
• API: Express.js, TypeScript, PostgreSQL
• SDK: TypeScript SDK with retry logic, webhook verification
• Adapters: Open source adapters for Stripe, Shopify, QuickBooks, PayPal
• Infrastructure: Serverless-ready (Vercel, AWS Lambda)

KEY FEATURES
• Pre-built adapters for 50+ platforms
• Configurable matching rules with confidence scoring
• Real-time webhook notifications
• Complete audit trail and reports
• API-first design (use from any language)

TRY IT
• Sign up: settler.io/signup (free tier available)
• Docs: docs.settler.io
• GitHub: github.com/settler/settler
• Demo: settler.io/demo

FEEDBACK WELCOME
I'd love to hear your thoughts, especially:
• Is this a problem you face?
• What features would make this more useful?
• What platforms should we support next?

Thanks for checking it out!
```

---

## Launch Sequence Checklist

### Pre-Launch (2 Weeks Before)

**Content Preparation:**
- [ ] Product Hunt post written and reviewed
- [ ] Show HN post written and reviewed
- [ ] Press release drafted
- [ ] Blog post written
- [ ] Social media posts scheduled
- [ ] Email announcement drafted
- [ ] Demo video recorded
- [ ] Screenshots/graphics created

**Technical Preparation:**
- [ ] Production environment tested
- [ ] Load testing completed
- [ ] Monitoring/alerting configured
- [ ] Support team briefed
- [ ] Documentation reviewed
- [ ] Onboarding flow tested

**Community Preparation:**
- [ ] Beta users notified
- [ ] Advisors notified
- [ ] Partners notified
- [ ] Investors notified (if applicable)

---

### Launch Day (T-0)

**Morning (9 AM ET):**
- [ ] Product Hunt post goes live
- [ ] Show HN post submitted
- [ ] Press release sent
- [ ] Social media posts go live
- [ ] Email announcement sent
- [ ] Blog post published

**Midday (12 PM ET):**
- [ ] Monitor Product Hunt ranking
- [ ] Respond to comments/questions
- [ ] Share on social media
- [ ] Engage with community

**Evening (6 PM ET):**
- [ ] Thank you post on Product Hunt
- [ ] Update Show HN with launch results
- [ ] Send follow-up emails
- [ ] Review metrics and feedback

---

### Post-Launch (Week 1)

**Day 1:**
- [ ] Monitor signups and conversions
- [ ] Respond to all comments/questions
- [ ] Share launch results on social media
- [ ] Thank early supporters

**Day 2-3:**
- [ ] Analyze launch metrics
- [ ] Gather feedback
- [ ] Address any issues
- [ ] Follow up with signups

**Day 4-7:**
- [ ] Write launch recap blog post
- [ ] Share lessons learned
- [ ] Plan next steps
- [ ] Thank community

---

## PR/Announcement Template

### Press Release Template

**FOR IMMEDIATE RELEASE**

**Settler Launches Reconciliation-as-a-Service API to Automate Financial Data Matching**

*New API platform eliminates manual reconciliation, saving finance teams 10+ hours per week*

**[City, Date]** — Settler, a reconciliation-as-a-Service API platform, today announced its public beta launch. Settler automates the process of matching records across disconnected systems (Shopify orders with Stripe payments, QuickBooks invoices with PayPal transactions, etc.), eliminating the need for manual reconciliation.

**The Problem**
Finance teams spend 10-20 hours per week manually matching records between different systems. This process is slow, error-prone (5-10% error rate), and doesn't scale as businesses grow.

**The Solution**
Settler automates reconciliation with 99%+ accuracy:
- Connect systems in 5 minutes via API
- Automated matching with configurable rules
- Real-time webhook notifications
- Complete audit trail and reports

**Key Features**
- Pre-built adapters for 50+ platforms (Stripe, Shopify, QuickBooks, PayPal, etc.)
- Configurable matching rules with confidence scoring
- API-first design (use from any language, any framework)
- Usage-based pricing (no per-seat fees)

**Pricing**
- Free: 1 job, 100 reconciliations/month
- Starter: $29/mo - 5 jobs, 1,000 reconciliations/month
- Growth: $99/mo - 20 jobs, 10,000 reconciliations/month
- Scale: $299/mo - 100 jobs, 100,000 reconciliations/month

**Availability**
Settler is available now at settler.io. Sign up for a free account to get started.

**About Settler**
Settler is a reconciliation-as-a-Service API platform that automates financial data matching across disconnected systems. Founded in 2026, Settler helps e-commerce and SaaS companies eliminate manual reconciliation and reduce errors.

**Media Contact**
[Name]
[Email]
[Phone]

**Links**
- Website: settler.io
- Documentation: docs.settler.io
- GitHub: github.com/settler/settler

---

### Email Announcement Template

**Subject:** 🚀 Settler is Live! Automate Your Reconciliation in 5 Minutes

**Body:**

```
Hi [Name],

I'm excited to announce that Settler is now publicly available! 🎉

WHAT IS SETTLER?
Settler automates reconciliation across disconnected systems (Shopify → Stripe, QuickBooks → PayPal, etc.) with 99%+ accuracy. No more manual matching, no more errors.

WHY SETTLER?
• 90% time savings (10+ hours/week → 1 hour/week)
• 99%+ accuracy vs. 85-95% manual
• 5-minute setup vs. days/weeks for custom solutions
• Complete audit trail for compliance

TRY IT FREE
Sign up: settler.io/signup
• Free tier: 1 job, 100 reconciliations/month
• No credit card required
• Get started in 5 minutes

LAUNCH SPECIAL
Use code LAUNCH2026 for 20% off your first 3 months (valid until [Date]).

RESOURCES
• Documentation: docs.settler.io
• Demo: settler.io/demo
• Support: support@settler.io

Thanks for your support!

[Founder Name]
Founder, Settler
```

---

## Notion Launch Board

### Launch Board Structure

**Database:** Launch Tasks

**Properties:**
- Task Name (Title)
- Status (Select: Not Started, In Progress, Done, Blocked)
- Owner (Person)
- Due Date (Date)
- Priority (Select: P0, P1, P2)
- Category (Select: Content, Technical, Marketing, Support)
- Notes (Text)

**Views:**

1. **Launch Timeline** (Timeline view)
   - Group by: Due Date
   - Filter: Status != Done

2. **By Owner** (Board view)
   - Group by: Owner
   - Sort by: Priority

3. **By Priority** (Board view)
   - Group by: Priority
   - Sort by: Due Date

**Sample Tasks:**

| Task | Owner | Due Date | Priority | Status |
|------|-------|----------|----------|--------|
| Write Product Hunt post | Marketing | T-14 | P0 | Done |
| Record demo video | Marketing | T-10 | P0 | In Progress |
| Test production environment | Engineering | T-7 | P0 | Done |
| Schedule social media posts | Marketing | T-3 | P1 | Done |
| Prepare support team | Support | T-1 | P1 | Done |
| Launch Product Hunt | Founder | T-0 | P0 | Not Started |
| Monitor launch metrics | All | T+1 | P1 | Not Started |

---

## Getting Started Blog Post

### Blog Post Outline: "Getting Started with Settler in 5 Minutes"

**Title:** Getting Started with Settler: Automate Reconciliation in 5 Minutes

**Meta Description:** Learn how to automate reconciliation across Shopify, Stripe, QuickBooks, and 50+ platforms with Settler's API-first platform.

**Outline:**

#### Introduction (2 paragraphs)
- Hook: "Every finance team wastes 10+ hours per week on manual reconciliation."
- Problem: Manual matching is slow, error-prone, and doesn't scale.
- Solution: Settler automates this in 5 minutes.

#### What is Settler? (1 paragraph)
- Reconciliation-as-a-Service API
- Automates matching across disconnected systems
- 99%+ accuracy, 5-minute setup

#### Step 1: Sign Up (1 paragraph + code)
- Create account at settler.io
- Get API key
- Code: Show API key in dashboard

#### Step 2: Install SDK (1 paragraph + code)
```bash
npm install @settler/sdk
```

```typescript
import Settler from "@settler/sdk";

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});
```

#### Step 3: Create Reconciliation Job (2 paragraphs + code)
- Explain job concept
- Show example: Shopify → Stripe
- Code: Create job API call

```typescript
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
    ],
  },
});
```

#### Step 4: Run Reconciliation (1 paragraph + code)
- Explain execution
- Code: Run job and get results

```typescript
// Run reconciliation
await client.jobs.run(job.data.id);

// Get results
const report = await client.reports.get(job.data.id);
console.log(report.data.summary);
// {
//   matched: 1250,
//   unmatched_source: 5,
//   unmatched_target: 3,
//   accuracy: 99.4%
// }
```

#### Step 5: Handle Exceptions (1 paragraph + code)
- Explain unmatched records
- Code: Get unmatched records and webhooks

```typescript
// Set up webhooks
await client.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: ["reconciliation.completed", "reconciliation.failed"],
});

// Get unmatched records
const unmatched = await client.reports.getUnmatched(job.data.id);
```

#### Advanced Features (2 paragraphs)
- Scheduled reconciliations
- Custom matching rules
- Confidence scoring
- Export reports

#### Use Cases (3 paragraphs)
- E-commerce: Shopify ↔ Stripe
- SaaS: Subscription events ↔ Billing
- Finance: Multi-platform accounting

#### Next Steps (1 paragraph)
- Try it free: settler.io/signup
- Read docs: docs.settler.io
- Join Discord: discord.gg/settler

#### Conclusion (1 paragraph)
- Recap: 5-minute setup, 99%+ accuracy
- Call to action: Sign up and try it

---

## Feedback Integration

### Post-Signup Survey

**Trigger:** After first successful reconciliation  
**Format:** In-app modal or email  
**Length:** 2-3 questions

**Questions:**

1. **"How helpful was this reconciliation?"**
   - [ ] Very helpful
   - [ ] Somewhat helpful
   - [ ] Not helpful

2. **"What would make it more useful?"** (Open text, optional)

3. **"Rate your experience so far:"** (1-5 stars)

**Implementation:**
```typescript
// Show survey after first reconciliation
if (isFirstReconciliation && !hasCompletedSurvey) {
  showSurveyModal({
    questions: [
      { type: 'radio', question: 'How helpful was this reconciliation?', options: ['Very helpful', 'Somewhat helpful', 'Not helpful'] },
      { type: 'text', question: 'What would make it more useful?', optional: true },
      { type: 'stars', question: 'Rate your experience so far:' }
    ],
    onComplete: (answers) => {
      trackEvent('survey_completed', { answers });
      markSurveyCompleted();
    }
  });
}
```

---

### In-App "Rate Your Setup" Poll

**Trigger:** After viewing first report  
**Format:** Sidebar widget  
**Length:** 1 question

**Question:**
**"How easy was it to set up Settler?"**
- [ ] Very easy (5 stars)
- [ ] Easy (4 stars)
- [ ] Neutral (3 stars)
- [ ] Difficult (2 stars)
- [ ] Very difficult (1 star)

**Follow-up (if < 3 stars):**
**"What was difficult?"** (Open text)

**Implementation:**
```typescript
// Show poll after first report view
if (isFirstReportView && !hasCompletedPoll) {
  showPollWidget({
    question: 'How easy was it to set up Settler?',
    type: 'stars',
    onComplete: (rating) => {
      trackEvent('setup_rating', { rating });
      if (rating < 3) {
        showFollowUpQuestion('What was difficult?');
      }
      markPollCompleted();
    }
  });
}
```

---

### Feature Request Link

**Location:** Dashboard sidebar, footer, or settings page

**Text:** "Request a Feature" or "What's Missing?"

**Link:** [Feature Request Form](https://settler.io/feedback) or GitHub Issues

**Implementation:**
```typescript
// Add feature request link to dashboard
<Sidebar>
  <Link href="/feedback">Request a Feature</Link>
</Sidebar>
```

---

### Feedback Collection Points

| Location | Trigger | Format | Purpose |
|---------|---------|--------|---------|
| **Post-Signup** | After account creation | Email survey | Onboarding experience |
| **First Reconciliation** | After first successful run | In-app modal | Product value |
| **First Report** | After viewing first report | Sidebar poll | Setup ease |
| **Dashboard** | Always visible | Link/button | Feature requests |
| **Settings** | In settings page | Feedback form | General feedback |

---

## Next Steps & TO DOs

### Immediate Actions (This Week)

| Task | Owner | Time Estimate | Priority |
|------|-------|---------------|----------|
| Write Product Hunt post | Marketing | 2 hours | P0 |
| Write Show HN post | Founder | 1 hour | P0 |
| Create launch checklist | Marketing | 1 hour | P0 |
| Draft press release | Marketing | 2 hours | P1 |
| Set up Notion launch board | Operations | 1 hour | P1 |

### Short-Term (This Month)

| Task | Owner | Time Estimate | Priority |
|------|-------|---------------|----------|
| Write blog post | Marketing | 4 hours | P1 |
| Record demo video | Marketing | 4 hours | P1 |
| Set up feedback collection | Engineering | 1 day | P1 |
| Schedule social media posts | Marketing | 2 hours | P2 |

### Long-Term (This Quarter)

| Task | Owner | Time Estimate | Priority |
|------|-------|---------------|----------|
| Analyze launch metrics | Marketing | 1 day | P1 |
| Iterate based on feedback | Product | Ongoing | P1 |
| Plan next launch | Marketing | 1 week | P2 |
| Build community | Marketing | Ongoing | P2 |

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ Ready for Launch

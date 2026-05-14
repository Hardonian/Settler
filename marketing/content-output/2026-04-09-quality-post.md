---
title: "What We Learned Processing $1B+ in Financial Reconciliations"
platform: reddit
subreddit: r/SaaS
pillar: technical-deep-dive
tone: educational
---

# What We Learned Processing $1B+ in Financial Reconciliations

I've been building reconciliation infrastructure for the past 2 years. We just crossed $1B in transactions processed, and I wanted to share some hard-earned lessons.

## The Problem Nobody Talks About

Everyone focuses on the "happy path" - payments flow through, everything matches. But in reality:

- **3-5% of transactions have discrepancies** (timing, fees, exchange rates)
- **Currency conversion** creates invisible precision issues
- **Partial refunds** break simple matching logic
- **Chargebacks** arrive weeks later with different references

## Our Architecture Evolution

**Phase 1: Simple Matching**
```
Transaction ID == Reference Number
```
Worked for 100 transactions. Failed at 10,000.

**Phase 2: Fuzzy Matching**
- Amount within tolerance
- Date within window
- Multiple identifier attempts
- Manual review queue

**Phase 3: Multi-Source Reconciliation**
- Normalize all sources first
- Track lineage
- Handle partial matches
- Automate 95%, queue 5%

## The Algorithms That Actually Work

**1. Tolerance-Based Matching**
Don't match exact amounts. Match within reasonable tolerance (e.g., ±0.5% for FX differences).

**2. Temporal Clustering**
Group transactions by time windows. A Stripe charge and its corresponding payout are usually within 48 hours.

**3. Reference Normalization**
Stripe: `pi_1234567890`
Your DB: `payment_1234567890`
Bank: `STRIPE*TST REF123456`

Same transaction, three formats. Build normalization pipelines.

**4. Confidence Scoring**
Instead of binary match/no-match, calculate confidence:
- Exact ID match: 100%
- Amount + date match: 85%
- Amount only match: 60%
- Flag <80% for review

## The Real Complexity

**Multi-Currency Hell**
- Transaction: $100 USD
- Stripe converts: €92.50
- Your system records: €92.50
- Payout arrives: €91.80 (FX moved)
- Bank statement: €91.75 (additional fees)

Four different amounts, all "correct."

**Our Solution:**
- Store original + converted amounts
- Track FX rates at transaction time
- Separate fee accounting
- Reconcile in original currency when possible

## Performance at Scale

**What Slows Down:**
- O(n²) matching algorithms
- Database JOINs without indexes
- Processing everything in real-time

**What Works:**
- Batch processing (hourly, not per-transaction)
- Incremental reconciliation (only new/changed)
- Pre-computed match candidates
- Read replicas for heavy queries

**Numbers:**
- 10K transactions: ~30 seconds
- 1M transactions: ~5 minutes
- 10M transactions: ~45 minutes (with optimization)

## The 5% Manual Review Problem

Even with 95% automation, someone has to review exceptions. We learned:

1. **Context is everything** - Show related transactions, not just the mismatch
2. **Bulk actions** - Allow approving 100 similar items at once
3. **Learn from reviews** - If humans consistently match X with Y, automate it
4. **Escalation paths** - Some mismatches need finance team, others just need confirmation

## Tools & Tech Stack

- **Database:** PostgreSQL (partitioned by month)
- **Queue:** Redis/RabbitMQ for async processing
- **Monitoring:** Custom reconciliation dashboard
- **Testing:** 1000s of real-world edge cases as test fixtures

## The ROI of Getting This Right

Before: 2 people, 3 days/month on reconciliation
After: 0.5 person, 2 hours/month

At scale, this is the difference between a 10-person finance team and a 3-person team.

## What's Next

We're open-sourcing some of our reconciliation patterns. If you're dealing with this pain, DM me. Happy to share more specifics.

---

*This is based on real experience building [Settler](https://settler.dev) - reconciliation infrastructure for fintech. Not a pitch, just lessons learned.*

**What's your biggest reconciliation headache?** I've probably seen it.

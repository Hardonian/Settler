# Metrics Framework, Growth Hypotheses & Investor Story

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Comprehensive metrics framework, growth hypotheses, and investor update templates

---

## Executive Summary

This document provides a comprehensive metrics framework for tracking Settler's growth, retention, and expansion. It includes growth hypotheses, prioritized experiments, and investor update templates.

**Core Principles:**

1. **Data-Driven:** All decisions based on metrics
2. **Growth-Focused:** Metrics aligned with growth objectives
3. **Investor-Ready:** Clear metrics for investor communication
4. **Actionable:** Metrics drive actionable insights

---

## Comprehensive Metrics Framework

### Activation Metrics

#### Metric 1: Time to First Value (TTFV)

**Definition:** Time from signup to first successful reconciliation

**Target:** <24 hours

**Measurement:**

- Track signup timestamp
- Track first reconciliation timestamp
- Calculate difference

**Segmentation:**

- By plan (Free, Starter, Growth, Scale)
- By source (Organic, Paid, Referral)
- By industry (E-commerce, SaaS, Enterprise)

**Current:** [Tracked in Mixpanel]

---

#### Metric 2: Activation Rate

**Definition:** Percentage of users who complete first reconciliation within 7 days

**Target:** 60%+

**Measurement:**

- Users who created first job / Total signups
- Measure over 7-day window
- Exclude test accounts

**Segmentation:**

- By plan
- By source
- By industry

**Current:** [Tracked in Mixpanel]

---

#### Metric 3: Feature Adoption Rate

**Definition:** Percentage of users who use key features

**Key Features:**

- Webhooks
- Scheduled jobs
- Advanced matching rules
- Multi-platform reconciliation

**Target:** 40%+ for each feature

**Measurement:**

- Users who used feature / Total active users
- Measure over 30-day window

**Current:** [Tracked in Mixpanel]

---

### Retention Metrics

#### Metric 4: Monthly Active Users (MAU)

**Definition:** Number of unique users who used Settler in the past 30 days

**Target:** 80%+ of signups

**Measurement:**

- Count unique users with activity in past 30 days
- Exclude test accounts

**Segmentation:**

- By plan
- By source
- By industry

**Current:** [Tracked in Mixpanel]

---

#### Metric 5: Retention Rate (Cohort Analysis)

**Definition:** Percentage of users who remain active over time

**Cohorts:**

- Week 1 retention
- Week 4 retention
- Week 12 retention
- Week 52 retention

**Targets:**

- Week 1: 70%+
- Week 4: 60%+
- Week 12: 50%+
- Week 52: 40%+

**Measurement:**

- Track user activity by cohort
- Calculate retention rate for each cohort

**Current:** [Tracked in Mixpanel]

---

#### Metric 6: Churn Rate

**Definition:** Percentage of customers who cancel subscription

**Target:** <5% monthly churn

**Measurement:**

- Cancelled customers / Total customers
- Measure over 30-day window
- Exclude free tier

**Segmentation:**

- By plan
- By tenure
- By usage

**Current:** [Tracked in Stripe/Revenue system]

---

### Expansion Metrics

#### Metric 7: Expansion Revenue Rate

**Definition:** Percentage of revenue from existing customers (upgrades, add-ons)

**Target:** 30%+ of MRR

**Measurement:**

- Expansion revenue / Total MRR
- Measure over 30-day window

**Expansion Sources:**

- Plan upgrades
- AI feature add-ons
- Premium extensions
- Additional adapters

**Current:** [Tracked in Stripe/Revenue system]

---

#### Metric 8: Net Revenue Retention (NRR)

**Definition:** Percentage of revenue retained from existing customers (including expansion)

**Target:** 110%+ (10%+ net expansion)

**Measurement:**

- (Starting MRR + Expansion - Churn) / Starting MRR
- Measure over 12-month window

**Current:** [Tracked in Stripe/Revenue system]

---

#### Metric 9: Average Revenue Per User (ARPU)

**Definition:** Average monthly revenue per customer

**Target:** $100+ per month

**Measurement:**

- Total MRR / Total customers
- Measure over 30-day window
- Exclude free tier

**Segmentation:**

- By plan
- By industry
- By usage

**Current:** [Tracked in Stripe/Revenue system]

---

### Growth Metrics

#### Metric 10: Customer Acquisition Cost (CAC)

**Definition:** Average cost to acquire a new customer

**Target:** <$500 per customer

**Measurement:**

- Total acquisition costs / New customers
- Measure over 30-day window

**Acquisition Costs:**

- Marketing spend
- Sales costs
- Content creation
- Tools and software

**Segmentation:**

- By channel (Organic, Paid, Referral, Partnership)
- By plan

**Current:** [Tracked in marketing/sales systems]

---

#### Metric 11: Lifetime Value (LTV)

**Definition:** Average revenue from a customer over their lifetime

**Target:** $2,400+ (2-year average lifetime × $100/month)

**Measurement:**

- ARPU × Average Lifetime
- Average Lifetime = 1 / Monthly Churn Rate

**Segmentation:**

- By plan
- By industry
- By source

**Current:** [Tracked in Stripe/Revenue system]

---

#### Metric 12: LTV:CAC Ratio

**Definition:** Lifetime value divided by customer acquisition cost

**Target:** 5:1+ (for paid channels)

**Measurement:**

- LTV / CAC
- Measure over 12-month window

**Segmentation:**

- By channel
- By plan

**Current:** [Tracked in marketing/sales systems]

---

### Product Metrics

#### Metric 13: Reconciliation Accuracy

**Definition:** Percentage of correctly matched transactions

**Target:** 95%+

**Measurement:**

- Correctly matched / Total transactions
- Exclude manual reviews
- Measure over 30-day window

**Segmentation:**

- By adapter
- By matching rules
- By industry

**Current:** [Tracked in internal dashboard]

---

#### Metric 14: API Error Rate

**Definition:** Percentage of API requests that result in errors

**Target:** <1%

**Measurement:**

- Error requests / Total requests
- Measure over 30-day window
- Exclude 4xx errors (client errors)

**Segmentation:**

- By endpoint
- By error type
- By customer

**Current:** [Tracked in Datadog]

---

#### Metric 15: API Latency

**Definition:** API response time (p50, p95, p99)

**Targets:**

- p50: <100ms
- p95: <500ms
- p99: <1s

**Measurement:**

- Track response time for all API requests
- Calculate percentiles over 30-day window

**Segmentation:**

- By endpoint
- By region

**Current:** [Tracked in Datadog]

---

### Engagement Metrics

#### Metric 16: Daily Active Users (DAU)

**Definition:** Number of unique users who used Settler in the past 24 hours

**Target:** 30%+ of MAU

**Measurement:**

- Count unique users with activity in past 24 hours
- Exclude test accounts

**Segmentation:**

- By plan
- By source

**Current:** [Tracked in Mixpanel]

---

#### Metric 17: Sessions Per User

**Definition:** Average number of sessions per user per month

**Target:** 10+ sessions per month

**Measurement:**

- Total sessions / Total users
- Measure over 30-day window

**Segmentation:**

- By plan
- By source

**Current:** [Tracked in Mixpanel]

---

#### Metric 18: Feature Usage Rate

**Definition:** Percentage of users who use each feature

**Key Features:**

- Dashboard
- API
- Webhooks
- Scheduled jobs
- Reports

**Target:** 50%+ for core features

**Measurement:**

- Users who used feature / Total active users
- Measure over 30-day window

**Current:** [Tracked in Mixpanel]

---

## Growth Hypotheses

### Hypothesis 1: Onboarding Optimization Increases Activation

**Hypothesis:** Simplifying onboarding flow will increase activation rate from 50% to 60%.

**Experiment:**

- A: Current onboarding flow (5 steps)
- B: Simplified onboarding flow (3 steps)

**Metrics:**

- Activation rate (target: 60%+)
- Time to first value (target: <24 hours)
- Drop-off rate

**Timeline:** 2 weeks  
**Priority:** P0 (High)

**Success Criteria:**

- Activation rate increases by 10%+
- Time to first value decreases by 20%+
- Drop-off rate decreases by 15%+

---

### Hypothesis 2: Free Tier Expansion Increases Signups

**Hypothesis:** Expanding free tier from 1K to 2K reconciliations/month will increase signups by 30%.

**Experiment:**

- A: Current free tier (1K reconciliations/month)
- B: Expanded free tier (2K reconciliations/month)

**Metrics:**

- Signup rate
- Conversion to paid (target: 20%+)
- Revenue impact

**Timeline:** 4 weeks  
**Priority:** P1 (Medium)

**Success Criteria:**

- Signup rate increases by 30%+
- Conversion to paid remains >20%
- Revenue increases by 15%+

---

### Hypothesis 3: Referral Program Drives Organic Growth

**Hypothesis:** Referral program will drive 20% of new signups with viral coefficient of 0.3+.

**Experiment:**

- A: No referral program
- B: Referral program (credits for referrer and referee)

**Metrics:**

- Referral rate (target: 20%+)
- Viral coefficient (target: 0.3+)
- Revenue from referrals

**Timeline:** 8 weeks  
**Priority:** P1 (Medium)

**Success Criteria:**

- Referral rate >20%
- Viral coefficient >0.3
- Revenue from referrals >15% of total

---

### Hypothesis 4: Content Marketing Increases Organic Traffic

**Hypothesis:** Scaling content production from 2 to 5 posts/week will increase organic traffic by 50%.

**Experiment:**

- A: Current content production (2 posts/week)
- B: Scaled content production (5 posts/week)

**Metrics:**

- Organic traffic (target: 10K+ monthly)
- Signups from content (target: 15%+)
- SEO rankings

**Timeline:** 12 weeks  
**Priority:** P2 (Lower)

**Success Criteria:**

- Organic traffic increases by 50%+
- Signups from content >15%
- Top 3 rankings for 20+ keywords

---

### Hypothesis 5: AI Features Increase Expansion Revenue

**Hypothesis:** AI-powered features will increase expansion revenue by 25% through upsells.

**Experiment:**

- A: No AI features
- B: AI features (matching, alerts, anomaly detection)

**Metrics:**

- Expansion revenue rate (target: 30%+)
- Upsell rate (target: 30%+)
- Revenue per feature

**Timeline:** 6 months  
**Priority:** P1 (Medium)

**Success Criteria:**

- Expansion revenue rate >30%
- Upsell rate >30%
- Revenue per feature >$1,200/year

---

## Prioritized Feature Experiments

### Experiment 1: AI-Powered Matching (Month 6)

**Hypothesis:** AI-powered matching will improve accuracy from 90% to 95%+.

**Metrics:**

- Reconciliation accuracy (target: 95%+)
- False positive rate (target: <5%)
- Customer satisfaction

**Timeline:** 3 months (development + beta + launch)

**Success Criteria:**

- Accuracy >95%
- False positive rate <5%
- 20%+ adoption rate

---

### Experiment 2: Predictive Alerts (Month 9)

**Hypothesis:** Predictive alerts will reduce reconciliation errors by 30%+.

**Metrics:**

- Error reduction rate (target: 30%+)
- Alert accuracy (target: 80%+)
- Customer satisfaction

**Timeline:** 3 months (development + beta + launch)

**Success Criteria:**

- Error reduction >30%
- Alert accuracy >80%
- 15%+ adoption rate

---

### Experiment 3: Marketplace Launch (Month 9)

**Hypothesis:** Marketplace will drive 30% of adapter usage through community contributions.

**Metrics:**

- Marketplace GMV (target: $2M+ Year 1)
- Adapters listed (target: 100+ Year 1)
- Settler commission (target: $600K+ Year 1)

**Timeline:** 6 months (platform development + developer recruitment + launch)

**Success Criteria:**

- Marketplace GMV >$2M
- Adapters listed >100
- Settler commission >$600K

---

### Experiment 4: White-Label Offering (Month 12)

**Hypothesis:** White-label offering will drive $1M+ ARR from 10+ partners.

**Metrics:**

- Partners onboarded (target: 10+ Year 1)
- Revenue per partner (target: $50K+ per year)
- Total embedded revenue (target: $1M+ Year 1)

**Timeline:** 6 months (infrastructure + partner recruitment + launch)

**Success Criteria:**

- Partners >10
- Revenue per partner >$50K
- Total embedded revenue >$1M

---

## Investor Update Templates

### Template 1: Monthly Investor Update

**Subject:** Settler Monthly Update - [Month Year]

**Body:**

```
Hi [Investor Name],

Here's our monthly update for [Month Year]:

📊 Key Metrics
- MRR: $[X]K (↑[Y]% MoM)
- Customers: [X] (↑[Y]% MoM)
- Churn: [X]% (↓[Y]% MoM)
- NRR: [X]% (↑[Y]% MoM)

🚀 Highlights
- [Key achievement 1]
- [Key achievement 2]
- [Key achievement 3]

📈 Growth
- New customers: [X]
- Expansion revenue: $[X]K
- Key wins: [Customer 1], [Customer 2]

🔧 Product
- [Feature launch 1]
- [Feature launch 2]
- [Product improvement]

💰 Business
- Revenue: $[X]K (↑[Y]% MoM)
- Runway: [X] months
- Key hires: [Role 1], [Role 2]

🎯 Next Month
- [Goal 1]
- [Goal 2]
- [Goal 3]

Questions? Let's chat!

Best,
[Your Name]
```

---

### Template 2: Quarterly Investor Update

**Subject:** Settler Q[Quarter] [Year] Update

**Body:**

```
Hi [Investor Name],

Here's our Q[Quarter] [Year] update:

📊 Quarterly Metrics
- MRR: $[X]K (↑[Y]% QoQ)
- Customers: [X] (↑[Y]% QoQ)
- ARR: $[X]K (↑[Y]% QoQ)
- Churn: [X]% (↓[Y]% QoQ)
- NRR: [X]% (↑[Y]% QoQ)
- CAC: $[X] (↓[Y]% QoQ)
- LTV:CAC: [X]:1 (↑[Y]% QoQ)

🚀 Key Achievements
- [Achievement 1 with metrics]
- [Achievement 2 with metrics]
- [Achievement 3 with metrics]

📈 Growth Highlights
- New customers: [X] (↑[Y]% QoQ)
- Expansion revenue: $[X]K (↑[Y]% QoQ)
- Key wins: [Customer 1], [Customer 2], [Customer 3]

🔧 Product Updates
- [Major feature 1]
- [Major feature 2]
- [Product improvements]

💰 Business Updates
- Revenue: $[X]K (↑[Y]% QoQ)
- Runway: [X] months
- Key hires: [Role 1], [Role 2], [Role 3]
- Fundraising: [Status]

🎯 Next Quarter Goals
- [Goal 1 with metrics]
- [Goal 2 with metrics]
- [Goal 3 with metrics]

📅 Next Steps
- [Action item 1]
- [Action item 2]

Let's schedule a call to discuss!

Best,
[Your Name]
```

---

### Template 3: Annual Investor Update

**Subject:** Settler [Year] Annual Update

**Body:**

```
Hi [Investor Name],

Here's our [Year] annual update:

📊 Annual Metrics
- ARR: $[X]M (↑[Y]% YoY)
- Customers: [X] (↑[Y]% YoY)
- NRR: [X]% (↑[Y]% YoY)
- CAC: $[X] (↓[Y]% YoY)
- LTV:CAC: [X]:1 (↑[Y]% YoY)
- Runway: [X] months

🚀 Key Achievements
- [Achievement 1 with metrics]
- [Achievement 2 with metrics]
- [Achievement 3 with metrics]

📈 Growth Story
- Started year with [X] customers, $[X]K ARR
- Ended year with [X] customers, $[X]M ARR
- Key milestones: [Milestone 1], [Milestone 2], [Milestone 3]

🔧 Product Evolution
- Launched [Feature 1], [Feature 2], [Feature 3]
- Improved [Metric 1] by [X]%, [Metric 2] by [Y]%

💰 Business Highlights
- Revenue growth: [X]% YoY
- Key hires: [Role 1], [Role 2], [Role 3]
- Fundraising: [Status]

🎯 [Next Year] Goals
- ARR: $[X]M (↑[Y]% YoY)
- Customers: [X] (↑[Y]% YoY)
- [Goal 1], [Goal 2], [Goal 3]

📅 Next Steps
- [Action item 1]
- [Action item 2]

Let's schedule a call to discuss [Next Year]!

Best,
[Your Name]
```

---

## Metrics Dashboard

### Executive Dashboard

**Metrics:**

- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Customers (Total, New, Churned)
- Churn Rate
- NRR (Net Revenue Retention)
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- LTV:CAC Ratio

**Visualization:**

- Time series charts
- Cohort analysis
- Funnel visualization
- Comparison charts

---

### Product Dashboard

**Metrics:**

- Activation Rate
- Retention Rate (Cohort)
- Feature Adoption Rate
- Reconciliation Accuracy
- API Error Rate
- API Latency

**Visualization:**

- Funnel charts
- Cohort tables
- Feature usage charts
- Performance charts

---

### Growth Dashboard

**Metrics:**

- Signups (by channel)
- Conversion Rate (by channel)
- CAC (by channel)
- LTV (by channel)
- LTV:CAC (by channel)

**Visualization:**

- Channel comparison charts
- Funnel analysis
- ROI charts

---

## Next Steps

1. **Implement Metrics Tracking:** Set up tracking for all metrics
2. **Create Dashboards:** Build executive, product, and growth dashboards
3. **Run Experiments:** Start running prioritized experiments
4. **Send Updates:** Send monthly investor updates
5. **Iterate:** Continuously improve based on metrics

---

**Contact:** metrics@settler.io | investors@settler.io  
**Last Updated:** January 2026

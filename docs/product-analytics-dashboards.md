# Product Analytics Dashboards

**Version:** 1.0  
**Last Updated:** Phase 7  
**Purpose:** Guide to building product analytics dashboards and monitoring key metrics.

---

## Overview

This document provides recommendations for building product analytics dashboards using the events defined in our [Event Taxonomy](./event-taxonomy.md). These dashboards help track user behavior, measure feature adoption, and analyze experiment results.

**Supported Analytics Tools:**

- Google Analytics 4 (GA4)
- PostHog
- Amplitude
- Mixpanel
- Vercel Analytics
- Custom analytics endpoints

---

## Key Metrics to Monitor

### 1. User Engagement

**Metrics:**

- Daily/Monthly Active Users (DAU/MAU)
- Session duration
- Pages per session
- Return rate

**Events:**

- `session_started`
- `session_ended`
- `page_view`

**Dashboard Query Example:**

```sql
-- DAU (conceptual, tool-agnostic)
SELECT
  DATE(timestamp) as date,
  COUNT(DISTINCT userId) as daily_active_users
FROM events
WHERE event = 'session_started'
GROUP BY DATE(timestamp)
```

---

## 2. Onboarding Funnel

### Funnel Steps

1. `onboarding_started`
2. `onboarding_step_completed` (step 1)
3. `onboarding_step_completed` (step 2)
4. `onboarding_step_completed` (step 3)
5. `onboarding_completed`

### Key Metrics

- **Conversion Rate**: `onboarding_completed` / `onboarding_started`
- **Drop-off Rate**: Users who abandon at each step
- **Time to Complete**: Average duration from start to completion
- **Step Completion Rates**: % of users completing each step

### Dashboard Setup

**Funnel Visualization:**

```
Started → Step 1 → Step 2 → Step 3 → Completed
 100%     85%       70%       60%       55%
```

**Metrics to Track:**

- Overall conversion rate: 55%
- Biggest drop-off: Step 1 → Step 2 (15% drop)
- Average completion time: 5.2 minutes

**Alerts:**

- Conversion rate drops below 50%
- Step completion time exceeds 10 minutes
- Abandon rate increases >20%

---

## 3. Job Creation & Execution Funnel

### Funnel Steps

1. `page_view` (route: '/jobs/new')
2. `job_created`
3. `job_run_started`
4. `job_run_completed` (success)

### Key Metrics

- **Job Creation Rate**: `job_created` / `page_view` (jobs/new)
- **First Run Rate**: `job_run_started` / `job_created`
- **Success Rate**: `job_run_completed` (success=true) / `job_run_started`
- **Time to First Run**: Time between creation and first run

### Dashboard Setup

**Funnel:**

```
View Page → Create Job → Run Job → Success
  100%        45%         80%       95%
```

**Metrics:**

- Job creation conversion: 45%
- First run rate: 80%
- Success rate: 95%

**Cohort Analysis:**

- Track users who create jobs vs. those who don't
- Compare behavior of users who run jobs vs. those who don't

---

## 4. Subscription Funnel

### Funnel Steps

1. `page_view` (route: '/pricing')
2. `cta_clicked` (ctaName: 'pricing_signup')
3. `trial_started`
4. `subscription_started`

### Key Metrics

- **Pricing Page Conversion**: `cta_clicked` / `page_view`
- **Trial Start Rate**: `trial_started` / `cta_clicked`
- **Trial to Paid Conversion**: `subscription_started` / `trial_started`
- **Overall Conversion**: `subscription_started` / `page_view`

### Dashboard Setup

**Funnel:**

```
View Pricing → Click Signup → Start Trial → Subscribe
   100%           25%           80%         30%
```

**Metrics:**

- Pricing page CTR: 25%
- Trial start rate: 80%
- Trial to paid: 30%
- Overall conversion: 6% (25% × 80% × 30%)

**Revenue Metrics:**

- Average Revenue Per User (ARPU)
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (LTV)

---

## 5. Feature Adoption

### Metrics

- **Feature Usage Rate**: `feature_used` / active users
- **Feature Adoption Curve**: Usage over time
- **Power Users**: Users using multiple features

### Dashboard Setup

**Feature Usage Table:**

```
Feature              | Users | Usage Rate | Trend
---------------------|-------|------------|-------
Advanced Matching    | 1,234 | 45%        | ↑ 5%
ML Features          | 567   | 20%        | ↑ 10%
Realtime Dashboard  | 890   | 32%        | → 0%
```

**Adoption Curve:**

- Track `feature_used` events over time
- Compare adoption rates across features
- Identify features with low adoption

---

## 6. Experiment Analysis

### Key Metrics

- **Variant Distribution**: % of users in each variant
- **Conversion Rates**: By variant
- **Statistical Significance**: p-value, confidence intervals
- **Effect Size**: Difference between variants

### Dashboard Setup

**Experiment Results Table:**

```
Experiment              | Variant    | Users | Conversion | Lift
------------------------|------------|-------|------------|-------
Onboarding V2          | Control    | 500   | 55%        | -
                       | Variant A  | 250   | 62%        | +12.7%
                       | Variant B  | 250   | 58%        | +5.5%
Dashboard Layout       | Control    | 1000  | 45%        | -
                       | Compact    | 500   | 48%        | +6.7%
                       | Expanded   | 500   | 42%        | -6.7%
```

**Funnel Comparison:**

- Compare funnels for each variant
- Identify where variants differ
- Measure impact on key metrics

**Statistical Analysis:**

- Calculate p-values
- Determine confidence intervals
- Check for statistical significance

---

## 7. Error & Friction Monitoring

### Metrics

- **Error Rate**: `api_error_shown` / total requests
- **Form Abandon Rate**: `form_abandon` / `form_start`
- **Validation Failure Rate**: `form_validation_failed` / form submissions
- **Feature Flag Fallbacks**: `feature_flag_fallback_triggered` count

### Dashboard Setup

**Error Tracking:**

```
Error Type          | Count | Rate   | Trend
--------------------|-------|--------|-------
API Errors          | 234   | 2.3%   | ↓ 0.5%
Form Validation     | 567   | 5.6%   | ↑ 1.2%
Flag Fallbacks      | 12    | 0.1%   | → 0%
```

**Friction Points:**

- Identify forms with high abandon rates
- Track validation failures by field
- Monitor API error patterns

---

## 8. Retention & Cohort Analysis

### Metrics

- **Day 1 Retention**: Users who return the next day
- **Week 1 Retention**: Users active in first week
- **Month 1 Retention**: Users active in first month
- **Cohort Retention Curves**: Retention over time by cohort

### Dashboard Setup

**Cohort Retention Table:**

```
Cohort      | Day 1 | Day 7 | Day 14 | Day 30
------------|-------|-------|--------|-------
2024-01-01  | 65%   | 45%   | 35%    | 25%
2024-01-08  | 70%   | 50%   | 40%    | -
2024-01-15  | 68%   | 48%   | -      | -
```

**Retention Curve:**

- Plot retention over time
- Compare cohorts
- Identify trends

---

## Dashboard Implementation

### Google Analytics 4 (GA4)

**Custom Events:**
All events from our taxonomy are automatically sent to GA4.

**Funnel Setup:**

1. Go to Explore → Funnel Exploration
2. Add events in order: `onboarding_started` → `onboarding_step_completed` → `onboarding_completed`
3. Set conversion window

**Custom Dimensions:**

- `experiment_key` - Experiment identifier
- `experiment_variant` - Variant name
- `user_segment` - User segment

### PostHog

**Event Tracking:**
Events are sent with properties including experiment context.

**Funnel Setup:**

1. Create funnel in PostHog
2. Add steps: `onboarding_started` → `onboarding_completed`
3. Filter by experiment variant if needed

**Cohort Analysis:**

- Create cohorts based on experiment variants
- Compare behavior between cohorts

### Amplitude

**Event Properties:**
All events include standard properties (userId, timestamp, route).

**Chart Builder:**

1. Create funnel chart
2. Add events in sequence
3. Group by experiment variant
4. Set conversion window

---

## Recommended Dashboards

### 1. Executive Dashboard

**Metrics:**

- DAU/MAU
- Conversion rates (onboarding, subscription)
- Revenue metrics (MRR, ARPU)
- Experiment results summary

**Update Frequency:** Daily

### 2. Product Dashboard

**Metrics:**

- Feature adoption rates
- User engagement (sessions, duration)
- Funnel conversion rates
- Error rates

**Update Frequency:** Real-time / Hourly

### 3. Experiment Dashboard

**Metrics:**

- Active experiments
- Variant distributions
- Conversion rates by variant
- Statistical significance

**Update Frequency:** Real-time

### 4. Growth Dashboard

**Metrics:**

- User acquisition
- Activation rate
- Retention curves
- Referral metrics

**Update Frequency:** Daily

---

## Query Examples

### Onboarding Conversion Rate

```javascript
// Conceptual query (adapt to your analytics tool)
SELECT
  COUNT(DISTINCT CASE WHEN event = 'onboarding_completed' THEN userId END) * 100.0 /
  COUNT(DISTINCT CASE WHEN event = 'onboarding_started' THEN userId END) as conversion_rate
FROM events
WHERE event IN ('onboarding_started', 'onboarding_completed')
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
```

### Experiment Conversion Comparison

```javascript
// Compare conversion rates by variant
SELECT
  properties.experiment_variant as variant,
  COUNT(DISTINCT CASE WHEN event = 'subscription_started' THEN userId END) * 100.0 /
  COUNT(DISTINCT CASE WHEN event = 'trial_started' THEN userId END) as conversion_rate
FROM events
WHERE properties.experiment_key = 'experiment_checkout_v2'
  AND event IN ('trial_started', 'subscription_started')
GROUP BY properties.experiment_variant
```

### Feature Adoption Over Time

```javascript
// Track feature usage over time
SELECT
  DATE(timestamp) as date,
  properties.feature_name as feature,
  COUNT(DISTINCT userId) as users
FROM events
WHERE event = 'feature_used'
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(timestamp), properties.feature_name
ORDER BY date DESC, feature
```

---

## Alerts & Monitoring

### Critical Alerts

1. **Conversion Rate Drop**
   - Alert if onboarding conversion drops below 50%
   - Alert if subscription conversion drops below 25%

2. **Error Rate Spike**
   - Alert if API error rate exceeds 5%
   - Alert if form validation failures exceed 10%

3. **Experiment Anomalies**
   - Alert if variant distribution is unbalanced (>10% difference)
   - Alert if experiment assignment failures exceed 1%

### Weekly Reports

**Include:**

- Key metrics summary
- Top performing experiments
- Feature adoption highlights
- Friction points identified

---

## Best Practices

1. **Consistent Event Naming**: Use events from taxonomy
2. **Include Experiment Context**: Always include experiment info in events
3. **Track Funnels**: Set up funnels for key user journeys
4. **Monitor Trends**: Track metrics over time, not just snapshots
5. **Compare Cohorts**: Analyze behavior by user cohorts
6. **Test Queries**: Verify queries return expected results
7. **Document Dashboards**: Document what each dashboard shows

---

## Next Steps

1. **Set up dashboards** in your analytics tool
2. **Configure alerts** for critical metrics
3. **Schedule reports** for stakeholders
4. **Review regularly** to identify trends
5. **Iterate** based on insights

---

## Related Documentation

- [Event Taxonomy](./event-taxonomy.md) - Complete event catalog
- [Feature Flags & Experiments](./feature-flags-and-experiments.md) - Experiment setup
- [Analytics Implementation](../packages/web/src/lib/analytics/README.md) - Technical details

---

**Questions?** Check the event taxonomy or reach out to the analytics team.

# Metrics & Product Iteration Engine

**Complete product metrics framework: KPIs, collection queries, hypotheses, and experiment framework**

---

## Table of Contents

1. [Product Metrics & KPIs](#product-metrics--kpis)
2. [Collection Tools & Queries](#collection-tools--queries)
3. [Hypotheses & Experiments](#hypotheses--experiments)
4. [Iteration Framework](#iteration-framework)

---

## Product Metrics & KPIs

### Activation Metrics

**Definition:** User completes key actions that indicate they've derived value from Settler.

**Key Actions:**

1. **Account Created** - User signs up
2. **API Key Generated** - User gets API key
3. **First Job Created** - User creates reconciliation job
4. **First Reconciliation Run** - User runs reconciliation
5. **First Report Viewed** - User views results

**Activation Rate:**

```
Activation Rate = Users who completed all 5 actions / Total signups
Target: 60%+
```

**Funnel:**

```
Signups → API Key Generated → Job Created → Reconciliation Run → Report Viewed
100%     → 80%                → 60%         → 50%                → 40%
```

**SQL Query:**

```sql
-- Activation funnel
WITH activation_steps AS (
  SELECT
    u.id as user_id,
    u.created_at as signup_date,
    CASE WHEN ak.id IS NOT NULL THEN 1 ELSE 0 END as has_api_key,
    CASE WHEN j.id IS NOT NULL THEN 1 ELSE 0 END as has_job,
    CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END as has_execution,
    CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END as has_report
  FROM users u
  LEFT JOIN api_keys ak ON u.id = ak.user_id
  LEFT JOIN jobs j ON u.id = j.user_id
  LEFT JOIN executions e ON j.id = e.job_id
  LEFT JOIN reports r ON j.id = r.job_id
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
)
SELECT
  COUNT(*) as total_signups,
  SUM(has_api_key) as api_key_generated,
  SUM(has_job) as job_created,
  SUM(has_execution) as reconciliation_run,
  SUM(has_report) as report_viewed,
  ROUND(100.0 * SUM(has_report) / COUNT(*), 2) as activation_rate
FROM activation_steps;
```

---

### Onboarding Dropoff Metrics

**Definition:** Where users drop off during onboarding.

**Dropoff Points:**

1. **After Signup** - User doesn't generate API key
2. **After API Key** - User doesn't create job
3. **After Job Creation** - User doesn't run reconciliation
4. **After First Run** - User doesn't view report

**Dropoff Rate:**

```
Dropoff Rate = Users who drop off at step X / Users who reached step X
```

**SQL Query:**

```sql
-- Onboarding dropoff analysis
WITH user_journey AS (
  SELECT
    u.id,
    u.created_at,
    MIN(ak.created_at) as api_key_date,
    MIN(j.created_at) as job_date,
    MIN(e.created_at) as execution_date,
    MIN(r.created_at) as report_date
  FROM users u
  LEFT JOIN api_keys ak ON u.id = ak.user_id
  LEFT JOIN jobs j ON u.id = j.user_id
  LEFT JOIN executions e ON j.id = e.job_id
  LEFT JOIN reports r ON j.id = r.job_id
  WHERE u.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY u.id, u.created_at
)
SELECT
  COUNT(*) as total_signups,
  COUNT(api_key_date) as reached_api_key,
  COUNT(job_date) as reached_job,
  COUNT(execution_date) as reached_execution,
  COUNT(report_date) as reached_report,
  ROUND(100.0 * (COUNT(*) - COUNT(api_key_date)) / COUNT(*), 2) as dropoff_after_signup,
  ROUND(100.0 * (COUNT(api_key_date) - COUNT(job_date)) / COUNT(api_key_date), 2) as dropoff_after_api_key,
  ROUND(100.0 * (COUNT(job_date) - COUNT(execution_date)) / COUNT(job_date), 2) as dropoff_after_job,
  ROUND(100.0 * (COUNT(execution_date) - COUNT(report_date)) / COUNT(execution_date), 2) as dropoff_after_execution
FROM user_journey;
```

---

### Reconciliation/Job Success Rate

**Definition:** Percentage of reconciliation jobs that complete successfully.

**Success Rate:**

```
Success Rate = Successful Executions / Total Executions
Target: >95%
```

**SQL Query:**

```sql
-- Reconciliation success rate
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_executions,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM executions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

**By Job:**

```sql
-- Success rate by job
SELECT
  j.id,
  j.name,
  COUNT(e.id) as total_executions,
  SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / COUNT(e.id), 2) as success_rate
FROM jobs j
LEFT JOIN executions e ON j.id = e.job_id
WHERE j.created_at >= NOW() - INTERVAL '30 days'
GROUP BY j.id, j.name
HAVING COUNT(e.id) > 0
ORDER BY success_rate ASC;
```

---

### Error Rates

**Definition:** Percentage of operations that result in errors.

**Error Types:**

1. **API Errors** - 4xx/5xx HTTP errors
2. **Reconciliation Errors** - Failed reconciliations
3. **Webhook Errors** - Failed webhook deliveries
4. **Adapter Errors** - Adapter-specific errors

**Error Rate:**

```
Error Rate = Errors / Total Operations
Target: <1%
```

**SQL Query:**

```sql
-- API error rate
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as total_requests,
  SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors,
  ROUND(100.0 * SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) / COUNT(*), 2) as error_rate
FROM audit_logs
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;
```

**By Error Type:**

```sql
-- Error breakdown by type
SELECT
  error_type,
  COUNT(*) as error_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM audit_logs
WHERE status_code >= 400
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY error_type
ORDER BY error_count DESC;
```

---

### Feedback Response Time

**Definition:** Time to respond to user feedback (support tickets, feature requests, etc.).

**Response Time:**

```
Response Time = Time to first response
Target: <24 hours
```

**SQL Query:**

```sql
-- Feedback response time
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_feedback,
  AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 3600) as avg_response_hours,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_response_at - created_at)) / 3600) as median_response_hours
FROM feedback
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND first_response_at IS NOT NULL
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

---

## Collection Tools & Queries

### Tools Stack

| Tool                 | Purpose            | Cost                    |
| -------------------- | ------------------ | ----------------------- |
| **PostgreSQL**       | Primary data store | Free (self-hosted)      |
| **Metabase**         | BI/Analytics       | Free (self-hosted)      |
| **Mixpanel**         | Product analytics  | $25/mo+                 |
| **Amplitude**        | Product analytics  | Free (up to 10M events) |
| **Google Analytics** | Web analytics      | Free                    |
| **Segment**          | Data collection    | $120/mo+                |

### Recommended: Metabase Setup

**Why Metabase:**

- Free and open source
- Easy SQL queries
- Beautiful dashboards
- Self-hosted (data stays in your database)

**Setup:**

```bash
# Using Docker
docker run -d -p 3000:3000 \
  -e "MB_DB_TYPE=postgres" \
  -e "MB_DB_DBNAME=settler" \
  -e "MB_DB_PORT=5432" \
  -e "MB_DB_USER=postgres" \
  -e "MB_DB_PASS=postgres" \
  -e "MB_DB_HOST=host.docker.internal" \
  --name metabase metabase/metabase
```

**Access:** http://localhost:3000

---

### Key Dashboards

#### Dashboard 1: Activation Funnel

**Panels:**

1. Signups (line chart, last 30 days)
2. Activation funnel (funnel chart)
3. Dropoff by step (bar chart)
4. Time to activation (histogram)

**Queries:**

- Use activation funnel SQL query above
- Use onboarding dropoff SQL query above

---

#### Dashboard 2: Product Health

**Panels:**

1. Reconciliation success rate (line chart)
2. Error rate (line chart)
3. Average reconciliation duration (line chart)
4. Top error types (bar chart)

**Queries:**

- Use reconciliation success rate SQL query above
- Use error rate SQL query above

---

#### Dashboard 3: User Engagement

**Panels:**

1. Daily active users (line chart)
2. Weekly active users (line chart)
3. Jobs per user (histogram)
4. Reconciliations per user (histogram)

**Queries:**

```sql
-- Daily active users
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(DISTINCT user_id) as dau
FROM executions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

```sql
-- Jobs per user
SELECT
  user_id,
  COUNT(*) as job_count
FROM jobs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY job_count DESC;
```

---

## Hypotheses & Experiments

### Hypothesis Framework

**Format:**

```
We believe that [doing X] will result in [outcome Y] because [reason Z].

We'll know we're right when [metric M] [changes by N%].
```

**Example:**

```
We believe that adding a "Quick Start" tutorial will increase activation rate because new users need guidance.

We'll know we're right when activation rate increases from 40% to 60% within 2 weeks.
```

---

### Top Hypotheses to Test

#### Hypothesis 1: Onboarding Tutorial Increases Activation

**Hypothesis:**

```
We believe that adding an interactive onboarding tutorial will increase activation rate because new users need step-by-step guidance.

We'll know we're right when activation rate increases from 40% to 60% within 2 weeks.
```

**Experiment:**

- **Control:** Current onboarding (no tutorial)
- **Variant:** Onboarding with interactive tutorial
- **Split:** 50/50 A/B test
- **Duration:** 2 weeks
- **Sample Size:** 100 users per variant

**Metrics:**

- Activation rate
- Time to activation
- Dropoff at each step

**Success Criteria:**

- Activation rate increases by 20%+
- Time to activation decreases by 30%+

---

#### Hypothesis 2: Pre-built Templates Increase Job Creation

**Hypothesis:**

```
We believe that offering pre-built job templates (Shopify-Stripe, QuickBooks-PayPal, etc.) will increase job creation rate because users don't need to configure from scratch.

We'll know we're right when job creation rate increases from 60% to 80% within 2 weeks.
```

**Experiment:**

- **Control:** Manual job creation (current)
- **Variant:** Template-based job creation
- **Split:** 50/50 A/B test
- **Duration:** 2 weeks

**Metrics:**

- Job creation rate
- Time to first job
- Template usage rate

**Success Criteria:**

- Job creation rate increases by 20%+
- Time to first job decreases by 50%+

---

#### Hypothesis 3: In-App Help Reduces Support Tickets

**Hypothesis:**

```
We believe that adding contextual help tooltips and documentation links will reduce support tickets because users can self-serve.

We'll know we're right when support ticket volume decreases by 30% within 1 month.
```

**Experiment:**

- **Control:** Current UI (no help tooltips)
- **Variant:** UI with contextual help
- **Split:** 50/50 A/B test
- **Duration:** 1 month

**Metrics:**

- Support ticket volume
- Help tooltip clicks
- Documentation page views

**Success Criteria:**

- Support ticket volume decreases by 30%+
- Help tooltip click rate > 20%

---

#### Hypothesis 4: Email Reminders Increase Re-engagement

**Hypothesis:**

```
We believe that sending email reminders to inactive users will increase re-engagement because users forget about Settler.

We'll know we're right when re-engagement rate increases from 10% to 25% within 1 month.
```

**Experiment:**

- **Control:** No email reminders
- **Variant:** Email reminders after 7 days of inactivity
- **Split:** 50/50 A/B test
- **Duration:** 1 month

**Metrics:**

- Re-engagement rate (users who return after reminder)
- Email open rate
- Email click rate

**Success Criteria:**

- Re-engagement rate increases by 15%+
- Email open rate > 30%

---

#### Hypothesis 5: Free Tier Limits Increase Conversions

**Hypothesis:**

```
We believe that reducing free tier limits (from 1,000 to 100 reconciliations/month) will increase paid conversions because users hit limits faster.

We'll know we're right when conversion rate increases from 5% to 10% within 1 month.
```

**Experiment:**

- **Control:** Current free tier (1,000 reconciliations/month)
- **Variant:** Reduced free tier (100 reconciliations/month)
- **Split:** 50/50 A/B test
- **Duration:** 1 month

**Metrics:**

- Conversion rate (free → paid)
- Time to conversion
- Churn rate

**Success Criteria:**

- Conversion rate increases by 5%+
- No increase in churn rate

---

### Experiment Tracking

**Experiment Log:**

| Experiment          | Hypothesis              | Status  | Start Date | End Date   | Results |
| ------------------- | ----------------------- | ------- | ---------- | ---------- | ------- |
| Onboarding Tutorial | Increases activation    | Running | 2026-01-15 | 2026-01-29 | TBD     |
| Pre-built Templates | Increases job creation  | Planned | TBD        | TBD        | -       |
| In-App Help         | Reduces support tickets | Planned | TBD        | TBD        | -       |
| Email Reminders     | Increases re-engagement | Planned | TBD        | TBD        | -       |
| Free Tier Limits    | Increases conversions   | Planned | TBD        | TBD        | -       |

---

## Iteration Framework

### What to Double Down On

**If metrics flare up in specific areas:**

#### Onboarding Too Slow

**Symptoms:**

- Time to activation > 7 days
- Dropoff rate > 50% after signup
- Support tickets about setup

**Actions:**

1. **Simplify onboarding:**
   - Reduce steps
   - Add progress indicator
   - Pre-fill defaults

2. **Add guidance:**
   - Interactive tutorial
   - Tooltips and help text
   - Video walkthrough

3. **Improve documentation:**
   - Quick start guide
   - Common issues FAQ
   - Example code snippets

**Success Metrics:**

- Time to activation < 1 day
- Dropoff rate < 30%
- Support tickets decrease

---

#### Confusion About Value

**Symptoms:**

- Low activation rate (< 40%)
- High churn rate (> 10%)
- Support tickets: "What does Settler do?"

**Actions:**

1. **Improve messaging:**
   - Clear value proposition
   - Use cases and examples
   - Customer testimonials

2. **Add value demonstration:**
   - Demo video
   - Interactive demo
   - Sample data

3. **Onboarding improvements:**
   - Show value early
   - Quick wins
   - Success metrics

**Success Metrics:**

- Activation rate > 60%
- Churn rate < 5%
- Support tickets decrease

---

#### Low Engagement

**Symptoms:**

- Low daily active users (< 10%)
- Low job creation rate (< 50%)
- High inactivity (> 30 days)

**Actions:**

1. **Increase engagement:**
   - Email reminders
   - In-app notifications
   - Weekly digests

2. **Add features:**
   - Scheduled reconciliations
   - Alerts and notifications
   - Dashboard improvements

3. **Improve value:**
   - Better matching accuracy
   - Faster reconciliation
   - More integrations

**Success Metrics:**

- Daily active users > 20%
- Job creation rate > 70%
- Inactivity < 20%

---

#### High Error Rate

**Symptoms:**

- Reconciliation success rate < 90%
- High support tickets about errors
- User complaints about accuracy

**Actions:**

1. **Fix bugs:**
   - Identify common errors
   - Fix root causes
   - Add error handling

2. **Improve matching:**
   - Better algorithms
   - More matching rules
   - Confidence scoring

3. **Better error messages:**
   - Clear error descriptions
   - Actionable solutions
   - Support links

**Success Metrics:**

- Success rate > 95%
- Support tickets decrease
- User satisfaction increases

---

### Experimentation Process

**Step 1: Identify Problem**

- Review metrics
- Gather user feedback
- Identify pain points

**Step 2: Form Hypothesis**

- Write hypothesis using framework
- Define success criteria
- Estimate impact

**Step 3: Design Experiment**

- Choose experiment type (A/B test, feature flag, etc.)
- Define control and variant
- Set sample size and duration

**Step 4: Run Experiment**

- Implement variant
- Monitor metrics
- Collect feedback

**Step 5: Analyze Results**

- Compare metrics
- Statistical significance
- User feedback

**Step 6: Decide**

- **If successful:** Roll out to all users
- **If unsuccessful:** Iterate or abandon
- **If inconclusive:** Extend experiment

---

## Next Steps & TO DOs

### Immediate Actions (This Week)

| Task                               | Owner       | Time Estimate | Priority |
| ---------------------------------- | ----------- | ------------- | -------- |
| Set up Metabase                    | Engineering | 1 day         | P0       |
| Create activation funnel dashboard | Product     | 4 hours       | P0       |
| Create product health dashboard    | Product     | 4 hours       | P0       |
| Define key metrics                 | Product     | 2 hours       | P1       |

### Short-Term (This Month)

| Task                                       | Owner       | Time Estimate | Priority |
| ------------------------------------------ | ----------- | ------------- | -------- |
| Set up Mixpanel/Amplitude                  | Engineering | 1 day         | P1       |
| Create user engagement dashboard           | Product     | 4 hours       | P1       |
| Run first experiment (onboarding tutorial) | Product     | 2 weeks       | P1       |
| Document experiment process                | Product     | 2 hours       | P2       |

### Long-Term (This Quarter)

| Task                              | Owner       | Time Estimate | Priority |
| --------------------------------- | ----------- | ------------- | -------- |
| Run 5+ experiments                | Product     | Ongoing       | P1       |
| Build experimentation framework   | Engineering | 1 week        | P2       |
| Create metrics dashboard for team | Product     | 1 week        | P2       |
| Automate metric collection        | Engineering | 1 week        | P2       |

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ Ready for Implementation

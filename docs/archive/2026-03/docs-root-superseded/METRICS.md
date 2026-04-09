# Metrics Documentation - Settler Enterprise

**Last Updated:** December 2024

---

## Overview

Settler tracks comprehensive metrics across product, business, and technical dimensions to drive data-driven decisions.

---

## 1. Product Metrics

### Time-to-Value

**Definition:** Time from signup to first successful reconciliation

**Target:** <5 minutes

**Measurement:**

- Event: `onboarding_completed` → `job_run_completed`
- Tracked in: `product_events` table
- Dashboard: `/console/admin/activation`

**Improvement:**

- Optimize onboarding flow
- Reduce steps to first value
- Improve documentation

### Activation Funnel

**Stages:**

1. Signup
2. Email verification
3. Tenant creation
4. Provider connection
5. First reconciliation

**Metrics:**

- Conversion rate per stage
- Drop-off points
- Time between stages

**Dashboard:** `/console/admin/activation`

### Feature Adoption

**Metrics:**

- Reconciliation API usage
- Receipt parsing usage
- Feature flags usage
- Developer console usage

**Measurement:**

- API call counts per feature
- Unique users per feature
- Usage trends over time

---

## 2. Business Metrics

### Revenue Metrics

**Monthly Recurring Revenue (MRR)**

- Calculation: Sum of all active subscription base prices
- Target: $1M ARR Year 1
- Tracked: Monthly

**Annual Recurring Revenue (ARR)**

- Calculation: MRR × 12
- Target: $1M Year 1 → $50M Year 5
- Tracked: Annually

**Average Revenue Per User (ARPU)**

- Calculation: MRR / Active Customers
- Target: $83/month
- Tracked: Monthly

**Revenue Growth Rate**

- Calculation: (Current MRR - Previous MRR) / Previous MRR
- Target: 20%+ monthly
- Tracked: Monthly

### Customer Metrics

**Customer Acquisition Cost (CAC)**

- Calculation: Sales & Marketing Spend / New Customers
- Target: <$100
- Tracked: Monthly

**Customer Lifetime Value (LTV)**

- Calculation: ARPU × Average Lifetime (months)
- Target: $500+
- Tracked: Quarterly

**LTV/CAC Ratio**

- Calculation: LTV / CAC
- Target: 5:1+
- Tracked: Quarterly

**Churn Rate**

- Calculation: Lost Customers / Total Customers
- Target: <5% monthly
- Tracked: Monthly

**Net Revenue Retention (NRR)**

- Calculation: (Starting MRR + Expansion - Churn) / Starting MRR
- Target: >100%
- Tracked: Monthly

### Usage Metrics

**Transactions Processed**

- Total transactions per month
- Per customer average
- Growth rate

**API Calls**

- Total API calls per month
- Per customer average
- Error rate

**Reconciliation Runs**

- Total runs per month
- Success rate
- Match rate

---

## 3. Technical Metrics

### API Performance

**Request Rate (RPS)**

- Requests per second
- Target: Handle 1000+ RPS
- Tracked: Real-time

**Error Rate**

- Percentage of failed requests
- Target: <1%
- Tracked: Real-time

**Latency**

- p50, p95, p99 response times
- Target: p95 <200ms
- Tracked: Real-time

**Success Rate**

- Percentage of successful requests
- Target: >99%
- Tracked: Real-time

**Uptime**

- Service availability
- Target: 99.9% SLA
- Tracked: Continuous

### Infrastructure Metrics

**Database Performance**

- Connection pool usage (<80% target)
- Query performance
- Slow query count

**Cache Performance**

- Hit rate (>80% target)
- Miss rate
- Eviction rate

**Resource Usage**

- CPU usage
- Memory usage
- Network usage

### Reliability Metrics

**Mean Time Between Failures (MTBF)**

- Average time between incidents
- Target: >720 hours (30 days)
- Tracked: Monthly

**Mean Time To Recovery (MTTR)**

- Average time to resolve incidents
- Target: <1 hour
- Tracked: Per incident

**Error Rate by Endpoint**

- Error rate per API endpoint
- Target: <1% per endpoint
- Tracked: Real-time

---

## 4. Security Metrics

### Access Metrics

**Failed Login Attempts**

- Count of failed logins
- Target: <100/day
- Tracked: Daily

**Suspicious Activity**

- Unusual access patterns
- Target: 0 incidents
- Tracked: Real-time

### Compliance Metrics

**Data Access Logs**

- All data access logged
- Retention: 90 days
- Tracked: Continuous

**Audit Trail Completeness**

- Percentage of actions logged
- Target: 100%
- Tracked: Continuous

---

## 5. Operational Metrics

### Support Metrics

**Ticket Volume**

- Tickets per month
- Target: <10% of customer base
- Tracked: Monthly

**Response Time**

- Average response time
- Target: <4 hours
- Tracked: Per ticket

**Resolution Time**

- Average resolution time
- Target: <24 hours
- Tracked: Per ticket

**Customer Satisfaction (CSAT)**

- Satisfaction score
- Target: >4.5/5
- Tracked: Per ticket

### Deployment Metrics

**Deployment Frequency**

- Deployments per week
- Target: Multiple per week
- Tracked: Weekly

**Deployment Success Rate**

- Percentage of successful deployments
- Target: >95%
- Tracked: Per deployment

**Rollback Rate**

- Percentage of deployments rolled back
- Target: <5%
- Tracked: Per deployment

---

## 6. Measurement Implementation

### Data Collection

**Product Events:**

- Location: `packages/web/src/lib/telemetry/product-events.ts`
- Storage: `product_events` table
- Tracking: Comprehensive event tracking

**Usage Events:**

- Location: `usage_events` table
- Storage: Database
- Tracking: All API usage tracked

**Business Metrics:**

- Location: Admin dashboards
- Storage: Aggregated from events
- Tracking: Real-time aggregation

### Dashboards

**Admin Dashboard:**

- URL: `/console/admin`
- Metrics: All key metrics
- Updates: Real-time

**Activation Funnel:**

- URL: `/console/admin/activation`
- Metrics: Funnel conversion rates
- Updates: Real-time

**System Health:**

- URL: `/api/ops/system-health`
- Metrics: Technical metrics
- Updates: Real-time

**Costs:**

- URL: `/console/costs`
- Metrics: Infrastructure costs
- Updates: Daily

---

## 7. Key Performance Indicators (KPIs)

### Product KPIs

1. **Time-to-Value:** <5 minutes
2. **Activation Rate:** >50% (signup → first reconciliation)
3. **Feature Adoption:** >80% of customers use core features
4. **User Satisfaction:** >4.5/5

### Business KPIs

1. **MRR Growth:** 20%+ monthly
2. **Churn Rate:** <5% monthly
3. **LTV/CAC:** 5:1+
4. **CAC Payback:** <3 months

### Technical KPIs

1. **Uptime:** 99.9% SLA
2. **Error Rate:** <1%
3. **Latency:** p95 <200ms
4. **MTTR:** <1 hour

---

## 8. Reporting

### Daily Reports

**Generated:** Automatically at 07:40 and 16:40 ET
**Location:** `ops/reports/FOUNDERS_DAILY_REPORT.md`
**Content:**

- Growth metrics
- Activation funnel
- Usage metrics
- Revenue metrics
- Billing health
- Risk indicators

### Weekly Reports

**Generated:** Every Monday at 07:40 ET
**Location:** `ops/reports/FOUNDERS_WEEKLY_REPORT.md`
**Content:**

- Week-over-week trends
- Key metrics summary
- Recommendations
- Risk assessment

### Monthly Reports

**Generated:** First of each month
**Content:**

- Monthly summary
- Trend analysis
- Goal progress
- Strategic recommendations

---

## 9. Metric Targets

### Year 1 Targets

**Product:**

- Time-to-value: <5 minutes ✅
- Activation rate: >50%
- Feature adoption: >80%

**Business:**

- MRR: $83K/month ($1M ARR)
- Customers: 1,000
- Churn: <5% monthly
- LTV/CAC: 5:1+

**Technical:**

- Uptime: 99.9%
- Error rate: <1%
- Latency: p95 <200ms

### Year 3 Targets

**Business:**

- MRR: $833K/month ($10M ARR)
- Customers: 10,000
- Churn: <3% monthly
- LTV/CAC: 7:1+

### Year 5 Targets

**Business:**

- MRR: $4.2M/month ($50M ARR)
- Customers: 50,000
- Churn: <2% monthly
- LTV/CAC: 10:1+

---

## 10. Metric Monitoring

### Real-Time Monitoring

**Tools:**

- Sentry (error tracking)
- Vercel Analytics (performance)
- Custom dashboards (business metrics)

**Alerts:**

- Error rate >5%
- Latency >500ms
- Uptime <99%
- Churn spike

### Historical Analysis

**Tools:**

- Database queries
- Aggregated reports
- Custom analytics

**Analysis:**

- Trend analysis
- Cohort analysis
- Funnel analysis
- Retention analysis

---

**Last Updated:** December 2024  
**Next Review:** Quarterly

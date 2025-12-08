# Operational Readiness & SRE Playbook

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Comprehensive SRE runbooks, alerting rules, incident workflows, and KPIs/SLIs

---

## Executive Summary

This document provides comprehensive operational guidance for Settler's Site Reliability Engineering (SRE) team. It covers onboarding, runbooks, alerting, incident response, and performance monitoring.

**Core Principles:**
1. **Reliability First:** 99.9%+ uptime is non-negotiable
2. **Automation:** Automate everything possible
3. **Observability:** Full visibility into system health
4. **Incident Response:** Fast, effective incident response

---

## New Hire Onboarding Guide

### Week 1: Infrastructure Overview

**Day 1: Introduction**
- [ ] Welcome meeting with SRE lead
- [ ] Access to all systems (AWS, Vercel, Cloudflare, Datadog)
- [ ] Review architecture diagram
- [ ] Review infrastructure documentation

**Day 2: Core Infrastructure**
- [ ] Review AWS setup (Lambda, RDS, S3)
- [ ] Review Vercel deployment process
- [ ] Review Cloudflare configuration
- [ ] Review database setup (PostgreSQL, Redis)

**Day 3: Monitoring & Observability**
- [ ] Review Datadog dashboards
- [ ] Review alerting rules
- [ ] Review logging setup (Axiom, Datadog Logs)
- [ ] Review error tracking (Sentry)

**Day 4: CI/CD & Deployment**
- [ ] Review GitHub Actions workflows
- [ ] Review deployment process
- [ ] Review rollback procedures
- [ ] Practice deployment (staging)

**Day 5: Incident Response**
- [ ] Review incident response playbook
- [ ] Review on-call rotation
- [ ] Review escalation procedures
- [ ] Practice incident scenario

---

### Week 2: Deep Dive

**Day 6-7: API Infrastructure**
- [ ] Review API architecture
- [ ] Review API endpoints
- [ ] Review rate limiting
- [ ] Review authentication/authorization

**Day 8-9: Reconciliation Engine**
- [ ] Review reconciliation engine architecture
- [ ] Review matching algorithms
- [ ] Review adapter system
- [ ] Review job processing

**Day 10: Testing & Validation**
- [ ] Review test suite
- [ ] Review load testing setup
- [ ] Review chaos engineering
- [ ] Practice troubleshooting

---

### Key Infrastructure Documents

**Architecture:**
- `/docs/architecture.md` - System architecture
- `/docs/infrastructure.md` - Infrastructure details
- `/docs/deployment.md` - Deployment process

**Operations:**
- `/docs/runbooks/` - Operational runbooks
- `/docs/alerts.md` - Alerting rules
- `/docs/incidents.md` - Incident response

**Development:**
- `/docs/contributing.md` - Contribution guidelines
- `/docs/development.md` - Development setup
- `/docs/testing.md` - Testing guide

---

## SRE Runbooks

### Runbook 1: API Latency Degradation

**Symptoms:**
- API response time >500ms (p95)
- Increased error rate
- Customer complaints

**Investigation Steps:**
1. **Check Datadog Dashboards:**
   - API latency dashboard
   - Error rate dashboard
   - Database performance dashboard

2. **Check Logs:**
   - Recent errors in Axiom/Datadog Logs
   - Slow queries in database logs
   - API gateway logs

3. **Check Infrastructure:**
   - Lambda function metrics (duration, errors)
   - Database metrics (CPU, connections, queries)
   - Redis metrics (memory, connections)

**Resolution Steps:**
1. **If Database Issue:**
   - Check slow queries
   - Optimize queries
   - Scale database if needed

2. **If Lambda Issue:**
   - Check function logs
   - Check cold starts
   - Scale functions if needed

3. **If External API Issue:**
   - Check adapter API status
   - Implement retries
   - Use cached data if available

**Prevention:**
- Set up alerting for latency thresholds
- Regular performance testing
- Database query optimization
- Caching strategy

---

### Runbook 2: Database Connection Exhaustion

**Symptoms:**
- Database connection errors
- API errors (503, 500)
- High database connection count

**Investigation Steps:**
1. **Check Database Metrics:**
   - Connection count
   - Active connections
   - Connection pool usage

2. **Check Application Logs:**
   - Connection errors
   - Connection pool exhaustion errors
   - Slow queries

3. **Check Application Code:**
   - Connection pool configuration
   - Connection leak detection
   - Query performance

**Resolution Steps:**
1. **Immediate:**
   - Increase connection pool size
   - Kill idle connections
   - Restart application if needed

2. **Short-term:**
   - Fix connection leaks
   - Optimize queries
   - Add connection monitoring

3. **Long-term:**
   - Implement connection pooling best practices
   - Add connection leak detection
   - Scale database if needed

**Prevention:**
- Set up alerting for connection pool usage
- Regular connection leak audits
- Connection pool monitoring
- Database scaling plan

---

### Runbook 3: Reconciliation Job Failures

**Symptoms:**
- High job failure rate
- Jobs stuck in "running" state
- Customer complaints

**Investigation Steps:**
1. **Check Job Metrics:**
   - Job success/failure rate
   - Job duration
   - Stuck jobs

2. **Check Job Logs:**
   - Recent job failures
   - Error messages
   - Adapter errors

3. **Check Adapter Status:**
   - External API status (Stripe, Shopify, etc.)
   - Adapter connection errors
   - Rate limiting issues

**Resolution Steps:**
1. **If Adapter Issue:**
   - Check external API status
   - Implement retries
   - Use cached data if available

2. **If Job Processing Issue:**
   - Check job queue
   - Restart stuck jobs
   - Scale job processors if needed

3. **If Data Issue:**
   - Validate data format
   - Check data quality
   - Fix data issues

**Prevention:**
- Set up alerting for job failures
- Regular adapter health checks
- Job retry logic
- Data validation

---

### Runbook 4: High Error Rate

**Symptoms:**
- Error rate >1%
- Increased 500 errors
- Customer complaints

**Investigation Steps:**
1. **Check Error Tracking (Sentry):**
   - Recent errors
   - Error trends
   - Error stack traces

2. **Check Application Logs:**
   - Error logs
   - Exception logs
   - Stack traces

3. **Check Infrastructure:**
   - Lambda function errors
   - Database errors
   - External API errors

**Resolution Steps:**
1. **Immediate:**
   - Identify root cause
   - Fix critical errors
   - Deploy hotfix if needed

2. **Short-term:**
   - Fix all errors
   - Add error handling
   - Improve logging

3. **Long-term:**
   - Root cause analysis
   - Process improvements
   - Error prevention

**Prevention:**
- Set up alerting for error rates
- Regular error reviews
- Error handling best practices
- Comprehensive testing

---

### Runbook 5: Deployment Failure

**Symptoms:**
- Deployment fails
- Application not updating
- Errors after deployment

**Investigation Steps:**
1. **Check Deployment Logs:**
   - GitHub Actions logs
   - Vercel deployment logs
   - AWS deployment logs

2. **Check Application Status:**
   - Application health
   - API status
   - Database migrations

3. **Check Rollback:**
   - Previous deployment status
   - Rollback procedure
   - Data consistency

**Resolution Steps:**
1. **Immediate:**
   - Stop deployment
   - Rollback to previous version
   - Verify application health

2. **Short-term:**
   - Fix deployment issues
   - Test deployment process
   - Redeploy when ready

3. **Long-term:**
   - Improve deployment process
   - Add deployment testing
   - Automate rollback

**Prevention:**
- Comprehensive testing before deployment
- Staged deployments (staging → production)
- Automated rollback on failure
- Deployment monitoring

---

## Alerting Rules

### Critical Alerts (P0)

**API Uptime <99.9%**
- **Threshold:** Uptime <99.9% over 5 minutes
- **Action:** Page on-call engineer
- **Escalation:** Escalate to SRE lead if not resolved in 15 minutes

**Error Rate >5%**
- **Threshold:** Error rate >5% over 5 minutes
- **Action:** Page on-call engineer
- **Escalation:** Escalate to SRE lead if not resolved in 15 minutes

**Database Down**
- **Threshold:** Database unavailable
- **Action:** Page on-call engineer immediately
- **Escalation:** Escalate to SRE lead immediately

**Payment Processing Failure**
- **Threshold:** Payment processing errors
- **Action:** Page on-call engineer
- **Escalation:** Escalate to finance team if not resolved in 30 minutes

---

### High Priority Alerts (P1)

**API Latency >1s (p95)**
- **Threshold:** API latency >1s (p95) over 10 minutes
- **Action:** Notify on-call engineer
- **Escalation:** Escalate to P0 if not resolved in 30 minutes

**Job Failure Rate >10%**
- **Threshold:** Job failure rate >10% over 15 minutes
- **Action:** Notify on-call engineer
- **Escalation:** Escalate to P0 if not resolved in 30 minutes

**Database Connection Pool >80%**
- **Threshold:** Connection pool usage >80% over 10 minutes
- **Action:** Notify on-call engineer
- **Escalation:** Escalate to P0 if not resolved in 30 minutes

**High Memory Usage >90%**
- **Threshold:** Memory usage >90% over 10 minutes
- **Action:** Notify on-call engineer
- **Escalation:** Escalate to P0 if not resolved in 30 minutes

---

### Medium Priority Alerts (P2)

**API Latency >500ms (p95)**
- **Threshold:** API latency >500ms (p95) over 30 minutes
- **Action:** Create ticket
- **Escalation:** Review in daily standup

**Error Rate >1%**
- **Threshold:** Error rate >1% over 30 minutes
- **Action:** Create ticket
- **Escalation:** Review in daily standup

**Disk Usage >80%**
- **Threshold:** Disk usage >80% over 1 hour
- **Action:** Create ticket
- **Escalation:** Review in daily standup

---

## Incident Response Workflow

### Phase 1: Detection (0-5 minutes)

**Steps:**
1. **Alert Received:** On-call engineer receives alert
2. **Acknowledge Alert:** Acknowledge alert in PagerDuty/Opsgenie
3. **Assess Severity:** Determine severity (P0, P1, P2)
4. **Create Incident:** Create incident in incident management system

**Tools:**
- PagerDuty/Opsgenie (alerting)
- Incident.io (incident management)
- Slack (communication)

---

### Phase 2: Response (5-30 minutes)

**Steps:**
1. **Assemble Team:** Assemble incident response team
2. **Investigate:** Investigate root cause using runbooks
3. **Communicate:** Update incident status
4. **Mitigate:** Implement mitigation steps

**Team Roles:**
- **Incident Commander:** Coordinates response
- **Technical Lead:** Technical investigation
- **Communications Lead:** Customer communication
- **Documentation Lead:** Documents incident

---

### Phase 3: Resolution (30 minutes - 2 hours)

**Steps:**
1. **Fix Issue:** Implement fix
2. **Verify Fix:** Verify fix resolves issue
3. **Monitor:** Monitor system health
4. **Communicate:** Update stakeholders

**Verification:**
- Check metrics (latency, error rate, uptime)
- Test critical paths
- Verify customer impact resolved

---

### Phase 4: Post-Incident (2-24 hours)

**Steps:**
1. **Post-Mortem:** Conduct post-mortem within 24 hours
2. **Root Cause Analysis:** Identify root cause
3. **Action Items:** Create action items
4. **Follow-Up:** Follow up on action items

**Post-Mortem Template:**
- **Incident Summary:** What happened?
- **Timeline:** When did it happen?
- **Impact:** What was the impact?
- **Root Cause:** What was the root cause?
- **Resolution:** How was it resolved?
- **Action Items:** What will we do differently?

---

## KPIs & SLIs

### Service Level Indicators (SLIs)

#### SLI 1: API Availability

**Definition:** Percentage of successful API requests

**Measurement:**
- Successful requests / Total requests
- Exclude planned maintenance
- Measure over 30-day rolling window

**Target:** 99.9% (3 nines)

**Current:** [Tracked in Datadog]

---

#### SLI 2: API Latency

**Definition:** API response time (p50, p95, p99)

**Measurement:**
- p50: Median response time
- p95: 95th percentile response time
- p99: 99th percentile response time
- Measure over 30-day rolling window

**Targets:**
- p50: <100ms
- p95: <500ms
- p99: <1s

**Current:** [Tracked in Datadog]

---

#### SLI 3: Reconciliation Accuracy

**Definition:** Percentage of correctly matched transactions

**Measurement:**
- Correctly matched / Total transactions
- Exclude manual reviews
- Measure over 30-day rolling window

**Target:** 95%+

**Current:** [Tracked in internal dashboard]

---

#### SLI 4: Job Success Rate

**Definition:** Percentage of successful reconciliation jobs

**Measurement:**
- Successful jobs / Total jobs
- Exclude user-cancelled jobs
- Measure over 30-day rolling window

**Target:** 99%+

**Current:** [Tracked in internal dashboard]

---

### Service Level Objectives (SLOs)

#### SLO 1: API Availability

**Target:** 99.9% availability (3 nines)

**Measurement Period:** 30 days

**Error Budget:** 43.2 minutes/month

**Current:** [Tracked in Datadog]

---

#### SLO 2: API Latency

**Target:** p95 latency <500ms

**Measurement Period:** 30 days

**Error Budget:** 5% of requests can exceed 500ms

**Current:** [Tracked in Datadog]

---

#### SLO 3: Reconciliation Accuracy

**Target:** 95%+ accuracy

**Measurement Period:** 30 days

**Error Budget:** 5% of transactions can be unmatched

**Current:** [Tracked in internal dashboard]

---

### Key Performance Indicators (KPIs)

#### KPI 1: Mean Time To Recovery (MTTR)

**Definition:** Average time to recover from incidents

**Target:** <1 hour

**Current:** [Tracked in incident management system]

---

#### KPI 2: Mean Time Between Failures (MTBF)

**Definition:** Average time between incidents

**Target:** >30 days

**Current:** [Tracked in incident management system]

---

#### KPI 3: Deployment Frequency

**Definition:** Frequency of deployments to production

**Target:** Daily

**Current:** [Tracked in GitHub Actions]

---

#### KPI 4: Change Failure Rate

**Definition:** Percentage of deployments causing incidents

**Target:** <5%

**Current:** [Tracked in incident management system]

---

## Monitoring Dashboards

### Dashboard 1: API Health

**Metrics:**
- API availability (99.9% target)
- API latency (p50, p95, p99)
- Error rate (<1% target)
- Request rate (requests/second)
- Response codes (2xx, 4xx, 5xx)

**Alerts:**
- API uptime <99.9%
- Error rate >5%
- Latency >1s (p95)

---

### Dashboard 2: Infrastructure Health

**Metrics:**
- Lambda function metrics (duration, errors, invocations)
- Database metrics (CPU, memory, connections, queries)
- Redis metrics (memory, connections, hit rate)
- S3 metrics (requests, errors)

**Alerts:**
- Database down
- Connection pool >80%
- Memory usage >90%

---

### Dashboard 3: Reconciliation Health

**Metrics:**
- Job success rate (99%+ target)
- Job duration (average, p95)
- Reconciliation accuracy (95%+ target)
- Adapter health (per adapter)

**Alerts:**
- Job failure rate >10%
- Reconciliation accuracy <95%
- Adapter errors

---

### Dashboard 4: Business Metrics

**Metrics:**
- Active customers
- API usage (requests/month)
- Reconciliation volume (reconciliations/month)
- Revenue (MRR, ARR)

**Alerts:**
- Significant drop in usage
- Revenue anomalies

---

## On-Call Rotation

### Rotation Schedule

**Primary On-Call:** Week 1-2 (Engineer A)  
**Secondary On-Call:** Week 1-2 (Engineer B)  
**Primary On-Call:** Week 3-4 (Engineer C)  
**Secondary On-Call:** Week 3-4 (Engineer D)

**Rotation:** Monthly rotation

### On-Call Responsibilities

**Primary On-Call:**
- Respond to P0/P1 alerts within 15 minutes
- Investigate and resolve incidents
- Escalate to secondary if needed
- Document incidents

**Secondary On-Call:**
- Support primary on-call
- Handle P2 alerts
- Review and approve changes
- Backup for primary

---

## Next Steps

1. **Implement Runbooks:** Create and test all runbooks
2. **Set Up Alerting:** Configure all alerting rules
3. **Create Dashboards:** Build monitoring dashboards
4. **Establish On-Call:** Set up on-call rotation
5. **Practice Incidents:** Run incident drills quarterly

---

**Contact:** sre@settler.io | oncall@settler.io  
**Last Updated:** January 2026

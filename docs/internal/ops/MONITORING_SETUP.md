# Monitoring & Alerting Setup

**Version:** 1.0  
**Date:** January 2026  
**Status:** Active  
**Purpose:** Comprehensive monitoring and alerting configuration

---

## Overview

This document defines **monitoring and alerting** setup for Settler.dev. It covers infrastructure, application, business, and SLA monitoring.

**Philosophy:** Monitor everything that matters, alert on actionable issues.

---

## Monitoring Layers

### Layer 1: Infrastructure Monitoring

**Metrics:**
- CPU usage
- Memory usage
- Disk usage
- Network traffic
- Database connections

**Tools:**
- Cloud provider monitoring (AWS CloudWatch, GCP Monitoring)
- Infrastructure monitoring (Datadog, New Relic)

**Alerts:**
- CPU > 80% for 5 minutes
- Memory > 90% for 5 minutes
- Disk > 85% for 5 minutes
- Database connections > 80% capacity

---

### Layer 2: Application Monitoring

**Metrics:**
- Request rate
- Error rate
- Response time (p50, p95, p99)
- API endpoint availability
- Database query performance

**Tools:**
- Application Performance Monitoring (APM): Datadog, New Relic
- Error tracking: Sentry
- Log aggregation: Datadog Logs, CloudWatch Logs

**Alerts:**
- Error rate > 5% for 5 minutes
- Response time p95 > 2s for 5 minutes
- API endpoint down
- Database query time > 1s

---

### Layer 3: Business Metrics Monitoring

**Metrics:**
- Active customers
- API requests per customer
- Reconciliation runs per customer
- Usage vs. limits
- Revenue per customer

**Tools:**
- Custom dashboards (Datadog, Grafana)
- Business intelligence (Metabase, Looker)

**Alerts:**
- Customer churn spike
- Usage spike (> 2x normal)
- Revenue drop (> 10%)

---

### Layer 4: SLA Monitoring

**Metrics:**
- Uptime (target: 99.5%+)
- Support response time (target: < 24 hours)
- Support resolution time (target: < 48 hours)
- SLA violations

**Tools:**
- Uptime monitoring: Pingdom, UptimeRobot
- SLA tracking: Custom service (see `sla/tracker.ts`)
- Support ticket tracking: Custom service

**Alerts:**
- Uptime < 99.5% (monthly)
- Support response time > SLA
- SLA violation detected

---

## Alert Configuration

### Critical Alerts (P0)

**Triggers:**
- Complete service outage
- Data breach
- Payment processing failure
- SLA violation (Critical tier)

**Channels:**
- PagerDuty (on-call engineer)
- Slack (#incidents channel)
- Email (operations team)

**Response:**
- Immediate (< 15 minutes)
- Escalate if not resolved in 1 hour

---

### High Priority Alerts (P1)

**Triggers:**
- Partial service outage
- High error rate (> 10%)
- Performance degradation (> 2x latency)
- SLA violation (High tier)

**Channels:**
- Slack (#incidents channel)
- Email (operations team)

**Response:**
- Within 1 hour
- Escalate if not resolved in 4 hours

---

### Medium Priority Alerts (P2)

**Triggers:**
- Intermittent errors (< 10%)
- Minor performance degradation (< 2x latency)
- Infrastructure warnings

**Channels:**
- Slack (#monitoring channel)
- Email (operations team)

**Response:**
- Within 4 hours
- Track in ticket system

---

### Low Priority Alerts (P3)

**Triggers:**
- Cosmetic issues
- Non-critical warnings
- Informational alerts

**Channels:**
- Slack (#monitoring channel)

**Response:**
- Next business day
- Track in ticket system

---

## SLA Monitoring Setup

### Support SLA Monitoring

**Implementation:**
- See `packages/api/src/services/sla/tracker.ts`
- Scheduled job: `packages/api/src/jobs/sla-monitoring-job.ts`
- Script: `scripts/check-sla-violations.ts`

**Metrics:**
- Support ticket response time
- SLA compliance rate
- SLA violations

**Alerts:**
- SLA violation detected
- SLA compliance < 95%

**Dashboard:**
- Track SLA compliance per tier
- Monitor response times
- Track violations

---

### Uptime Monitoring

**Implementation:**
- Uptime monitoring service (Pingdom, UptimeRobot)
- Health check endpoints
- Status page integration

**Metrics:**
- Uptime percentage (monthly)
- Downtime incidents
- Mean time between failures (MTBF)

**Alerts:**
- Service down
- Uptime < 99.5% (monthly)

**Dashboard:**
- Public status page
- Internal uptime dashboard

---

## Data Retention Monitoring

**Implementation:**
- See `packages/api/src/services/data-retention/enforcer.ts`
- Scheduled job: `packages/api/src/jobs/data-retention-job.ts`
- Script: `scripts/enforce-data-retention.ts`

**Metrics:**
- Data retention compliance
- Storage costs per customer
- Retention policy violations

**Alerts:**
- Retention job failure
- Storage cost spike (> 20% increase)

**Dashboard:**
- Track retention compliance
- Monitor storage costs
- Track retention job success

---

## Monitoring Dashboards

### Operations Dashboard

**Metrics:**
- Infrastructure health
- Application performance
- Error rates
- Uptime

**Refresh:** Real-time
**Access:** Operations team

---

### Business Dashboard

**Metrics:**
- Active customers
- Revenue
- Usage metrics
- Churn rate

**Refresh:** Daily
**Access:** Business team

---

### SLA Dashboard

**Metrics:**
- SLA compliance per tier
- Support response times
- Uptime metrics
- Violations

**Refresh:** Real-time
**Access:** Operations team

---

## Alert Testing

**Testing Schedule:**
- Weekly: Test critical alerts
- Monthly: Test all alerts
- Quarterly: Review alert effectiveness

**Testing Process:**
1. Trigger test alert
2. Verify alert received
3. Verify response process
4. Document results

---

## Monitoring Best Practices

1. **Monitor Everything That Matters:**
   - Infrastructure
   - Application
   - Business metrics
   - SLA compliance

2. **Alert on Actionable Issues:**
   - Don't alert on noise
   - Alert on actionable issues
   - Set appropriate thresholds

3. **Use Multiple Channels:**
   - PagerDuty for critical
   - Slack for high/medium
   - Email for low

4. **Review Regularly:**
   - Weekly alert review
   - Monthly dashboard review
   - Quarterly monitoring audit

---

## Related Documents

- `INCIDENT_RESPONSE_PLAYBOOK.md` - Incident response process
- `SYSTEM_GUARANTEES.md` - System guarantees
- `SLA_POSITION.md` - SLA definitions

---

**Document Status:** Active  
**Last Updated:** January 2026  
**Next Review:** Monthly (update based on incidents)

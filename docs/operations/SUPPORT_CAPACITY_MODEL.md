# Settler.dev — Support Capacity Model

**Version:** 1.0  
**Last Updated:** January 2026  
**Purpose:** Define support team capacity, staffing, and scaling model

---

## Overview

This document defines:
- Support team capacity model
- Staffing requirements
- Support ticket handling capacity
- Scaling model

**Current Status:** Support capacity undefined — requires implementation

---

## Support Capacity Model

### Capacity Calculation

**Formula:**
```
Support Capacity = (Support Engineers × Hours/Day × Utilization Rate) / Average Ticket Time
```

**Variables:**
- **Support Engineers:** Number of support engineers
- **Hours/Day:** Working hours per day (8 hours)
- **Utilization Rate:** % of time spent on tickets (70% = 0.7)
- **Average Ticket Time:** Average time to resolve ticket (hours)

### Example Calculation

**Current State (Hypothetical):**
- **Support Engineers:** 1
- **Hours/Day:** 8
- **Utilization Rate:** 70%
- **Average Ticket Time:** 2 hours

**Capacity:**
```
Capacity = (1 × 8 × 0.7) / 2 = 2.8 tickets/day
```

**Monthly Capacity:**
```
Monthly Capacity = 2.8 × 20 working days = 56 tickets/month
```

---

## Support Tiers and Capacity

### Free Tier: Community Support

**Capacity Model:**
- **Support Engineers:** 0 (community-driven)
- **Ticket Handling:** Community forums, GitHub issues
- **Response Time:** Best-effort (no SLA)
- **Capacity:** Unlimited (community-driven)

**Scaling:**
- No scaling required (community-driven)
- Monitor community activity
- Provide documentation and resources

---

### Starter Tier: Email Support (Best-Effort)

**Capacity Model:**
- **Support Engineers:** 0.25 FTE (shared with other tiers)
- **Ticket Handling:** Email support (best-effort)
- **Response Time:** 24-48 hours (best-effort, no SLA)
- **Capacity:** ~14 tickets/month per engineer

**Scaling:**
- **At 50 customers:** 0.5 FTE support engineer
- **At 100 customers:** 1 FTE support engineer
- **At 200 customers:** 2 FTE support engineers

**Ticket Volume Estimate:**
- **Per Customer:** ~0.5 tickets/month
- **50 customers:** ~25 tickets/month
- **100 customers:** ~50 tickets/month
- **200 customers:** ~100 tickets/month

---

### Growth Tier: Priority Email Support

**Capacity Model:**
- **Support Engineers:** 0.5 FTE (shared with Scale tier)
- **Ticket Handling:** Priority email support
- **Response Time:** 4 hours (SLA)
- **Capacity:** ~28 tickets/month per engineer

**Scaling:**
- **At 50 customers:** 1 FTE support engineer
- **At 100 customers:** 2 FTE support engineers
- **At 200 customers:** 4 FTE support engineers

**Ticket Volume Estimate:**
- **Per Customer:** ~1 ticket/month
- **50 customers:** ~50 tickets/month
- **100 customers:** ~100 tickets/month
- **200 customers:** ~200 tickets/month

---

### Scale Tier: Priority Support (SLA-Backed)

**Capacity Model:**
- **Support Engineers:** 1 FTE (dedicated)
- **Ticket Handling:** Priority support (1-hour SLA)
- **Response Time:** 1 hour (SLA)
- **Capacity:** ~56 tickets/month per engineer

**Scaling:**
- **At 10 customers:** 1 FTE support engineer
- **At 20 customers:** 2 FTE support engineers
- **At 50 customers:** 5 FTE support engineers

**Ticket Volume Estimate:**
- **Per Customer:** ~2 tickets/month
- **10 customers:** ~20 tickets/month
- **20 customers:** ~40 tickets/month
- **50 customers:** ~100 tickets/month

---

### Enterprise Tier: Dedicated Support

**Capacity Model:**
- **Support Engineers:** 1 FTE per 5-10 customers
- **Ticket Handling:** Dedicated account manager
- **Response Time:** 1 hour (SLA)
- **Capacity:** Custom (based on contract)

**Scaling:**
- **Per Customer:** 0.1-0.2 FTE support engineer
- **5 customers:** 1 FTE support engineer
- **10 customers:** 2 FTE support engineers

**Ticket Volume Estimate:**
- **Per Customer:** ~5-10 tickets/month
- **5 customers:** ~25-50 tickets/month
- **10 customers:** ~50-100 tickets/month

---

## Staffing Requirements

### Current State

**Support Team:**
- **Headcount:** 0 (undefined)
- **Capacity:** Undefined
- **Status:** Requires implementation

### Recommended Initial Staffing

**Phase 1: Initial Support (0-50 customers)**
- **Support Engineers:** 0.5 FTE
- **Capacity:** ~14 tickets/month
- **Cost:** ~$3,000/month

**Phase 2: Growth Support (50-100 customers)**
- **Support Engineers:** 1 FTE
- **Capacity:** ~28 tickets/month
- **Cost:** ~$6,000/month

**Phase 3: Scale Support (100-200 customers)**
- **Support Engineers:** 2 FTE
- **Capacity:** ~56 tickets/month
- **Cost:** ~$12,000/month

---

## Support Tools

### Required Tools

1. **Support Ticketing System**
   - **Options:** Zendesk, Intercom, Help Scout
   - **Cost:** ~$50-200/month per agent
   - **Status:** Not implemented

2. **Knowledge Base**
   - **Options:** GitBook, Notion, Confluence
   - **Cost:** ~$10-50/month
   - **Status:** Documentation exists, needs platform

3. **Chat Support (Optional)**
   - **Options:** Intercom, Drift, Crisp
   - **Cost:** ~$50-200/month
   - **Status:** Not implemented

4. **Monitoring & Alerts**
   - **Options:** Datadog, Sentry
   - **Cost:** Included in existing tools
   - **Status:** Implemented

---

## Support Metrics

### Key Metrics

1. **Response Time**
   - **Target:** Meet documented SLAs
   - **Measurement:** Time from ticket creation to first response
   - **Tracking:** Support ticketing system

2. **Resolution Time**
   - **Target:** <24 hours (P2), <4 hours (P1), <1 hour (P0)
   - **Measurement:** Time from ticket creation to resolution
   - **Tracking:** Support ticketing system

3. **Ticket Volume**
   - **Target:** <5 tickets per customer per month
   - **Measurement:** Total tickets per customer per month
   - **Tracking:** Support ticketing system

4. **Customer Satisfaction (CSAT)**
   - **Target:** >4.5/5.0
   - **Measurement:** Post-resolution survey
   - **Tracking:** Support ticketing system

5. **First Contact Resolution (FCR)**
   - **Target:** >70%
   - **Measurement:** % of tickets resolved on first contact
   - **Tracking:** Support ticketing system

---

## Scaling Model

### When to Scale Support

**Scale Up When:**
- Ticket volume exceeds capacity (>80% utilization)
- Response times exceed SLAs
- Customer satisfaction declining (<4.0/5.0)
- Support team burnout indicators

**Scale Down When:**
- Ticket volume <50% capacity
- Response times well below SLAs
- Low customer satisfaction not due to capacity
- Cost optimization needed

### Scaling Triggers

**Immediate Scale (Within 1 Week):**
- Ticket volume >100% capacity
- SLA violations >10%
- Customer escalations >5%

**Short-Term Scale (Within 1 Month):**
- Ticket volume >80% capacity
- SLA violations >5%
- Customer satisfaction <4.0/5.0

**Long-Term Scale (Within 3 Months):**
- Customer growth >20% MoM
- Ticket volume trending upward
- Support capacity planning

---

## Support Capacity Planning

### Capacity Planning Formula

**Required Support Engineers:**
```
Required Engineers = (Ticket Volume × Average Ticket Time) / (Hours/Day × Utilization Rate × Working Days)
```

**Example:**
- **Ticket Volume:** 100 tickets/month
- **Average Ticket Time:** 2 hours
- **Hours/Day:** 8
- **Utilization Rate:** 70%
- **Working Days:** 20

**Calculation:**
```
Required Engineers = (100 × 2) / (8 × 0.7 × 20) = 200 / 112 = 1.79 engineers
```

**Result:** Need 2 FTE support engineers

---

## Implementation Plan

### Phase 1: Initial Setup (Week 1-2)

1. **Implement Support Ticketing System**
   - Choose platform (Zendesk/Intercom)
   - Set up ticketing system
   - Configure workflows
   - Train team

2. **Define Support Processes**
   - Create support workflows
   - Define escalation procedures
   - Set up SLAs
   - Create knowledge base

3. **Hire Initial Support Team**
   - Hire 0.5 FTE support engineer
   - Train on product
   - Set up tools
   - Define metrics

### Phase 2: Scaling (Month 2-3)

1. **Monitor Support Metrics**
   - Track ticket volume
   - Monitor response times
   - Measure customer satisfaction
   - Identify bottlenecks

2. **Scale Support Team**
   - Hire additional support engineers as needed
   - Scale based on customer growth
   - Optimize processes
   - Improve documentation

### Phase 3: Optimization (Month 4+)

1. **Optimize Support Processes**
   - Automate common tasks
   - Improve documentation
   - Reduce ticket volume
   - Improve efficiency

2. **Continuous Improvement**
   - Review metrics monthly
   - Update processes quarterly
   - Train team regularly
   - Optimize tools

---

## Cost Model

### Support Cost per Customer

**Starter Tier:**
- **Cost per Customer:** ~$0.10/month (shared support)
- **At 100 customers:** ~$10/month total

**Growth Tier:**
- **Cost per Customer:** ~$0.20/month (shared support)
- **At 100 customers:** ~$20/month total

**Scale Tier:**
- **Cost per Customer:** ~$2/month (dedicated support)
- **At 10 customers:** ~$20/month total

**Enterprise Tier:**
- **Cost per Customer:** ~$50-200/month (dedicated support)
- **At 5 customers:** ~$250-1000/month total

---

## Summary

**Current State:**
- Support capacity undefined
- Support team not hired
- Support tools not implemented
- Support processes not defined

**Recommended Actions:**
1. Implement support ticketing system (Week 1-2)
2. Hire initial support team (0.5 FTE) (Week 2-4)
3. Define support processes (Week 1-2)
4. Set up support metrics (Week 2)
5. Scale based on customer growth (Month 2+)

**Next Steps:**
- Choose support ticketing platform
- Hire initial support engineer
- Define support workflows
- Set up support metrics
- Monitor and scale

---

**Last Updated:** January 2026  
**Owner:** Operations Team  
**Review Frequency:** Monthly

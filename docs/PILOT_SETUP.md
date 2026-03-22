# Settler Pilot Setup Guide

## Overview

This guide covers setting up a Settler pilot for a prospect or customer.
A pilot is a time-boxed proof-of-value using the prospect's actual data.

---

## Pre-Pilot Checklist

- [ ] Prospect has identified 2-3 data sources to reconcile (e.g., Stripe + bank, Shopify + QuickBooks)
- [ ] Data volume estimate: how many transactions per day/week/month
- [ ] Pilot duration agreed (recommended: 2-4 weeks)
- [ ] Success criteria defined (see below)
- [ ] Settler instance provisioned (cloud or self-hosted)
- [ ] Prospect point-of-contact identified

---

## Setup Steps

### 1. Create Tenant

- Sign up at `/signup` or provision via admin panel
- Tenant name should match the prospect's company name
- Assign the prospect's admin user

### 2. Connect Integrations

Navigate to **Console > Settings** or use the API:

- Connect the source system (e.g., Stripe via OAuth or API key)
- Connect the target system (e.g., bank via Plaid or CSV upload)
- Verify connection status shows "Connected" with a successful initial sync

### 3. Configure Rules

- Set tolerance thresholds (default: $0.50 amount, 3-day timing)
- Review matching rules for the prospect's use case
- Adjust exception severity mappings if needed

### 4. Run First Reconciliation

- Navigate to **Console > Reconciliations**
- Create a new reconciliation job selecting the connected adapters
- Execute and review results in **Console > Runs**

### 5. Review Together

Walk the prospect through:
- Dashboard KPIs (match rate, exception count)
- Run detail (matched vs unmatched breakdown)
- Exception queue (what needs attention)
- Audit trail (who did what, when)

---

## Success Criteria

Recommended metrics for pilot evaluation:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Match rate | > 90% on first run, > 95% after rule tuning | Run summary |
| Time to first result | < 1 hour from setup | Timestamp of first completed run |
| Exception resolution rate | > 80% during pilot | Exception status distribution |
| Operator confidence | Operators can triage without help | Qualitative feedback |
| Data freshness | Syncs complete within SLA | Integration last-sync timestamps |

---

## Trial Success Playbook

### Week 1: Setup & First Run
- Connect integrations
- Run first reconciliation
- Review results with prospect
- Tune tolerance rules based on initial findings

### Week 2: Daily Operations
- Schedule recurring reconciliation runs
- Prospect team triages exceptions independently
- Monitor match rate trends
- Identify recurring exception patterns

### Week 3-4: Optimization & Evaluation
- Refine rules to reduce false positives
- Review audit trail completeness
- Evaluate against success criteria
- Decision meeting with prospect

---

## Support During Pilot

- Check **Console > Docs > Glossary** for status and term definitions
- Use **Console > Diagnostics** for integration health checks
- Review the [Demo Script](./DEMO_SCRIPT.md) for presentation guidance
- Escalate integration issues via support channel

---

## After the Pilot

1. Document findings: match rate achieved, exceptions identified, rules configured
2. Compare against success criteria
3. Present ROI: time saved vs manual reconciliation
4. Discuss production deployment plan
5. Transition to paid subscription

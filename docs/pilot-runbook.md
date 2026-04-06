# Pilot Runbook

Operational guide for running a Settler pilot. Covers setup, success criteria, weekly checkpoints, go/no-go decision, and rollback.

## Pilot overview

A typical Settler pilot runs 2–4 weeks with a single reconciliation use case (e.g., Stripe payments vs. bank deposits). The goal is to validate three things:

1. **Technical fit** — Can Settler match your real transaction data accurately?
2. **Operational fit** — Does the exception workflow integrate with your team's process?
3. **Trust fit** — Are audit trails, evidence, and tenant isolation sufficient for your compliance requirements?

## Pre-pilot checklist

| Step | Owner | Status |
|------|-------|--------|
| Settler account or local instance provisioned | Engineering | [ ] |
| API key generated and stored in secret manager | Engineering | [ ] |
| Source adapter configured (e.g., Stripe) | Engineering | [ ] |
| Target adapter configured (e.g., bank/ledger) | Engineering | [ ] |
| First reconciliation job created and tested | Engineering | [ ] |
| Webhook endpoint registered (if using events) | Engineering | [ ] |
| Pilot success criteria agreed with stakeholders | Eng Lead / Finance | [ ] |
| Pilot timeline communicated to team | Eng Lead | [ ] |

## Week-by-week guide

### Week 1: Setup and first run

**Goals:** Working integration, first successful reconciliation, team access.

```bash
# Quick setup path
git clone https://github.com/settler/settler.git
cd settler
pnpm run bootstrap
pnpm tb:start
pnpm dev
pnpm demo:seed   # Load demo data for evaluation
```

**Or use the hosted API:**

```bash
# Install the starter kit
cd examples/starter-kits/settler-recon-starter
npm install
cp .env.example .env
# Set SETTLER_API_KEY
npm start
```

**Week 1 checkpoint:**
- [ ] First reconciliation run completed
- [ ] Match/unmatch results reviewed
- [ ] At least one exception reviewed in the console
- [ ] Team members have console access

### Week 2: Real data integration

**Goals:** Connect real data sources, run against production-like volume.

- Replace demo adapters with your real Stripe/bank credentials
- Run reconciliation against a representative data window (e.g., last 30 days)
- Set up scheduled runs if applicable
- Configure webhook notifications for your team's Slack/PagerDuty

**Week 2 checkpoint:**
- [ ] Real data sources connected
- [ ] Reconciliation accuracy measured on real data
- [ ] Exception volume is manageable (< 5% of transactions ideally)
- [ ] No data quality issues blocking progress

### Week 3: Operational validation

**Goals:** Test the full operational loop — exceptions, evidence, audit.

- Assign exception review to a finance team member
- Generate a proofpack for one completed reconciliation
- Review audit logs for compliance
- Test the export pipeline (CSV/JSON)

**Week 3 checkpoint:**
- [ ] Exception workflow tested by a non-engineer
- [ ] Proofpack generated and reviewed
- [ ] Audit log export completed
- [ ] No blocking operational issues

### Week 4: Evaluation and decision

**Goals:** Collect metrics, evaluate against success criteria, make go/no-go call.

## Success criteria scorecard

Score each criterion. **Go = all critical met + majority of important met.**

### Critical (must pass)

| Criterion | Target | Actual | Pass? |
|-----------|--------|--------|-------|
| Reconciliation accuracy | ≥ 95% | | [ ] |
| No data leakage across tenants | 0 incidents | | [ ] |
| API available during pilot | ≥ 99% | | [ ] |
| First reconciliation in < 1 day | Yes/No | | [ ] |
| Data export works | Yes/No | | [ ] |

### Important (should pass)

| Criterion | Target | Actual | Pass? |
|-----------|--------|--------|-------|
| Exception resolution time | < 4 hours avg | | [ ] |
| Team can use console without training | Yes/No | | [ ] |
| Audit log meets compliance needs | Yes/No | | [ ] |
| Webhook delivery reliable | ≥ 99% | | [ ] |
| Time saved vs. manual process | ≥ 50% | | [ ] |

### Nice to have

| Criterion | Target | Actual | Pass? |
|-----------|--------|--------|-------|
| Scheduled runs working | Yes/No | | [ ] |
| Multi-currency support | If needed | | [ ] |
| Custom adapter built | If needed | | [ ] |

## Go/No-Go decision

### Go

All critical criteria met. Proceed to:
1. Production deployment plan
2. Contract/pricing discussion
3. SSO/identity integration (if enterprise)
4. Full team rollout

### Conditional Go

Critical criteria met, but important gaps remain. Proceed with:
1. Documented workarounds for gaps
2. Timeline for gap resolution
3. Limited rollout scope

### No-Go

Critical criteria not met. Actions:
1. Document specific failures and root causes
2. Determine if failures are addressable (config issues vs. fundamental limitations)
3. Schedule follow-up evaluation in 4–8 weeks if addressable
4. Execute rollback plan (below)

## Rollback plan

If the pilot is unsuccessful or needs to be unwound:

### 1. Revert to previous process

- Re-enable manual reconciliation workflow
- Restore any processes that were paused during the pilot

### 2. Export pilot data

```bash
# Export all reconciliation data from the pilot
settler export --tenant <tenant-id> --format csv --output ./pilot-export/
```

### 3. Clean up Settler resources

Follow the [Teardown Guide](getting-started/teardown.md):

- Revoke API keys
- Remove webhooks
- Cancel scheduled jobs
- Remove environment variables from CI/CD

### 4. Document lessons learned

Even for a no-go, document:
- What worked well
- What didn't work
- Specific blockers and whether they're addressable
- Recommendation for re-evaluation timeline

## Pilot-to-production checklist

When the pilot succeeds, before going to production:

- [ ] Production environment provisioned (or managed account upgraded)
- [ ] SSO/OIDC configured (if enterprise)
- [ ] RBAC roles assigned for team members
- [ ] Production API keys generated and stored in secret manager
- [ ] Webhook endpoints updated to production URLs
- [ ] Scheduled reconciliation jobs configured
- [ ] Alerting configured (webhook → PagerDuty/Slack)
- [ ] Data retention policy confirmed
- [ ] Security review completed (see [Trust Packet](trust-packet.md))
- [ ] Billing/subscription confirmed

## Related

- [Quickstart](getting-started/quickstart.md)
- [Teardown Guide](getting-started/teardown.md)
- [Trust Packet](trust-packet.md)
- [What Works Today](getting-started/WHAT_WORKS.md)
- [Intentional Boundaries](getting-started/INTENTIONAL_BOUNDARIES.md)

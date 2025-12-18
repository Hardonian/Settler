# Settler Operations Checklist

Checklists for pre-launch and ongoing maintenance.

## Pre-Launch Checklist

### Infrastructure

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] Stripe webhook endpoint configured
- [ ] Webhook secret matches Stripe dashboard
- [ ] Domain configured (DNS, SSL)
- [ ] CDN configured (if applicable)

### Security

- [ ] Security headers configured
- [ ] CORS policies set correctly
- [ ] API rate limiting enabled
- [ ] Auth gating on admin endpoints
- [ ] Secret scanning enabled in CI
- [ ] Dependency audit passing
- [ ] No secrets in code or logs
- [ ] Environment variables secured

### Monitoring

- [ ] Health check endpoint working (`/api/health`)
- [ ] Metrics endpoint accessible (`/api/metrics`)
- [ ] Logging configured (structured JSON)
- [ ] Trace ID propagation working
- [ ] Error tracking configured (if using Sentry)
- [ ] Alerts configured for critical errors
- [ ] Uptime monitoring set up

### Billing

- [ ] Stripe products configured
- [ ] Pricing plans set up
- [ ] Webhook handler tested
- [ ] Idempotency working (test duplicate events)
- [ ] Subscription sync working
- [ ] Usage tracking enabled
- [ ] Entitlements model tested

### Testing

- [ ] Smoke tests passing
- [ ] API contract tests passing
- [ ] E2E tests passing
- [ ] Load tests completed
- [ ] Security tests passing
- [ ] QA crawler run successfully

### Documentation

- [ ] Runbook reviewed and up-to-date
- [ ] Threat model documented
- [ ] API documentation current
- [ ] Deployment guide written
- [ ] On-call procedures documented

### Team

- [ ] On-call rotation set up
- [ ] Emergency contacts documented
- [ ] Access to all systems verified
- [ ] Team trained on runbook procedures

## Weekly Maintenance Checklist

### Monday

- [ ] Review weekend error logs
- [ ] Check dependency vulnerabilities (`npm audit`)
- [ ] Review security alerts
- [ ] Check Stripe webhook processing
- [ ] Review usage metrics

### Tuesday

- [ ] Review database performance
- [ ] Check RLS policy effectiveness
- [ ] Review audit logs for anomalies
- [ ] Check API rate limit effectiveness

### Wednesday

- [ ] Review application logs for errors
- [ ] Check metrics endpoint for slow requests
- [ ] Review user-reported issues
- [ ] Check webhook processing times

### Thursday

- [ ] Review billing reconciliation
- [ ] Check subscription sync status
- [ ] Review entitlements usage
- [ ] Check feature flag usage

### Friday

- [ ] Weekly summary report
- [ ] Plan next week's improvements
- [ ] Review and update runbook if needed
- [ ] Check for pending security updates

## Monthly Maintenance Checklist

### First Week

- [ ] Full security audit
- [ ] Review and update threat model
- [ ] Audit RLS policies
- [ ] Review access logs
- [ ] Check for unused API keys

### Second Week

- [ ] Database optimization
- [ ] Review query performance
- [ ] Check index usage
- [ ] Review connection pool settings

### Third Week

- [ ] Dependency updates
- [ ] Review changelog
- [ ] Test rollback procedures
- [ ] Review backup procedures

### Fourth Week

- [ ] Monthly summary report
- [ ] Plan next month's improvements
- [ ] Review incident reports
- [ ] Update documentation

## Quarterly Maintenance Checklist

- [ ] Full security penetration test
- [ ] Review and update threat model
- [ ] Comprehensive audit of all systems
- [ ] Review and update runbook
- [ ] Team training on new procedures
- [ ] Review and update emergency contacts
- [ ] Disaster recovery drill

## Incident Response Checklist

When an incident occurs:

1. **Immediate Response**
   - [ ] Acknowledge incident
   - [ ] Gather trace_id from error
   - [ ] Check health endpoint
   - [ ] Review recent logs

2. **Diagnosis**
   - [ ] Use trace_id to correlate logs
   - [ ] Identify root cause
   - [ ] Check related systems
   - [ ] Review recent changes

3. **Resolution**
   - [ ] Apply fix or workaround
   - [ ] Verify fix works
   - [ ] Monitor for recurrence

4. **Post-Incident**
   - [ ] Document incident
   - [ ] Identify root cause
   - [ ] Create follow-up tasks
   - [ ] Update runbook if needed
   - [ ] Communicate resolution

## Deployment Checklist

Before deploying:

- [ ] All tests passing
- [ ] Doctor script passes (`npm run doctor`)
- [ ] No critical security vulnerabilities
- [ ] Database migrations tested
- [ ] Rollback plan ready
- [ ] Changelog updated
- [ ] Team notified

After deploying:

- [ ] Health check passes
- [ ] Smoke tests pass
- [ ] Monitor error rates
- [ ] Check webhook processing
- [ ] Verify billing still works
- [ ] Monitor for 30 minutes

## Emergency Procedures

### Database Down

1. Check Supabase status
2. Verify connection string
3. Check application logs
4. Restart if needed
5. Monitor recovery

### Webhook Failing

1. Check Stripe dashboard
2. Verify webhook secret
3. Check application logs
4. Test webhook endpoint
5. Replay failed events if needed

### High Error Rate

1. Check recent deployments
2. Review error logs with trace_id
3. Identify common error pattern
4. Apply hotfix if needed
5. Rollback if necessary

### Security Incident

1. Assess severity
2. Isolate affected systems
3. Preserve logs and evidence
4. Notify security team
5. Follow incident response plan

## Monitoring Alerts

Set up alerts for:

- [ ] Error rate > 5%
- [ ] Database connection failures
- [ ] Webhook processing failures
- [ ] Response time > 2s (p95)
- [ ] Health check failures
- [ ] Security scan failures
- [ ] Dependency vulnerabilities

## Backup Procedures

### Database Backups

- Supabase handles automatic backups
- Verify backups are working
- Test restore procedure quarterly

### Code Backups

- Git repository is source of truth
- Regular pushes to remote
- Tag releases for easy rollback

### Configuration Backups

- Environment variables documented
- Infrastructure as code (if applicable)
- Configuration in version control

## Communication

### Internal

- Slack channel for incidents
- On-call rotation schedule
- Weekly team sync

### External

- Status page for outages
- Support email for user issues
- Security email for vulnerabilities

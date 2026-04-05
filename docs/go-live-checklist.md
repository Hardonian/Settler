# Production Go-Live Checklist

**Canonical operator sequence:** use `docs/launch/canonical-go-live-path.md` first (preflight → env → deploy → smoke → rollback). This checklist is a broader checklist; it does not override the canonical path when they conflict.

## Pre-Launch

### Infrastructure

- [ ] Production database configured and tested
- [ ] CDN and edge network configured
- [ ] SSL certificates installed and valid
- [ ] Domain DNS configured correctly
- [ ] Backup systems in place
- [ ] Monitoring and alerting configured
- [ ] Log aggregation set up
- [ ] Error tracking configured (Sentry)

### Security

- [ ] All environment variables secured
- [ ] API keys rotated and stored securely
- [ ] RLS policies tested and verified
- [ ] Rate limiting configured
- [ ] DDoS protection enabled
- [ ] Security headers configured
- [ ] Penetration testing completed
- [ ] SOC 2 compliance verified

### Performance

- [ ] Load testing completed
- [ ] Database indexes optimized
- [ ] API response times < 500ms (P95)
- [ ] Frontend bundle size optimized
- [ ] Image optimization configured
- [ ] Caching strategy implemented
- [ ] CDN configured

### Functionality

- [ ] All critical features tested
- [ ] Integration connections verified
- [ ] Payment processing tested
- [ ] Email delivery tested
- [ ] Webhook delivery tested
- [ ] Error handling verified
- [ ] Edge cases tested

### Documentation

- [ ] API documentation complete
- [ ] User guides published
- [ ] Support articles ready
- [ ] Status page configured
- [ ] Terms of Service published
- [ ] Privacy Policy published

### Team Readiness

- [ ] Support team trained
- [ ] On-call schedule established
- [ ] Incident response plan ready
- [ ] Escalation procedures documented
- [ ] Communication channels set up

## Launch Day

### Pre-Launch (T-1 hour)

- [ ] Final backup created
- [ ] Team briefed and on standby
- [ ] Monitoring dashboards open
- [ ] Communication channels active

### Launch (T-0)

- [ ] Deploy to production
- [ ] Verify deployment success
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check system health
- [ ] Verify critical paths

### Post-Launch (T+1 hour)

- [ ] Monitor user signups
- [ ] Check payment processing
- [ ] Verify integrations working
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Gather initial feedback

## Post-Launch (First Week)

### Daily Checks

- [ ] Error rates normal
- [ ] Performance within targets
- [ ] No security incidents
- [ ] User feedback reviewed
- [ ] Support tickets addressed

### Weekly Review

- [ ] Metrics review
- [ ] Performance analysis
- [ ] User feedback summary
- [ ] Incident review
- [ ] Improvement planning

---

**Status:** Ready for Launch ✅  
**Last Updated:** January 2026

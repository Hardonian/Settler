# Settler Launch Checklist

**Version:** 1.0  
**Date:** January 2026  
**Purpose:** Pre-launch verification checklist

---

## Pre-Launch Verification

### 🔴 Critical (Must Complete Before Launch)

- [ ] **Trial Automation**
  - [ ] Test signup → verify trial provisioned
  - [ ] Test trial expiration → verify conversion to free tier
  - [ ] Verify trial end date is 14 days from signup

- [ ] **Email Service Integration**
  - [ ] Configure Resend API key in production
  - [ ] Test welcome email sends
  - [ ] Test onboarding emails (Day 1, 3)
  - [ ] Test trial expiration emails
  - [ ] Verify email templates render correctly

- [ ] **Health Checks**
  - [ ] Verify health checks run every 5 minutes
  - [ ] Test health check endpoints
  - [ ] Verify health checks table populated
  - [ ] Set up alerting (email/Slack) for failures

- [ ] **Billing Integration**
  - [ ] Verify Stripe webhook endpoint configured
  - [ ] Test webhook processing
  - [ ] Verify subscription sync works
  - [ ] Test payment processing
  - [ ] Verify usage tracking syncs to Stripe

- [ ] **Usage Tracking**
  - [ ] Verify all API calls log usage
  - [ ] Test usage warnings (80%, 90%, 100%)
  - [ ] Verify upgrade prompts show correctly
  - [ ] Test usage limits enforcement

- [ ] **Security**
  - [ ] Rotate all default secrets
  - [ ] Verify RLS policies enabled
  - [ ] Test API key authentication
  - [ ] Verify rate limiting works
  - [ ] Test webhook signature verification

- [ ] **Database**
  - [ ] Run all migrations in production
  - [ ] Verify RLS policies
  - [ ] Test database connectivity
  - [ ] Verify indexes created
  - [ ] Test backup/restore process

### 🟡 Important (Should Complete Before Launch)

- [ ] **Onboarding**
  - [ ] Test onboarding progress tracking
  - [ ] Verify onboarding steps trigger correctly
  - [ ] Test onboarding UI displays progress
  - [ ] Verify welcome tour works (if implemented)

- [ ] **Monitoring**
  - [ ] Set up Sentry error tracking
  - [ ] Configure log aggregation
  - [ ] Set up uptime monitoring
  - [ ] Test alerting channels

- [ ] **Documentation**
  - [ ] Update README with production setup
  - [ ] Verify API documentation is current
  - [ ] Update pricing page with correct limits
  - [ ] Verify all docs links work

- [ ] **Testing**
  - [ ] Run smoke tests in production
  - [ ] Test critical user flows
  - [ ] Test billing flows end-to-end
  - [ ] Test error handling

- [ ] **Performance**
  - [ ] Load test API endpoints
  - [ ] Verify database query performance
  - [ ] Test rate limiting under load
  - [ ] Verify caching works

### 🟢 Nice to Have (Can Complete Post-Launch)

- [ ] **SEO**
  - [ ] Add structured data
  - [ ] Verify meta tags
  - [ ] Test sitemap
  - [ ] Submit to search engines

- [ ] **Analytics**
  - [ ] Set up conversion tracking
  - [ ] Configure funnels
  - [ ] Set up retention tracking

- [ ] **Support**
  - [ ] Set up support email
  - [ ] Create support docs
  - [ ] Set up help center

---

## Launch Day Checklist

### Morning (Before Launch)

- [ ] Review health checks from last 24 hours
- [ ] Verify no critical errors in logs
- [ ] Check Stripe dashboard for issues
- [ ] Verify all environment variables set
- [ ] Test signup flow end-to-end
- [ ] Test billing flow end-to-end

### Launch

- [ ] Announce launch (if applicable)
- [ ] Monitor health checks closely
- [ ] Watch for error spikes
- [ ] Monitor signup rate
- [ ] Check email delivery

### Post-Launch (First 24 Hours)

- [ ] Monitor error rates hourly
- [ ] Check health checks every hour
- [ ] Review signups and conversions
- [ ] Monitor support requests
- [ ] Check billing processing
- [ ] Review user feedback

---

## Post-Launch Monitoring

### Daily (First Week)

- [ ] Check health checks summary
- [ ] Review error logs
- [ ] Check billing reconciliation
- [ ] Monitor signup rate
- [ ] Review support requests

### Weekly (First Month)

- [ ] Review conversion metrics
- [ ] Analyze user behavior
- [ ] Review churn rate
- [ ] Check infrastructure costs
- [ ] Review feature usage

---

## Rollback Plan

If critical issues arise:

1. **Immediate Rollback**
   ```bash
   vercel rollback [deployment-url]
   ```

2. **Disable Affected Features**
   - Set feature flags to false
   - Disable automated systems if needed

3. **Notify Users**
   - Update status page
   - Send email if needed

4. **Investigate**
   - Review logs
   - Run diagnostics
   - Identify root cause

5. **Fix & Redeploy**
   - Fix issue
   - Test thoroughly
   - Deploy fix

---

## Success Metrics

### Week 1 Targets

- Signups: [Target]
- Trial activations: [Target]
- Trial-to-paid conversions: [Target]
- Error rate: < 1%
- Uptime: > 99.9%

### Month 1 Targets

- MRR: [Target]
- Churn rate: < 5%
- Activation rate: > 60%
- Support tickets: < [Target]
- NPS: > 50

---

## Emergency Contacts

- **Founder:** [To be filled]
- **Stripe Support:** https://support.stripe.com
- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/support

---

**Last Updated:** January 2026  
**Next Review:** Before launch

# Ops Autopilot - Next Steps & Deployment Checklist

**Status:** ✅ All reliability features implemented  
**Date:** 2025-01-27

---

## ✅ Completed Tasks

### 1. Doctor Command Verification
- ✅ Doctor command runs successfully
- ✅ Identifies configuration issues (Node version, env vars)
- ✅ Provides actionable fixes

**Run:** `npm run doctor`

### 2. Reliability Metrics Dashboard
- ✅ Enhanced admin monitoring dashboard (`/admin/monitoring`)
- ✅ Displays operation statistics (success rates, durations)
- ✅ Shows adapter error rates
- ✅ Lists dead-letter jobs
- ✅ Shows latest failures

**Access:** `/admin/monitoring` (super admin only)

### 3. Alerting Infrastructure
- ✅ Alert endpoint (`/api/admin/monitoring/alerts`)
- ✅ Alert utilities (Slack, Email, PagerDuty)
- ✅ Cron job for periodic alert checks (`/api/cron/check-reliability-alerts`)
- ✅ Alert deduplication to prevent spam

**Cron Schedule:** Every 5 minutes

### 4. Documentation
- ✅ Deployment guide (`docs/internal/ops-autopilot-deployment-guide.md`)
- ✅ Monitoring guide (`docs/internal/ops-autopilot-monitoring-guide.md`)
- ✅ Quota tuning guide (`docs/internal/ops-autopilot-quota-tuning.md`)
- ✅ Alerting guide (`docs/internal/ops-autopilot-alerting-guide.md`)

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] **Environment Variables**
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `DATABASE_URL`
  - [ ] `CRON_SECRET` (for cron job authentication)
  - [ ] `SLACK_WEBHOOK_URL` (optional, for Slack alerts)
  - [ ] `ALERT_EMAIL_TO` (optional, for email alerts)
  - [ ] `PAGERDUTY_INTEGRATION_KEY` (optional, for PagerDuty alerts)

- [ ] **Database Migrations**
  - [ ] Ensure `idempotency_keys` table exists
  - [ ] Ensure `ops_events` table exists (optional, falls back to console)
  - [ ] Ensure `dead_letters` table exists (optional)
  - [ ] Run `npm run prisma:migrate`

- [ ] **Run Doctor Command**
  ```bash
  npm run doctor
  ```
  Fix any errors before deploying.

### Deployment

- [ ] **Build & Deploy**
  ```bash
  npm run build
  vercel deploy --prod
  ```

- [ ] **Verify Health Endpoint**
  ```bash
  curl https://your-domain.com/api/admin/monitoring/health
  ```

- [ ] **Verify Alerts Endpoint**
  ```bash
  curl https://your-domain.com/api/admin/monitoring/alerts
  ```

- [ ] **Test Cron Job**
  ```bash
  curl -X POST https://your-domain.com/api/cron/check-reliability-alerts \
    -H "Authorization: Bearer $CRON_SECRET"
  ```

### Post-Deployment

- [ ] **Monitor Dashboard**
  - [ ] Access `/admin/monitoring`
  - [ ] Verify reliability metrics are displayed
  - [ ] Check for any active alerts

- [ ] **Set Up External Monitoring** (Recommended)
  - [ ] Configure Uptime Robot / Pingdom to monitor `/api/console/health`
  - [ ] Set up alerts for non-200 responses
  - [ ] Configure alerts for degraded health status

- [ ] **Configure Alert Channels**
  - [ ] Set up Slack webhook (if using Slack)
  - [ ] Configure email alerts (if using email)
  - [ ] Set up PagerDuty integration (if using PagerDuty)

---

## 📊 Monitoring Setup

### 1. Admin Dashboard

**URL:** `/admin/monitoring`

**What to Monitor:**
- System status (healthy/degraded)
- Operation success rates (< 95% = degraded)
- Dead-letter job count (> 0 = degraded)
- Adapter error rates (> 10% = degraded)
- Latest failures

**Refresh Rate:** Auto-refreshes every 30 seconds

### 2. Health Endpoint

**URL:** `/api/admin/monitoring/health`

**Use Cases:**
- External monitoring services
- Health check scripts
- Alerting systems

**Response Includes:**
- Overall system status
- Reliability metrics
- Operation statistics
- Adapter error rates
- Dead-letter jobs
- Latest failures

### 3. Alerts Endpoint

**URL:** `/api/admin/monitoring/alerts`

**Use Cases:**
- Cron job checks
- Manual alert inspection
- Integration with alerting systems

**Response Includes:**
- Active alerts (high/medium/low severity)
- Alert summary (counts by severity)
- Alert details (type, message, timestamp)

---

## 🔔 Alert Configuration

### Alert Thresholds

Current thresholds (configurable in `packages/web/src/app/api/admin/monitoring/alerts/route.ts`):

| Metric | Warning | Critical |
|--------|---------|----------|
| Success Rate | < 98% | < 95% |
| Dead-Letter Jobs | ≥ 1 | ≥ 10 |
| Adapter Error Rate | ≥ 5% | ≥ 10% |
| Stuck Jobs | ≥ 3 | ≥ 5 |

### Alert Channels

1. **Slack** (Recommended)
   - Set `SLACK_WEBHOOK_URL` environment variable
   - Alerts sent to configured Slack channel
   - All severity levels

2. **Email**
   - Set `ALERT_EMAIL_TO` environment variable
   - Currently logs alerts (implement email service if needed)
   - All severity levels

3. **PagerDuty**
   - Set `PAGERDUTY_INTEGRATION_KEY` environment variable
   - Only high severity alerts
   - Requires PagerDuty account

### Alert Deduplication

- Alerts are deduplicated per alert key
- Default cooldown: 15 minutes (critical), 30 minutes (medium)
- Prevents alert spam

---

## 📈 Quota Tuning

### Current Default Quotas

```typescript
{
  requestsPerMinute: 100,
  jobsPerHour: 50,
  maxConcurrentJobs: 5,
  maxRecordsPerRun: 10000,
  maxExportSizeMB: 100,
}
```

### Tuning Process

1. **Collect Usage Data** (7 days)
   ```sql
   -- See docs/internal/ops-autopilot-quota-tuning.md
   ```

2. **Analyze Patterns**
   - Peak usage times
   - Usage distribution
   - Burst patterns

3. **Set Tier-Based Quotas**
   - Base tier: Conservative limits
   - Pro tier: Higher limits
   - Enterprise: Very high or unlimited

4. **Monitor Quota Hit Rates**
   - Target: < 1% quota hits
   - If > 5%: Quotas too restrictive
   - If < 0.1%: Quotas too permissive

**See:** `docs/internal/ops-autopilot-quota-tuning.md` for detailed guide

---

## 🛠️ Troubleshooting

### Doctor Command Fails

**Issue:** Missing environment variables  
**Fix:** Set required env vars (see Pre-Deployment checklist)

**Issue:** Database connection fails  
**Fix:** Verify `DATABASE_URL` is correct and database is accessible

**Issue:** Migrations not applied  
**Fix:** Run `npm run prisma:migrate`

### Reliability Metrics Not Showing

**Issue:** `ops_events` table doesn't exist  
**Fix:** Metrics fall back to console logging. Create table if you want DB storage.

**Issue:** No data in dashboard  
**Fix:** Wait for operations to occur. Metrics are collected over time.

### Alerts Not Sending

**Issue:** Slack webhook not configured  
**Fix:** Set `SLACK_WEBHOOK_URL` environment variable

**Issue:** Cron job not running  
**Fix:** 
- Verify cron is configured in Vercel dashboard
- Check `CRON_SECRET` is set
- Verify cron endpoint is accessible

**Issue:** Alerts being deduplicated  
**Fix:** This is expected behavior. Wait for cooldown period (15-30 minutes).

---

## 📚 Documentation

- **Deployment Guide:** `docs/internal/ops-autopilot-deployment-guide.md`
- **Monitoring Guide:** `docs/internal/ops-autopilot-monitoring-guide.md`
- **Quota Tuning:** `docs/internal/ops-autopilot-quota-tuning.md`
- **Alerting Guide:** `docs/internal/ops-autopilot-alerting-guide.md`
- **Main Report:** `docs/internal/ops-autopilot-report.md`

---

## 🎯 Next Actions

1. **Deploy to Production**
   - Follow deployment checklist above
   - Verify all endpoints work
   - Test alert delivery

2. **Set Up External Monitoring**
   - Configure Uptime Robot / Pingdom
   - Set up health check alerts

3. **Configure Alert Channels**
   - Set up Slack webhook
   - Configure email alerts (if needed)
   - Set up PagerDuty (if needed)

4. **Monitor & Tune**
   - Monitor reliability metrics for 1 week
   - Tune quotas based on usage patterns
   - Adjust alert thresholds if needed

5. **Document Runbooks**
   - Create runbooks for common issues
   - Document alert response procedures
   - Train team on monitoring dashboard

---

## ✅ Verification Commands

```bash
# 1. Run doctor
npm run doctor

# 2. Build
npm run build

# 3. Check health endpoint
curl https://your-domain.com/api/admin/monitoring/health

# 4. Check alerts endpoint
curl https://your-domain.com/api/admin/monitoring/alerts

# 5. Test cron job
curl -X POST https://your-domain.com/api/cron/check-reliability-alerts \
  -H "Authorization: Bearer $CRON_SECRET"

# 6. Verify dashboard
# Open https://your-domain.com/admin/monitoring in browser
```

---

**All reliability features are now implemented and ready for deployment!** 🎉

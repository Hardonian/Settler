# Observability & Monitoring

**Last Updated:** 2025-01-XX  
**Stack:** Sentry (errors) + Winston (logs) + Prometheus (metrics) + OpenTelemetry (traces)

---

## Executive Summary

Settler uses a comprehensive observability stack:
- **Error Tracking:** Sentry (configured, needs DSN)
- **Logging:** Winston (structured logging)
- **Metrics:** Prometheus (custom metrics)
- **Tracing:** OpenTelemetry (optional, configured)

**Status:** Infrastructure exists but needs production configuration.

---

## 1. Error Tracking (Sentry)

### Current Setup

**Location:** `packages/api/src/middleware/sentry.ts`

**Status:** ✅ Configured but needs DSN

**Configuration:**
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
});
```

### Setup Steps

1. **Create Sentry Project:**
   - Go to [sentry.io](https://sentry.io)
   - Create new project (Node.js)
   - Copy DSN

2. **Set Environment Variables:**
   ```bash
   SENTRY_DSN=https://your-key@sentry.io/your-project-id
   SENTRY_ENVIRONMENT=production
   SENTRY_TRACES_SAMPLE_RATE=0.1
   ```

3. **Verify:**
   - Trigger an error in production
   - Check Sentry dashboard for error

### Features

- ✅ Automatic error capture
- ✅ Source maps support (needs build config)
- ✅ Performance monitoring
- ✅ User context tracking
- ✅ Release tracking

---

## 2. Logging (Winston)

### Current Setup

**Location:** `packages/api/src/utils/logger.ts`

**Status:** ✅ Implemented

**Configuration:**
- Log level: `LOG_LEVEL` env var (default: `info`)
- Sampling rate: `LOG_SAMPLING_RATE` env var (default: `1.0`)
- Output: Console (structured JSON)

### Usage

```typescript
import { logInfo, logError, logWarn, logDebug } from '@/utils/logger';

logInfo('User signed up', { userId, email });
logError('Failed to process job', error, { jobId });
logWarn('Rate limit approaching', { tenantId, currentRate });
logDebug('Cache hit', { key });
```

### Log Levels

- **error:** Errors that need attention
- **warn:** Warnings (rate limits, deprecations)
- **info:** General information (user actions, API calls)
- **debug:** Debug information (cache hits, internal state)

### Production Recommendations

**Option 1: Structured Logging (Current)**
- Logs to console (JSON format)
- Vercel captures console logs
- Use Vercel Log Drains for external services

**Option 2: External Log Aggregation**
- **Logflare** (Supabase-integrated)
- **Datadog**
- **Logtail**
- **Axiom**

**Setup Logflare (Recommended for Supabase):**
1. Create Logflare account
2. Connect Supabase project
3. Set up log drain in Vercel
4. View logs in Logflare dashboard

---

## 3. Metrics (Prometheus)

### Current Setup

**Location:** `packages/api/src/infrastructure/observability/metrics.ts`

**Status:** ✅ Implemented

**Metrics:**
- `http_request_duration_seconds` - Request duration histogram
- `http_requests_total` - Total HTTP requests counter
- `queue_depth` - Queue depth gauge
- `reconciliation_jobs_total` - Reconciliation jobs counter
- `reconciliation_matches_total` - Matches counter

### Exposing Metrics

**Endpoint:** `/metrics` (Prometheus format)

**Usage:**
```typescript
import { httpRequestDuration, httpRequestsTotal } from '@/infrastructure/observability/metrics';

// Record request duration
const timer = httpRequestDuration.startTimer();
// ... process request
timer({ method: 'GET', route: '/api/jobs', status: 200 });

// Increment request counter
httpRequestsTotal.inc({ method: 'GET', route: '/api/jobs', status: 200 });
```

### Production Setup

**Option 1: Prometheus + Grafana**
- Deploy Prometheus server
- Scrape `/metrics` endpoint
- Visualize in Grafana

**Option 2: Managed Metrics**
- **Datadog** (APM + metrics)
- **New Relic**
- **Honeycomb**

**Option 3: Vercel Analytics**
- Built-in Vercel Analytics
- Limited custom metrics support

---

## 4. Tracing (OpenTelemetry)

### Current Setup

**Location:** `packages/api/src/infrastructure/observability/tracing.ts`

**Status:** ⚠️ Configured but optional

**Configuration:**
- OTLP endpoint: `OTLP_ENDPOINT` env var
- Jaeger endpoint: `JAEGER_ENDPOINT` env var
- Auto-instrumentation enabled

### Setup Steps

1. **Set Environment Variables:**
   ```bash
   OTLP_ENDPOINT=https://your-otlp-endpoint.com
   # OR
   JAEGER_ENDPOINT=https://your-jaeger-endpoint.com
   ```

2. **Deploy Tracing Backend:**
   - **Honeycomb** (recommended for startups)
   - **Datadog APM**
   - **New Relic**
   - **Self-hosted Jaeger**

### When to Enable

**Enable if:**
- ✅ Need to debug performance issues
- ✅ Have complex distributed systems
- ✅ Want to understand request flow

**Skip if:**
- ⚠️ Simple API (may be overkill)
- ⚠️ Cost-sensitive (tracing can be expensive)
- ⚠️ Not experiencing performance issues

---

## 5. Health Checks

### Current Setup

**Location:** `packages/api/src/routes/health.ts`

**Status:** ✅ Implemented

**Endpoints:**
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health (database, Redis, etc.)

### Usage

**Basic Health:**
```bash
curl https://api.settler.dev/health
# Returns: { status: 'ok' }
```

**Detailed Health:**
```bash
curl https://api.settler.dev/health/detailed
# Returns: {
#   status: 'ok',
#   database: { connected: true },
#   redis: { connected: true },
#   uptime: 12345
# }
```

### Monitoring

**Set up uptime monitoring:**
- **UptimeRobot** (free)
- **Pingdom**
- **StatusCake**

**Alert on:**
- Health check fails
- Response time > 5s
- Status code != 200

---

## 6. Recommended Observability Stack

### Minimal (Free/Cheap)

1. **Sentry** - Error tracking (free tier: 5K events/month)
2. **Winston** - Logging (console → Vercel logs)
3. **Prometheus** - Metrics (self-hosted or free tier)
4. **UptimeRobot** - Uptime monitoring (free)

**Cost:** ~$0-10/month

### Recommended (Production)

1. **Sentry** - Error tracking ($26/month for 50K events)
2. **Logflare** - Log aggregation ($0-20/month)
3. **Datadog** - Metrics + APM ($31/month starter)
4. **UptimeRobot** - Uptime monitoring (free)

**Cost:** ~$60-80/month

### Enterprise

1. **Sentry** - Error tracking (enterprise)
2. **Datadog** - Full observability platform
3. **Honeycomb** - High-cardinality tracing
4. **PagerDuty** - Incident management

**Cost:** $500+/month

---

## 7. Alerting

### Recommended Alerts

**Critical (PagerDuty/Phone):**
- API down (health check fails)
- Database connection failures
- Redis connection failures
- Error rate > 5% (5-minute window)

**Warning (Email/Slack):**
- Error rate > 1% (5-minute window)
- Queue depth > 1000
- Response time p95 > 2s
- Redis memory usage > 80%

**Info (Dashboard):**
- Daily active users
- API request volume
- Job completion rate

### Setup

**Option 1: Sentry Alerts**
- Set up alerts in Sentry dashboard
- Email/Slack notifications

**Option 2: Prometheus Alertmanager**
- Define alert rules
- Route to PagerDuty/Slack

**Option 3: Datadog Monitors**
- Set up monitors in Datadog
- Email/Slack/PagerDuty notifications

---

## 8. Dashboard Recommendations

### Development

**Use:**
- Sentry dashboard (errors)
- Vercel logs (console)
- Prometheus + Grafana (metrics)

### Production

**Use:**
- Sentry dashboard (errors)
- Logflare dashboard (logs)
- Datadog dashboard (metrics + traces)
- Custom admin dashboard (business metrics)

---

## 9. Action Items

### High Priority
- [ ] Set up Sentry DSN
- [ ] Configure log aggregation (Logflare or similar)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure alerts (Sentry alerts)

### Medium Priority
- [ ] Set up Prometheus/Grafana (if self-hosting metrics)
- [ ] Configure OpenTelemetry (if needed)
- [ ] Set up custom dashboards
- [ ] Document alert runbooks

### Low Priority
- [ ] Set up distributed tracing (if needed)
- [ ] Configure log retention policies
- [ ] Set up log archiving

---

## 10. Best Practices

### Logging
- ✅ Use structured logging (JSON)
- ✅ Include context (userId, tenantId, requestId)
- ✅ Don't log sensitive data (passwords, tokens)
- ✅ Use appropriate log levels

### Metrics
- ✅ Use consistent metric names
- ✅ Include relevant labels (tenant, route, status)
- ✅ Don't create high-cardinality metrics
- ✅ Monitor metric cardinality

### Errors
- ✅ Include stack traces
- ✅ Include user context
- ✅ Don't expose sensitive data
- ✅ Set up error grouping rules

### Tracing
- ✅ Use consistent span names
- ✅ Include relevant attributes
- ✅ Don't trace everything (sample appropriately)
- ✅ Monitor trace volume

---

## References

- [Sentry Documentation](https://docs.sentry.io/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Logflare Documentation](https://logflare.app/docs)

# Load Testing Guide

This document describes load testing strategies and scripts for Settler.

## Tools

- **k6**: Modern load testing tool (primary)
- **Artillery**: Alternative load testing tool

## Test Scenarios

### 1. Create Reconciliation Jobs

**Goal**: Test job creation endpoint under load

**k6 Script**: `tests/load/k6-load-test.js`

**Run**:

```bash
k6 run --vus 100 --duration 5m tests/load/k6-load-test.js \
  -e BASE_URL=https://api.settler.com \
  -e API_KEY=your-api-key
```

**Expected Results**:

- p95 latency < 200ms
- Success rate > 95%
- Error rate < 1%

### 2. List Jobs (Pagination)

**Goal**: Test job listing with pagination

**Run**:

```bash
k6 run --vus 200 --duration 10m tests/load/k6-load-test.js \
  -e BASE_URL=https://api.settler.com \
  -e API_KEY=your-api-key \
  --tag scenario=list_jobs
```

**Expected Results**:

- p95 latency < 200ms
- Cache hit rate > 50% (after warm-up)

### 3. Get Reconciliation Summary

**Goal**: Test summary endpoint with caching

**Run**:

```bash
k6 run --vus 300 --duration 10m tests/load/k6-load-test.js \
  -e BASE_URL=https://api.settler.com \
  -e API_KEY=your-api-key \
  --tag scenario=summary
```

**Expected Results**:

- p95 latency < 100ms (with cache)
- Cache hit rate > 80%

### 4. Sustained Load (10x Scale)

**Goal**: Test system at 10x normal load

**Run**:

```bash
k6 run tests/load/k6-load-test.js \
  -e BASE_URL=https://api.settler.com \
  -e API_KEY=your-api-key
```

**Stages**:

1. Ramp up to 10 users (30s)
2. Ramp up to 50 users (1m)
3. Ramp up to 100 users (2m)
4. Stay at 100 users (5m)
5. Ramp up to 200 users (2m) - 10x scale
6. Stay at 200 users (5m)
7. Ramp down (2m)

**Expected Results**:

- System remains stable
- p95 latency < 200ms throughout
- Error rate < 1%

## Artillery Tests

### Run Artillery Test

```bash
artillery run tests/load/artillery-load-test.yml \
  --environment production \
  --output report.json
```

### Generate Report

```bash
artillery report report.json
```

## Chaos Scenarios

### Database Slow/Unavailable

**Goal**: Test system resilience when database is slow

**Run**:

```bash
k6 run tests/chaos/chaos-scenarios.js \
  -e BASE_URL=https://api.settler.com \
  -e API_KEY=your-api-key \
  --tag scenario=db_slow
```

**Expected Behavior**:

- System should degrade gracefully
- Cache should serve stale data
- Errors should be properly formatted
- System should recover when DB is restored

### External APIs Slow/Failing

**Goal**: Test adapter resilience

**Run**:

```bash
k6 run tests/chaos/chaos-scenarios.js \
  -e BASE_URL=https://api.settler.com \
  -e API_KEY=your-api-key \
  --tag scenario=external_api_slow
```

**Expected Behavior**:

- Circuit breaker should activate
- Retries should be limited
- Errors should be properly handled
- System should recover when APIs are restored

## Performance Targets

### API Endpoints

| Endpoint                                | p50 Target | p95 Target | p99 Target |
| --------------------------------------- | ---------- | ---------- | ---------- |
| POST /api/v1/jobs                       | < 50ms     | < 200ms    | < 500ms    |
| GET /api/v1/jobs                        | < 30ms     | < 100ms    | < 200ms    |
| GET /api/v1/jobs/:id                    | < 20ms     | < 50ms     | < 100ms    |
| GET /api/v1/reconciliations/:id/summary | < 10ms     | < 50ms     | < 100ms    |

### Database Queries

| Query Type      | Target  |
| --------------- | ------- |
| Simple SELECT   | < 10ms  |
| JOIN queries    | < 50ms  |
| Aggregations    | < 100ms |
| Complex queries | < 200ms |

## Load Test Checklist

- [ ] Baseline metrics recorded
- [ ] Test environment matches production
- [ ] Database seeded with realistic data
- [ ] Cache warmed up
- [ ] Monitoring dashboards open
- [ ] Alert rules configured
- [ ] On-call engineer notified
- [ ] Test scripts reviewed
- [ ] Expected results documented
- [ ] Post-test analysis planned

## Interpreting Results

### Good Results

- ✅ p95 latency < target
- ✅ Error rate < 1%
- ✅ No memory leaks
- ✅ Database connections stable
- ✅ Cache hit rate > 50%

### Warning Signs

- ⚠️ p95 latency approaching target
- ⚠️ Error rate > 1%
- ⚠️ Memory usage growing
- ⚠️ Database connections increasing
- ⚠️ Cache hit rate < 50%

### Critical Issues

- ❌ p95 latency > target
- ❌ Error rate > 5%
- ❌ Memory leaks detected
- ❌ Database connection pool exhausted
- ❌ System crashes/restarts

## Post-Load Test Analysis

1. **Review Metrics**
   - Compare before/after metrics
   - Identify bottlenecks
   - Check for regressions

2. **Analyze Errors**
   - Review error logs
   - Identify error patterns
   - Check error rates by endpoint

3. **Database Analysis**
   - Review slow query log
   - Check index usage
   - Identify missing indexes

4. **Cache Analysis**
   - Review cache hit rates
   - Check cache eviction
   - Optimize cache TTLs

5. **Document Findings**
   - Create performance report
   - Document optimizations needed
   - Update runbook with learnings

## Continuous Load Testing

### Scheduled Tests

Run load tests regularly:

- **Daily**: Smoke tests (low load)
- **Weekly**: Full load tests
- **Before releases**: Comprehensive tests

### CI/CD Integration

```yaml
# .github/workflows/load-test.yml
name: Load Test
on:
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run k6 tests
        run: |
          k6 run tests/load/k6-load-test.js
```

## Best Practices

1. **Start Small**: Begin with low load, gradually increase
2. **Monitor Everything**: Watch metrics, logs, traces during tests
3. **Test Realistic Scenarios**: Use realistic data and patterns
4. **Test Failure Scenarios**: Chaos engineering is important
5. **Document Results**: Keep records of all test results
6. **Iterate**: Use results to optimize, then test again

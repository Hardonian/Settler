# Load Testing Guide

This directory contains load testing scripts for validating Settler's scalability and performance.

## Test Scripts

### 1. `k6-10x-peak-load-test.js` - 10x Peak Load Stress Test

**Purpose**: Simulates 10x the projected peak user load to validate scalability.

**Configuration**:

- Normal peak load: 100 concurrent users
- 10x peak load: 1000 concurrent users
- Test duration: ~30 minutes
- Detailed metrics for latency, resource consumption, and cost analysis

**Run**:

```bash
k6 run tests/load/k6-10x-peak-load-test.js \
  -e BASE_URL=https://api.settler.io \
  -e API_KEY=your-api-key \
  -e COST_PER_1K_REQUESTS=0.01
```

**Expected Results**:

- p95 latency < 500ms at 10x load
- Error rate < 5%
- Success rates > 90% for all operations
- System remains stable throughout test

### 2. `k6-comprehensive-load-test.js` - Comprehensive Load Test

**Purpose**: Tests all major API endpoints under various load scenarios.

**Run**:

```bash
k6 run tests/load/k6-comprehensive-load-test.js \
  -e BASE_URL=https://api.settler.io \
  -e API_KEY=your-api-key
```

### 3. `k6-load-test.js` - Basic Load Test

**Purpose**: Basic smoke test for API endpoints.

**Run**:

```bash
k6 run tests/load/k6-load-test.js \
  -e BASE_URL=https://api.settler.io \
  -e API_KEY=your-api-key
```

## Metrics Collected

### Latency Metrics

- p50, p95, p99 percentiles
- Average and maximum latency
- Per-endpoint latency breakdown

### Success Rates

- Job creation success rate
- Job list success rate
- Job get success rate
- Report get success rate
- Webhook creation success rate

### Resource Consumption

- Requests per second
- Active users (VUs)
- Error rate percentage
- Memory usage (if available)
- CPU usage (if available)

### Cost Analysis

- Estimated cost per request
- Total estimated cost
- Cost per user
- Cost per 1000 requests

## Reports

After running tests, the following reports are generated:

1. **`load-test-report.html`** - Interactive HTML report with charts and graphs
2. **`load-test-summary.json`** - JSON summary with all metrics
3. **Console output** - Real-time test progress and summary

## Interpreting Results

### Good Results ✅

- p95 latency < target (500ms for 10x load)
- Error rate < 5%
- Success rates > 90%
- No memory leaks
- Stable resource consumption

### Warning Signs ⚠️

- p95 latency approaching target
- Error rate > 1% but < 5%
- Success rates between 85-90%
- Gradual increase in resource consumption

### Critical Issues ❌

- p95 latency > target
- Error rate > 5%
- Success rates < 85%
- Memory leaks detected
- System crashes/restarts

## Performance Targets

### At Normal Peak Load (100 users)

- p50 latency: < 50ms
- p95 latency: < 200ms
- p99 latency: < 500ms
- Error rate: < 1%

### At 10x Peak Load (1000 users)

- p50 latency: < 100ms
- p95 latency: < 500ms
- p99 latency: < 1000ms
- Error rate: < 5%

## Running in CI/CD

Load tests are automatically run in CI/CD on:

- Main branch pushes (10x peak load test)
- Pull requests (comprehensive load test)
- Scheduled daily runs (smoke tests)

See `.github/workflows/ci.yml` for configuration.

## Local Development

### Prerequisites

```bash
# Install k6
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Running Tests Locally

1. Start the API server:

```bash
cd packages/api
npm run dev
```

2. Run load test:

```bash
k6 run tests/load/k6-10x-peak-load-test.js \
  -e BASE_URL=http://localhost:3000 \
  -e API_KEY=test-api-key
```

## Best Practices

1. **Start Small**: Begin with low load, gradually increase
2. **Monitor Everything**: Watch metrics, logs, traces during tests
3. **Test Realistic Scenarios**: Use realistic data and patterns
4. **Test Failure Scenarios**: Include chaos engineering tests
5. **Document Results**: Keep records of all test results
6. **Iterate**: Use results to optimize, then test again

## Troubleshooting

### High Latency

- Check database connection pool size
- Review slow query logs
- Verify cache hit rates
- Check for N+1 query problems

### High Error Rate

- Review error logs
- Check rate limiting configuration
- Verify API key validity
- Check resource limits (memory, CPU)

### Test Failures

- Verify API server is running
- Check network connectivity
- Verify test configuration
- Review k6 logs for errors

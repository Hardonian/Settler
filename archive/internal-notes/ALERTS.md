# Alerting Configuration

This document defines alert conditions for Settler's observability stack (Prometheus + Grafana).

## Alert Rules (Prometheus)

```yaml
groups:
  - name: settler_api_alerts
    interval: 30s
    rules:
      # High Error Rate
      - alert: HighErrorRate
        expr: |
          rate(http_request_errors_total[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      # Latency Spike
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "p95 latency is {{ $value | humanizeDuration }} (threshold: 200ms)"

      # Database Connection Pool Exhausted
      - alert: DatabasePoolExhausted
        expr: |
          active_connections / pg_stat_database_max_connections > 0.9
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value | humanizePercentage }} of connections in use"

      # Queue Backlog
      - alert: QueueBacklog
        expr: |
          queue_depth > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Queue backlog detected"
          description: "Queue depth is {{ $value }} (threshold: 1000)"

      # Reconciliation Failure Rate
      - alert: HighReconciliationFailureRate
        expr: |
          rate(reconciliations_total{status="failed"}[10m]) / rate(reconciliations_total[10m]) > 0.1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High reconciliation failure rate"
          description: "{{ $value | humanizePercentage }} of reconciliations are failing"

      # Tenant Quota Exceeded
      - alert: TenantQuotaExceeded
        expr: |
          tenant_quota_usage / tenant_quota_limit > 0.95
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Tenant quota nearly exceeded"
          description: "Tenant {{ $labels.tenant_id }} is at {{ $value | humanizePercentage }} of quota"

      # Noisy Neighbor Detection
      - alert: NoisyNeighbor
        expr: |
          tenant_resource_usage_seconds_sum / sum(tenant_resource_usage_seconds_sum) > 0.5
        for: 10m
        labels:
          severity: info
        annotations:
          summary: "Noisy neighbor detected"
          description: "Tenant {{ $labels.tenant_id }} is using {{ $value | humanizePercentage }} of resources"

      # Cache Hit Rate Low
      - alert: LowCacheHitRate
        expr: |
          sum(rate(http_requests_total{route=~".*summary.*"}[5m])) - sum(rate(http_requests_total{route=~".*summary.*",cache="HIT"}[5m])) / sum(rate(http_requests_total{route=~".*summary.*"}[5m])) > 0.5
        for: 10m
        labels:
          severity: info
        annotations:
          summary: "Low cache hit rate"
          description: "Cache hit rate is below 50%"

      # External API Slow
      - alert: ExternalAPISlow
        expr: |
          histogram_quantile(0.95, rate(http_client_request_duration_seconds_bucket{service="external"}[5m])) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "External API slow"
          description: "External API p95 latency is {{ $value | humanizeDuration }}"

      # Dead Letter Queue Growth
      - alert: DeadLetterQueueGrowth
        expr: |
          increase(dead_letter_queue_size[10m]) > 100
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Dead letter queue growing"
          description: "{{ $value }} messages added to DLQ in last 10 minutes"
```

## Alert Severity Levels

- **Critical**: Immediate action required (service down, data loss risk)
- **Warning**: Attention needed but not immediately critical
- **Info**: Informational alerts (noisy neighbors, trends)

## Alert Routing

- **Critical**: PagerDuty / On-call rotation
- **Warning**: Slack #alerts channel
- **Info**: Slack #monitoring channel

## Alert Response SLA

- **Critical**: Respond within 5 minutes
- **Warning**: Respond within 30 minutes
- **Info**: Review during next business day

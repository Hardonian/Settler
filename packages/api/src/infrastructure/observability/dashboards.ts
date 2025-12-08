/**
 * Observability Dashboard Configuration
 * Grafana dashboard configurations and Prometheus alerting rules
 */

/**
 * Prometheus Alerting Rules
 * These rules should be configured in Prometheus
 */
export const prometheusAlerts = {
  highErrorRate: {
    alert: 'HighErrorRate',
    expr: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.05',
    for: '5m',
    labels: {
      severity: 'critical',
    },
    annotations: {
      summary: 'High error rate detected',
      description: 'Error rate is above 5% for 5 minutes',
    },
  },
  highLatency: {
    alert: 'HighLatency',
    expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5',
    for: '5m',
    labels: {
      severity: 'warning',
    },
    annotations: {
      summary: 'High API latency detected',
      description: 'p95 latency is above 500ms for 5 minutes',
    },
  },
  lowCacheHitRate: {
    alert: 'LowCacheHitRate',
    expr: 'rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.5',
    for: '10m',
    labels: {
      severity: 'warning',
    },
    annotations: {
      summary: 'Low cache hit rate',
      description: 'Cache hit rate is below 50% for 10 minutes',
    },
  },
  databaseConnectionPoolExhausted: {
    alert: 'DatabaseConnectionPoolExhausted',
    expr: 'pg_stat_database_numbackends / pg_settings_max_connections > 0.8',
    for: '5m',
    labels: {
      severity: 'critical',
    },
    annotations: {
      summary: 'Database connection pool nearly exhausted',
      description: 'Database connections are above 80% of max',
    },
  },
  reconciliationFailureRate: {
    alert: 'ReconciliationFailureRate',
    expr: 'rate(reconciliations_failed_total[5m]) / rate(reconciliations_started_total[5m]) > 0.1',
    for: '5m',
    labels: {
      severity: 'critical',
    },
    annotations: {
      summary: 'High reconciliation failure rate',
      description: 'Reconciliation failure rate is above 10%',
    },
  },
};

/**
 * Grafana Dashboard Variables
 */
export const grafanaVariables = {
  environment: {
    name: 'environment',
    type: 'query',
    query: 'label_values(environment)',
    current: { value: 'production' },
  },
  jobId: {
    name: 'jobId',
    type: 'query',
    query: 'label_values(job_id)',
    current: { value: 'All' },
  },
};

/**
 * Key Metrics to Monitor
 */
export const keyMetrics = {
  api: [
    'http_requests_total',
    'http_request_duration_seconds',
    'http_requests_in_flight',
  ],
  reconciliation: [
    'reconciliations_started_total',
    'reconciliations_completed_total',
    'reconciliations_failed_total',
    'reconciliation_match_accuracy',
    'reconciliation_duration_seconds',
  ],
  cache: [
    'cache_hits_total',
    'cache_misses_total',
    'cache_size_bytes',
  ],
  database: [
    'pg_stat_database_numbackends',
    'pg_stat_database_xact_commit',
    'pg_stat_database_xact_rollback',
    'pg_stat_database_blks_read',
    'pg_stat_database_blks_hit',
  ],
  redis: [
    'redis_memory_used_bytes',
    'redis_connected_clients',
    'redis_commands_processed_total',
  ],
};

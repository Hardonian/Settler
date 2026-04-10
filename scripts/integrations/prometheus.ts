/**
 * Prometheus Metrics Exporter
 * For Settler: reconciliation metrics, query latency, error rates
 */

import { Registry, Counter, Gauge, Histogram } from 'prom-client';

// Create registry
const register = new Registry();

// Reconciliation metrics
const reconciliationTotal = new Counter({
  name: 'settler_reconciliation_total',
  help: 'Total reconciliation runs',
  labelNames: ['status', 'type'],
  registers: [register],
});

const reconciliationDuration = new Histogram({
  name: 'settler_reconciliation_duration_seconds',
  help: 'Reconciliation duration in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

const discrepancyCount = new Gauge({
  name: 'settler_discrepancies_open',
  help: 'Open discrepancies count',
  labelNames: ['severity'],
  registers: [register],
});

// API metrics
const apiRequestTotal = new Counter({
  name: 'settler_api_requests_total',
  help: 'Total API requests',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register],
});

const apiRequestDuration = new Histogram({
  name: 'settler_api_request_duration_seconds',
  help: 'API request duration',
  labelNames: ['method', 'endpoint'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

// Query gateway metrics
const queryGatewayLatency = new Histogram({
  name: 'settler_query_gateway_latency_seconds',
  help: 'Query gateway latency',
  labelNames: ['query_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [register],
});

// Database metrics
const dbConnectionPool = new Gauge({
  name: 'settler_db_connections_active',
  help: 'Active database connections',
  registers: [register],
});

const dbQueryDuration = new Histogram({
  name: 'settler_db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
  registers: [register],
});

export {
  register,
  reconciliationTotal,
  reconciliationDuration,
  discrepancyCount,
  apiRequestTotal,
  apiRequestDuration,
  queryGatewayLatency,
  dbConnectionPool,
  dbQueryDuration,
};

// Express middleware for metrics
export function metricsMiddleware(req: any, res: any, next: Function) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    apiRequestTotal.inc({ method: req.method, endpoint: req.route?.path || req.path, status: res.statusCode });
    apiRequestDuration.observe({ method: req.method, endpoint: req.route?.path || req.path }, duration);
  });
  
  next();
}
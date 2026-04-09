# Operations Guide

This guide covers operational aspects of running Settler in production.

## Monitoring

### Health Checks

Settler provides several health check endpoints:

- **Basic Health**: `GET /health` - Returns overall system health
- **Liveness Probe**: `GET /health/live` - Always returns OK if process is alive
- **Readiness Probe**: `GET /health/ready` - Returns OK only if dependencies are healthy

**Kubernetes Example:**

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Metrics

Settler exposes Prometheus-compatible metrics at `/metrics`:

- **HTTP Metrics**: Request count, latency, error rate by endpoint
- **Business Metrics**: Reconciliation jobs, webhook deliveries, API usage
- **System Metrics**: Database connections, Redis cache hit/miss, queue depth

**Example Prometheus Scrape Config:**

```yaml
scrape_configs:
  - job_name: "settler-api"
    metrics_path: "/metrics"
    static_configs:
      - targets: ["api.settler.io:3000"]
```

### Logging

- **Format**: Structured JSON logs
- **Levels**: ERROR, WARN, INFO, DEBUG
- **Trace IDs**: Included in all log entries for request correlation
- **PII Redaction**: Automatic redaction of sensitive data

**Log Aggregation:**

Logs should be shipped to a centralized logging system (e.g., Datadog, Splunk, ELK stack) for analysis and alerting.

### Alerting

Recommended alerts:

- **High Error Rate**: Error rate > 5% for 5 minutes
- **High Latency**: P95 latency > 1s for 5 minutes
- **Database Connection Pool Exhaustion**: Available connections < 2
- **Redis Unavailable**: Redis health check fails
- **High Memory Usage**: Memory usage > 80%
- **High CPU Usage**: CPU usage > 80% for 10 minutes

## Scaling

### Horizontal Scaling

Settler is stateless and can be horizontally scaled:

- **API Servers**: Scale based on request rate and CPU usage
- **Background Workers**: Scale based on queue depth
- **Database**: Use read replicas for read-heavy workloads

### Vertical Scaling

- **API Servers**: Increase CPU/memory for compute-intensive operations
- **Database**: Increase CPU/memory/IOPS for larger datasets
- **Redis**: Increase memory for larger cache

### Auto-Scaling

**Kubernetes HPA Example:**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: settler-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: settler-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## Database Management

### Migrations

- **Local Development**: `npm run db:migrate:local`
- **Production**: `npm run db:migrate:prod`
- **Verification**: `npm run db:verify`

**Migration Best Practices:**

- Always test migrations in staging first
- Run migrations during low-traffic periods
- Have a rollback plan
- Monitor migration execution time

### Backups

- **Frequency**: Daily full backups, hourly incremental backups
- **Retention**: 30 days for full backups, 7 days for incremental
- **Testing**: Restore backups monthly to verify integrity

### Connection Pooling

- **Max Connections**: 20 per instance (configurable)
- **Min Connections**: 5 per instance (configurable)
- **Idle Timeout**: 30 seconds
- **Monitor**: Track connection pool usage and adjust as needed

## Redis Management

### Configuration

- **TTL**: Default TTL for cache entries (configurable)
- **Memory Limit**: Set appropriate memory limits
- **Eviction Policy**: Use `allkeys-lru` for cache eviction

### Monitoring

- **Memory Usage**: Monitor Redis memory usage
- **Hit Rate**: Track cache hit/miss ratio
- **Connection Count**: Monitor active connections
- **Latency**: Track Redis operation latency

## Deployment

### Zero-Downtime Deployments

1. **Blue-Green Deployment**: Deploy new version alongside old version, then switch traffic
2. **Rolling Updates**: Gradually replace old instances with new ones
3. **Canary Releases**: Deploy to small percentage of traffic first

### Deployment Checklist

- [ ] Run database migrations (if any)
- [ ] Verify environment variables are set
- [ ] Run health checks
- [ ] Monitor error rates
- [ ] Verify metrics are being collected
- [ ] Check logs for errors

### Rollback Procedure

1. Identify the issue
2. Revert to previous deployment
3. Verify system health
4. Investigate root cause
5. Document incident

## Incident Response

### On-Call Rotation

- **Primary On-Call**: Handles incidents during business hours
- **Secondary On-Call**: Handles incidents outside business hours
- **Escalation**: Escalate to engineering lead if issue persists > 30 minutes

### Incident Runbook

See [SRE Runbook](../sre/SRE_RUNBOOK.md) for detailed incident response procedures.

### Post-Incident Review

After resolving an incident:

1. Document the incident (what happened, root cause, resolution)
2. Identify improvements (prevention, detection, response)
3. Update runbooks and documentation
4. Share learnings with team

## Performance Tuning

### Database Optimization

- **Indexes**: Ensure proper indexes on frequently queried columns
- **Query Analysis**: Use `EXPLAIN ANALYZE` to identify slow queries
- **Connection Pooling**: Adjust pool size based on load
- **Vacuum**: Run `VACUUM ANALYZE` regularly

### Caching Strategy

- **Cache Frequently Accessed Data**: User sessions, API keys, adapter configs
- **Cache Invalidation**: Use tag-based invalidation for related data
- **Cache Warming**: Pre-warm cache for predictable access patterns

### API Optimization

- **Response Compression**: Enable gzip compression
- **Pagination**: Use cursor-based pagination for large datasets
- **Field Selection**: Allow clients to select specific fields
- **Rate Limiting**: Prevent abuse and ensure fair usage

## Security Operations

### Secret Management

- **Storage**: Use secret management service (AWS Secrets Manager, HashiCorp Vault)
- **Rotation**: Rotate secrets regularly (every 90 days)
- **Access Control**: Limit access to secrets based on role
- **Audit**: Log all secret access

### Security Monitoring

- **Failed Login Attempts**: Alert on multiple failed login attempts
- **Unusual API Usage**: Detect unusual patterns in API usage
- **Security Events**: Monitor security-related events (key rotation, permission changes)

### Compliance

- **Audit Logs**: Maintain audit logs for compliance requirements
- **Data Retention**: Comply with data retention policies
- **Access Reviews**: Regular reviews of user access and permissions

## Disaster Recovery

### Backup Strategy

- **Database**: Daily full backups, hourly incremental backups
- **Configuration**: Version control for all configuration
- **Secrets**: Secure backup of encryption keys

### Recovery Procedures

1. **Database Recovery**: Restore from latest backup
2. **Service Recovery**: Redeploy from version control
3. **Data Recovery**: Restore from backup and replay events

### RTO/RPO Targets

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour

## Support

- **Documentation**: [docs.settler.io](https://docs.settler.io)
- **Issues**: [GitHub Issues](https://github.com/shardie-github/Settler-API/issues)
- **Email**: support@settler.io

# Operator Runbook: Integration Connectors

## Diagnosing Sync Failures

### 1. Check Sync Run Status

```sql
SELECT 
  sr.id,
  sr.connector_id,
  c.provider_id,
  sr.status,
  sr.started_at,
  sr.finished_at,
  sr.error_message,
  sr.error_details,
  sr.transactions_synced,
  sr.errors_count
FROM sync_runs sr
JOIN connectors c ON c.id = sr.connector_id
WHERE sr.status = 'failed'
ORDER BY sr.started_at DESC
LIMIT 10;
```

### 2. Check Connector Health

```sql
SELECT 
  c.id,
  c.provider_id,
  c.status,
  c.last_sync_at,
  c.last_successful_sync_at,
  c.consecutive_failures,
  c.error_count,
  c.last_error,
  c.auto_disabled
FROM connectors c
WHERE c.status IN ('error', 'needs_attention')
ORDER BY c.consecutive_failures DESC;
```

### 3. View Recent Errors

```sql
SELECT 
  c.provider_id,
  sr.error_message,
  sr.error_details,
  sr.started_at,
  COUNT(*) as occurrence_count
FROM sync_runs sr
JOIN connectors c ON c.id = sr.connector_id
WHERE sr.status = 'failed'
  AND sr.started_at > NOW() - INTERVAL '24 hours'
GROUP BY c.provider_id, sr.error_message, sr.error_details, sr.started_at
ORDER BY occurrence_count DESC;
```

## Rotating Tokens

### OAuth2 Tokens

1. **Check Token Expiry**:

```sql
SELECT 
  c.provider_id,
  cc.token_expires_at,
  cc.updated_at
FROM connector_credentials cc
JOIN connectors c ON c.id = cc.connector_id
WHERE cc.token_expires_at IS NOT NULL
  AND cc.token_expires_at < NOW() + INTERVAL '7 days';
```

2. **Refresh Token** (via API):

```bash
curl -X POST https://your-domain.com/api/connectors/refresh/{providerId} \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-uuid",
    "connectorId": "connector-uuid"
  }'
```

3. **Manual Refresh** (if API fails):

- Update `connector_credentials.refresh_token_encrypted`
- Trigger sync manually
- Driver will attempt token refresh automatically

### API Keys

1. **Update Credentials**:

```sql
UPDATE connector_credentials
SET encrypted_credentials = '{"api_key": "new-key"}'::jsonb,
    updated_at = NOW(),
    rotated_at = NOW()
WHERE connector_id = 'connector-uuid';
```

2. **Test Connection**:

```bash
curl -X POST https://your-domain.com/api/connectors/test/{providerId} \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-uuid",
    "credentials": {"api_key": "new-key"},
    "config": {}
  }'
```

## Replaying Events

### Replay Failed Webhooks

```sql
-- Find failed webhooks
SELECT 
  we.id,
  we.connector_id,
  c.provider_id,
  we.event_type,
  we.created_at,
  we.error_message
FROM webhook_events we
JOIN connectors c ON c.id = we.connector_id
WHERE we.processed = false
ORDER BY we.created_at DESC;

-- Replay webhook (via API)
curl -X POST https://your-domain.com/api/connectors/webhook/{providerId}/replay \
  -H "Content-Type: application/json" \
  -d '{
    "webhookEventId": "webhook-uuid"
  }'
```

### Replay Sync Run

```sql
-- Get sync run details
SELECT 
  sr.id,
  sr.connector_id,
  c.provider_id,
  sr.sync_since,
  sr.sync_until,
  sr.cursor
FROM sync_runs sr
JOIN connectors c ON c.id = sr.connector_id
WHERE sr.id = 'sync-run-uuid';

-- Trigger manual sync
curl -X POST https://your-domain.com/api/connectors/sync/{providerId} \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-uuid",
    "since": "2024-01-01T00:00:00Z",
    "until": "2024-01-31T23:59:59Z"
  }'
```

## Monitoring

### Health Dashboard Query

```sql
SELECT 
  c.provider_id,
  COUNT(*) as total_connectors,
  COUNT(*) FILTER (WHERE c.status = 'connected') as connected,
  COUNT(*) FILTER (WHERE c.status = 'error') as error,
  COUNT(*) FILTER (WHERE c.status = 'needs_attention') as needs_attention,
  AVG(EXTRACT(EPOCH FROM (NOW() - c.last_successful_sync_at)) / 3600) as avg_hours_since_sync,
  SUM(c.consecutive_failures) as total_failures
FROM connectors c
GROUP BY c.provider_id
ORDER BY c.provider_id;
```

### Sync Performance Metrics

```sql
SELECT 
  c.provider_id,
  COUNT(*) as sync_count,
  AVG(EXTRACT(EPOCH FROM (sr.finished_at - sr.started_at))) as avg_duration_seconds,
  AVG(sr.transactions_synced) as avg_transactions_per_sync,
  SUM(sr.errors_count) as total_errors
FROM sync_runs sr
JOIN connectors c ON c.id = sr.connector_id
WHERE sr.status = 'completed'
  AND sr.started_at > NOW() - INTERVAL '7 days'
GROUP BY c.provider_id
ORDER BY avg_duration_seconds DESC;
```

## Common Issues

### Issue: Token Expired

**Symptoms**: Sync fails with "401 Unauthorized" or "Token expired"

**Solution**:
1. Check `connector_credentials.token_expires_at`
2. If expired, refresh token via API or manually
3. Update connector status back to 'connected'

### Issue: Rate Limiting

**Symptoms**: Sync fails with "429 Too Many Requests"

**Solution**:
1. Check provider rate limits
2. Increase sync interval
3. Implement exponential backoff (already in runtime)

### Issue: Webhook Not Processing

**Symptoms**: Webhooks received but not processed

**Solution**:
1. Check `webhook_events.processed = false`
2. Verify webhook signature
3. Replay failed webhooks manually

### Issue: Duplicate Data

**Symptoms**: Same transactions appearing multiple times

**Solution**:
1. Check idempotency keys in `financial_transactions`
2. Verify `idempotency_key` uniqueness constraint
3. Review sync cursor logic

## Emergency Procedures

### Disable All Connectors

```sql
UPDATE connectors
SET auto_disabled = true,
    status = 'error'
WHERE status = 'connected';
```

### Re-enable Connector

```sql
UPDATE connectors
SET auto_disabled = false,
    status = 'connected',
    consecutive_failures = 0,
    error_count = 0
WHERE id = 'connector-uuid';
```

### Clear Failed Sync Runs

```sql
DELETE FROM sync_runs
WHERE status = 'failed'
  AND started_at < NOW() - INTERVAL '30 days';
```

## Environment Variables

Required environment variables for connectors:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Plaid
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENVIRONMENT=sandbox|development|production

# TrueLayer
TRUELAYER_CLIENT_ID=your-truelayer-client-id
TRUELAYER_CLIENT_SECRET=your-truelayer-client-secret
TRUELAYER_ENVIRONMENT=sandbox|production

# FreshBooks
FRESHBOOKS_CLIENT_ID=your-freshbooks-client-id
FRESHBOOKS_CLIENT_SECRET=your-freshbooks-client-secret

# Wave
WAVE_API_KEY=your-wave-api-key

# Chargebee
CHARGEBEE_API_KEY=your-chargebee-api-key
CHARGEBEE_SITE=your-site-name

# Recurly
RECURLY_API_KEY=your-recurly-api-key
RECURLY_SUBDOMAIN=your-subdomain
```

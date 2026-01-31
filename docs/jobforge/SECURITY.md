# JobForge Security Model

Security considerations for running JobForge in production.

## Multi-Tenant Isolation

### Row Level Security (RLS)

All tables enforce tenant isolation:

```sql
CREATE POLICY jobforge_jobs_select_policy ON jobforge_jobs
  FOR SELECT
  USING (
    tenant_id::text = current_setting('app.tenant_id', true)
    OR current_setting('app.tenant_id', true) IS NULL
  );
```

**Key Points:**

- Tenants can only see their own data
- Enforced at database level (no application bugs can bypass)
- Service role can bypass for admin operations

### Testing Isolation

Run `supabase/tests/test_rls_isolation.sql` to verify:

```bash
psql -U postgres -d your_database -f supabase/tests/test_rls_isolation.sql
```

Expected: Cross-tenant reads return 0 rows.

## Least Privilege

### Service Role Protection

**NEVER expose service role key to clients:**

```typescript
// ❌ WRONG: Service key on client
const supabase = createClient(url, serviceRoleKey) // Exposed to browser!

// ✅ CORRECT: Service key only on server
// app/api/jobs/route.ts (server-only)
const supabase = createClient(url, serviceRoleKey)
```

### RPC-Only Mutations

Direct INSERT/UPDATE/DELETE blocked by RLS:

```sql
CREATE POLICY jobforge_jobs_insert_policy ON jobforge_jobs
  FOR INSERT
  WITH CHECK (false);  -- Always fails
```

**Why?**

- RPC functions enforce business logic
- Prevent invalid state transitions
- Audit trail in function logs

## SSRF Protection

### HTTP Connector

Blocks private IPs and internal services:

```typescript
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // AWS metadata
  'metadata.google.internal', // GCP metadata
]

const PRIVATE_IP_RANGES = [/^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./]
```

### Allowlist Enforcement

```typescript
await client.enqueueJob({
  type: 'connector.http.request',
  payload: {
    url: 'https://api.example.com/webhook',
    allowlist: ['api.example.com', '*.trusted-domain.com'],
  },
})
```

**Best Practices:**

- Always use allowlist for tenant-provided URLs
- Store allowlist in `jobforge_connector_configs`
- Reject if host not in allowlist

## Webhook Security

### HMAC Signing

```typescript
// Worker signs webhook payload
const signature = createHmac('sha256', secret).update(payloadString).digest('hex')

headers['X-JobForge-Signature'] = `sha256=${signature}`
```

### Verification (Receiver)

```typescript
// Webhook receiver verifies signature
const receivedSig = request.headers['x-jobforge-signature']
const expectedSig = `sha256=${computeHmac(request.body, secret)}`

if (receivedSig !== expectedSig) {
  throw new Error('Invalid signature')
}
```

### Replay Protection

```typescript
// Check timestamp (reject if >5 minutes old)
const timestamp = request.headers['x-jobforge-timestamp']
const age = Date.now() - new Date(timestamp).getTime()

if (age > 300_000) {
  // 5 minutes
  throw new Error('Timestamp too old')
}
```

## Secret Management

### Environment Variables

**NEVER store secrets in database:**

```typescript
// ❌ WRONG
await db.insert('connector_configs', {
  webhook_secret: 'actual-secret-value', // Plaintext in DB!
})

// ✅ CORRECT
await db.insert('connector_configs', {
  webhook_secret_ref: 'WEBHOOK_SECRET_TENANT_123', // Reference only
})

// Worker fetches from env
const secret = process.env[config.webhook_secret_ref]
```

### Secrets Rotation

1. Add new secret to environment
2. Update `secret_ref` in connector config
3. Remove old secret after grace period

## Input Validation

### Payload Validation (Zod)

```typescript
const PayloadSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  timeout_ms: z.number().int().positive().max(60_000),
})

const validated = PayloadSchema.parse(payload) // Throws if invalid
```

### SQL Injection Prevention

All RPC parameters are typed:

```sql
CREATE FUNCTION jobforge_enqueue_job(
  p_tenant_id UUID,  -- Typed as UUID, not text
  p_type TEXT,
  ...
)
```

**Never concatenate user input into SQL:**

```sql
-- ❌ WRONG
EXECUTE 'SELECT * FROM jobs WHERE tenant_id = ' || user_input;

-- ✅ CORRECT
SELECT * FROM jobs WHERE tenant_id = p_tenant_id;
```

## Rate Limiting

### Per-Tenant Limits

```sql
CREATE FUNCTION jobforge_enqueue_job(...)
...
BEGIN
  -- Check current queue depth
  SELECT COUNT(*) INTO v_queued
  FROM jobforge_jobs
  WHERE tenant_id = p_tenant_id
    AND status IN ('queued', 'running');

  IF v_queued > 10000 THEN
    RAISE EXCEPTION 'Tenant job limit exceeded';
  END IF;
  ...
END;
```

### Global Rate Limits

Use API gateway (Kong, Nginx) for global limits:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

location /api/jobs {
  limit_req zone=api burst=20;
}
```

## Audit Logging

### Job Attempt History

All attempts logged in `jobforge_job_attempts`:

```sql
INSERT INTO jobforge_job_attempts (
  job_id,
  tenant_id,
  attempt_no,
  error
) VALUES (...);
```

**Use for:**

- Security investigations
- Debugging failures
- Compliance requirements

### Application Logs

Structured JSON logs with:

- `worker_id` - Which worker processed
- `tenant_id` - Which tenant
- `trace_id` - Correlation ID
- `timestamp` - When

## Network Security

### Supabase Configuration

1. **Enable RLS on all tables**
2. **Restrict database access** (no public internet)
3. **Use connection pooling** (Supavisor, pgBouncer)
4. **Enable SSL/TLS** for all connections

### Worker Deployment

1. **Run in private network** (VPC, private subnets)
2. **No inbound access** (workers poll, don't listen)
3. **Outbound allowlist** (firewall rules)
4. **Secrets via environment** (not config files)

## Compliance

### GDPR / Data Deletion

```sql
-- Delete all jobs for tenant
DELETE FROM jobforge_jobs WHERE tenant_id = 'tenant-to-delete';
DELETE FROM jobforge_job_results WHERE tenant_id = 'tenant-to-delete';
DELETE FROM jobforge_job_attempts WHERE tenant_id = 'tenant-to-delete';
DELETE FROM jobforge_connector_configs WHERE tenant_id = 'tenant-to-delete';
```

### Data Retention

Configure automatic cleanup:

```typescript
// Delete jobs older than retention period
await client.enqueueJob({
  type: 'system.cleanup',
  payload: {
    retention_days: 90,
    statuses: ['succeeded', 'failed', 'dead'],
  },
})
```

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Service role key never exposed to clients
- [ ] SSRF protection enabled (HTTP connector)
- [ ] Webhook HMAC signing configured
- [ ] Secrets stored in environment, not database
- [ ] Input validation with Zod/Pydantic
- [ ] Rate limiting per tenant
- [ ] Audit logging enabled
- [ ] Workers in private network
- [ ] SSL/TLS for database connections
- [ ] Regular security updates (dependencies)

## Reporting Vulnerabilities

Report security issues to: security@example.com (replace with actual contact)

**Do NOT open public GitHub issues for security vulnerabilities.**

---

For operational guidance, see [RUNBOOK.md](RUNBOOK.md).

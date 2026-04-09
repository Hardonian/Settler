# Teardown, Cleanup & Offboarding

How to cleanly remove Settler from your environment. This covers local development, pilot, and production teardown.

## Local Development Teardown

### Stop services

```bash
# Stop development servers
# (Ctrl+C if running pnpm dev)

# Stop infrastructure containers (TigerBeetle, PostgreSQL, Redis)
docker compose -f packages/api/docker-compose.yml down

# Or, if you only started TigerBeetle:
pnpm tb:stop
```

### Remove local data

```bash
# Remove Docker volumes (deletes all local database data)
docker compose -f packages/api/docker-compose.yml down -v

# Remove demo data files
rm -rf demo/data/

# Remove generated artifacts
rm -rf examples/demo-output/
```

### Remove local environment

```bash
# Remove node_modules and build artifacts
pnpm run clean
rm -rf node_modules/

# Remove local environment files (contains secrets)
rm .env.local

# Optionally remove the entire repository
cd .. && rm -rf settler/
```

## Pilot / Sandbox Teardown

### 1. Export your data first

Before deleting anything, export all reconciliation data for your records:

```bash
# Via CLI
settler export --tenant <tenant-id> --format csv --output ./settler-export/

# Via API
curl -X POST https://api.settler.dev/api/v1/exports \
  -H "X-API-Key: $SETTLER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"format": "csv", "includeEvidence": true}'
```

### 2. Revoke API keys

Revoke all API keys associated with the pilot to prevent further API calls:

```bash
# Via the console: Settings → API Keys → Revoke
# Via API:
curl -X DELETE https://api.settler.dev/api/v1/console/api-keys/<key-id> \
  -H "X-API-Key: $SETTLER_API_KEY"
```

### 3. Remove webhooks

Deregister all webhook endpoints to stop event delivery:

```bash
# List webhooks
curl https://api.settler.dev/api/v1/webhooks \
  -H "X-API-Key: $SETTLER_API_KEY"

# Delete each webhook
curl -X DELETE https://api.settler.dev/api/v1/webhooks/<webhook-id> \
  -H "X-API-Key: $SETTLER_API_KEY"
```

### 4. Remove scheduled jobs

Cancel any scheduled reconciliation jobs:

```bash
# List jobs
settler jobs list --tenant <tenant-id>

# Delete each scheduled job
settler jobs delete <job-id>
```

### 5. Request data deletion

For hosted/managed accounts, request full data deletion:

- Email: support@settler.io
- Subject: "Data deletion request — [Tenant Name]"
- Include your tenant ID and confirm you have exported any data you need

Settler will confirm deletion within 5 business days per the [Data Portability](../../DATA_PORTABILITY.md) policy.

## Production Teardown

### Pre-teardown checklist

- [ ] All reconciliation data has been exported
- [ ] Downstream systems no longer depend on Settler webhooks
- [ ] API keys have been removed from CI/CD secrets and environment variables
- [ ] Scheduled jobs have been cancelled
- [ ] Team members have been notified

### 1. Drain active work

```bash
# Pause all scheduled jobs (prevents new runs)
settler jobs pause --all --tenant <tenant-id>

# Wait for in-flight reconciliation runs to complete
settler jobs list --status running --tenant <tenant-id>
```

### 2. Export everything

```bash
# Full tenant data export (reconciliation runs, exceptions, audit logs, evidence)
settler export --tenant <tenant-id> \
  --format csv \
  --include-audit-logs \
  --include-evidence \
  --output ./settler-full-export/
```

### 3. Revoke all credentials

- Revoke all API keys in the console
- Remove `SETTLER_API_KEY` from all environment variables, secret managers, and CI/CD pipelines
- Remove webhook endpoints
- If using SSO/OIDC: remove the Settler application from your identity provider

### 4. Remove infrastructure (self-hosted only)

```bash
# Stop and remove containers
docker compose -f enterprise/docker-compose.yml down -v

# Remove Settler-specific database
# WARNING: This is irreversible
psql -h <host> -U <user> -c "DROP DATABASE settler;"

# Remove TigerBeetle data directory
rm -rf /var/lib/tigerbeetle/
```

### 5. Request account closure

For managed accounts, email support@settler.io with:

- Tenant ID
- Confirmation that all data has been exported
- Preferred deletion timeline

## What gets deleted

| Data                  | Local teardown        | Managed account closure                     |
| --------------------- | --------------------- | ------------------------------------------- |
| Reconciliation runs   | Docker volume removal | Deleted within 5 days                       |
| Exception records     | Docker volume removal | Deleted within 5 days                       |
| Audit logs            | Docker volume removal | Retained 90 days (regulatory), then deleted |
| Evidence / proofpacks | Docker volume removal | Deleted within 5 days                       |
| API keys              | Immediate             | Immediate                                   |
| Webhook registrations | Immediate             | Immediate                                   |
| Billing data          | N/A                   | Retained per legal requirements             |

## Verify cleanup

After teardown, verify that Settler is fully removed:

```bash
# Confirm API keys no longer work
curl -I https://api.settler.dev/api/v1/health \
  -H "X-API-Key: $SETTLER_API_KEY"
# Expected: 401 Unauthorized

# Confirm no Docker containers running
docker ps --filter "name=settler" --filter "name=tigerbeetle"
# Expected: empty

# Confirm no environment references remain
grep -r "SETTLER_API_KEY" ~/.bashrc ~/.zshrc .env* || echo "Clean"
```

## Related

- [Data Portability](../../DATA_PORTABILITY.md)
- [Privacy Policy](../../PRIVACY.md)
- [Support](../../SUPPORT.md)

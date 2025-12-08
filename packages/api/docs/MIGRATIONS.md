# API Migration Guide: v1 → v2

**Status**: v2 is not yet available. This guide will be updated when v2 is released.

## Overview

This guide helps you migrate from Settler API v1 to v2.

**Timeline:**
- **v2 Release**: TBD
- **v1 Deprecation**: TBD (6 months after v2 release)
- **v1 Sunset**: TBD (12 months after v2 release)

## Breaking Changes

### Authentication

#### v1
```typescript
// JWT tokens valid for 1 hour
const token = await login(email, password);
```

#### v2
```typescript
// Short-lived access tokens (15 min) + refresh tokens
const { accessToken, refreshToken } = await login(email, password);

// Refresh access token
const newAccessToken = await refreshToken(refreshToken);
```

**Migration Steps:**
1. Update authentication flow to handle refresh tokens
2. Implement token refresh logic
3. Update token expiration handling

### Job Creation

#### v1
```typescript
POST /api/v1/jobs
{
  "name": "My Job",
  "sourceAdapter": "stripe",
  "targetAdapter": "shopify",
  "sourceConfig": { "apiKey": "..." },
  "targetConfig": { "apiKey": "..." },
  "rules": { ... }
}
```

#### v2
```typescript
POST /api/v2/jobs
{
  "name": "My Job",
  "source": {
    "adapter": "stripe",
    "config": { "apiKey": "..." }
  },
  "target": {
    "adapter": "shopify",
    "config": { "apiKey": "..." }
  },
  "rules": { ... }
}
```

**Changes:**
- `sourceAdapter` → `source.adapter`
- `targetAdapter` → `target.adapter`
- `sourceConfig` → `source.config`
- `targetConfig` → `target.config`

**Migration Steps:**
1. Update job creation requests
2. Update job update requests
3. Update job response parsing

### Response Format

#### v1
```json
{
  "id": "job-id",
  "name": "My Job",
  "status": "active"
}
```

#### v2
```json
{
  "data": {
    "id": "job-id",
    "name": "My Job",
    "status": "active"
  },
  "meta": {
    "version": "2.0.0",
    "timestamp": "2026-01-01T00:00:00Z"
  }
}
```

**Changes:**
- Response wrapped in `data` object
- Added `meta` object with version info

**Migration Steps:**
1. Update response parsing to access `data` property
2. Handle `meta` object if needed

### Error Format

#### v1
```json
{
  "error": "ValidationError",
  "message": "Invalid input"
}
```

#### v2
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "requestId": "req-123",
    "timestamp": "2026-01-01T00:00:00Z"
  }
}
```

**Changes:**
- Error object structure changed
- Added `details` array for validation errors
- Added `meta.requestId` for tracing

**Migration Steps:**
1. Update error handling to access `error.code`
2. Handle `error.details` array
3. Use `meta.requestId` for support requests

## New Features in v2

### GraphQL API

v2 introduces an optional GraphQL API:

```graphql
query {
  jobs {
    id
    name
    status
    executions {
      id
      status
      summary
    }
  }
}
```

**Migration Steps:**
1. Evaluate GraphQL vs REST for your use case
2. Update API client if using GraphQL
3. Test GraphQL queries

### Enhanced Webhooks

v2 webhooks include:
- Retry configuration
- Signature verification improvements
- Event filtering

**Migration Steps:**
1. Update webhook signature verification
2. Configure retry settings
3. Update event filtering logic

## Migration Checklist

### Pre-Migration

- [ ] Review breaking changes
- [ ] Test v2 in staging environment
- [ ] Update API client libraries
- [ ] Update documentation
- [ ] Plan migration timeline

### Migration

- [ ] Update authentication flow
- [ ] Update API endpoints
- [ ] Update request/response parsing
- [ ] Update error handling
- [ ] Test all integrations
- [ ] Monitor for errors

### Post-Migration

- [ ] Verify all features work
- [ ] Monitor error rates
- [ ] Update monitoring/alerts
- [ ] Remove v1 code paths
- [ ] Update team documentation

## Code Examples

### Complete Migration Example

#### v1 Code
```typescript
import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({ apiKey: 'rk_...' });

// Create job
const job = await client.jobs.create({
  name: 'My Job',
  sourceAdapter: 'stripe',
  targetAdapter: 'shopify',
  sourceConfig: { apiKey: 'sk_...' },
  targetConfig: { apiKey: 'shpat_...' },
  rules: { matching: [...] }
});

// Get job
const jobData = await client.jobs.get(job.id);
console.log(jobData.name);
```

#### v2 Code
```typescript
import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({ 
  apiKey: 'rk_...',
  version: 'v2' // Specify version
});

// Create job (new format)
const response = await client.jobs.create({
  name: 'My Job',
  source: {
    adapter: 'stripe',
    config: { apiKey: 'sk_...' }
  },
  target: {
    adapter: 'shopify',
    config: { apiKey: 'shpat_...' }
  },
  rules: { matching: [...] }
});

// Get job (response wrapped in data)
const jobData = response.data; // v2 wraps in data
console.log(jobData.name);
```

## Rollback Plan

If you encounter issues with v2:

1. **Immediate**: Switch back to v1 by changing version in client
2. **Investigate**: Check error logs and contact support
3. **Fix**: Address issues in your integration
4. **Retry**: Migrate again after fixes

## Support

- **Migration Help**: migrations@settler.io
- **Documentation**: https://docs.settler.io/migrations
- **Support**: support@settler.io
- **Status Page**: https://status.settler.io

## Timeline

- **v2 Beta**: TBD
- **v2 GA**: TBD
- **v1 Deprecation**: TBD (6 months after v2 GA)
- **v1 Sunset**: TBD (12 months after v2 GA)

Check https://status.settler.io for latest timeline updates.

# auth_edge_guard Setup Complete

This document summarizes the setup for the `auth_edge_guard` Supabase Edge Function with rate limiting using Upstash Redis.

## What Was Created

1. **Edge Function**: `supabase/functions/auth_edge_guard/index.ts`
   - Implements IP-based and user-based rate limiting
   - Uses Upstash Redis REST API for distributed rate limiting
   - Caches authentication results to reduce Supabase API calls
   - Returns rate limit headers in responses

2. **Documentation**:
   - `docs/supabase-secrets-guide.md` - How to set Supabase secrets
   - `docs/github-secrets-guide.md` - How to set GitHub secrets
   - `docs/auth-edge-guard-setup.md` - This file

3. **Scripts**:
   - `scripts/set-supabase-secrets.sh` - Helper script to set Supabase secrets

4. **Updated Files**:
   - `.github/workflows/deploy-edge-functions.yml` - Added auth_edge_guard deployment
   - `scripts/vercel-env-vars-template.json` - Added new secrets
   - `scripts/sync-vercel-env.ts` - Added new secret mappings

## Required Secrets

### Supabase Secrets

Set these using Supabase CLI or Dashboard:

```bash
supabase secrets set UPSTASH_REDIS_REST_URL="https://pretty-buck-23396.upstash.io"
supabase secrets set UPSTASH_REDIS_REST_TOKEN="AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY"
supabase secrets set IP_RPM="300"
supabase secrets set USER_RPM="900"
supabase secrets set CACHE_MAX_AGE="90"
```

Or use the provided script:

```bash
export UPSTASH_REDIS_REST_URL="https://pretty-buck-23396.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY"
export IP_RPM="300"
export USER_RPM="900"
export CACHE_MAX_AGE="90"
./scripts/set-supabase-secrets.sh
```

### GitHub Secrets

Set these in GitHub repository settings:

- `UPSTASH_REDIS_REST_URL` = `https://pretty-buck-23396.upstash.io`
- `UPSTASH_REDIS_REST_TOKEN` = `AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY`
- `IP_RPM` = `300`
- `USER_RPM` = `900`
- `CACHE_MAX_AGE` = `90`

### Vercel Environment Variables

Set these in Vercel dashboard (optional, for other services):

- `UPSTASH_REDIS_REST_URL` = `https://pretty-buck-23396.upstash.io`
- `UPSTASH_REDIS_REST_TOKEN` = `AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY`
- `IP_RPM` = `300`
- `USER_RPM` = `900`
- `CACHE_MAX_AGE` = `90`

## Deployment

### Manual Deployment

```bash
# Set secrets first (see above)
supabase functions deploy auth_edge_guard
```

### Automated Deployment

The GitHub workflow (`.github/workflows/deploy-edge-functions.yml`) will automatically:
1. Set Supabase secrets from GitHub secrets (if configured)
2. Deploy the `auth_edge_guard` function
3. Deploy other edge functions

## Function Features

### Rate Limiting

- **IP-based**: Limits requests per IP address (default: 300/minute)
- **User-based**: Limits requests per authenticated user (default: 900/minute)
- **Redis-backed**: Uses Upstash Redis for distributed rate limiting
- **Sliding window**: Uses time-windowed counters for accurate rate limiting

### Authentication

- **JWT validation**: Validates Supabase JWT tokens
- **Caching**: Caches authentication results (default: 90 seconds)
- **Error handling**: Graceful fallback if Redis is unavailable

### Response Headers

The function returns rate limit information in headers:

- `X-RateLimit-Limit-IP`: IP rate limit
- `X-RateLimit-Remaining-IP`: Remaining IP requests
- `X-RateLimit-Reset-IP`: When IP limit resets
- `X-RateLimit-Limit-User`: User rate limit (if authenticated)
- `X-RateLimit-Remaining-User`: Remaining user requests
- `X-RateLimit-Reset-User`: When user limit resets

## Usage Example

```typescript
// Call the auth_edge_guard function
const response = await fetch('https://your-project.supabase.co/functions/v1/auth_edge_guard', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

if (response.status === 200) {
  const data = await response.json();
  console.log('Authenticated:', data.user);
  console.log('Rate limits:', data.rateLimit);
} else if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
} else {
  console.error('Authentication failed');
}
```

## Configuration

### Rate Limits

- `IP_RPM`: Requests per minute per IP (default: 300)
- `USER_RPM`: Requests per minute per user (default: 900)

### Cache Settings

- `CACHE_MAX_AGE`: Authentication cache TTL in seconds (default: 90)

### Redis Configuration

- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST API token

## Security Notes

1. **Never commit secrets**: All secrets should be set via CLI or dashboard
2. **Rotate tokens**: Regularly rotate Redis tokens and API keys
3. **Monitor usage**: Check Upstash dashboard for Redis usage and rate limit violations
4. **Fail open**: Function allows requests if Redis is unavailable (for development)

## Troubleshooting

### Function not deploying

- Verify Supabase CLI is installed and authenticated
- Check project is linked: `supabase projects list`
- Verify secrets are set: `supabase secrets list`

### Rate limiting not working

- Verify Redis credentials are correct
- Check Upstash dashboard for connectivity
- Review function logs: `supabase functions logs auth_edge_guard`

### Authentication failing

- Verify JWT token is valid
- Check Supabase project URL and keys
- Review function logs for errors

## Next Steps

1. ✅ Set Supabase secrets (see `docs/supabase-secrets-guide.md`)
2. ✅ Set GitHub secrets (see `docs/github-secrets-guide.md`)
3. ✅ Set Vercel environment variables (optional, see `docs/vercel-env-sync-guide.md`)
4. ✅ Deploy the function: `supabase functions deploy auth_edge_guard`
5. ✅ Test the function with a valid JWT token
6. ✅ Monitor rate limiting and adjust limits as needed

## Related Documentation

- [Supabase Secrets Guide](./supabase-secrets-guide.md)
- [GitHub Secrets Guide](./github-secrets-guide.md)
- [Vercel Environment Variables Guide](./vercel-env-sync-guide.md)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Upstash Redis REST API](https://docs.upstash.com/redis/features/restapi)

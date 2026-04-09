# Supabase Secrets Management Guide

This guide explains how to set secrets for Supabase Edge Functions, specifically for the `auth_edge_guard` function.

## Required Secrets

The `auth_edge_guard` function requires the following secrets:

| Secret Name                | Description                               | Default Value | Required |
| -------------------------- | ----------------------------------------- | ------------- | -------- |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST API URL                | -             | Yes      |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST API token              | -             | Yes      |
| `IP_RPM`                   | Rate limit per IP (requests per minute)   | 300           | No       |
| `USER_RPM`                 | Rate limit per user (requests per minute) | 900           | No       |
| `CACHE_MAX_AGE`            | Authentication cache TTL in seconds       | 90            | No       |

## Setting Secrets

### Method 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):

   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:

   ```bash
   supabase login
   ```

3. **Link your project** (if not already linked):

   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Set secrets individually**:

   ```bash
   supabase secrets set UPSTASH_REDIS_REST_URL="https://pretty-buck-23396.upstash.io"
   supabase secrets set UPSTASH_REDIS_REST_TOKEN="AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY"
   supabase secrets set IP_RPM="300"
   supabase secrets set USER_RPM="900"
   supabase secrets set CACHE_MAX_AGE="90"
   ```

5. **Or use the provided script**:

   ```bash
   # Set environment variables first
   export UPSTASH_REDIS_REST_URL="https://pretty-buck-23396.upstash.io"
   export UPSTASH_REDIS_REST_TOKEN="AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY"
   export IP_RPM="300"
   export USER_RPM="900"
   export CACHE_MAX_AGE="90"

   # Run the script
   chmod +x scripts/set-supabase-secrets.sh
   ./scripts/set-supabase-secrets.sh
   ```

### Method 2: Using Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **Edge Functions** → **Secrets**
4. Add each secret with its value
5. Click **Save**

## Verifying Secrets

To verify that secrets are set correctly:

```bash
supabase secrets list
```

This will show all secrets for your project (values are masked for security).

## Deploying the Function

After setting secrets, deploy the function:

```bash
supabase functions deploy auth_edge_guard
```

## Security Best Practices

1. **Never commit secrets to version control**
   - Secrets should only be set via CLI or dashboard
   - Use environment variables or secure secret management tools

2. **Rotate secrets regularly**
   - Update Redis tokens periodically
   - Use strong, unique tokens

3. **Limit access**
   - Only grant access to team members who need it
   - Use project-level access controls

4. **Monitor usage**
   - Check Upstash dashboard for Redis usage
   - Monitor rate limit violations in function logs

## Troubleshooting

### Secrets not available in function

- Ensure secrets are set for the correct project
- Verify project is linked: `supabase projects list`
- Check function logs: `supabase functions logs auth_edge_guard`

### Rate limiting not working

- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are correct
- Check Upstash dashboard for Redis connectivity
- Review function logs for Redis errors

### Authentication cache issues

- Adjust `CACHE_MAX_AGE` if needed (default: 90 seconds)
- Clear cache by redeploying function
- Check Redis storage limits in Upstash dashboard

## Related Documentation

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Upstash Redis REST API](https://docs.upstash.com/redis/features/restapi)
- [Rate Limiting Best Practices](https://supabase.com/docs/guides/functions/rate-limiting)

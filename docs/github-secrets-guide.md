# GitHub Secrets Management Guide

This guide explains how to set secrets in GitHub for CI/CD workflows and deployment automation.

## Required Secrets for auth_edge_guard

The following secrets are required for the `auth_edge_guard` Supabase Edge Function:

| Secret Name | Description | Example Value | Required |
|------------|-------------|---------------|----------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST API URL | `https://pretty-buck-23396.upstash.io` | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST API token | `AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY` | Yes |
| `IP_RPM` | Rate limit per IP (requests per minute) | `300` | No |
| `USER_RPM` | Rate limit per user (requests per minute) | `900` | No |
| `CACHE_MAX_AGE` | Authentication cache TTL in seconds | `90` | No |

## Setting GitHub Secrets

### Method 1: GitHub Web Interface (Recommended)

1. **Navigate to Repository Settings**:
   - Go to your GitHub repository
   - Click **Settings** → **Secrets and variables** → **Actions**

2. **Add New Secret**:
   - Click **New repository secret**
   - Enter the secret name (e.g., `UPSTASH_REDIS_REST_URL`)
   - Enter the secret value
   - Click **Add secret**

3. **Repeat for all secrets**:
   - Add each secret listed above
   - Ensure names match exactly (case-sensitive)

### Method 2: GitHub CLI

```bash
# Install GitHub CLI if not already installed
# macOS: brew install gh
# Linux: See https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# Authenticate
gh auth login

# Set secrets
gh secret set UPSTASH_REDIS_REST_URL --body "https://pretty-buck-23396.upstash.io"
gh secret set UPSTASH_REDIS_REST_TOKEN --body "AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY"
gh secret set IP_RPM --body "300"
gh secret set USER_RPM --body "900"
gh secret set CACHE_MAX_AGE --body "90"
```

### Method 3: GitHub API

```bash
# Set secrets using GitHub API
# Requires: GITHUB_TOKEN environment variable with repo scope

REPO="your-username/your-repo"
GITHUB_TOKEN="your-github-token"

# Encrypt secret value (GitHub requires base64 encoding)
echo -n "https://pretty-buck-23396.upstash.io" | base64 | \
  gh api repos/$REPO/actions/secrets/UPSTASH_REDIS_REST_URL \
    --method PUT \
    --field encrypted_value="$(cat)" \
    --field key_id="$(gh api repos/$REPO/actions/secrets/public-key | jq -r .key_id)"
```

## Verifying Secrets

To verify secrets are set:

1. **GitHub Web Interface**:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - You'll see a list of all secrets (values are masked)

2. **GitHub CLI**:
   ```bash
   gh secret list
   ```

3. **Check in Workflow**:
   - Secrets are available as `${{ secrets.SECRET_NAME }}` in workflows
   - Use `echo "::add-mask::${{ secrets.SECRET_NAME }}"` to mask in logs (values are already masked)

## Using Secrets in GitHub Actions

Secrets are automatically available in GitHub Actions workflows:

```yaml
env:
  UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
  UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
  IP_RPM: ${{ secrets.IP_RPM }}
  USER_RPM: ${{ secrets.USER_RPM }}
  CACHE_MAX_AGE: ${{ secrets.CACHE_MAX_AGE }}
```

## Environment-Specific Secrets

GitHub supports environment-specific secrets:

1. **Create Environment**:
   - Go to **Settings** → **Environments**
   - Click **New environment**
   - Name it (e.g., `production`, `staging`)

2. **Add Secrets to Environment**:
   - Select the environment
   - Add secrets specific to that environment
   - These override repository-level secrets when the environment is used

3. **Use in Workflow**:
   ```yaml
   environment: production
   ```

## Security Best Practices

1. **Never commit secrets to code**
   - Use GitHub Secrets for all sensitive values
   - Review `.gitignore` to ensure `.env` files are excluded

2. **Rotate secrets regularly**
   - Update Redis tokens periodically
   - Rotate GitHub tokens and API keys

3. **Limit access**
   - Use environment protection rules
   - Require approvals for production deployments
   - Limit who can view/modify secrets

4. **Audit secret usage**
   - Review workflow logs for secret access
   - Monitor for unauthorized access attempts
   - Use GitHub's audit log

5. **Use different secrets per environment**
   - Separate production and staging secrets
   - Use environment-specific configurations

## Troubleshooting

### Secrets not available in workflow

- Verify secret name matches exactly (case-sensitive)
- Check workflow has access to repository secrets
- Ensure environment is specified if using environment secrets
- Verify workflow has `permissions: read` for secrets

### Secret values appear as empty

- Check secret is set correctly in GitHub
- Verify secret name matches workflow reference
- Ensure secret is not empty when setting

### Permission denied errors

- Check GitHub token has `repo` scope
- Verify workflow has necessary permissions
- Review repository settings for secret access

## Related Documentation

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub CLI Secrets](https://cli.github.com/manual/gh_secret)
- [Supabase Secrets Guide](./supabase-secrets-guide.md)
- [Vercel Environment Variables Guide](./vercel-env-sync-guide.md)

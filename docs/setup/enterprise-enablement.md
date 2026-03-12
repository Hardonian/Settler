# Enterprise Enablement

> Canonical platform index: [`docs/platform-index.md`](../platform-index.md)

This file documents enterprise/premium-only env controls that are active in code.

## Required for enterprise integrations

- `JOBFORGE_INTEGRATION_ENABLED=1`
- `JOBFORGE_BUNDLE_EXECUTION_ENABLED=1` (only if bundle execution is intended)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CREDENTIAL_ENCRYPTION_KEY` **or** `SUPABASE_VAULT_KEY`

## Optional but common for enterprise operations

- `SETTLER_OPERATOR_INTELLIGENCE_PROVIDER_MODULE`
- `SETTLER_OPERATOR_API_KEY`
- Alert channel hooks (`SLACK_ALERT_WEBHOOK_URL`, `TEAMS_ALERT_WEBHOOK_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)

## Security expectations

- Do not enable JobForge flags without credential encryption keying.
- Keep service-role keys out of `NEXT_PUBLIC_*` scope.
- For multi-tenant safety, keep schema and tenant controls aligned with verified migration state before enabling tenant-specific schema behavior.

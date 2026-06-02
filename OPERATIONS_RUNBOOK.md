# Settler: Operations Runbook

This runbook defines the standard operating procedures (SOPs) for running the Settler platform. It is designed specifically for a solo-founder or minimal-ops team.

## 1. Incident Response

### Edge Crashes (Sentry)

- **Trigger**: Sentry alerts via Slack indicating a crash in `global-error.tsx`.
- **Action**:
  1. Check the Sentry dashboard for the stack trace.
  2. If the issue is related to the AI SDK, verify that the `OPENAI_API_KEY` hasn't expired or hit rate limits.
  3. If the issue is a UI crash, revert the latest UI deployment via the Vercel dashboard.

### Reconciliation Mismatches (DLQ)

- **Trigger**: Anomaly detector flags a mismatched transaction in the Dead Letter Queue (DLQ).
- **Action**:
  1. Open the Settler Dashboard -> "Pulse".
  2. Review the "Unmatched Value" metric.
  3. Trigger the `AI Support Sweep` via the Command Palette to have the agent attempt auto-resolution.
  4. If the AI fails, manually map the transaction ID in the database.

## 2. Managing the AI Workforce

### BYOK Key Failures

- **Issue**: A user complains that the "Sales Hunter" isn't working.
- **Resolution**: Direct the user to the Settings panel to verify their OpenAI API Key. The platform defaults to a `verified_degraded` state if their key is invalid.

### Monitoring Agent Activity

- **Procedure**: Periodically check the "Agent Activity Feed" (the bell icon in the dashboard). Ensure that the Orchestrator is successfully delegating tasks to the Support and Sales agents.

## 3. Financial Operations

### Stripe Billing

- **Monitoring**: Ensure the `log_usage_event` function in Supabase is correctly firing on every successful reconciliation map.
- **Reporting**: End-of-month revenue is calculated as: `Base Platform Fee ($99) + (Total Transactions * $0.01)`.
- **Overages**: Users are automatically billed for overages on the 1st of every month via Stripe Metered Billing.

## 4. Deployment Pipeline

- **Branching Strategy**: All work happens on feature branches. `main` must remain green at all times.
- **Pre-commit Hooks**: Husky runs ESLint, Prettier, and Type-checking before any commit is allowed.
- **CI/CD**: Pushing to `main` triggers a Vercel production build.

_Always run `pnpm build` locally before pushing a major UI overhaul._

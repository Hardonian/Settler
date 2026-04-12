# Settler Agents Package

Status: supported for **local security verification only**

This package is no longer presented as a 24/7 autonomous operations suite.

## Supported surface

### Security Agent

The supported entrypoint is a repo-native security verification runner:

```bash
pnpm --filter @settler/agents build
pnpm --filter @settler/agents start
```

Or run it directly:

```bash
node packages/agents/dist/security-agent.js --scan=all
node packages/agents/dist/security-agent.js --scan=secrets
node packages/agents/dist/security-agent.js --scan=rls
```

Supported scan families:

- `vulnerabilities`
- `secrets`
- `rls`
- `compliance` (honest boundary only; not a certification proof)
- `all`

The security agent uses exact repo-owned verification surfaces instead of placeholder logic:

- `node scripts/audit-deps.mjs`
- `node scripts/security/dependency-evidence.mjs`
- `pnpm run security:routes`
- `pnpm run verify:tenant`
- `pnpm run test:cross-tenant`
- `node scripts/security/verify-rls-boundary.mjs`
- `node scripts/security/rls-evidence.mjs`

Optional environment:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SETTLER_SECURITY_REPORT_OUT=artifacts/security/local-security-agent-report.json
SECURITY_AUDIT_MODE=warn
SECURITY_DEPENDENCY_EVIDENCE_MODE=standard
SECURITY_RLS_EVIDENCE_MODE=static-only
DEPENDABOT_ALERTS_EXPORT_PATH=security/dependabot-alerts.json
```

## Explicit boundaries

- This package does **not** prove SOC 2, ISO 27001, or third-party penetration-test posture.
- This package does **not** replace canonical release verification like `pnpm run verify:fast` or `pnpm run verify:security`.
- This package does **not** provide production-safe daemon orchestration.

## Legacy local agents

The following entrypoints remain in the package only as explicit blocked boundaries:

- `orchestrator-agent`
- `monitor-agent`
- `deploy-agent`
- `maintenance-agent`
- `communication-agent`

They now fail closed on execution so the repo does not silently imply operational automation that is not actually implemented.

For supported repo-owned agent execution, use:

```bash
pnpm run agents:run <agent-type>
```

The current executable bridge is [`scripts/run-agent.ts`](../../scripts/run-agent.ts).

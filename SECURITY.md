# Security Policy

## Reporting a Vulnerability

If you believe you have found a security issue, please report it responsibly.

**Preferred contact:** security@settler.dev

Include the following details in your report:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any proposed mitigations

## Supported Versions

Only the `main` branch receives active security updates. If you are running a fork, please keep it current.

## Threat Model (Summary)

**Primary assets**

- Tenant-scoped financial records and reconciliation runs
- API keys, webhook secrets, and service-role credentials
- Billing and subscription state

**Key threat vectors**

- Unauthorized tenant access (broken RLS or missing tenant filters)
- Webhook replay or forgery (Stripe/PayPal/etc.)
- Abuse of public endpoints (rate-limit bypass, resource exhaustion)
- Secret leakage in logs, configs, or commits

**Controls in place**

- RLS + tenant-scoped queries
- Structured error envelopes (no stack leaks in user responses)
- Auth + billing gates for paid features
- Runtime validation of external inputs (Zod schemas)

## Webhooks

- **Runtime:** Webhook handlers must use Node.js runtime.
- **Verification:** Raw body signature verification is required.
- **Replay protection:** Use event IDs for idempotency; reject duplicate event IDs.
- **Failure behavior:** Return safe errors with `{ code, message, traceId, retryable }`.

## Rate Limiting

- Public endpoints are rate limited with in-memory limits for OSS/local usage.
- **Upgrade path:** Use Redis or a managed rate-limit service for production-scale deployments.

## Secrets Hygiene

- Never commit secrets or credentials.
- Use `.env.example` as the template for required variables.
- Rotate service-role keys immediately if exposure is suspected.

## Handling and Disclosure

We acknowledge reports and coordinate fixes as quickly as possible. Please do not publicly disclose vulnerabilities before a fix is available.

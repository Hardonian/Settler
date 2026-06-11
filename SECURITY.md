# Security Policy

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report vulnerabilities privately via [GitHub Security Advisories](https://github.com/settler/settler/security/advisories/new), or email the maintainers directly with:

- The affected component or file path
- A clear description of the vulnerability and its impact
- Reproduction steps or a proof-of-concept
- Your assessment of severity and blast radius

We acknowledge all reports within **72 hours** and communicate resolution status as the fix progresses.

## Security Architecture

Settler's security model is enforced across five independent layers. No single layer is sufficient alone — they compound.

### Tenant Isolation (Multi-Layer)

1. **Request middleware** — `tenantMiddleware` resolves `req.tenantId` from JWT, API key, header, or subdomain before any route handler executes. Requests without a resolvable tenant are rejected with `403`.
2. **TypeScript interfaces** — Every repository method signature includes a mandatory `tenantId: string` parameter. Callers that omit it fail TypeScript compilation.
3. **SQL queries** — Every `SELECT`, `UPDATE`, and `DELETE` against tenant-scoped tables includes `AND tenant_id = $N`. The `assertTenantScoped()` guard throws in development if this is violated.
4. **Row-Level Security** — PostgreSQL RLS policies filter rows by `current_setting('app.current_tenant_id')`. This is the database-level defense-in-depth layer.
5. **Entity-level checks** — `UserRepository.save()` and `JobRepository.create()` throw `Error('Tenant mismatch')` if an entity's `tenantId` does not match the scoped `tenantId`.

For the full mechanical specification of every invariant and its test coverage, see [SECURITY_INVARIANTS.md](SECURITY_INVARIANTS.md).

### Authorization

- `requirePermission()` middleware verifies the authenticated user is a member of the resolved tenant before any privileged route handler executes
- OpenFGA attribute-based access control is available for fine-grained authorization
- **Fail-closed posture:** when OpenFGA is unavailable, requests are denied (403) rather than defaulted to permissive

### API Security

- All request bodies are validated with Zod schemas before processing
- Rate limiting is enforced at the IP and authenticated-user level via Redis
- Helmet sets HTTP security headers on all responses
- CORS is explicitly configured — no wildcard origins in production
- API keys are scoped to a tenant and validated on every request

### Infrastructure

- All secrets managed via environment variables — no hardcoded credentials in source
- Supabase service role key is server-only and never exposed to the client
- JWT secrets are minimum 32 characters, enforced at startup
- Webhook payloads are signature-verified before processing
- Dependency scanning and secret scanning run in CI on every push

## Secure Defaults

- Least-privilege tokens — no over-scoped credentials
- Branch protection and required PR review on the default branch
- Automated dependency updates with audit on every PR
- Code scanning and secret scanning enforced via GitHub Actions

## Vulnerability Disclosure SLA

| Severity                           | Acknowledgment | Target Resolution |
| ---------------------------------- | -------------- | ----------------- |
| Critical (RCE, data exfiltration)  | 24 hours       | 72 hours          |
| High (auth bypass, tenant leakage) | 48 hours       | 7 days            |
| Medium                             | 72 hours       | 30 days           |
| Low / informational                | Best effort    | Next release      |

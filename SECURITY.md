# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Settler, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### Reporting Channels

- **Email:** [security@hardonia.store](mailto:security@hardonia.store)
- **GitHub:** [Private vulnerability reporting](https://github.com/Hardonian/Settler/security/advisories/new) (preferred)

### What to Include

- Description of the vulnerability and affected component
- Steps to reproduce (proof of concept if possible)
- Potential impact assessment (data exposure, privilege escalation, tenant isolation breach, etc.)
- Suggested fix or mitigation (if any)
- Your contact information for follow-up

## Response Timeline

| Stage | Target |
| --- | --- |
| **Acknowledgment** | Within 48 hours of receipt |
| **Initial triage and severity assessment** | Within 72 hours |
| **Remediation timeline communicated** | Within 7 business days |
| **Critical fix (P0 — tenant breach or data loss)** | Within 24 hours |
| **High fix (P1 — service outage or privilege escalation)** | Within 7 days |
| **Medium/Low fix** | Within 30 days |

## Scope

This security policy applies to:

- The latest release on the `main` branch
- All code in `packages/`, `crates/`, `prisma/`, and `supabase/`
- Infrastructure configurations in `.github/workflows/`, `config/`, and `deploy/`
- The hosted Settler cloud service (when available)

### Out of Scope

- Third-party dependencies with their own security policies (report upstream)
- Demo data and fixtures in `demo/`, `test-data/`, `fixtures/`
- Historical/archived documentation in `docs/archive/`
- Vulnerabilities requiring physical access to the host machine
- Social engineering attacks against team members
- Denial of service attacks against development/staging environments

## Severity Classification

| Severity | Criteria | Examples |
| --- | --- | --- |
| **Critical (P0)** | Tenant data breach, cross-tenant data access, RLS bypass, authentication bypass | Cross-tenant query without `tenant_id`, JWT forgery, RLS policy gap |
| **High (P1)** | Privilege escalation, data exfiltration within tenant, service-wide outage | Role bypass, API key scope escape, unvalidated admin access |
| **Medium (P2)** | Information disclosure, denial of service, security control bypass | Error message leaking internals, rate limit bypass, CSRF |
| **Low (P3)** | Minor information leak, hardening improvement | Missing security header, verbose logging in production |

## Security Architecture Reference

Settler enforces a 5-layer tenant isolation model. For the full specification, see [SECURITY_INVARIANTS.md](SECURITY_INVARIANTS.md).

| Layer | Mechanism |
| --- | --- |
| **1. Middleware** | `tenantMiddleware` resolves `req.tenantId` before any route handler |
| **2. Repository** | Every database method requires explicit `tenantId` parameter (TypeScript-enforced) |
| **3. SQL** | All queries include parameterized `WHERE tenant_id = $N` |
| **4. PostgreSQL RLS** | Database-level Row-Level Security filters by `current_setting('app.current_tenant_id')` |
| **5. Entity** | Cross-tenant write operations throw `Error('Tenant mismatch')` before execution |

## Safe Harbor

Settler supports responsible security research. We will not pursue legal action against researchers who:

- Act in good faith to avoid privacy violations, data destruction, and service disruption
- Only interact with accounts they own or have explicit permission to test
- Report vulnerabilities through the channels listed above
- Allow reasonable time for remediation before public disclosure

## CVE Policy

For confirmed vulnerabilities that affect released versions:

1. We will request a CVE ID through GitHub Security Advisories.
2. The CVE will be published after a fix is available.
3. Affected versions will be documented in the advisory.
4. Users will be notified through GitHub release notes and the changelog.

## Bug Bounty

Settler does not currently operate a paid bug bounty program. Security researchers who report valid vulnerabilities will receive public credit in the security advisory (unless they prefer to remain anonymous).

## Verification Commands

Run the security verification suite locally:

```bash
pnpm run verify:security:fast    # Quick security posture check
pnpm run verify:tenant           # Tenant isolation coverage (must be 100%)
pnpm run test:cross-tenant       # Cross-tenant runtime tests
pnpm run verify:security:full    # Full layered security evidence
```

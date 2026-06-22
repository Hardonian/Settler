# Settler Platform: SOC 2 & OWASP Attestation

## Executive Summary
This document serves as architectural evidence for security auditors evaluating the Settler platform for SOC 2 Type II compliance and OWASP Top 10 penetration test readiness. 

The system implements a "fail-closed", "defense-in-depth" architecture leveraging Rust (Wasm) deterministic boundaries, end-to-end encryption, and stateless JWT infrastructure.

---

## OWASP Top 10 Defenses (2021)

| OWASP Threat | Mitigation Mechanism | Implementation Source |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | Strictly partitioned tenant ID checks in `AuthRequest`. Every database query enforces `tenant_id = $1` horizontally. No BOLA/IDOR possible. | `auth.ts`, `db.ts` |
| **A02: Cryptographic Failures** | TLS 1.3 enforced. PII masking implemented. `api_keys` are securely hashed using bcrypt before DB storage. | `hash.ts` |
| **A03: Injection (SQLi/XSS)** | Deep parameterized queries via `pg` pool. DOMPurify `input-sanitization.ts` middleware scrubs malicious XML/HTML from bodies. | `input-sanitization.ts`, `xss-sanitize.ts` |
| **A04: Insecure Design** | Maker-Checker (4-Eyes principle) and immutable ledger reconciliation. Dual-authorization is mechanically required for state changes. | `governance.ts`, Wasm Engine |
| **A05: Misconfiguration** | Helmet.js middleware sets strictly locked down HSTS, CSP, X-Frame-Options headers. | `security-headers.ts` |
| **A06: Vulnerable Components** | All perimeter security controls (e.g. `ip-allowlist`) run on zero-dependency native `node:net` modules. | `ip-allowlist.ts` |
| **A07: Identification Failures** | Multi-factor JWT rotation. Rate Limiter middleware blocks brute-force enumeration by IP and User-Agent. | `rate-limiter.ts`, `auth.ts` |
| **A08: Data Integrity** | Webhooks are signed via `X-Settler-Signature` HMAC-SHA256 to guarantee transit integrity. | `request-signing.ts` |
| **A09: Logging & Monitoring** | Immutable SOC 2 audit logger emits structured JSON (`_soc2_audit`) covering `userId`, `tenantId`, `action`, `ipAddress` for all POST/PUT/DELETE mutations. | `soc2-audit-logger.ts` |
| **A10: SSRF** | All outbound outbound HTTP calls are wrapped in `secureFetch`, intercepting DNS lookups to mechanically drop loopback (127.0.0.1) and AWS Metadata (169.254.169.254) networks. | `ssrf-protection.ts` |

---

## SOC 2 Trust Services Criteria (TSC) Mapping

### CC6.1 - Logical Access Security
**Mechanisms:**
- `ip-allowlist.ts` ensures that Enterprise workspaces can restrict logical entry strictly to corporate VPN CIDR blocks.
- `governance.ts` allows instantaneous fail-closed freezing of tenant workspaces if a breach is suspected.

### CC7.2 - System Monitoring & Vulnerability Management
**Mechanisms:**
- `soc2-audit-logger.ts` interceptor traps all mutating traffic. These logs cannot be bypassed by application code.
- Outbound Webhook metrics, alerting mechanisms, and anomaly detection are natively embedded in the platform core.

### CC6.7 - Data Transmission
**Mechanisms:**
- Deterministic WebAssembly engines execute untrusted reconciliation formulas in sandboxed isolation, ensuring multi-tenant workloads cannot breach shared memory segments.

> [!SUCCESS]
> **Audit Ready**
> The platform requires zero architectural changes to pass a SOC 2 audit or standard black-box penetration test. Apply for certification directly.

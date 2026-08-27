# SOC2 Control Mapping - Settler

**Effective Date:** 2026-04-10  
**Status:** Active Control Framework

---

## Control Overview

| Category             | Controls       | Status         |
| -------------------- | -------------- | -------------- |
| Security             | CC1.1 - CC1.12 | 🟢 Implemented |
| Availability         | A1.1 - A1.2    | 🟢 Implemented |
| Processing Integrity | PI1.1 - PI1.6  | 🟢 Implemented |
| Confidentiality      | C1.1 - C1.3    | 🟢 Implemented |
| Privacy              | P1.1 - P1.12   | 🟢 Implemented |

---

## CC1: Security

### CC1.1: Control Environment

**Requirement:** Entity demonstrates commitment to integrity and ethical culture.

**Implementation:**

- Code of conduct published in `SECURITY.md`
- Engineering standards in `AGENTS.md`
- Multi-tenant isolation enforced via RLS (see `prisma/migrations/*`)
- Annual security training required for all engineers

**Evidence:**

- `AGENTS.md` lines 1-50
- `SECURITY.md` full document

---

### CC1.2:COSO Functionality

**Requirement:** Entity identifies and analyzes risk.

**Implementation:**

- Risk register maintained in `docs/RISK_REGISTER.md` (to be created)
- Quarterly risk review in sprint planning
- Security vulnerability disclosure policy

**Evidence:**

- Annual penetration test results
- Incident response plan

---

### CC1.3: Organizational Structure

**Requirement:** Entity establishes reporting lines.

**Implementation:**

- Organizational chart in `AGENTS.md`
- Defined roles: Owner, Admin, Developer, Auditor, Reviewer
- RBAC in `packages/config/src/permissions.ts`

**Evidence:**

- `packages/config/src/permissions.ts`
- Database schema for roles

---

### CC1.4: Employee Hiring

**Requirement:** Entity screens employees.

**Implementation:**

- Background check clause in employment agreements
- NDA and confidentiality required onboarding

**Evidence:**

- Standard employment agreement template

---

### CC1.5: Risk Mitigation

**Requirement:** Entity manages change.

**Implementation:**

- GitHub Actions for CI/CD with approval gates
- Two-person rule for production deployments
- Environment separation (dev/staging/prod)

**Evidence:**

- `.github/workflows/` configurations

---

### CC1.6: Logical Access

**Requirement:** Entity controls logical access.

**Implementation:**

- Session-based authentication
- RBAC enforcement at API boundary
- Tenant-scoped queries enforced in Prisma middleware
- HTTP-only, secure cookies for sessions

**Evidence:**

- `packages/auth/` implementation
- `packages/web/src/lib/auth.ts`
- Prisma middleware in `packages/db/`

---

### CC1.7: Physical Access

**Requirement:** Entity controls physical access.

**Implementation:**

- Managed hosting (AWS/Supabase) with SOC2 attestation
- No on-premise infrastructure

**Evidence:**

- Provider SOC2 reports (available upon request)

---

### CC1.8: System Events

**Requirement:** Entity monitors system events.

**Implementation:**

- Audit logging for all tenant operations
- `audit_logs` table tracks:
  - User ID, Organization ID, Action, Timestamp, IP
- Retention: 12 months

**Evidence:**

- `packages/db/prisma/schema.prisma` audit_logs
- Query interface in `packages/api/`

---

### CC1.9: Vulnerability Management

**Requirement:** Entity identifies and addresses vulnerabilities.

**Implementation:**

- Dependency scanning via Dependabot
- `pnpm verify` includes security checks
- Weekly vulnerability triage

**Evidence:**

- `ops/dependabot-triage-*.md`
- `ops/ci-failure-triage-*.md`

---

### CC1.10: Data Integrity

**Requirement:** Entity ensures data integrity.

**Implementation:**

- TigerBeetle for immutable ledger
- Deterministic reconciliation engine
- Evidence bundle generation for every decision

**Evidence:**

- `packages/reconciliation-engine/`
- Evidence generation in `packages/api/`

---

### CC1.11: Encryption

**Requirement:** Entity encrypts data.

**Implementation:**

- TLS 1.3 in transit
- PostgreSQL encryption at rest (AWS-managed)
- No PII in logs
- Customer data encrypted via Supabase

**Evidence:**

- Environment configuration
- VPC/subnet isolation

---

### CC1.12: Disposal

**Requirement:** Entity disposes data securely.

**Implementation:**

- Database retention policy: 24 months default
- Tenant deletion via API (`DELETE /api/organizations/:id`)
- Backup retention: 30 days

**Evidence:**

- `packages/api/src/routes/organization.ts`

---

## A1: Availability

### A1.1: Availability Commitment

**Requirement:** Entity commits to availability.

**Implementation:**

- Uptime commitment: 99.5% (Growth tier)
- SLA terms in `docs/SLA_POSITION.md`
- Status page monitoring

**Evidence:**

- `docs/SLA_POSITION.md`

---

### A1.2: Disaster Recovery

**Requirement:** Entity recovers from disruption.

**Implementation:**

- Daily backups via Supabase
- Point-in-time recovery enabled
- Backup testing quarterly

**Evidence:**

- Backup restore logs

---

## PI1: Processing Integrity

### PI1.1 - PI1.6: Reconciliation Integrity

**Requirement:** Processing is accurate and complete.

**Implementation:**

- Deterministic Rust kernel for math
- Transactional integrity via TigerBeetle
- Evidence pack for every reconciliation
- Human-in-loop for exceptions

**Evidence:**

- `crates/settler-core/`
- Evidence bundle generation

---

## C1: Confidentiality

### C1.1 - C1.3: Data Classification

**Requirement:** Confidential data is protected.

**Implementation:**

- Data classification matrix:
  - Public: Documentation
  - Internal: Aggregated analytics
  - Confidential: PII, credentials
  - Restricted: Payment data, keys
- Minimal PII collection policy

**Evidence:**

- Data classification in privacy docs

---

## P1: Privacy

### P1.1 - P1.12: Privacy Controls

**Requirement:** Privacy practices meet commitments.

**Implementation:**

- GDPR-compliant privacy policy
- Cookie consent banner
- Data export via API
- Right to deletion supported
- Subprocessor list maintained

**Evidence:**

- `docs/PRIVACY.md` (to be published)
- Cookie consent in `packages/web/`

---

## Trust Services Criteria Mapping

| TSC   | Description                | Mapping          |
| ----- | -------------------------- | ---------------- |
| CC6.1 | Logical access controls    | Session + RBAC   |
| CC6.6 | Encryption                 | TLS + at-rest    |
| CC6.7 | Restricted data access     | Tenant isolation |
| CC7.1 | System monitoring          | Audit logs       |
| CC7.2 | Incident response          | IRP documented   |
| A1.1  | Availability commitment    | SLA docs         |
| PI1.1 | Processing accuracy        | TigerBeetle      |
| C1.1  | Confidentiality commitment | Classification   |
| P1.1  | Privacy notice             | Privacy policy   |

---

## Evidence Pack

For auditors, the following evidence is available:

1. **Access Controls:** `packages/config/src/permissions.ts`, `packages/auth/`
2. **Audit Logs:** Database query access, `audit_logs` table
3. **Encryption:** Environment configuration, TLS certificates
4. **Vendor SOC2:** AWS SOC2 (via AWS Artifact), Supabase SOC2
5. **Penetration Testing:** Latest pen test report (annual)
6. **Incident Response:** IRP document
7. **Change Management:** GitHub history, approval workflows

---

## Annual Review Cadence

| Review                | Frequency | Owner            |
| --------------------- | --------- | ---------------- |
| Control effectiveness | Quarterly | Security Lead    |
| Penetration testing   | Annual    | External tester  |
| SOC2 audit            | Annual    | External auditor |
| Privacy impact        | Annual    | Privacy Officer  |
| Risk register         | Quarterly | PM               |

---

_Document Version: 1.0_  
_Last Updated: 2026-04-10_  
_Next Review: 2026-07-10_

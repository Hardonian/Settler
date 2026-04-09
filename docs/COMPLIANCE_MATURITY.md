# Compliance Maturity

## Current Status (Reality)

| Control Domain     | Status           | Evidence / Notes                                                              |
| ------------------ | ---------------- | ----------------------------------------------------------------------------- |
| **Data Security**  | **Implemented**  | Encryption at rest (DB), TLS in transit, RLS (Supabase) for tenant isolation. |
| **Access Control** | **Implemented**  | Role-Based Access Control (RBAC), Audit Logs for all mutations.               |
| **Audit Trail**    | **Implemented**  | `reconAudit` table tracks all engine actions.                                 |
| **SOC2 Type II**   | **Planned**      | Controls mapped, but no audit performed yet. **DO NOT CLAIM CERTIFICATION.**  |
| **PCI-DSS**        | **N/A**          | We delegate card handling to Stripe/PSP. We do not store PANs.                |
| **GDPR/CCPA**      | **Designed For** | Data deletion/export supported. PII minimization in logs.                     |

## Compliance Ladder

1.  **Level 1: Good Hygiene (Current)**
    - HTTPS everywhere.
    - Secrets in env vars.
    - No raw card data.
    - Basic access logs.

2.  **Level 2: Control Ready (Target Q2)**
    - Formal change management (PRs, Tests).
    - Disaster Recovery plan.
    - Vendor risk assessment.
    - Automated vulnerability scanning.

3.  **Level 3: Certified (Target Q4)**
    - External Audit (SOC2).
    - Penetration Test.

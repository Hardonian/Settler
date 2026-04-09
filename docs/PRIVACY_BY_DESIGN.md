# Privacy by Design

**Last Updated:** 2025-01-20  
**Status:** Production Reality  
**Purpose:** Privacy-by-design principles and data handling policies

## Overview

This document defines Settler's **privacy-by-design principles** and **data handling policies**. It is designed to help users understand how their data is protected and help Settler comply with privacy regulations.

**Philosophy:** Privacy is not an afterthought. It is built into the system from the ground up.

---

## Privacy Principles

### 1. Data Minimization

**Principle:** Collect only the data necessary for the service.

**Implementation:**

- ✅ Only collect data required for reconciliation
- ✅ No collection of unnecessary personal data
- ✅ Data retention limited to necessary period

**Examples:**

- Email addresses collected for authentication (required)
- Names collected for user profiles (optional)
- IP addresses collected for security (required)

---

### 2. Purpose Limitation

**Principle:** Use data only for the purposes for which it was collected.

**Implementation:**

- ✅ Data used only for reconciliation services
- ✅ No use of data for marketing without consent
- ✅ No use of data for AI training without consent

**Examples:**

- Receipt data used only for parsing and storage
- Usage data used only for billing and operations
- No data resale or sharing with third parties

---

### 3. Storage Limitation

**Principle:** Retain data only for as long as necessary.

**Implementation:**

- ✅ User data retained until deletion
- ✅ System data retained for operations (90 days)
- ✅ Audit logs retained for compliance (7 years)

**Retention Periods:**

- Active accounts: Indefinite (until deletion)
- Inactive accounts: 90 days
- Deleted accounts: 30 days soft delete
- Audit logs: 7 years (legal requirement)

---

### 4. Accuracy

**Principle:** Keep data accurate and up-to-date.

**Implementation:**

- ✅ Users can update their data
- ✅ Data validation prevents invalid data
- ✅ Data accuracy verified regularly

**Examples:**

- Users can update email addresses
- Users can update names
- Data validation prevents invalid formats

---

### 5. Security

**Principle:** Protect data with appropriate security measures.

**Implementation:**

- ✅ Encryption at rest (best-effort)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Access controls (authentication, authorization)

**Security Measures:**

- TLS 1.3 for all API endpoints
- AES-256 encryption for sensitive data
- Row-Level Security (RLS) for tenant isolation

---

### 6. Transparency

**Principle:** Be transparent about data collection and use.

**Implementation:**

- ✅ Privacy policy published
- ✅ Data handling documented
- ✅ Users notified of data collection

**Transparency:**

- Privacy policy at `/legal/privacy`
- Data handling documented in this document
- Users notified during signup

---

### 7. User Control

**Principle:** Give users control over their data.

**Implementation:**

- ✅ Users can export their data
- ✅ Users can delete their data
- ✅ Users can update their data

**User Rights:**

- Right to access (data export)
- Right to rectification (data updates)
- Right to erasure (data deletion)
- Right to portability (data export)

---

## Data Handling Policies

### Data Collection

**What We Collect:**

- **Account Data:** Email, name, password (hashed)
- **Usage Data:** API usage, feature usage, performance metrics
- **Transaction Data:** Reconciliation jobs, receipts, feature flags
- **Technical Data:** IP addresses, user agents, request logs

**Why We Collect:**

- Account data: Authentication and user management
- Usage data: Billing and operations
- Transaction data: Core service functionality
- Technical data: Security and performance monitoring

**How We Collect:**

- Directly from users (signup, API calls)
- Automatically (usage tracking, logs)
- From third parties (Stripe for payments)

---

### Data Processing

**How We Process:**

- **Reconciliation:** Process transactions to match between systems
- **Receipt Parsing:** Extract structured data from receipts
- **Feature Flags:** Evaluate flags and return values
- **Usage Tracking:** Aggregate usage for billing

**Where We Process:**

- **Primary:** US East (us-east-1)
- **Backup:** US West (us-west-2) - planned
- **Edge:** Global CDN for static assets

**Who Processes:**

- Settler employees (operations, support)
- Third-party processors (Stripe, Supabase, Upstash)
- Automated systems (AI/ML for receipt parsing)

---

### Data Sharing

**Who We Share With:**

- **Stripe:** Payment processing (payment data only)
- **Supabase:** Database hosting (all data)
- **Upstash:** Redis/cache hosting (cache data only)
- **Vercel:** Application hosting (application data)

**Why We Share:**

- Payment processing: Required for billing
- Database hosting: Required for data storage
- Cache hosting: Required for performance
- Application hosting: Required for service delivery

**How We Share:**

- Encrypted in transit (TLS)
- Encrypted at rest (where supported)
- Data processing agreements (DPAs) with processors

---

### Data Retention

**Retention Periods:**

- **User Data:** Until deletion by user
- **Inactive Accounts:** 90 days after last activity
- **Deleted Accounts:** 30 days soft delete
- **System Data:** 90 days (usage events)
- **Audit Logs:** 7 years (legal requirement)
- **Billing Data:** 7 years (legal requirement)

**Deletion Process:**

1. User requests deletion
2. Data marked for deletion (soft delete)
3. Data deleted after retention period (permanent deletion)
4. Backups deleted after retention period

---

### Data Export

**What Can Be Exported:**

- Reconciliation jobs and configurations
- Receipt data (parsed receipts and items)
- Feature flags and configurations
- Webhook configurations
- Usage metrics

**Export Formats:**

- JSON (structured data)
- CSV (tabular data)
- SQL (database dumps, enterprise only)

**Export Process:**

1. User requests export
2. Export generated asynchronously
3. Export available for download (7 days)
4. Export expires after 7 days

---

### Data Deletion

**User-Initiated Deletion:**

- Users can delete their data
- Data marked for deletion (soft delete)
- Data deleted after 30 days (permanent deletion)

**Account Closure:**

- Account marked as closed
- Data retention period begins (90 days)
- Data deleted after retention period

**Automatic Deletion:**

- Inactive accounts (90 days)
- Soft-deleted data (30 days)
- Expired exports (7 days)

---

## Privacy Rights

### GDPR Rights

**Right to Access:**

- ✅ Users can export their data
- ✅ Users can view their data in Developer Console
- ✅ Users can request data disclosure

**Right to Rectification:**

- ✅ Users can update their data
- ✅ Users can correct inaccurate data
- ✅ Data validation prevents invalid data

**Right to Erasure:**

- ✅ Users can delete their data
- ✅ Users can request account deletion
- ✅ Data deleted after retention period

**Right to Portability:**

- ✅ Users can export their data
- ✅ Export available in machine-readable format
- ✅ Export includes all user data

**Right to Object:**

- ✅ Users can opt-out of data processing
- ✅ Users can disable usage tracking
- ✅ Users can delete their data

**Right to Restrict Processing:**

- ✅ Users can disable features
- ✅ Users can pause data processing
- ✅ Users can delete their data

---

### CCPA Rights

**Right to Know:**

- ✅ Users can request data disclosure
- ✅ Privacy policy discloses data collection
- ✅ Data handling documented

**Right to Delete:**

- ✅ Users can delete their data
- ✅ Users can request account deletion
- ✅ Data deleted after retention period

**Right to Opt-Out:**

- ✅ Users can opt-out of data sharing
- ✅ No data resale
- ✅ No data sharing without consent

**Right to Non-Discrimination:**

- ✅ Users not discriminated against for exercising rights
- ✅ Service continues regardless of privacy choices
- ✅ No penalties for privacy requests

---

## Privacy Controls

### User Controls

**Account Settings:**

- ✅ Update email address
- ✅ Update name
- ✅ Change password
- ✅ Enable/disable MFA

**Data Controls:**

- ✅ Export data
- ✅ Delete data
- ✅ Update data
- ✅ Disable usage tracking

**Privacy Controls:**

- ✅ Opt-out of marketing emails
- ✅ Opt-out of data sharing
- ✅ Request data deletion
- ✅ Request data disclosure

---

### Administrative Controls

**Access Controls:**

- ✅ Role-based access control (RBAC)
- ✅ Scoped API keys
- ✅ Tenant isolation

**Audit Controls:**

- ✅ Audit logs for all data access
- ✅ Audit logs for configuration changes
- ✅ Audit logs for data deletion

**Monitoring Controls:**

- ✅ Monitor data access patterns
- ✅ Monitor data deletion requests
- ✅ Monitor privacy requests

---

## Privacy by Design Implementation

### System Design

**Privacy Built-In:**

- ✅ Data minimization in data model
- ✅ Purpose limitation in data processing
- ✅ Storage limitation in data retention
- ✅ Security in data protection

**Privacy by Default:**

- ✅ Minimal data collection by default
- ✅ Privacy-friendly defaults
- ✅ Opt-in for optional data collection
- ✅ Opt-out for data sharing

---

### Development Process

**Privacy Reviews:**

- ✅ Privacy impact assessments (PIAs)
- ✅ Data protection impact assessments (DPIAs)
- ✅ Privacy reviews for new features

**Privacy Testing:**

- ✅ Privacy testing in development
- ✅ Privacy testing in staging
- ✅ Privacy testing in production

**Privacy Documentation:**

- ✅ Privacy policy updated regularly
- ✅ Data handling documented
- ✅ Privacy controls documented

---

## Third-Party Processors

### Sub-Processors

**Infrastructure:**

- **AWS:** Cloud hosting (US East)
- **Vercel:** Frontend hosting (Global CDN)
- **Supabase:** Database hosting (US East)
- **Upstash:** Redis/cache hosting (US East)

**Services:**

- **Stripe:** Payment processing (US)
- **Sentry:** Error monitoring (US)
- **Cloudflare:** DDoS protection (Global)

**Data Processing Agreements:**

- ✅ DPAs with all sub-processors
- ✅ Sub-processors comply with privacy regulations
- ✅ Sub-processors audited regularly

---

### Data Transfers

**International Transfers:**

- ✅ Data primarily stored in US
- ✅ EU data residency available (enterprise)
- ✅ Standard contractual clauses (SCCs) for transfers

**Transfer Safeguards:**

- ✅ Encryption in transit (TLS)
- ✅ Encryption at rest (where supported)
- ✅ Access controls
- ✅ Audit logging

---

## Privacy Incidents

### Incident Response

**Detection:**

- Monitor for data breaches
- Monitor for unauthorized access
- Monitor for data leakage

**Response:**

1. Detect privacy incident
2. Assess severity and scope
3. Contain incident
4. Notify affected users (if required)
5. Notify authorities (if required)
6. Remediate
7. Post-mortem

**Notification:**

- Users notified within 72 hours (GDPR)
- Authorities notified within 72 hours (GDPR)
- Public disclosure (if required)

---

## Privacy Compliance

### GDPR Compliance

**Status:** Compliant

**Requirements:**

- ✅ Data export available
- ✅ Data deletion available
- ✅ Data processing agreements available
- ✅ Privacy policy published
- ✅ Privacy by design implemented

---

### CCPA Compliance

**Status:** Compliant

**Requirements:**

- ✅ Data export available
- ✅ Data deletion available
- ✅ No data resale
- ✅ Privacy policy published
- ✅ Privacy rights implemented

---

## Summary

Settler's privacy-by-design implementation:

- ✅ **Data Minimization:** Collect only necessary data
- ✅ **Purpose Limitation:** Use data only for intended purposes
- ✅ **Storage Limitation:** Retain data only as long as necessary
- ✅ **Accuracy:** Keep data accurate and up-to-date
- ✅ **Security:** Protect data with appropriate security measures
- ✅ **Transparency:** Be transparent about data collection and use
- ✅ **User Control:** Give users control over their data
- ✅ **Privacy Rights:** GDPR and CCPA rights implemented
- ✅ **Privacy Controls:** User and administrative controls available
- ✅ **Privacy by Design:** Privacy built into system design
- ✅ **Third-Party Processors:** DPAs with all sub-processors
- ✅ **Privacy Compliance:** GDPR and CCPA compliant

**Key Principles:**

- Privacy is not an afterthought
- Privacy is built into the system from the ground up
- Users own their data
- Transparency and user control are priorities

**When in doubt, prioritize user privacy and data protection.**

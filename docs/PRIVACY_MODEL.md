# Settler Privacy Model

**Last Updated:** January 2025  
**Version:** 1.0

## Overview

This document describes Settler's privacy model, data handling practices, and customer data rights. It is designed to help customers understand how their data is processed and their rights under GDPR, CCPA, and other privacy regulations.

## Data Controller & Processor

**Data Controller:** Settler, Inc.  
**Data Processor:** Settler processes customer data on behalf of customers (data controllers) for reconciliation services.

## Data Categories

### Customer Data
- **Account Information:** Email, name, organization details
- **Configuration Data:** Reconciliation job configurations, mapping rules
- **Transaction Data:** Financial transactions imported for reconciliation
- **Results Data:** Reconciliation results, matches, exceptions

### Usage Data
- **API Usage:** API call logs, rate limit usage
- **Feature Usage:** Feature usage analytics
- **Performance Metrics:** Response times, error rates

### Technical Data
- **IP Addresses:** Logged for security and audit purposes
- **User Agents:** Browser/application identifiers
- **Session Data:** Authentication session information

## Data Processing Purposes

Settler processes customer data for the following purposes:

1. **Service Delivery:** Providing reconciliation services
2. **Account Management:** Managing customer accounts and billing
3. **Security:** Preventing fraud, abuse, and security threats
4. **Compliance:** Meeting legal and regulatory obligations
5. **Service Improvement:** Improving service quality (anonymized data only)

## Data Processing Legal Basis

### GDPR (EU/UK Customers)
- **Contract Performance:** Processing necessary to provide reconciliation services
- **Legitimate Interest:** Security, fraud prevention, service improvement
- **Consent:** For optional features (e.g., AI processing)

### CCPA (California Customers)
- **Business Purpose:** Providing reconciliation services
- **Service Provider:** Processing on behalf of customer

## Data Sharing & Sub-processors

### Sub-processors
Settler engages third-party sub-processors to provide services. All sub-processors:
- Undergo security and privacy diligence
- Sign Data Processing Agreements (DPAs)
- Process data only for specified purposes
- Implement appropriate security measures

See `/legal/subprocessors` for complete list.

### No Data Sales
Settler does not sell customer data to third parties.

### Law Enforcement
Settler may disclose customer data if required by law or valid legal process. Customers will be notified unless legally prohibited.

## Data Location & Residency

### Default Locations
- **US Customers:** Data stored in US regions (AWS us-east-1, us-west-2)
- **EU Customers:** Data stored in EU regions (AWS eu-west-1, eu-central-1)

### Data Residency Options
Enterprise customers can request specific data residency regions. Data residency is enforced at:
- Database level (region-specific instances)
- Storage level (region-specific S3 buckets)
- Processing level (region-specific compute)

## Data Retention

### Active Accounts
- **Customer Data:** Retained while account is active
- **Audit Logs:** Retained for 7 years
- **Backups:** Retained for 30 days (extendable)

### Deleted Accounts
- **Soft Delete:** Data marked as deleted immediately
- **Hard Delete:** Data permanently deleted after 30-day grace period
- **Backup Deletion:** Backups deleted after retention period

### Legal Holds
Data subject to legal holds may be retained beyond normal retention periods.

## Customer Data Rights

### Right to Access
- **Full Export:** `GET /api/v1/tenant/data-export` (JSON/CSV)
- **User Export:** `GET /api/v1/users/:id/data-export`
- **Audit Logs:** `GET /api/v1/audit-trail`

### Right to Rectification
- Customers can update their data via API or console
- Configuration data can be modified at any time
- Changes are logged in audit trail

### Right to Erasure
- **Account Deletion:** `DELETE /api/v1/tenant/data` (owner only)
- **User Deletion:** `DELETE /api/v1/users/:id/data` (user or admin)
- **Grace Period:** 30-day grace period before hard deletion
- **Verification:** Deletion verified and logged

### Right to Restrict Processing
- Customers can pause reconciliation jobs
- Data processing can be suspended for specific integrations
- Contact support for complete processing restriction

### Right to Data Portability
- Data export available in machine-readable formats (JSON, CSV)
- Export includes all customer data in structured format
- Exports can be automated via API

### Right to Object
- Customers can opt out of optional data processing (e.g., AI features)
- Marketing communications can be opted out
- Contact support to exercise right to object

## Data Security

### Technical Measures
- **Encryption:** AES-256 at rest, TLS 1.3 in transit
- **Access Controls:** Role-based access control, least privilege
- **Tenant Isolation:** Complete data isolation between tenants
- **Audit Logging:** Comprehensive audit trail of all data access

### Organizational Measures
- **Employee Training:** Privacy and security training
- **Access Controls:** Limited access to customer data
- **Incident Response:** Security incident response procedures
- **Regular Audits:** Security and privacy audits

## Data Breach Notification

### Notification Process
- **Detection:** Automated monitoring detects breaches
- **Assessment:** Impact assessment within 24 hours
- **Notification:** Affected customers notified within 72 hours
- **Remediation:** Immediate remediation actions

### Notification Content
- Description of breach
- Categories of data affected
- Likely consequences
- Measures taken or proposed
- Contact information for inquiries

## International Data Transfers

### Transfer Mechanisms
- **Standard Contractual Clauses (SCCs):** EU-US data transfers use SCCs
- **Adequacy Decisions:** Where applicable
- **DPAs:** Data Processing Agreements with sub-processors

### Transfer Locations
- US customers: Data may be processed in US regions
- EU customers: Data processed in EU regions (no transfer outside EU without consent)

## Children's Privacy

Settler's services are not intended for children under 16. We do not knowingly collect data from children.

## Privacy by Design

### Design Principles
- **Data Minimization:** Collect only necessary data
- **Purpose Limitation:** Process data only for specified purposes
- **Storage Limitation:** Retain data only as long as necessary
- **Accuracy:** Maintain accurate data
- **Security:** Implement appropriate security measures
- **Transparency:** Clear privacy notices and policies

### Implementation
- Privacy impact assessments for new features
- Default privacy settings favor privacy
- Regular privacy reviews

## Privacy Policy Updates

Privacy policy updates will be:
- Posted on `/legal/privacy`
- Notified to customers via email (material changes)
- Effective 30 days after notification

## Privacy Contacts

- **Privacy Inquiries:** privacy@settler.dev
- **Data Protection Officer:** dpo@settler.dev (EU customers)
- **General Support:** support@settler.dev

## Regulatory Compliance

### GDPR (EU/UK)
- Compliant with GDPR requirements
- Data Processing Agreements available
- Right to lodge complaint with supervisory authority

### CCPA (California)
- Compliant with CCPA requirements
- California residents have specific rights
- No sale of personal information

### Other Jurisdictions
- Working towards compliance with other privacy regulations
- Enterprise customers can request specific compliance documentation

## Document Control

This document is reviewed and updated quarterly or when significant changes occur. Customers will be notified of material changes.

**Document Owner:** Privacy Team  
**Review Frequency:** Quarterly  
**Next Review:** April 2025

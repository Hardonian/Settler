# Privacy Policy Skeleton

**Note**: This is a skeleton document. Consult with legal counsel before publishing.

## Data Categories

### Personal Data We Collect

1. **Account Information**
   - Email address
   - Name
   - Password (hashed)
   - Organization name

2. **Usage Data**
   - API usage logs
   - Reconciliation job execution logs
   - Error logs
   - Performance metrics

3. **Technical Data**
   - IP address
   - User agent
   - Request timestamps
   - API key usage

4. **Financial Data** (if applicable)
   - Payment method (processed by payment processor)
   - Billing address
   - Transaction history

### Data We Do NOT Collect

- Payment card numbers (processed by third-party)
- Social security numbers
- Health information (unless HIPAA BAA in place)
- Biometric data

## Processing Purposes

### Lawful Basis (GDPR Article 6)

1. **Contract Performance** (6(1)(b))
   - Providing reconciliation services
   - Processing reconciliation jobs
   - Delivering webhooks

2. **Legitimate Interests** (6(1)(f))
   - Security monitoring
   - Fraud prevention
   - Service improvement
   - Analytics

3. **Consent** (6(1)(a))
   - Marketing communications (opt-in)
   - Cookie usage (where required)

4. **Legal Obligation** (6(1)(c))
   - Tax reporting
   - Compliance with regulations

## Data Subject Rights (GDPR Chapter 3)

### Right of Access (Article 15)

**Request Flow:**
1. User submits access request via API or email
2. System verifies identity
3. System collects all user data
4. System exports data in JSON format
5. System delivers within 30 days

**Implementation:**
```typescript
GET /api/v1/users/me/data-export
```

### Right to Rectification (Article 16)

**Request Flow:**
1. User updates data via API or dashboard
2. System validates changes
3. System updates records
4. System logs change in audit log

**Implementation:**
```typescript
PATCH /api/v1/users/me
```

### Right to Erasure (Article 17)

**Request Flow:**
1. User submits deletion request
2. System verifies identity
3. System schedules deletion (30-day grace period)
4. System notifies user of scheduled deletion
5. System deletes data after grace period
6. System retains audit logs (legal requirement)

**Implementation:**
```typescript
DELETE /api/v1/users/me
```

**Retention Exception:**
- Audit logs: 7 years (legal requirement)
- Financial records: As required by law
- Anonymized usage data: Retained for analytics

### Right to Restrict Processing (Article 18)

**Implementation:**
- Suspend tenant account
- Stop processing reconciliation jobs
- Retain data but don't process

### Right to Data Portability (Article 20)

**Export Format:**
- JSON format
- Machine-readable
- Includes all user data
- Includes reconciliation jobs, reports, webhooks

**Implementation:**
```typescript
GET /api/v1/users/me/data-export
```

### Right to Object (Article 21)

**Processing User Can Object To:**
- Marketing communications (opt-out)
- Analytics (via cookie preferences)
- Legitimate interest processing (with justification)

## Data Retention Policies

### User Data
- **Active Accounts**: Retained while account is active
- **Deleted Accounts**: 30-day grace period, then deleted
- **Audit Logs**: 7 years (legal requirement)

### Reconciliation Data
- **Job Configurations**: Retained while account is active
- **Execution Logs**: Configurable (default 365 days)
- **Reports**: Configurable (default 365 days)

### Configuration
```typescript
// Per-tenant configuration
{
  dataRetentionDays: 365, // Default
  auditLogRetentionDays: 2555, // 7 years
}
```

## Data Transfers

### International Transfers

- **EU Data**: Processed in EU region (data residency)
- **US Data**: Processed in US region
- **Transfers**: Standard Contractual Clauses (SCCs)

### Subprocessors

List of subprocessors:
- **Hosting**: AWS (US, EU regions)
- **Database**: AWS RDS (US, EU regions)
- **Analytics**: [Analytics provider]
- **Email**: [Email provider]

## Security Measures

- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Access controls (RBAC)
- Audit logging
- Regular security assessments

## Data Breach Notification

- **Detection**: Automated monitoring + manual review
- **Assessment**: Within 24 hours
- **Notification**: 
  - Supervisory authority: Within 72 hours (GDPR Article 33)
  - Data subjects: Without undue delay (GDPR Article 34)

## Contact Information

**Data Protection Officer**: dpo@settler.io
**Privacy Inquiries**: privacy@settler.io

## Changes to Privacy Policy

- Notification: Email to all users
- Effective date: 30 days after notification
- Version history: Available in repository

# Admin Capabilities

**Last Updated:** 2025-01-20  
**Status:** Production Reality  
**Purpose:** Administrative and operational capabilities for Settler

## Overview

This document defines **administrative capabilities** and **operational surfaces** for Settler. It is designed to help operators understand what administrative tools are available.

**Philosophy:** Operators need visibility and control. Admin capabilities must be safe, audited, and reversible.

---

## Admin Endpoints

### Health & Status

**Endpoints:**
- `GET /api/health` - Overall health with dependency checks
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe
- `GET /api/status/health` - Detailed health status

**Access:** Public (no authentication required)

**Usage:**
```bash
curl https://api.settler.io/api/health
```

---

### Metrics & Observability

**Endpoints:**
- `GET /api/metrics` - Prometheus-compatible metrics
- `GET /api/observability` - Observability dashboard (internal)

**Access:** Internal (service-role key required)

**Metrics:**
- HTTP metrics (latency, error rate, request count)
- Business metrics (reconciliations, webhook deliveries)
- System metrics (connections, queue depth, cache hit/miss)

**Usage:**
```bash
curl -H "X-API-Key: service_role_key" https://api.settler.io/api/metrics
```

---

### Admin Operations

**Endpoints:**
- `GET /api/admin/users` - List all users (admin only)
- `GET /api/admin/tenants` - List all tenants (admin only)
- `GET /api/admin/billing/reconcile` - Reconcile billing (admin only)
- `POST /api/admin/billing/sync` - Sync billing from Stripe (admin only)

**Access:** Admin (service-role key or admin user required)

**Usage:**
```bash
curl -H "X-API-Key: service_role_key" https://api.settler.io/api/admin/users
```

---

## Operator Mode

### Operator Mode Endpoints

**Endpoints:**
- `GET /api/v1/operator-mode/health` - System health overview
- `GET /api/v1/operator-mode/metrics` - System metrics
- `GET /api/v1/operator-mode/errors` - Recent errors
- `GET /api/v1/operator-mode/usage` - Usage statistics
- `POST /api/v1/operator-mode/alerts` - Create alerts
- `POST /api/v1/operator-mode/actions` - Execute actions

**Access:** Admin (service-role key or admin user required)

**Features:**
- System health overview
- Error monitoring
- Usage statistics
- Alert management
- Action execution

---

### Daily Operator Tasks

**Scheduled Jobs:**
- Daily insights generation (2 AM UTC)
- Weekly briefing generation (Monday 9 AM UTC)
- Usage aggregation (hourly)
- Data retention cleanup (daily)

**Manual Tasks:**
- Review health endpoints
- Review error logs
- Review metrics dashboard
- Review alert notifications

---

## Feature Flags

### Feature Flag Management

**Admin Capabilities:**
- Enable/disable features globally
- Enable/disable features per tenant
- Roll out features gradually
- Kill switch for risky features

**Endpoints:**
- `GET /api/v1/feature-flags` - List feature flags
- `POST /api/v1/feature-flags` - Create feature flag
- `PATCH /api/v1/feature-flags/:id` - Update feature flag
- `DELETE /api/v1/feature-flags/:id` - Delete feature flag

**Usage:**
```bash
curl -H "X-API-Key: admin_key" https://api.settler.io/api/v1/feature-flags
```

---

### Kill Switches

**Risky Subsystems:**
- Receipt parsing (AI/ML operations)
- Reconciliation engine (matching algorithms)
- Webhook delivery (external dependencies)
- Payment processing (Stripe integration)

**Kill Switch Procedure:**
1. Identify risky subsystem
2. Disable feature flag
3. Monitor system health
4. Re-enable when safe

---

## Billing Operations

### Billing Reconciliation

**Endpoints:**
- `POST /api/admin/billing/reconcile` - Reconcile billing
- `POST /api/admin/billing/sync` - Sync from Stripe
- `GET /api/admin/billing/status` - Billing status

**Purpose:**
- Reconcile Stripe subscriptions with database
- Fix billing discrepancies
- Sync subscription status

**Usage:**
```bash
curl -X POST -H "X-API-Key: service_role_key" https://api.settler.io/api/admin/billing/reconcile
```

---

### Usage Tracking

**Admin Capabilities:**
- View usage by tenant
- View usage by user
- View usage by service
- Export usage data

**Endpoints:**
- `GET /api/admin/usage/tenants` - Usage by tenant
- `GET /api/admin/usage/users` - Usage by user
- `GET /api/admin/usage/services` - Usage by service

**Usage:**
```bash
curl -H "X-API-Key: service_role_key" https://api.settler.io/api/admin/usage/tenants
```

---

## Data Operations

### Data Export

**Admin Capabilities:**
- Export tenant data
- Export user data
- Export system data
- Export audit logs

**Endpoints:**
- `GET /api/admin/export/tenant/:id` - Export tenant data
- `GET /api/admin/export/user/:id` - Export user data
- `GET /api/admin/export/audit` - Export audit logs

**Usage:**
```bash
curl -H "X-API-Key: service_role_key" https://api.settler.io/api/admin/export/tenant/tenant_id
```

---

### Data Deletion

**Admin Capabilities:**
- Delete tenant data
- Delete user data
- Delete system data (with caution)
- Soft delete vs hard delete

**Endpoints:**
- `DELETE /api/admin/tenant/:id` - Delete tenant
- `DELETE /api/admin/user/:id` - Delete user
- `POST /api/admin/data/cleanup` - Cleanup expired data

**Usage:**
```bash
curl -X DELETE -H "X-API-Key: service_role_key" https://api.settler.io/api/admin/tenant/tenant_id
```

---

## Security Operations

### Access Control

**Admin Capabilities:**
- View all API keys
- Revoke API keys
- View authentication logs
- View authorization logs

**Endpoints:**
- `GET /api/admin/api-keys` - List all API keys
- `DELETE /api/admin/api-keys/:id` - Revoke API key
- `GET /api/admin/auth/logs` - Authentication logs
- `GET /api/admin/authz/logs` - Authorization logs

**Usage:**
```bash
curl -H "X-API-Key: service_role_key" https://api.settler.io/api/admin/api-keys
```

---

### Security Monitoring

**Admin Capabilities:**
- View security events
- View failed authentication attempts
- View authorization failures
- View suspicious activity

**Endpoints:**
- `GET /api/admin/security/events` - Security events
- `GET /api/admin/security/failed-auth` - Failed authentication
- `GET /api/admin/security/authz-failures` - Authorization failures

**Usage:**
```bash
curl -H "X-API-Key: service_role_key" https://api.settler.io/api/admin/security/events
```

---

## Monitoring & Alerting

### System Monitoring

**Admin Capabilities:**
- View system health
- View metrics
- View error logs
- View performance metrics

**Endpoints:**
- `GET /api/admin/monitoring/health` - System health
- `GET /api/admin/monitoring/metrics` - Metrics
- `GET /api/admin/monitoring/errors` - Error logs
- `GET /api/admin/monitoring/performance` - Performance metrics

**Usage:**
```bash
curl -H "X-API-Key: service_role_key" https://api.settler.io/api/admin/monitoring/health
```

---

### Alert Management

**Admin Capabilities:**
- View alerts
- Acknowledge alerts
- Resolve alerts
- Configure alert thresholds

**Endpoints:**
- `GET /api/admin/alerts` - List alerts
- `PATCH /api/admin/alerts/:id/acknowledge` - Acknowledge alert
- `PATCH /api/admin/alerts/:id/resolve` - Resolve alert

**Usage:**
```bash
curl -H "X-API-Key: service_role_key" https://api.settler.io/api/admin/alerts
```

---

## Audit & Compliance

### Audit Logging

**Admin Capabilities:**
- View audit logs
- Export audit logs
- Search audit logs
- Filter audit logs

**Endpoints:**
- `GET /api/admin/audit/logs` - List audit logs
- `GET /api/admin/audit/export` - Export audit logs
- `GET /api/admin/audit/search` - Search audit logs

**Usage:**
```bash
curl -H "X-API-Key: service_role_key" https://api.settler.io/api/admin/audit/logs
```

---

### Compliance Operations

**Admin Capabilities:**
- Generate compliance reports
- Export compliance data
- Verify compliance controls
- Document compliance activities

**Endpoints:**
- `GET /api/admin/compliance/reports` - Compliance reports
- `GET /api/admin/compliance/export` - Export compliance data

**Usage:**
```bash
curl -H "X-API-Key: service_role_key" https://api.settler.io/api/admin/compliance/reports
```

---

## Access Control

### Service-Role Keys

**Purpose:** Administrative access that bypasses RLS.

**Usage:**
- Billing reconciliation
- System administration
- Data export
- Security operations

**Security:**
- ✅ Service-role keys require operational controls
- ✅ All actions logged in audit trail
- ✅ Keys rotated regularly
- ✅ Keys restricted to specific operations

---

### Admin Users

**Purpose:** Users with administrative privileges.

**Roles:**
- **OWNER:** Full access to tenant
- **ADMIN:** Full operational access

**Capabilities:**
- Access admin endpoints
- Manage tenant settings
- Manage users
- View audit logs

---

## Safety & Reversibility

### Reversible Operations

**Operations:**
- Feature flag changes (can be reverted)
- Configuration changes (can be reverted)
- Data exports (read-only)

**Safety:**
- ✅ Changes logged in audit trail
- ✅ Changes can be reverted
- ✅ Changes require confirmation

---

### Irreversible Operations

**Operations:**
- Data deletion (permanent)
- Account deletion (permanent)
- API key revocation (permanent)

**Safety:**
- ✅ Operations require confirmation
- ✅ Operations logged in audit trail
- ✅ Operations require admin approval
- ✅ Operations have grace period (soft delete)

---

## Summary

Settler's admin capabilities:
- ✅ **Health & Status:** Health endpoints and dependency checks
- ✅ **Metrics & Observability:** Prometheus-compatible metrics
- ✅ **Admin Operations:** User and tenant management
- ✅ **Operator Mode:** Daily operator tasks and monitoring
- ✅ **Feature Flags:** Feature management and kill switches
- ✅ **Billing Operations:** Billing reconciliation and usage tracking
- ✅ **Data Operations:** Data export and deletion
- ✅ **Security Operations:** Access control and security monitoring
- ✅ **Monitoring & Alerting:** System monitoring and alert management
- ✅ **Audit & Compliance:** Audit logging and compliance operations
- ✅ **Access Control:** Service-role keys and admin users
- ✅ **Safety & Reversibility:** Reversible and irreversible operations

**Key Principles:**
- Admin capabilities must be safe, audited, and reversible
- Operators need visibility and control
- All admin actions are logged
- Kill switches for risky subsystems

**When in doubt, check audit logs, verify operations, and follow runbooks.**

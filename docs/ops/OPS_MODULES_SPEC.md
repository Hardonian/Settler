# Ops Modules Specification

**Last Updated:** 2025-01-27  
**Status:** Implemented

## Overview

The Founder Ops Command Center provides comprehensive operational monitoring and management capabilities for administrators.

## Modules

### 1. Overview Dashboard

**Route:** `/console/ops` (tab: Overview)

**Features:**
- System health status (R/Y/G indicators)
- Key metrics at a glance:
  - Total customers
  - Active customers
  - Total usage (24h)
  - Error rate (24h)
  - Pending jobs
  - Failed webhooks

**API:** `GET /api/ops/overview`

**Data Sources:**
- `billing_accounts` table
- `ops_errors` table
- `ops_jobs` table
- `ops_webhooks` table
- `ops_usage_aggregates` table

### 2. Customers Management

**Route:** `/console/ops` (tab: Customers)

**Features:**
- List all customers
- Customer status overview
- Usage per customer
- Creation date tracking

**API:** `GET /api/ops/customers`

**Data Sources:**
- `billing_accounts` table
- `users` table
- `ops_usage_aggregates` table

### 3. Usage Analytics

**Route:** `/console/ops` (tab: Usage)

**Features:**
- Usage metrics and analytics
- Endpoint-level usage tracking
- Time-series usage data

**Data Sources:**
- `ops_usage_aggregates` table

### 4. Jobs & Queues

**Route:** `/console/ops` (tab: Jobs)

**Features:**
- Job queue monitoring
- Job status tracking
- Failed job management
- Job retry controls

**Data Sources:**
- `ops_jobs` table

### 5. Webhooks Monitoring

**Route:** `/console/ops` (tab: Webhooks)

**Features:**
- Webhook delivery status
- Failed webhook tracking
- Retry management
- Event type filtering

**Data Sources:**
- `ops_webhooks` table

### 6. Error Monitoring

**Route:** `/console/ops` (tab: Errors)

**Features:**
- Error log viewing
- Error severity filtering
- Error resolution tracking
- Route-level error analysis

**Data Sources:**
- `ops_errors` table

### 7. Billing Management

**Route:** `/console/ops` (tab: Billing)

**Features:**
- Billing account management
- Subscription status
- Stripe integration status
- Revenue metrics

**Data Sources:**
- `billing_accounts` table
- Stripe API (via service)

### 8. Exports

**Route:** `/console/ops` (tab: Exports)

**Features:**
- CSV export functionality
- Export types:
  - Customers
  - Usage
  - Errors
- Audit log inclusion
- Timestamp tracking

**API:** `GET /api/ops/export?type={type}`

**Audit:** All exports logged to `ops_audit_logs`

### 9. Runbooks

**Route:** `/console/ops` (tab: Runbooks)

**Features:**
- Operational procedures
- Deployment guides
- Troubleshooting steps
- Emergency procedures

**Content:** Static documentation (expandable)

## Database Schema

### ops_errors
- Error tracking and monitoring
- Severity levels: info, warning, error, critical
- Route and context capture

### ops_jobs
- Job queue management
- Status tracking: pending, processing, completed, failed, cancelled
- Retry logic

### ops_webhooks
- Webhook delivery tracking
- Status: pending, delivered, failed, retrying
- Retry management

### ops_usage_aggregates
- Daily usage aggregates
- Endpoint-level tracking
- Organization and user-level metrics

### ops_support_tickets
- Support ticket management
- Auto-triage results
- Priority and category assignment

### ops_audit_logs
- Audit trail for all operations
- User action tracking
- Change history

## Access Control

**Required Role:** `SUPER_ADMIN`

**Enforcement:**
- Route-level: Check `getUserRole()` returns `SUPER_ADMIN`
- API-level: Use `requireAdmin()` helper
- Database-level: RLS policies on all `ops_*` tables

## Security

- All ops routes require authentication
- Admin-only access enforced at multiple layers
- RLS policies prevent unauthorized data access
- Audit logging for all sensitive operations
- No stack traces exposed to users

## Error Handling

- Error boundaries on all ops routes
- Graceful error states
- No hard 500s
- User-friendly error messages

## Performance

- Aggregated data queries (daily aggregates)
- Indexed database tables
- Efficient pagination
- Cached overview data (30s refresh)

## Future Enhancements

- Real-time updates via WebSocket
- Advanced filtering and search
- Custom dashboards
- Alert configuration
- Automated remediation actions

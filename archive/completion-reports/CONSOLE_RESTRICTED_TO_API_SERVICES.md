# Console Restricted to API Services ✅

## Summary

The Developer Console has been restricted to only show tables related to Settler's core API services:
- ✅ Receipts API
- ✅ Reconciliation API  
- ✅ Feature Flags API
- ✅ Webhooks
- ✅ API Keys & Authentication
- ✅ Usage Tracking
- ✅ Billing (for API services)

Full database access moved to Admin Dashboard.

## What Changed

### Console Tables (`/console/tables`)
**Restricted to API Service Tables Only:**
- Receipts: `receipt_uploads`, `receipts`, `receipt_items`
- Reconciliation: `recon_jobs`, `recon_results`, `recon_templates`, etc.
- Feature Flags: `feature_flags`, `feature_flag_environments`, `feature_flag_overrides`
- Webhooks: `webhooks`, `webhook_deliveries`
- API Keys: `api_keys`, `idempotency_keys`
- Usage: `usage_events`, `usage_aggregate_daily`, `usage_counters`
- Billing: `billing_accounts`, `subscriptions`, `add_ons`, `add_on_purchases`
- Ingestion: `ingestion_sources`, `ingestions`, `raw_records`, `normalized_transactions`

**Total**: ~40 API service tables (down from 223)

### Admin Dashboard (`/admin/database`)
**Full Database Access:**
- All 223 application tables
- Full CRUD operations
- Admin-only access
- Complete Supabase table browser

### API Test Console (`/console/api-test`)
**New CLI Code Editor:**
- Test API calls
- Test webhooks
- Test CLI commands
- Test SDK operations
- Code examples for each service
- Execute and see responses

## Console Purpose

The Developer Console is now focused on:
1. **Testing APIs** - Receipts, Reconciliation, Feature Flags, Webhooks
2. **CLI Operations** - Test CLI commands and SDK calls
3. **Webhook Testing** - Test webhook delivery and payloads
4. **API Service Data** - View/edit data for core services only

## Admin Dashboard Purpose

The Admin Dashboard provides:
1. **Full Database Access** - All tables for admin operations
2. **System Tables** - Access to internal/system tables
3. **Database Management** - Complete Supabase browser

## Access Points

### Console (API Services Only)
- `/console/tables` - Browse API service tables
- `/console/tables/[table]` - View/edit API service table
- `/console/api-test` - Test API calls, webhooks, CLI

### Admin (Full Database)
- `/admin/database` - Browse all tables
- `/admin/database/[table]` - View/edit any table

---

**Status**: ✅ **COMPLETE** - Console restricted to API services, admin has full access


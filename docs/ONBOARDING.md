# Customer Onboarding & Activation Engine

Complete onboarding and activation system for Settler that guides new users through workspace creation, team invites, data connection, and first success in under 3 minutes.

## Overview

The onboarding system provides:
- **Multi-step wizard** at `/console/onboarding`
- **Workspace creation** with slug validation
- **Team invites** with role-based access control
- **Activation checklist** showing progress
- **Event tracking** with `trace_id` and `tenant_id`
- **Demo mode** support without requiring secrets
- **Production-ready** with proper error handling

## User Journey

### 1. Sign Up → Create/Join Workspace

New users sign up via Supabase Auth and land in the console. If they don't have a workspace, they're guided to create one:

```
POST /api/workspaces
{
  "name": "My Company",
  "slug": "my-company"
}
```

The system:
- Creates a `Tenant` record
- Adds user as `owner` in `tenant_users`
- Initializes `tenant_onboarding_progress`
- Tracks `onboarding_started` event

### 2. Add Teammates (Optional)

Users can invite team members:

```
POST /api/workspaces/{workspaceId}/invites
{
  "email": "teammate@example.com",
  "role": "member" // owner, admin, member, viewer
}
```

Invites:
- Generate secure token
- Expire after 7 days
- Can be accepted via `/invite/{token}`
- Track `invite_sent` and `invite_accepted` events

### 3. Connect Data Source OR Upload Sample

Users can either:
- **Connect data source**: Stripe, Shopify, etc. via playground
- **Upload sample file**: CSV, JSON via receipts API
- **Skip (Demo Mode)**: Continue without real data

### 4. Run First Reconciliation

Users execute their first reconciliation job via the playground. This completes the "First Success" path.

### 5. View Results Dashboard

Users land in the console dashboard with their results, completing activation.

## Onboarding Steps

The system tracks 5 steps:

1. **create_workspace** (required)
2. **add_teammates** (optional - can skip)
3. **connect_data_source** (required - can skip for demo)
4. **run_first_reconciliation** (required - can skip for demo)
5. **view_results** (required)

Progress is calculated as: `(completed_steps / 5) * 100`

## API Endpoints

### Workspaces

- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces` - List user's workspaces

### Invites

- `POST /api/workspaces/{workspaceId}/invites` - Create invite
- `GET /api/workspaces/{workspaceId}/invites` - List invites
- `GET /api/invite/{token}` - Get invite details
- `POST /api/invite/{token}` - Accept invite

### Onboarding Progress

- `GET /api/workspaces/{workspaceId}/onboarding` - Get progress
- `POST /api/workspaces/{workspaceId}/onboarding/complete` - Complete step

## Database Schema

### Tables

- `tenants` - Workspace/tenant records
- `tenant_users` - Membership with roles (owner, admin, member, viewer)
- `workspace_invites` - Invite tokens and status
- `tenant_onboarding_progress` - Per-user, per-tenant progress
- `onboarding_events` - Event tracking with trace_id

### Functions

- `create_workspace_with_owner()` - Creates workspace and adds creator as owner
- `complete_onboarding_step()` - Completes a step and updates progress
- `track_onboarding_event()` - Records onboarding events

## Event Tracking

All onboarding actions are tracked with:

- `tenant_id` - Workspace identifier
- `user_id` - User identifier
- `event_type` - Event name (onboarding_started, step_completed, activation_complete, etc.)
- `step_id` - Step identifier
- `trace_id` - Request correlation ID
- `properties` - Additional JSON metadata

### Event Types

- `onboarding_started` - User starts onboarding
- `step_completed` - User completes a step
- `invite_sent` - User sends an invite
- `invite_accepted` - User accepts an invite
- `activation_complete` - User completes all required steps

## Role-Based Access Control

### Roles

- **Owner** - Full access, can delete workspace
- **Admin** - Can manage members, invites, settings
- **Member** - Can create/edit resources
- **Viewer** - Read-only access

### Permissions

- Workspace creation: Any authenticated user
- Invite creation: Owner, Admin
- Invite acceptance: User with matching email or Admin/Owner
- Onboarding progress: User can view/update their own

## RLS Policies

Row Level Security policies ensure:
- Users can only view workspaces they're members of
- Users can only update their own onboarding progress
- Admins/Owners can manage invites
- Events are scoped to user's tenants

## Demo Mode

The system supports demo mode without requiring:
- Real API keys
- Data source connections
- Actual reconciliation runs

Users can skip optional steps and still complete onboarding.

## Error Handling

All errors include:
- Clear error messages
- `trace_id` for correlation
- Graceful fallbacks
- No dead ends

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only)
- `DATABASE_URL` - PostgreSQL connection string

Optional:
- `NEXT_PUBLIC_APP_URL` - App URL for invite links

## Troubleshooting

### Workspace Creation Fails

1. Check database connection
2. Verify slug is unique (check `tenants` table)
3. Check RLS policies allow insert
4. Review server logs with `trace_id`

### Invite Not Working

1. Verify invite token is valid and not expired
2. Check user email matches invite email
3. Verify RLS policies allow invite acceptance
4. Check `workspace_invites` table status

### Onboarding Progress Not Updating

1. Verify user is member of workspace
2. Check `tenant_onboarding_progress` table
3. Verify Supabase functions are deployed
4. Check event tracking in `onboarding_events`

### Events Not Tracking

1. Verify `onboarding_events` table exists
2. Check RLS policies allow insert
3. Verify `trace_id` is being passed
4. Review Supabase function logs

## Testing

Run Playwright tests:

```bash
npm run test:e2e -- tests/e2e/onboarding-flow.spec.ts
```

Tests cover:
- Complete onboarding flow
- Workspace creation
- Error handling
- Event tracking
- Invite flow

## Migration

Apply database migration:

```bash
supabase migration up
# or
npm run db:migrate:local
```

The migration creates:
- `workspace_invites` table
- `tenant_onboarding_progress` table
- `onboarding_events` table
- RLS policies
- Helper functions

## First Success Path

The "First Success" path (<3 minutes) requires:
1. Create workspace (~30s)
2. Skip teammates (~5s)
3. Connect data OR upload sample (~60s)
4. Run reconciliation (~60s)
5. View results (~5s)

Total: ~2.5 minutes

## Next Steps

After onboarding:
- Users land in console dashboard
- Activation checklist shows remaining steps
- Guided tour highlights key features
- Support widget available for help

## Related Documentation

- [Console Overview](/docs/CONSOLE.md)
- [Multi-Tenancy](/docs/MULTI_TENANCY.md)
- [Event Tracking](/docs/EVENT_TRACKING.md)
- [RBAC](/docs/RBAC.md)

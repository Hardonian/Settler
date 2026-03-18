# Governance Freeze Enforcement

## Overview

Settler implements scoped operational freeze capabilities to support pre-go-live hardening, compliance holds, and emergency operational pauses. This document describes the freeze enforcement architecture, covered mutation paths, and operator UX.

## Architecture

### Backend Enforcement

**Middleware:** `packages/api/src/middleware/governance.ts`

- `enforceFreezeState()` - Blocks mutations when tenant is frozen
- `checkTenantFrozen()` - Queries current freeze state
- `bypassFreeze` - Explicit carve-out for governance unfreeze itself

**Storage:** `tenant_governance` table

- `frozen` (boolean)
- `frozen_at` (timestamp)
- `frozen_by` (user_id)
- `freeze_reason` (text)

**Error Response:** HTTP 423 Locked

```json
{
  "error": "GOVERNANCE_FREEZE_ACTIVE",
  "message": "Operation blocked: Tenant is in read-only mode. Unfreeze the system to enable write operations.",
  "frozen": true,
  "frozen_at": "2026-03-17T20:00:00Z",
  "freeze_reason": "Pre-go-live operational freeze",
  "traceId": "req_abc123"
}
```

### Frontend Enforcement

**Shared Hook:** `packages/web/src/hooks/use-governance-state.ts`

- Fetches freeze state on mount
- Polls every 30 seconds for changes
- Defaults to unfrozen on error (fail-open)

**Shared Component:** `packages/web/src/components/shared/FreezeBlockedButton.tsx`

- Proactively disables buttons when frozen
- Shows lock icon and tooltip with freeze reason
- Accessible and keyboard-navigable

**Banner:** `packages/web/src/components/GovernanceBanner.tsx`

- Global freeze notification
- Shows freeze reason and timestamp
- Dismissible per session

## Protected Mutation Routes

### High-Risk Operations (Enforced)

**Ingestion:**

- `POST /api/v1/ingestion/sources` - Block new ingestion sources
- `POST /api/v1/ingestion/upload` - Block new data uploads
- `POST /api/v1/ingestion/:id/retry` - Block retry operations

**Reconciliation:**

- `POST /api/v1/reconciliation/run` - Block reconciliation execution
- `PATCH /api/v1/reconciliation/matches/:id` - Block match updates

**Bulk Operations:**

- `POST /api/v1/bulk-operations` - Block bulk mutation operations

**Approvals:**

- `POST /api/v1/approvals/requests/:id/approve` - Block approval decisions
- `POST /api/v1/approvals/requests/:id/reject` - Block rejection decisions

**Exception Resolution:**

- `POST /api/exceptions/:id/resolve` - Block exception resolution
- `POST /api/exceptions/bulk-resolve` - Block bulk exception resolution

**Multi-Source Reconciliation:**

- `POST /api/v1/multi-source-reconciliation/jobs/:id/run` - Block multi-source runs
- `POST /api/v1/multi-source-reconciliation/conflicts/:id/resolve` - Block conflict resolution

### Allowed Operations (Not Blocked)

**Reads:** All GET endpoints remain functional
**Governance:** Unfreeze operation itself (explicit bypass)
**Monitoring:** Observability and health check endpoints
**User Management:** Authentication and user operations

## Proactive UI Locking

### Protected Controls

**Reconciliation Queue:**

- "Start Run" button disabled when frozen
- Tooltip: "Reconciliation runs blocked by tenant freeze: {reason}"

**Bulk Triage:**

- "Apply {action}" button disabled when frozen
- Tooltip: "Bulk operations blocked by tenant freeze: {reason}"

**Additional Controls (Future):**

- Ingestion upload buttons
- Match review action buttons
- Settlement posting buttons

### UX Patterns

1. **Lock Icon**: Disabled buttons show lock icon prefix
2. **Tooltip**: Hover reveals freeze reason
3. **Consistent Messaging**: All blocked actions use consistent copy
4. **Accessible**: Proper ARIA labels and keyboard navigation
5. **Fail-Open**: Frontend failures default to allowing action (backend remains authoritative)

## Scope and Limitations

### Current Scope

This is a **scoped operational freeze**, not a complete write lockdown:

- Covers high-risk financial mutation paths
- Protects reconciliation, ingestion, approvals, exceptions
- Does NOT freeze user management, settings, or admin functions

### Known Gaps

**Not Yet Protected:**

- Some settlement/posting operations
- All transaction creation/edit flows
- Some delete/archive operations
- All connector-triggered writes
- Some override/reprocess actions

**No Caching:**

- Governance state is queried on every protected request
- No distributed cache or TTL optimization yet
- Performance acceptable for current scale

**Binary Model:**

- Single frozen/unfrozen state per tenant
- No granular freeze scopes (e.g., "freeze ingestion only")
- No time-based auto-unfreeze

### Future Enhancements

1. **Granular Freeze Scopes**: Freeze by subsystem (ingestion, reconciliation, etc.)
2. **Scheduled Freezes**: Time-window freeze automation
3. **Freeze Inheritance**: Organization-level freeze cascades to tenants
4. **Governance State Caching**: Short-lived cache for high-traffic tenants
5. **Audit Trail**: Detailed freeze/unfreeze history with reasons

## Testing

### Backend Tests

**Location:** `packages/api/src/__tests__/middleware/governance.test.ts`

Tests cover:

- Freeze enforcement on protected routes
- Bypass for governance operations
- Error response format
- Tenant isolation

### Frontend Tests

**TODO:** Add tests for:

- `useGovernanceState` hook behavior
- `FreezeBlockedButton` rendering when frozen
- Disabled state and tooltip display

### Manual Verification

1. **Enable Freeze:**

   ```sql
   UPDATE tenant_governance
   SET frozen = true,
       frozen_at = NOW(),
       frozen_by = 'your-user-id',
       freeze_reason = 'Test freeze'
   WHERE tenant_id = 'your-tenant-id';
   ```

2. **Verify UI:**
   - Check banner appears
   - Verify mutation buttons are disabled with lock icon
   - Hover to see tooltip with freeze reason

3. **Verify API:**

   ```bash
   curl -X POST http://localhost:3000/api/v1/reconciliation/run \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"config": {}}'
   # Should return 423 Locked
   ```

4. **Disable Freeze:**
   ```bash
   curl -X DELETE http://localhost:3000/api/v1/governance/freeze \
     -H "Authorization: Bearer $TOKEN"
   ```

## Deployment Considerations

### Pre-Go-Live

- Test freeze enforcement on staging with real operator workflows
- Verify all critical mutation paths are blocked
- Ensure reads continue to work normally
- Test unfreeze recovery

### Production Operations

- Use freeze for maintenance windows
- Communicate freeze state to operators via banner
- Monitor for 423 errors as signal of freeze effectiveness
- Plan unfreeze timing and verification

### Incident Response

- Freeze can be activated as emergency brake
- Preserves read-only system state during investigation
- Unfreeze requires explicit action (no auto-recovery)

## Security Considerations

**Tenant Isolation:** Freeze state is tenant-scoped - no cross-tenant risk

**Permission Model:** Freeze/unfreeze requires governance permissions

**Server Authority:** Backend enforcement is authoritative - UI locking is additive UX only

**Audit Trail:** All freeze/unfreeze operations are logged

**Fail-Safe:** Frontend errors default to unfrozen to avoid operational lockout

## Troubleshooting

### "Action blocked by freeze" but not frozen

1. Check tenant governance table for stale freeze state
2. Verify correct tenant context in request
3. Check for middleware ordering issues

### UI shows frozen but actions work

1. Frontend freeze state may be stale (30s poll)
2. Check backend freeze state in database
3. Verify server-side enforcement middleware is mounted

### Cannot unfreeze

1. Verify user has governance permissions
2. Check `/api/v1/governance/freeze` DELETE endpoint is accessible
3. Review server logs for unfreeze operation errors

## Related Documentation

- `docs/GOVERNANCE.md` - Overall governance model
- `packages/api/src/middleware/governance.ts` - Implementation
- `packages/web/src/hooks/use-governance-state.ts` - Frontend hook

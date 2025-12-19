# Console Subscription Access Control ✅

## Summary

The Developer Console now enforces prorated access based on subscription tier:
- ✅ **Unsubscribed**: Receipts viewing only
- ✅ **Subscribed (Unpaid)**: Read-only access to API service tables
- ✅ **Subscribed (Paid)**: Full CRUD access to API service tables
- ✅ **Enterprise**: Full access + higher limits

## Access Levels

### Unsubscribed
- ❌ Cannot view API service tables
- ✅ Can view receipts only (limited)
- ❌ Cannot test APIs
- ❌ Cannot edit/delete records
- **Limit**: 100 API requests/day

### Subscribed (Unpaid)
- ✅ Can view API service tables (read-only)
- ✅ Can test APIs
- ✅ Can view webhooks, feature flags, reconciliation
- ❌ Cannot edit/delete records
- ❌ Cannot create records
- **Limit**: 1,000 API requests/day

### Subscribed (Paid)
- ✅ Full CRUD access to API service tables
- ✅ Can create/edit/delete records
- ✅ Can test APIs
- ✅ Full access to all API services
- **Limit**: 10,000 API requests/day

### Enterprise
- ✅ Full CRUD access
- ✅ All API services
- ✅ Higher rate limits
- ✅ Priority support
- **Limit**: 100,000 API requests/day

## Implementation

### Frontend Components
- `SubscriptionGate` component wraps protected features
- Conditional UI based on subscription tier
- Upgrade prompts for restricted features

### API Routes
- All `/api/console/tables/*` routes check subscription status
- GET requests require `subscribed_unpaid` or higher
- POST/PATCH/DELETE require `subscribed_paid` or higher
- Returns 403 with clear error messages

### Database Functions
- `get_subscription_status()` - Determines tier from subscriptions/billing_accounts
- Checks subscription status, billing account status, and period end dates
- Handles enterprise plan detection

## Files Created/Modified

### New Files
- `packages/web/src/lib/subscription-access.ts` - Access level definitions
- `packages/web/src/lib/get-subscription-status.ts` - Subscription status resolver
- `packages/web/src/components/console/SubscriptionGate.tsx` - Access control component
- `packages/web/src/app/api/console/subscription-status/route.ts` - Status API endpoint

### Modified Files
- `packages/web/src/app/console/tables/page.tsx` - Added subscription gate
- `packages/web/src/app/console/tables/[table]/page.tsx` - Conditional edit/delete UI
- `packages/web/src/app/console/api-test/page.tsx` - Added subscription gate
- `packages/web/src/app/api/console/tables/[table]/route.ts` - Added subscription checks

## Access Control Flow

1. **User visits console page**
   - Frontend loads subscription status via `/api/console/subscription-status`
   - `SubscriptionGate` component checks tier
   - Shows upgrade prompt if insufficient tier

2. **User makes API request**
   - API route calls `getSubscriptionStatus()`
   - Checks tier against required level
   - Returns 403 if insufficient

3. **UI Updates**
   - Edit/Delete buttons disabled for unpaid subscriptions
   - Read-only banner shown
   - Upgrade prompts displayed

## Testing

To test different tiers:
1. **Unsubscribed**: No subscription record
2. **Subscribed Unpaid**: Subscription with `status='active'` but billing `status='past_due'`
3. **Subscribed Paid**: Subscription with `status='active'` and billing `status='active'`
4. **Enterprise**: Subscription with `plan_name` containing 'enterprise'

---

**Status**: ✅ **COMPLETE** - Console access control based on subscription tier implemented


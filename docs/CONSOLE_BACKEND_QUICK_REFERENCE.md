# Console Backend Quick Reference

## Quick Diagnostic Commands

```bash
# Run full diagnostic
npm run diagnose:console

# Check health endpoint
curl https://your-domain.com/api/health/console

# Test console page
curl -I https://your-domain.com/console

# Test API route (should return 401)
curl https://your-domain.com/api/console/api-keys

# Run smoke tests
npm run test:smoke:console
```

## Most Common 500 Error Causes

1. **Missing DATABASE_URL** → Set in Vercel environment variables
2. **Prisma client not generated** → Run `npm run prisma:generate`
3. **Missing database tables** → Run migrations: `npm run db:migrate:auto`
4. **RLS policies missing** → Check migration: `supabase/migrations/20260125000000_console_rls_fixes.sql`
5. **Supabase URL/key incorrect** → Verify in Vercel dashboard

## Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON-KEY]
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

## Key Files

- **Routes**: `packages/web/src/app/api/console/*/route.ts`
- **Domain Logic**: `packages/web/src/domain/console/*.ts`
- **Auth**: `packages/web/src/lib/api/unified-auth.ts`
- **Health Check**: `packages/web/src/app/api/health/console/route.ts`
- **Diagnostics**: `/console/setup-check` (UI) or `npm run diagnose:console` (CLI)

## Error Handling Pattern

**Domain functions NEVER throw** - they return empty arrays/null:

```typescript
export async function listApiKeys(): Promise<ApiKeyListItem[]> {
  try {
    // ... query
    return keys;
  } catch (error) {
    console.error("[listApiKeys] Error:", error);
    return []; // ✅ Never throw
  }
}
```

**Route handlers catch and return safe responses**:

```typescript
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const data = await listApiKeys();
    return NextResponse.json({ keys: data });
  } catch (error) {
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ keys: [] }, { status: 200 }); // ✅ Never 500
  }
}
```

## Verification Checklist

- [ ] Health check returns 200: `/api/health/console`
- [ ] Console page loads: `/console`
- [ ] API routes return 401 when unauthenticated (not 500)
- [ ] API routes return 200 when authenticated (not 500)
- [ ] Diagnostic script passes: `npm run diagnose:console`
- [ ] Smoke tests pass: `npm run test:smoke:console`

## Full Documentation

See `docs/BACKEND_CONSOLE_DIAGNOSTICS.md` for complete troubleshooting guide.

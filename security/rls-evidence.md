# RLS Evidence
- status: PASS_WITH_DEGRADED_EVIDENCE
- evidenceLevel: static-only
- mode: static-only
- runtimeExecuted: false
- reason: Runtime RLS verification not executed in this run; only static/policy boundary is available.

## Environment constraints
- Runtime RLS verification not executed; only static boundary/policy checks were captured.

## Next operator action
- Set DATABASE_URL (or DIRECT_URL/SUPABASE_DB_URL) and run `pnpm run verify:rls:live`.
# Supabase AI Full Reconcile Prompt

**Copy and paste this entire prompt into Supabase AI Chat**

---

I need you to reconcile the Settler database schema to match the expected backend contract. This is a comprehensive migration that ensures all tables, functions, RLS policies, and indexes exist and are correctly configured.

## REQUIREMENTS:

### 1. CREATE ALL MISSING TABLES (if not exists):

Ensure `tenant_users` table exists with columns:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `tenant_id` UUID REFERENCES tenants(id) ON DELETE CASCADE
- `user_id` UUID NOT NULL (references auth.users.id or public.users.id)
- `role` TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer'))
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(tenant_id, user_id)

Ensure `stripe_events` table exists (for webhook idempotency):
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `event_id` VARCHAR(255) UNIQUE NOT NULL (Stripe event.id)
- `type` VARCHAR(100) NOT NULL (event type)
- `status` VARCHAR(50) DEFAULT 'received' (received, processed, failed)
- `received_at` TIMESTAMPTZ DEFAULT NOW()
- `processed_at` TIMESTAMPTZ
- `error` TEXT
- `user_id` UUID
- `tenant_id` UUID
- `billing_account_id` UUID REFERENCES billing_accounts(id) ON DELETE SET NULL
- `raw_payload` JSONB (full event payload for debugging)
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

Verify all tables from Prisma schema exist in Supabase (check against `prisma/schema.prisma`).

### 2. CREATE/UPDATE HELPER FUNCTIONS:

**`current_user_id()`** - Returns UUID from JWT claims->>'sub'
```sql
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  BEGIN
    v_user_id := (current_setting('request.jwt.claims', true)::jsonb->>'sub')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**`current_tenant_id()`** - Returns UUID from app.current_tenant_id setting
```sql
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  BEGIN
    v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**`is_tenant_member(tenant_id UUID)`** - Returns BOOLEAN, checks tenant_users table
```sql
CREATE OR REPLACE FUNCTION is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_is_member BOOLEAN := false;
BEGIN
  v_user_id := current_user_id();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = p_tenant_id AND user_id = v_user_id
  ) INTO v_is_member;
  RETURN COALESCE(v_is_member, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**`log_console_activity(...)`** - Logs to console_activities table (verify exists in migration `20260125000001_console_activity_logging.sql`)

**`get_recent_console_activities(billing_account_id UUID, limit INTEGER)`** - Returns recent activities (verify exists in migration `20260125000001_console_activity_logging.sql`)

### 3. ENABLE RLS ON ALL TABLES:

- Enable RLS on `tenant_users` (currently missing policy)
- Enable RLS on `stripe_events` (if not already enabled)
- Verify RLS is enabled on all tables from Prisma schema

### 4. CREATE RLS POLICIES FOR TENANT ISOLATION:

**`tenant_users` policy:**
```sql
DROP POLICY IF EXISTS tenant_users_user_access ON tenant_users;
CREATE POLICY tenant_users_user_access ON tenant_users
  FOR SELECT USING (
    user_id = current_user_id()
    OR tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS tenant_users_user_insert ON tenant_users;
CREATE POLICY tenant_users_user_insert ON tenant_users
  FOR INSERT WITH CHECK (user_id = current_user_id());

DROP POLICY IF EXISTS tenant_users_user_update ON tenant_users;
CREATE POLICY tenant_users_user_update ON tenant_users
  FOR UPDATE USING (user_id = current_user_id());
```

**`stripe_events` policy:**
```sql
DROP POLICY IF EXISTS stripe_events_billing_account_access ON stripe_events;
CREATE POLICY stripe_events_billing_account_access ON stripe_events
  FOR SELECT USING (
    billing_account_id IS NULL
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = stripe_events.billing_account_id
        AND ba.user_id = current_user_id()
    )
  );

DROP POLICY IF EXISTS stripe_events_system_insert ON stripe_events;
CREATE POLICY stripe_events_system_insert ON stripe_events
  FOR INSERT WITH CHECK (true); -- System can insert (webhook handler)
```

**All policies should:**
- Use `current_user_id()` function (not `current_tenant_id()`)
- Support billing account-based access via `billing_accounts.user_id`
- Work with Supabase auth (JWT claims->>'sub')

### 5. CREATE MISSING INDEXES:

```sql
-- tenant_users indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_tenant ON tenant_users(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);

-- stripe_events indexes
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_billing_account_id ON stripe_events(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_status ON stripe_events(status);
CREATE INDEX IF NOT EXISTS idx_stripe_events_received_at ON stripe_events(received_at);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(type);
```

Verify all foreign keys have indexes.

### 6. FIX INCONSISTENT POLICIES:

- Replace `current_tenant_id()` usage with `current_user_id()` + `billing_accounts` join pattern
- Ensure all policies work with Supabase auth (JWT claims->>'sub')
- Update policies that reference `current_tenant_id()` to use `current_user_id()` instead

### 7. ADD CONSTRAINTS:

```sql
-- Ensure unique constraint exists
ALTER TABLE tenant_users ADD CONSTRAINT IF NOT EXISTS tenant_users_tenant_user_unique UNIQUE(tenant_id, user_id);
ALTER TABLE stripe_events ADD CONSTRAINT IF NOT EXISTS stripe_events_event_id_unique UNIQUE(event_id);
```

### 8. GRANT PERMISSIONS:

```sql
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO anon;
GRANT EXECUTE ON FUNCTION current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_tenant_id() TO anon;
GRANT EXECUTE ON FUNCTION is_tenant_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_tenant_member(UUID) TO anon;
```

### 9. VERIFY FOREIGN KEYS:

- Ensure all foreign keys have ON DELETE CASCADE/SET NULL as appropriate
- Ensure all foreign keys reference existing tables
- Fix any broken foreign key references

### 10. DOCUMENT ASSUMPTIONS:

- Document that `current_user_id()` reads from JWT claims->>'sub' (Supabase auth)
- Document that `current_tenant_id()` reads from app.current_tenant_id setting (set by application)
- Document that Prisma bypasses RLS (application must enforce tenant isolation)

## CRITICAL REQUIREMENTS:

1. **This migration must be idempotent** - Use `IF NOT EXISTS` for all CREATE statements
2. **Use `DROP POLICY IF EXISTS` before `CREATE POLICY`** - Prevents errors on re-run
3. **Verify existing migrations** - Don't duplicate work from existing migrations
4. **Test all functions** - Ensure they return correct values
5. **Verify all policies** - Ensure they enforce tenant isolation correctly

## VERIFICATION QUERIES:

After applying, run these to verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tenant_users', 'stripe_events')
ORDER BY table_name;

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('current_user_id', 'current_tenant_id', 'is_tenant_member')
ORDER BY routine_name;

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tenant_users', 'stripe_events')
ORDER BY tablename;

-- Check policies exist
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('tenant_users', 'stripe_events')
ORDER BY tablename, policyname;

-- Check indexes exist
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('tenant_users', 'stripe_events')
ORDER BY tablename, indexname;
```

---

**END OF PROMPT**

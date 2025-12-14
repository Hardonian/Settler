# Supabase AI Minimal Patch Prompt

**Copy and paste this entire prompt into Supabase AI Chat**

---

I need a minimal patch to fix critical RLS and schema gaps that are causing 500 errors and security issues.

## MINIMAL CHANGES REQUIRED:

### 1. CREATE RLS POLICY FOR `tenant_users`:

```sql
-- Enable RLS if not already enabled
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists (to avoid conflicts)
DROP POLICY IF EXISTS tenant_users_user_access ON tenant_users;
DROP POLICY IF EXISTS tenant_users_user_insert ON tenant_users;
DROP POLICY IF EXISTS tenant_users_user_update ON tenant_users;

-- Create SELECT policy
CREATE POLICY tenant_users_user_access ON tenant_users
  FOR SELECT USING (
    user_id = current_user_id()
    OR tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = current_user_id()
    )
  );

-- Create INSERT policy
CREATE POLICY tenant_users_user_insert ON tenant_users
  FOR INSERT WITH CHECK (user_id = current_user_id());

-- Create UPDATE policy
CREATE POLICY tenant_users_user_update ON tenant_users
  FOR UPDATE USING (user_id = current_user_id());
```

### 2. CREATE RLS POLICY FOR `stripe_events` (if missing):

```sql
-- Enable RLS if not already enabled
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS stripe_events_billing_account_access ON stripe_events;
DROP POLICY IF EXISTS stripe_events_system_insert ON stripe_events;

-- Create SELECT policy
CREATE POLICY stripe_events_billing_account_access ON stripe_events
  FOR SELECT USING (
    billing_account_id IS NULL
    OR EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = stripe_events.billing_account_id
        AND ba.user_id = current_user_id()
    )
  );

-- Create INSERT policy (system can insert for webhook handler)
CREATE POLICY stripe_events_system_insert ON stripe_events
  FOR INSERT WITH CHECK (true);
```

### 3. ENSURE `is_tenant_member()` FUNCTION EXISTS:

```sql
CREATE OR REPLACE FUNCTION is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := current_user_id();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = p_tenant_id AND user_id = v_user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_tenant_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_tenant_member(UUID) TO anon;
```

### 4. CREATE MISSING INDEXES:

```sql
-- tenant_users indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_tenant ON tenant_users(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);

-- stripe_events indexes (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stripe_events') THEN
    CREATE INDEX IF NOT EXISTS idx_stripe_events_billing_account_id ON stripe_events(billing_account_id);
    CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(event_id);
    CREATE INDEX IF NOT EXISTS idx_stripe_events_status ON stripe_events(status);
  END IF;
END $$;
```

### 5. VERIFY `current_user_id()` FUNCTION EXISTS:

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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO anon;
```

### 6. ENSURE `tenant_users` TABLE EXISTS (if missing):

```sql
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);
```

### 7. ENSURE `stripe_events` TABLE EXISTS (if missing):

```sql
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'received',
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error TEXT,
  user_id UUID,
  tenant_id UUID,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## CRITICAL NOTES:

1. **Apply in order** - Execute statements in the order listed above
2. **Use IF NOT EXISTS** - All CREATE statements use IF NOT EXISTS to be idempotent
3. **Drop policies first** - Always DROP POLICY IF EXISTS before CREATE POLICY
4. **Test after applying** - Verify policies work correctly with test queries

## VERIFICATION:

After applying, verify with:

```sql
-- Check tenant_users RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'tenant_users';

-- Check tenant_users policies exist
SELECT policyname FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'tenant_users';

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('current_user_id', 'is_tenant_member');

-- Check indexes exist
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'tenant_users';
```

---

**END OF PROMPT**

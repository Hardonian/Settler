-- Migration: workspace_onboarding_activation
-- Created: 2026-01-31
-- Description: Complete workspace onboarding and activation system with membership, invites, and event tracking

BEGIN;

-- ============================================================================
-- 1. UPDATE TENANT_USERS TABLE: Add Member role and ensure proper roles
-- ============================================================================

-- Update tenant_users to support Owner/Admin/Member/Viewer roles
ALTER TABLE tenant_users 
  DROP CONSTRAINT IF EXISTS tenant_users_role_check;

ALTER TABLE tenant_users
  ADD CONSTRAINT tenant_users_role_check 
  CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- Add metadata column for invite tracking
ALTER TABLE tenant_users
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- 2. WORKSPACE INVITES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_invites_tenant_id ON workspace_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON workspace_invites(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_status ON workspace_invites(status);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_expires_at ON workspace_invites(expires_at);

-- ============================================================================
-- 3. TENANT-SCOPED ONBOARDING PROGRESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step TEXT NOT NULL DEFAULT 'create_workspace',
  completed_steps TEXT[] DEFAULT '{}',
  skipped_steps TEXT[] DEFAULT '{}',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  metadata JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_tenant_id ON tenant_onboarding_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_user_id ON tenant_onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_progress ON tenant_onboarding_progress(progress);

-- ============================================================================
-- 4. ONBOARDING EVENTS TABLE (with trace_id and tenant_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- onboarding_started, step_completed, activation_complete, etc.
  step_id TEXT,
  trace_id TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_tenant_id ON onboarding_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id ON onboarding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_event_type ON onboarding_events(event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_trace_id ON onboarding_events(trace_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created_at ON onboarding_events(created_at DESC);

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

-- Workspace Invites: Users can view invites for their tenants
CREATE POLICY "Users can view invites for their tenants" ON workspace_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = workspace_invites.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

-- Workspace Invites: Admins/Owners can create invites
CREATE POLICY "Admins can create invites" ON workspace_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = workspace_invites.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
    AND invited_by = auth.uid()
  );

-- Workspace Invites: Users can accept invites with valid token
CREATE POLICY "Users can accept invites" ON workspace_invites
  FOR UPDATE USING (
    status = 'pending'
    AND expires_at > NOW()
    AND (
      -- User can accept if email matches their auth email
      email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR
      -- Or if they're already an admin/owner of the tenant
      EXISTS (
        SELECT 1 FROM tenant_users tu
        WHERE tu.tenant_id = workspace_invites.tenant_id
        AND tu.user_id = auth.uid()
        AND tu.role IN ('owner', 'admin')
      )
    )
  );

-- Tenant Onboarding Progress: Users can view their own progress
CREATE POLICY "Users can view their onboarding progress" ON tenant_onboarding_progress
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = tenant_onboarding_progress.tenant_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('owner', 'admin')
    )
  );

-- Tenant Onboarding Progress: Users can update their own progress
CREATE POLICY "Users can update their onboarding progress" ON tenant_onboarding_progress
  FOR UPDATE USING (user_id = auth.uid());

-- Tenant Onboarding Progress: Users can insert their own progress
CREATE POLICY "Users can create their onboarding progress" ON tenant_onboarding_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Onboarding Events: Users can insert their own events
CREATE POLICY "Users can insert onboarding events" ON onboarding_events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Onboarding Events: Users can view events for their tenants
CREATE POLICY "Users can view onboarding events for their tenants" ON onboarding_events
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = onboarding_events.tenant_id
      AND tu.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to create workspace and add creator as owner
CREATE OR REPLACE FUNCTION create_workspace_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Create tenant
  INSERT INTO tenants (name, slug, is_active)
  VALUES (p_name, p_slug, true)
  RETURNING id INTO v_tenant_id;

  -- Add creator as owner
  INSERT INTO tenant_users (tenant_id, user_id, role, joined_at)
  VALUES (v_tenant_id, p_user_id, 'owner', NOW())
  ON CONFLICT (tenant_id, user_id) DO UPDATE
  SET role = 'owner', joined_at = NOW();

  -- Initialize onboarding progress
  INSERT INTO tenant_onboarding_progress (tenant_id, user_id, current_step, completed_steps, skipped_steps, progress)
  VALUES (v_tenant_id, p_user_id, 'create_workspace', ARRAY[]::TEXT[], ARRAY[]::TEXT[], 0)
  ON CONFLICT (tenant_id, user_id) DO NOTHING;

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track onboarding event
CREATE OR REPLACE FUNCTION track_onboarding_event(
  p_tenant_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_step_id TEXT DEFAULT NULL,
  p_trace_id TEXT DEFAULT NULL,
  p_properties JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO onboarding_events (
    tenant_id,
    user_id,
    event_type,
    step_id,
    trace_id,
    properties
  )
  VALUES (
    p_tenant_id,
    p_user_id,
    p_event_type,
    p_step_id,
    p_trace_id,
    p_properties
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete onboarding step
CREATE OR REPLACE FUNCTION complete_onboarding_step(
  p_tenant_id UUID,
  p_user_id UUID,
  p_step_id TEXT,
  p_trace_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_progress RECORD;
  v_completed_steps TEXT[];
  v_new_progress INTEGER;
  v_current_step TEXT;
BEGIN
  -- Get current progress
  SELECT * INTO v_progress
  FROM tenant_onboarding_progress
  WHERE tenant_id = p_tenant_id AND user_id = p_user_id;

  -- If no progress exists, create it
  IF v_progress IS NULL THEN
    INSERT INTO tenant_onboarding_progress (tenant_id, user_id, current_step, completed_steps, progress)
    VALUES (p_tenant_id, p_user_id, p_step_id, ARRAY[p_step_id], 20)
    RETURNING * INTO v_progress;
  ELSE
    -- Add step to completed if not already there
    v_completed_steps := array_append(
      COALESCE(v_progress.completed_steps, ARRAY[]::TEXT[]),
      p_step_id
    );
    v_completed_steps := array(SELECT DISTINCT unnest(v_completed_steps));

    -- Calculate progress (5 steps = 20% each)
    v_new_progress := LEAST(100, array_length(v_completed_steps, 1) * 20);

    -- Determine next step
    IF v_new_progress >= 100 THEN
      v_current_step := 'complete';
    ELSIF 'add_teammates' = ANY(v_completed_steps) OR 'skip_teammates' = ANY(v_completed_steps) THEN
      v_current_step := 'connect_data_source';
    ELSIF 'connect_data_source' = ANY(v_completed_steps) OR 'upload_sample' = ANY(v_completed_steps) THEN
      v_current_step := 'run_first_reconciliation';
    ELSIF 'run_first_reconciliation' = ANY(v_completed_steps) THEN
      v_current_step := 'view_results';
    ELSE
      v_current_step := v_progress.current_step;
    END IF;

    -- Update progress
    UPDATE tenant_onboarding_progress
    SET
      completed_steps = v_completed_steps,
      current_step = v_current_step,
      progress = v_new_progress,
      completed_at = CASE WHEN v_new_progress >= 100 THEN NOW() ELSE NULL END,
      updated_at = NOW()
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id
    RETURNING * INTO v_progress;
  END IF;

  -- Track event
  PERFORM track_onboarding_event(
    p_tenant_id,
    p_user_id,
    'step_completed',
    p_step_id,
    p_trace_id,
    jsonb_build_object('progress', v_progress.progress)
  );

  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'user_id', p_user_id,
    'current_step', v_progress.current_step,
    'completed_steps', v_progress.completed_steps,
    'progress', v_progress.progress,
    'completed_at', v_progress.completed_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_workspace_with_owner(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_onboarding_event(UUID, UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding_step(UUID, UUID, TEXT, TEXT) TO authenticated;

COMMIT;

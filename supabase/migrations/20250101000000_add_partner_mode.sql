-- Partner/Agency Mode Migration
-- Adds support for partners managing multiple client tenants

-- Create PartnerTenantAccess table
CREATE TABLE IF NOT EXISTS partner_tenant_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'partner_admin',
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(partner_user_id, tenant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_tenant_access_partner_user_id ON partner_tenant_access(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_tenant_access_tenant_id ON partner_tenant_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_tenant_access_role ON partner_tenant_access(role);

-- RLS Policies
ALTER TABLE partner_tenant_access ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can view their own access records
CREATE POLICY "Partners can view their own access"
  ON partner_tenant_access
  FOR SELECT
  USING (auth.uid() = partner_user_id);

-- Policy: Super admins can manage all partner access
CREATE POLICY "Super admins can manage partner access"
  ON partner_tenant_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'is_super_admin' = 'true'
    )
  );

-- Policy: Tenant owners can view partner access to their tenant
CREATE POLICY "Tenant owners can view partner access"
  ON partner_tenant_access
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = partner_tenant_access.tenant_id
      AND tenants.billing_account_id IN (
        SELECT id FROM billing_accounts WHERE user_id = auth.uid()
      )
    )
  );

-- Add comment
COMMENT ON TABLE partner_tenant_access IS 'Maps partner users to client tenants they can manage';

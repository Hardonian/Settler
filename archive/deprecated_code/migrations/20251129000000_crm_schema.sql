-- Migration: crm_schema
-- Created: 2025-11-29
-- Description: CRM tables for leads, deals, contacts with RLS policies
-- CRO Mode: Data Integrity & Visibility

BEGIN;

-- ============================================================================
-- LEADS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  lifecycle_stage VARCHAR(50) NOT NULL DEFAULT 'lead',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source VARCHAR(100),
  score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_lifecycle_stage ON leads(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_assigned ON leads(tenant_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(tenant_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(tenant_id, created_at DESC);

-- ============================================================================
-- DEALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  stage VARCHAR(100) NOT NULL DEFAULT 'prospecting',
  value_cents BIGINT NOT NULL DEFAULT 0, -- Store in cents (CFO Mode: integer math)
  currency VARCHAR(10) DEFAULT 'USD',
  probability INTEGER DEFAULT 0, -- 0-100
  close_date DATE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deals_tenant_id ON deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_tenant_status ON deals(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_tenant_assigned ON deals(tenant_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(tenant_id, close_date);

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company VARCHAR(255),
  phone VARCHAR(50),
  title VARCHAR(255),
  lifecycle_stage VARCHAR(50) NOT NULL DEFAULT 'subscriber',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_lifecycle_stage ON contacts(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email ON contacts(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_lifecycle ON contacts(tenant_id, lifecycle_stage);

-- ============================================================================
-- ACTIVITY LOGS TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'lead', 'deal', 'contact'
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'status_changed', 'assigned'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_created ON activity_logs(entity_type, entity_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Leads: Users can only see leads assigned to them or their tenant's leads (if admin)
CREATE POLICY "Users can view their assigned leads"
  ON leads FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = leads.tenant_id
      AND users.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can insert leads in their tenant"
  ON leads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = leads.tenant_id
    )
  );

CREATE POLICY "Users can update their assigned leads"
  ON leads FOR UPDATE
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = leads.tenant_id
      AND users.role IN ('admin', 'owner')
    )
  );

-- Deals: Similar policies
CREATE POLICY "Users can view their assigned deals"
  ON deals FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = deals.tenant_id
      AND users.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can insert deals in their tenant"
  ON deals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = deals.tenant_id
    )
  );

CREATE POLICY "Users can update their assigned deals"
  ON deals FOR UPDATE
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = deals.tenant_id
      AND users.role IN ('admin', 'owner')
    )
  );

-- Contacts: Similar policies
CREATE POLICY "Users can view their assigned contacts"
  ON contacts FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = contacts.tenant_id
      AND users.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Users can insert contacts in their tenant"
  ON contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = contacts.tenant_id
    )
  );

CREATE POLICY "Users can update their assigned contacts"
  ON contacts FOR UPDATE
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = contacts.tenant_id
      AND users.role IN ('admin', 'owner')
    )
  );

-- Activity logs: Users can view logs for entities they have access to
CREATE POLICY "Users can view activity logs for accessible entities"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = activity_logs.tenant_id
    )
  );

COMMIT;

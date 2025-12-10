-- Migration: webhook_models_update
-- Created: 2025-12-10
-- Description: Update webhook tables to match Prisma schema (webhooks and webhook_deliveries)
-- Part of: Pre-deployment readiness - webhook service implementation

BEGIN;

-- ============================================================================
-- UPDATE WEBHOOKS TABLE
-- Ensure webhooks table matches Prisma schema requirements
-- ============================================================================

-- Check if webhooks table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') THEN
    CREATE TABLE webhooks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      tenant_id UUID NOT NULL,
      url TEXT NOT NULL,
      events JSONB DEFAULT '[]'::jsonb,
      secret TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON webhooks(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
    CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
    CREATE INDEX IF NOT EXISTS idx_webhooks_deleted_at ON webhooks(deleted_at);
  ELSE
    -- Table exists, add missing columns if needed
    ALTER TABLE webhooks
      ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

    -- Update existing rows to have default events array if null
    UPDATE webhooks SET events = '[]'::jsonb WHERE events IS NULL;
  END IF;
END $$;

-- ============================================================================
-- UPDATE WEBHOOK_DELIVERIES TABLE
-- Ensure webhook_deliveries table matches Prisma schema requirements
-- ============================================================================

-- Check if webhook_deliveries table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_deliveries') THEN
    CREATE TABLE webhook_deliveries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      payload JSONB NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      status_code INTEGER,
      response_body TEXT,
      attempts INTEGER DEFAULT 1,
      next_retry_at TIMESTAMPTZ,
      error_message TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry_at ON webhook_deliveries(next_retry_at);
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);
  ELSE
    -- Table exists, add missing columns if needed
    ALTER TABLE webhook_deliveries
      ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS error_message TEXT,
      ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

    -- Update existing rows to have default attempts if null
    UPDATE webhook_deliveries SET attempts = 1 WHERE attempts IS NULL;
  END IF;
END $$;

-- ============================================================================
-- RLS POLICIES FOR WEBHOOKS
-- ============================================================================

-- Enable RLS on webhooks table
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can create their own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can update their own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can delete their own webhooks" ON webhooks;

-- Create RLS policies
CREATE POLICY "Users can view their own webhooks" ON webhooks
  FOR SELECT
  USING (auth.uid() = user_id::text OR auth.uid() IN (SELECT id::text FROM users WHERE tenant_id = webhooks.tenant_id));

CREATE POLICY "Users can create their own webhooks" ON webhooks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id::text);

CREATE POLICY "Users can update their own webhooks" ON webhooks
  FOR UPDATE
  USING (auth.uid() = user_id::text);

CREATE POLICY "Users can delete their own webhooks" ON webhooks
  FOR DELETE
  USING (auth.uid() = user_id::text);

-- ============================================================================
-- RLS POLICIES FOR WEBHOOK_DELIVERIES
-- ============================================================================

-- Enable RLS on webhook_deliveries table
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view webhook deliveries for their webhooks" ON webhook_deliveries;
DROP POLICY IF EXISTS "Service role can manage webhook deliveries" ON webhook_deliveries;

-- Create RLS policies
CREATE POLICY "Users can view webhook deliveries for their webhooks" ON webhook_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks 
      WHERE webhooks.id = webhook_deliveries.webhook_id 
      AND (auth.uid() = webhooks.user_id::text OR auth.uid() IN (SELECT id::text FROM users WHERE tenant_id = webhooks.tenant_id))
    )
  );

-- Service role can manage all webhook deliveries (for background jobs)
CREATE POLICY "Service role can manage webhook deliveries" ON webhook_deliveries
  FOR ALL
  USING (auth.role() = 'service_role');

COMMIT;

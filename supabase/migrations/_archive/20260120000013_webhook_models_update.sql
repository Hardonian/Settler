-- Migration: webhook_models_update
-- Created: 2025-01-20 00:00:09 UTC (updated 2025-12-10)
-- Description: Update webhook tables to match Prisma schema (webhooks and webhook_deliveries)
-- Part of: Pre-deployment readiness - Webhook service implementation
-- Note: Webhook tables already exist in initial_schema.sql, this migration adds missing columns and RLS policies

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
    -- Check if events column exists and its type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'events') THEN
      ALTER TABLE webhooks ADD COLUMN events JSONB DEFAULT '[]'::jsonb;
    ELSE
      -- Column exists, check if it's text[] and needs conversion
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhooks' 
        AND column_name = 'events' 
        AND data_type = 'ARRAY'
      ) THEN
        -- Convert text[] to JSONB by creating a new column, migrating data, dropping old, renaming
        ALTER TABLE webhooks ADD COLUMN events_jsonb JSONB DEFAULT '[]'::jsonb;
        UPDATE webhooks SET events_jsonb = to_jsonb(events) WHERE events IS NOT NULL;
        ALTER TABLE webhooks DROP COLUMN events;
        ALTER TABLE webhooks RENAME COLUMN events_jsonb TO events;
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'webhooks' 
        AND column_name = 'events' 
        AND udt_name = 'jsonb'
      ) THEN
        -- Already JSONB, just update defaults
        ALTER TABLE webhooks ALTER COLUMN events SET DEFAULT '[]'::jsonb;
        UPDATE webhooks SET events = '[]'::jsonb WHERE events IS NULL;
      END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'webhooks' AND column_name = 'deleted_at') THEN
      ALTER TABLE webhooks ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
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
  USING (
    auth.uid()::uuid = user_id 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::uuid
      AND users.tenant_id = webhooks.tenant_id
    )
  );

CREATE POLICY "Users can create their own webhooks" ON webhooks
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own webhooks" ON webhooks
  FOR UPDATE
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own webhooks" ON webhooks
  FOR DELETE
  USING (auth.uid()::uuid = user_id);

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
      AND (
        auth.uid()::uuid = webhooks.user_id 
        OR EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid()::uuid
          AND users.tenant_id = webhooks.tenant_id
        )
      )
    )
  );

-- Service role can manage all webhook deliveries (for background jobs)
CREATE POLICY "Service role can manage webhook deliveries" ON webhook_deliveries
  FOR ALL
  USING (auth.role() = 'service_role');

COMMIT;

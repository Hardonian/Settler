-- Migration: Add stripe_events table for webhook idempotency
-- Created: 2025-01-21
-- Purpose: Track Stripe webhook events to prevent duplicate processing

-- CreateTable
CREATE TABLE IF NOT EXISTS "stripe_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "processed_at" TIMESTAMPTZ,
    "error" TEXT,
    "user_id" UUID,
    "tenant_id" UUID,
    "billing_account_id" UUID,
    "raw_payload" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- Add missing columns if table exists with partial schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_events') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'event_id') THEN
      ALTER TABLE stripe_events ADD COLUMN event_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'type') THEN
      ALTER TABLE stripe_events ADD COLUMN type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'status') THEN
      ALTER TABLE stripe_events ADD COLUMN status TEXT DEFAULT 'received';
    END IF;
  END IF;
END $$;

-- CreateIndex conditionally
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_events') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'event_id') THEN
      EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS stripe_events_event_id_key ON stripe_events(event_id)';
      EXECUTE 'CREATE INDEX IF NOT EXISTS stripe_events_event_id_idx ON stripe_events(event_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'type') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS stripe_events_type_idx ON stripe_events(type)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'status') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS stripe_events_status_idx ON stripe_events(status)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'received_at') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS stripe_events_received_at_idx ON stripe_events(received_at)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'user_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS stripe_events_user_id_idx ON stripe_events(user_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'tenant_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS stripe_events_tenant_id_idx ON stripe_events(tenant_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_events' AND column_name = 'billing_account_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS stripe_events_billing_account_id_idx ON stripe_events(billing_account_id)';
    END IF;
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE "stripe_events" IS 'Tracks Stripe webhook events for idempotency and audit trail';

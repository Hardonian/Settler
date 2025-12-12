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

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "stripe_events_event_id_key" ON "stripe_events"("event_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stripe_events_event_id_idx" ON "stripe_events"("event_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stripe_events_type_idx" ON "stripe_events"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stripe_events_status_idx" ON "stripe_events"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stripe_events_received_at_idx" ON "stripe_events"("received_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stripe_events_user_id_idx" ON "stripe_events"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stripe_events_tenant_id_idx" ON "stripe_events"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stripe_events_billing_account_id_idx" ON "stripe_events"("billing_account_id");

-- Add comment
COMMENT ON TABLE "stripe_events" IS 'Tracks Stripe webhook events for idempotency and audit trail';

-- Supabase AI Chat Prompt: Receipt Console RLS & Schema Fixes
-- Execute this SQL to ensure receipt tables, RLS policies, and helper functions are correct

-- Ensure helper function exists for extracting user_id from JWT
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

-- Ensure receipt_uploads table exists with correct schema
CREATE TABLE IF NOT EXISTS receipt_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  billing_account_id UUID REFERENCES billing_accounts(id) ON DELETE SET NULL,
  storage_location TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipt_uploads_api_key_id ON receipt_uploads(api_key_id);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_billing_account_id ON receipt_uploads(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_status ON receipt_uploads(status);
CREATE INDEX IF NOT EXISTS idx_receipt_uploads_created_at ON receipt_uploads(created_at);

-- Ensure receipts table exists with correct schema
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID UNIQUE NOT NULL REFERENCES receipt_uploads(id) ON DELETE CASCADE,
  vendor VARCHAR(255),
  date TIMESTAMPTZ,
  currency VARCHAR(10),
  subtotal DECIMAL(15, 2),
  tax DECIMAL(15, 2),
  total DECIMAL(15, 2),
  payment_method VARCHAR(100),
  confidence_score DECIMAL(5, 4),
  raw_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_upload_id ON receipts(upload_id);
CREATE INDEX IF NOT EXISTS idx_receipts_vendor ON receipts(vendor);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);

-- Ensure receipt_items table exists with correct schema
CREATE TABLE IF NOT EXISTS receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 3),
  unit_price DECIMAL(15, 2),
  line_total DECIMAL(15, 2),
  category VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_category ON receipt_items(category);

-- Enable RLS on all receipt tables
ALTER TABLE receipt_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS receipt_uploads_user_access ON receipt_uploads;
DROP POLICY IF EXISTS receipts_user_access ON receipts;
DROP POLICY IF EXISTS receipt_items_user_access ON receipt_items;

-- Create RLS policy for receipt_uploads: users can only access their own billing account's uploads
CREATE POLICY receipt_uploads_user_access ON receipt_uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM billing_accounts ba
      WHERE ba.id = receipt_uploads.billing_account_id
        AND ba.user_id = current_user_id()
    )
  );

-- Create RLS policy for receipts: users can only access receipts from their own billing account's uploads
CREATE POLICY receipts_user_access ON receipts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM receipt_uploads ru
      JOIN billing_accounts ba ON ba.id = ru.billing_account_id
      WHERE ru.id = receipts.upload_id
        AND ba.user_id = current_user_id()
    )
  );

-- Create RLS policy for receipt_items: users can only access items from receipts they own
CREATE POLICY receipt_items_user_access ON receipt_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM receipts r
      JOIN receipt_uploads ru ON ru.id = r.upload_id
      JOIN billing_accounts ba ON ba.id = ru.billing_account_id
      WHERE r.id = receipt_items.receipt_id
        AND ba.user_id = current_user_id()
    )
  );

-- Grant necessary permissions (if using service role, these may already exist)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_uploads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipt_items TO authenticated;

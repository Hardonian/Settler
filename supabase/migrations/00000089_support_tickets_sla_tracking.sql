-- Support Tickets SLA Tracking
-- Creates table for tracking support tickets and SLA compliance

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_account_id UUID NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'responded', 'resolved', 'closed')),
  
  -- SLA tracking
  sla_response_hours INTEGER,
  sla_resolution_hours INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  response_time_hours NUMERIC,
  resolution_time_hours NUMERIC,
  sla_met BOOLEAN,
  sla_violated BOOLEAN DEFAULT FALSE,
  sla_violated_at TIMESTAMPTZ,
  
  -- Ticket details
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_response_time CHECK (
    (responded_at IS NULL AND response_time_hours IS NULL) OR
    (responded_at IS NOT NULL AND response_time_hours IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_billing_account ON support_tickets(billing_account_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sla_violated ON support_tickets(sla_violated) WHERE sla_violated = TRUE;
CREATE INDEX IF NOT EXISTS idx_support_tickets_tier ON support_tickets(tier_id);

-- RLS policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view their own support tickets"
  ON support_tickets
  FOR SELECT
  USING (
    billing_account_id IN (
      SELECT id FROM billing_accounts WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can manage all tickets
CREATE POLICY "Service role can manage all support tickets"
  ON support_tickets
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to check SLA violations (for scheduled job)
CREATE OR REPLACE FUNCTION check_sla_violations()
RETURNS TABLE (
  ticket_id UUID,
  billing_account_id UUID,
  tier_id TEXT,
  elapsed_hours NUMERIC,
  sla_hours INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id,
    st.billing_account_id,
    st.tier_id,
    EXTRACT(EPOCH FROM (NOW() - st.created_at)) / 3600 AS elapsed_hours,
    st.sla_response_hours
  FROM support_tickets st
  WHERE
    st.status = 'open'
    AND st.sla_response_hours IS NOT NULL
    AND st.sla_response_hours > 0
    AND st.responded_at IS NULL
    AND EXTRACT(EPOCH FROM (NOW() - st.created_at)) / 3600 > st.sla_response_hours
    AND (st.sla_violated IS NULL OR st.sla_violated = FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON support_tickets TO authenticated;
GRANT ALL ON support_tickets TO service_role;

COMMENT ON TABLE support_tickets IS 'Support tickets with SLA tracking';
COMMENT ON COLUMN support_tickets.sla_response_hours IS 'SLA response time in hours (based on tier)';
COMMENT ON COLUMN support_tickets.sla_met IS 'Whether SLA was met (true/false)';
COMMENT ON COLUMN support_tickets.sla_violated IS 'Whether SLA was violated';

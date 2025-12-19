-- Migration: lead_scoring
-- Created: 2025-11-29
-- Description: Lead scoring database function
-- CRO Mode: Lead Scoring logic in database, not client-side

BEGIN;

-- ============================================================================
-- FUNCTION: Calculate lead score
-- ============================================================================
-- CRO Principle: Lead scoring in database, not client-side

CREATE OR REPLACE FUNCTION calculate_lead_score(
  p_lead_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_lead RECORD;
  v_activity_count INTEGER;
  v_days_since_created INTEGER;
BEGIN
  -- Get lead data
  SELECT * INTO v_lead
  FROM leads
  WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Base score from lifecycle stage
  CASE v_lead.lifecycle_stage
    WHEN 'customer' THEN v_score := v_score + 100;
    WHEN 'sql' THEN v_score := v_score + 75;
    WHEN 'mql' THEN v_score := v_score + 50;
    WHEN 'lead' THEN v_score := v_score + 25;
    WHEN 'subscriber' THEN v_score := v_score + 10;
    ELSE v_score := v_score + 5;
  END CASE;
  
  -- Score from status
  CASE v_lead.status
    WHEN 'qualified' THEN v_score := v_score + 30;
    WHEN 'contacted' THEN v_score := v_score + 20;
    WHEN 'engaged' THEN v_score := v_score + 15;
    WHEN 'new' THEN v_score := v_score + 5;
    ELSE v_score := v_score + 0;
  END CASE;
  
  -- Score from activity (number of activities)
  SELECT COUNT(*) INTO v_activity_count
  FROM activity_logs
  WHERE entity_type = 'lead'
    AND entity_id = p_lead_id;
  
  v_score := v_score + LEAST(v_activity_count * 5, 25); -- Max 25 points for activity
  
  -- Score from recency (newer leads get bonus)
  v_days_since_created := EXTRACT(DAY FROM NOW() - v_lead.created_at);
  IF v_days_since_created <= 7 THEN
    v_score := v_score + 15;
  ELSIF v_days_since_created <= 30 THEN
    v_score := v_score + 10;
  ELSIF v_days_since_created <= 90 THEN
    v_score := v_score + 5;
  END IF;
  
  -- Score from metadata (custom fields)
  IF v_lead.metadata ? 'company_size' THEN
    CASE v_lead.metadata->>'company_size'
      WHEN 'enterprise' THEN v_score := v_score + 20;
      WHEN 'large' THEN v_score := v_score + 15;
      WHEN 'medium' THEN v_score := v_score + 10;
      WHEN 'small' THEN v_score := v_score + 5;
    END CASE;
  END IF;
  
  -- Cap score at 200
  v_score := LEAST(v_score, 200);
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: Update lead score (trigger function)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.score := calculate_lead_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-update lead score on changes
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_lead_score ON leads;
CREATE TRIGGER trigger_update_lead_score
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_score();

COMMIT;

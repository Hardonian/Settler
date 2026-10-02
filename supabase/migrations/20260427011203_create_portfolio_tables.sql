-- Recovered from the live database's supabase_migrations.schema_migrations
-- (version 20260427011203, name "create_portfolio_tables") on 2026-10-02. This migration was applied
-- via the Supabase migrations UI and existed only in database bookkeeping;
-- recorded here so the repository holds the full schema history.

-- =============================================================================
-- MULTI-PORTFOLIO AI BUSINESS SYSTEM — Data Model
-- =============================================================================

-- 1. Portfolios: top-level capital containers
CREATE TABLE IF NOT EXISTS public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  name text NOT NULL,
  total_capital numeric(14,2) NOT NULL DEFAULT 0 CHECK (total_capital >= 0),
  allocated_capital numeric(14,2) NOT NULL DEFAULT 0 CHECK (allocated_capital >= 0),
  reserve_capital numeric(14,2) NOT NULL DEFAULT 0 CHECK (reserve_capital >= 0),
  risk_profile text NOT NULL DEFAULT 'balanced' CHECK (risk_profile IN ('conservative', 'balanced', 'aggressive')),
  max_drawdown_pct numeric(5,2) NOT NULL DEFAULT 20.00 CHECK (max_drawdown_pct > 0 AND max_drawdown_pct <= 100),
  reserve_pct numeric(5,2) NOT NULL DEFAULT 15.00 CHECK (reserve_pct >= 0 AND reserve_pct <= 100),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT allocated_lte_total CHECK (allocated_capital <= total_capital)
);

-- 2. Portfolio Entities: individual businesses within a portfolio
CREATE TABLE IF NOT EXISTS public.portfolio_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  org_id text NOT NULL,
  niche text NOT NULL,
  angle text,
  status text NOT NULL DEFAULT 'testing' CHECK (status IN ('testing', 'active', 'scaled', 'retired', 'killed')),
  capital_allocated numeric(14,2) NOT NULL DEFAULT 0 CHECK (capital_allocated >= 0),
  capital_spent numeric(14,2) NOT NULL DEFAULT 0 CHECK (capital_spent >= 0),
  expected_value numeric(14,2) NOT NULL DEFAULT 0,
  actual_return numeric(14,2) NOT NULL DEFAULT 0,
  risk_score numeric(5,4) NOT NULL DEFAULT 0.5 CHECK (risk_score >= 0 AND risk_score <= 1),
  confidence numeric(5,4) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  spend_cap numeric(14,2) NOT NULL DEFAULT 500 CHECK (spend_cap >= 0),
  funnel_config jsonb NOT NULL DEFAULT '{}',
  creative_config jsonb NOT NULL DEFAULT '{}',
  campaign_config jsonb NOT NULL DEFAULT '{}',
  offer_config jsonb NOT NULL DEFAULT '{}',
  learning_data jsonb NOT NULL DEFAULT '{}',
  last_evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_spent_lte_allocated CHECK (capital_spent <= capital_allocated)
);

-- 3. Entity Performance: time-series performance records
CREATE TABLE IF NOT EXISTS public.entity_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.portfolio_entities(id) ON DELETE CASCADE,
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  org_id text NOT NULL,
  revenue numeric(14,2) NOT NULL DEFAULT 0,
  cost numeric(14,2) NOT NULL DEFAULT 0,
  profit numeric(14,2) GENERATED ALWAYS AS (revenue - cost) STORED,
  roi numeric(8,4) GENERATED ALWAYS AS (CASE WHEN cost > 0 THEN (revenue - cost) / cost ELSE 0 END) STORED,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  conversion_rate numeric(8,6) GENERATED ALWAYS AS (CASE WHEN clicks > 0 THEN conversions::numeric / clicks ELSE 0 END) STORED,
  cac numeric(14,2) GENERATED ALWAYS AS (CASE WHEN conversions > 0 THEN cost / conversions ELSE 0 END) STORED,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  granularity text NOT NULL DEFAULT 'daily' CHECK (granularity IN ('hourly', 'daily', 'weekly')),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end > period_start)
);

-- 4. Portfolio rebalance history
CREATE TABLE IF NOT EXISTS public.portfolio_rebalance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  org_id text NOT NULL,
  trigger text NOT NULL DEFAULT 'scheduled' CHECK (trigger IN ('scheduled', 'manual', 'risk_event', 'performance_threshold')),
  pre_allocation jsonb NOT NULL DEFAULT '{}',
  post_allocation jsonb NOT NULL DEFAULT '{}',
  capital_shifts jsonb NOT NULL DEFAULT '[]',
  entities_killed text[] NOT NULL DEFAULT '{}',
  entities_scaled text[] NOT NULL DEFAULT '{}',
  total_portfolio_value numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Cross-entity intelligence sharing log
CREATE TABLE IF NOT EXISTS public.portfolio_intelligence_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  source_entity_id uuid REFERENCES public.portfolio_entities(id) ON DELETE SET NULL,
  target_entity_id uuid REFERENCES public.portfolio_entities(id) ON DELETE SET NULL,
  pattern_type text NOT NULL CHECK (pattern_type IN ('winning', 'failing', 'neutral')),
  pattern_data jsonb NOT NULL DEFAULT '{}',
  applied boolean NOT NULL DEFAULT false,
  impact_score numeric(8,4) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Portfolio risk events
CREATE TABLE IF NOT EXISTS public.portfolio_risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  entity_id uuid REFERENCES public.portfolio_entities(id) ON DELETE SET NULL,
  org_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('drawdown_breach', 'spend_cap_hit', 'anomaly_detected', 'loss_spike', 'traffic_anomaly', 'entity_paused', 'entity_killed')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details jsonb NOT NULL DEFAULT '{}',
  action_taken text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_org_id ON public.portfolios(org_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_entities_portfolio_id ON public.portfolio_entities(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_entities_org_id ON public.portfolio_entities(org_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_entities_status ON public.portfolio_entities(status);
CREATE INDEX IF NOT EXISTS idx_entity_performance_entity_id ON public.entity_performance(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_performance_period ON public.entity_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_entity_performance_org_id ON public.entity_performance(org_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_rebalance_portfolio_id ON public.portfolio_rebalance_log(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_intelligence_org_id ON public.portfolio_intelligence_log(org_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_risk_events_portfolio_id ON public.portfolio_risk_events(portfolio_id);

-- Enable RLS on all new tables
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_rebalance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_intelligence_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_risk_events ENABLE ROW LEVEL SECURITY;

-- RLS policies: service role access
CREATE POLICY "service_role_portfolios" ON public.portfolios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_portfolio_entities" ON public.portfolio_entities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_entity_performance" ON public.entity_performance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_portfolio_rebalance_log" ON public.portfolio_rebalance_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_portfolio_intelligence_log" ON public.portfolio_intelligence_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_portfolio_risk_events" ON public.portfolio_risk_events FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_portfolio_entities_updated_at
  BEFORE UPDATE ON public.portfolio_entities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add table comments
COMMENT ON TABLE public.portfolios IS 'Top-level capital containers for multi-business portfolio management';
COMMENT ON TABLE public.portfolio_entities IS 'Individual business entities within a portfolio, each targeting a niche';
COMMENT ON TABLE public.entity_performance IS 'Time-series performance tracking for portfolio entities';
COMMENT ON TABLE public.portfolio_rebalance_log IS 'Audit trail for portfolio rebalancing operations';
COMMENT ON TABLE public.portfolio_intelligence_log IS 'Cross-entity intelligence sharing and pattern propagation';
COMMENT ON TABLE public.portfolio_risk_events IS 'Risk events and anomaly detection for portfolio protection';

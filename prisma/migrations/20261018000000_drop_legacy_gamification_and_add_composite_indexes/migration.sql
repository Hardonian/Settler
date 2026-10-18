-- Migration: 20261018000000_drop_legacy_gamification_and_add_composite_indexes
-- Description: Reversibly drop unused legacy gamification tables if empty and add hot-path composite indexes.

DO $$
DECLARE
  tbl text;
  legacy_tables text[] := ARRAY[
    'Kudos', 'UserFollow', 'StreakHistory', 'UserStreak', 
    'LeaderboardRanking', 'Leaderboard', 'UserAchievement', 
    'Achievement', 'UserBadge', 'Badge',
    'kudos', 'user_follow', 'streak_history', 'user_streak',
    'leaderboard_ranking', 'leaderboard', 'user_achievement',
    'achievement', 'user_badge', 'badge'
  ];
  row_cnt bigint;
BEGIN
  FOREACH tbl IN ARRAY legacy_tables LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('SELECT count(*) FROM public.%I', tbl) INTO row_cnt;
      IF row_cnt = 0 THEN
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;

-- Composite indexes on (tenant_id, created_at) and (tenant_id, status)
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_tenant_created 
  ON reconciliation_matches(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_tenant_status 
  ON reconciliation_matches(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_tenant_created 
  ON reconciliation_runs(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_tenant_status 
  ON reconciliation_runs(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_exception_adjudication_memory_tenant_created 
  ON exception_adjudication_memory(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exception_adjudication_memory_tenant_status 
  ON exception_adjudication_memory(tenant_id, outcome);

CREATE INDEX IF NOT EXISTS idx_proof_packages_tenant_created 
  ON proof_packages(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proof_packages_tenant_status 
  ON proof_packages(tenant_id, status);

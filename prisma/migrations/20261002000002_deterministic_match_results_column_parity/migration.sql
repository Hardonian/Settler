-- Column parity for deterministic_match_results with the table definition in
-- 20260224000000_deterministic_core. That migration created the table with
-- CREATE TABLE IF NOT EXISTS, which silently skipped on databases where an
-- older shape already existed — leaving four declared columns absent from the
-- live table (verified 2026-10-02). This closes the gap additively and lets
-- 20260329230000_add_matched_at_index_to_deterministic_match_results apply.

ALTER TABLE deterministic_match_results ADD COLUMN IF NOT EXISTS match_rationale JSONB DEFAULT '{}'::jsonb;
ALTER TABLE deterministic_match_results ADD COLUMN IF NOT EXISTS evidence_pointers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE deterministic_match_results ADD COLUMN IF NOT EXISTS actor VARCHAR(32) NOT NULL DEFAULT 'system';
ALTER TABLE deterministic_match_results ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

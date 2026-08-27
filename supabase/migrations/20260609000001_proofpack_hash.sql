-- P2-C Evidence Immutability
-- Adds a cryptographic hash to proof_packages to ensure evidence is tamper-proof

ALTER TABLE public.proof_packages ADD COLUMN IF NOT EXISTS sha256_hash text;
-- We cannot enforce NOT NULL yet because existing rows won't have it,
-- but we can add an index.
CREATE INDEX IF NOT EXISTS idx_proof_packages_hash ON public.proof_packages USING btree (sha256_hash);

-- P1-D: Add index for run reaper to quickly find stuck jobs
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_status_updated ON public.reconciliation_runs USING btree (status, updated_at);

-- Align recon_results with Prisma ReconResult field mappings (snapshot_id, proof_capsule).
-- Safe on databases that already have these columns (IF NOT EXISTS).

ALTER TABLE recon_results ADD COLUMN IF NOT EXISTS snapshot_id uuid;
ALTER TABLE recon_results ADD COLUMN IF NOT EXISTS proof_capsule jsonb;

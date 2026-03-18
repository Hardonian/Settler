-- Add explicit tolerance fields to recon_templates for easier configuration
-- This allows operators to configure tolerances without editing JSON directly

ALTER TABLE recon_templates 
ADD COLUMN IF NOT EXISTS amount_tolerance DECIMAL(20, 4) DEFAULT 0.01,
ADD COLUMN IF NOT EXISTS date_tolerance_days INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS config_version VARCHAR(64);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recon_templates_tolerance 
ON recon_templates(amount_tolerance, date_tolerance_days);

-- Backfill existing templates with default values if they don't have tolerances in metadata
UPDATE recon_templates 
SET amount_tolerance = COALESCE(
  (metadata->>'tolerances')::jsonb->>'amount',
  '0.01'
)::decimal,
date_tolerance_days = COALESCE(
  (metadata->>'tolerances')::jsonb->>'days',
  '3'
)::integer,
config_version = 'v1'
WHERE amount_tolerance IS NULL OR date_tolerance_days IS NULL;

-- Add tolerance fields to recon_jobs for job-level overrides
ALTER TABLE recon_jobs 
ADD COLUMN IF NOT EXISTS amount_tolerance DECIMAL(20, 4),
ADD COLUMN IF NOT EXISTS date_tolerance_days INTEGER,
ADD COLUMN IF NOT EXISTS matching_config_version VARCHAR(64);

-- Create index
CREATE INDEX IF NOT EXISTS idx_recon_jobs_tolerance 
ON recon_jobs(amount_tolerance, date_tolerance_days);

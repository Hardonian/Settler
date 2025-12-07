-- ROLLBACK TEMPLATE
-- Save as: YYYYMMDDHHMMSS_rollback_[original_migration_name].sql
-- Only use in emergencies

BEGIN;

-- Reverse table changes
-- DROP TABLE IF EXISTS public.new_table;

-- Reverse column changes
-- ALTER TABLE public.existing_table DROP COLUMN IF EXISTS new_column;

-- Reverse RLS policies
-- DROP POLICY IF EXISTS "new_policy" ON public.table_name;

-- Reverse functions
-- DROP FUNCTION IF EXISTS public.new_function();

-- Reverse triggers
-- DROP TRIGGER IF EXISTS new_trigger ON public.table_name;

COMMIT;

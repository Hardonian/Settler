-- Make the 61 policy-free RLS tables strictly server-only (2026-10-03).
--
-- p6 audit: these tables have RLS enabled with no policies — browser roles get
-- zero rows (deny by default) but still hold direct table GRANTS. Revoke the
-- grants so access is explicit: postgres (owner) and service_role only.
-- service_role additionally bypasses RLS. No application flow is affected:
-- anon/authenticated queries returned empty before this change.

DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname AS name
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND c.relrowsecurity
      AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.tablename = c.relname)
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t.name);
  END LOOP;
END $$;

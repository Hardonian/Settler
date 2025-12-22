-- Add PostgreSQL advisory lock functions for concurrency protection

CREATE OR REPLACE FUNCTION pg_try_advisory_lock(lock_id bigint)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT pg_try_advisory_lock(lock_id);
$$;

CREATE OR REPLACE FUNCTION pg_advisory_unlock(lock_id bigint)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT pg_advisory_unlock(lock_id);
$$;

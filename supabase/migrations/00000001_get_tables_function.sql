-- ============================================================================
-- Helper Function: Get Tables
-- ============================================================================
-- Returns all tables in a schema for the table browser

CREATE OR REPLACE FUNCTION get_tables(schema_name TEXT DEFAULT 'public')
RETURNS TABLE (
  table_schema TEXT,
  table_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_schema::TEXT,
    t.table_name::TEXT
  FROM information_schema.tables t
  WHERE t.table_schema = schema_name
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE '\_%'  -- Exclude system tables
    AND t.table_name NOT IN ('schema_migrations', 'migrations')
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_tables(TEXT) TO authenticated;

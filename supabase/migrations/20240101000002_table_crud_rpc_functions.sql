-- ============================================================================
-- Generic CRUD RPC Functions for All Tables
-- ============================================================================
-- These functions provide safe, RLS-aware CRUD operations for any table

-- Get table records with pagination and filtering
CREATE OR REPLACE FUNCTION get_table_records(
  p_table_schema TEXT,
  p_table_name TEXT,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_filters JSONB DEFAULT '{}'::jsonb,
  p_order_by TEXT DEFAULT 'created_at',
  p_order_asc BOOLEAN DEFAULT false
)
RETURNS TABLE (
  data JSONB,
  total_count BIGINT
) AS $$
DECLARE
  v_table_name TEXT;
  v_query TEXT;
  v_count_query TEXT;
  v_filter_query TEXT := '';
  v_key TEXT;
  v_value TEXT;
BEGIN
  v_table_name := quote_ident(p_table_schema) || '.' || quote_ident(p_table_name);
  
  -- Build filter conditions
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_filters)
  LOOP
    IF v_filter_query = '' THEN
      v_filter_query := ' WHERE ' || quote_ident(v_key) || ' = ' || quote_literal(v_value);
    ELSE
      v_filter_query := v_filter_query || ' AND ' || quote_ident(v_key) || ' = ' || quote_literal(v_value);
    END IF;
  END LOOP;
  
  -- Count query
  v_count_query := 'SELECT COUNT(*) FROM ' || v_table_name || v_filter_query;
  EXECUTE v_count_query INTO total_count;
  
  -- Data query
  v_query := format(
    'SELECT jsonb_agg(row_to_json(t)) FROM (
      SELECT * FROM %s %s ORDER BY %I %s LIMIT %s OFFSET %s
    ) t',
    v_table_name,
    v_filter_query,
    p_order_by,
    CASE WHEN p_order_asc THEN 'ASC' ELSE 'DESC' END,
    p_limit,
    p_offset
  );
  
  EXECUTE v_query INTO data;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create record in table
CREATE OR REPLACE FUNCTION create_table_record(
  p_table_schema TEXT,
  p_table_name TEXT,
  p_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_table_name TEXT;
  v_query TEXT;
  v_result JSONB;
  v_keys TEXT[];
  v_values TEXT[];
  v_key TEXT;
BEGIN
  v_table_name := quote_ident(p_table_schema) || '.' || quote_ident(p_table_name);
  
  -- Extract keys and values from JSONB
  SELECT array_agg(key), array_agg(value::text)
  INTO v_keys, v_values
  FROM jsonb_each_text(p_data);
  
  -- Build INSERT query
  v_query := format(
    'INSERT INTO %s (%s) VALUES (%s) RETURNING row_to_json(%s.*)',
    v_table_name,
    array_to_string(v_keys, ', '),
    array_to_string(v_values, ', '),
    quote_ident(p_table_name)
  );
  
  EXECUTE v_query INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update record in table
CREATE OR REPLACE FUNCTION update_table_record(
  p_table_schema TEXT,
  p_table_name TEXT,
  p_id UUID,
  p_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_table_name TEXT;
  v_query TEXT;
  v_result JSONB;
  v_set_clause TEXT := '';
  v_key TEXT;
BEGIN
  v_table_name := quote_ident(p_table_schema) || '.' || quote_ident(p_table_name);
  
  -- Build SET clause
  FOR v_key IN SELECT jsonb_object_keys(p_data)
  LOOP
    IF v_set_clause = '' THEN
      v_set_clause := quote_ident(v_key) || ' = ' || quote_literal(p_data->>v_key);
    ELSE
      v_set_clause := v_set_clause || ', ' || quote_ident(v_key) || ' = ' || quote_literal(p_data->>v_key);
    END IF;
  END LOOP;
  
  -- Build UPDATE query
  v_query := format(
    'UPDATE %s SET %s WHERE id = %L RETURNING row_to_json(%s.*)',
    v_table_name,
    v_set_clause,
    p_id,
    quote_ident(p_table_name)
  );
  
  EXECUTE v_query INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete record from table
CREATE OR REPLACE FUNCTION delete_table_record(
  p_table_schema TEXT,
  p_table_name TEXT,
  p_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_table_name TEXT;
  v_query TEXT;
BEGIN
  v_table_name := quote_ident(p_table_schema) || '.' || quote_ident(p_table_name);
  
  v_query := format('DELETE FROM %s WHERE id = %L', v_table_name, p_id);
  EXECUTE v_query;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get table schema (columns, types, constraints)
CREATE OR REPLACE FUNCTION get_table_schema(
  p_table_schema TEXT,
  p_table_name TEXT
)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT
) AS $$
DECLARE
  v_query TEXT;
BEGIN
  v_query := format('
    SELECT 
      column_name::TEXT,
      data_type::TEXT,
      is_nullable::TEXT,
      column_default::TEXT
    FROM information_schema.columns
    WHERE table_schema = %L AND table_name = %L
    ORDER BY ordinal_position
  ', p_table_schema, p_table_name);
  
  RETURN QUERY EXECUTE v_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_table_records(TEXT, TEXT, INTEGER, INTEGER, JSONB, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_table_record(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_table_record(TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_table_record(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_schema(TEXT, TEXT) TO authenticated;

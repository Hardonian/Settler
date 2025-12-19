-- ============================================================================
-- Secure CRUD Functions with RLS Enforcement
-- ============================================================================
-- Replaces previous SECURITY DEFINER functions with RLS-aware versions
-- These functions respect Row Level Security policies

-- Drop old insecure functions
DROP FUNCTION IF EXISTS get_table_records(TEXT, TEXT, INTEGER, INTEGER, JSONB, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS create_table_record(TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS update_table_record(TEXT, TEXT, UUID, JSONB);
DROP FUNCTION IF EXISTS delete_table_record(TEXT, TEXT, UUID);

-- Get table records with RLS enforcement (uses current user context)
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
  -- Validate table name to prevent SQL injection
  IF p_table_schema != 'public' THEN
    RAISE EXCEPTION 'Only public schema tables are allowed';
  END IF;
  
  -- Whitelist allowed tables (API service tables only)
  IF p_table_name NOT IN (
    'receipt_uploads', 'receipts', 'receipt_items',
    'recon_jobs', 'recon_results', 'recon_templates', 'recon_audits', 'recon_runs',
    'mapping_templates', 'transform_recipes', 'validation_rules', 'contract_versions',
    'drift_events', 'workflow_runs',
    'feature_flags', 'feature_flag_environments', 'feature_flag_overrides',
    'webhooks', 'webhook_deliveries',
    'api_keys', 'idempotency_keys',
    'usage_events', 'usage_aggregate_daily', 'usage_counters',
    'billing_accounts', 'subscriptions', 'add_ons', 'add_on_purchases',
    'ingestion_sources', 'ingestions', 'raw_records', 'normalized_transactions',
    'reconciliation_runs', 'reconciliation_matches', 'exports'
  ) THEN
    RAISE EXCEPTION 'Table % is not accessible via this function', p_table_name;
  END IF;

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
  
  -- Count query (RLS policies apply automatically)
  v_count_query := 'SELECT COUNT(*) FROM ' || v_table_name || v_filter_query;
  EXECUTE v_count_query INTO total_count;
  
  -- Data query (RLS policies apply automatically)
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
$$ LANGUAGE plpgsql SECURITY INVOKER; -- Changed from SECURITY DEFINER to INVOKER

-- Create record (RLS policies apply)
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
  -- Validate table name
  IF p_table_schema != 'public' THEN
    RAISE EXCEPTION 'Only public schema tables are allowed';
  END IF;
  
  -- Whitelist allowed tables
  IF p_table_name NOT IN (
    'receipt_uploads', 'receipts', 'receipt_items',
    'recon_jobs', 'recon_results', 'recon_templates',
    'feature_flags', 'feature_flag_environments', 'feature_flag_overrides',
    'webhooks', 'webhook_deliveries',
    'api_keys', 'idempotency_keys',
    'usage_events', 'usage_counters',
    'ingestion_sources', 'ingestions', 'raw_records', 'normalized_transactions',
    'reconciliation_runs', 'reconciliation_matches', 'exports'
  ) THEN
    RAISE EXCEPTION 'Table % is not accessible for writes via this function', p_table_name;
  END IF;

  v_table_name := quote_ident(p_table_schema) || '.' || quote_ident(p_table_name);
  
  -- Extract keys and values from JSONB
  SELECT array_agg(key), array_agg(value::text)
  INTO v_keys, v_values
  FROM jsonb_each_text(p_data);
  
  -- Build INSERT query (RLS policies apply)
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
$$ LANGUAGE plpgsql SECURITY INVOKER; -- Changed from SECURITY DEFINER to INVOKER

-- Update record (RLS policies apply)
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
  -- Validate table name
  IF p_table_schema != 'public' THEN
    RAISE EXCEPTION 'Only public schema tables are allowed';
  END IF;
  
  -- Whitelist allowed tables
  IF p_table_name NOT IN (
    'receipt_uploads', 'receipts', 'receipt_items',
    'recon_jobs', 'recon_results', 'recon_templates',
    'feature_flags', 'feature_flag_environments', 'feature_flag_overrides',
    'webhooks', 'webhook_deliveries',
    'api_keys', 'idempotency_keys',
    'usage_events', 'usage_counters',
    'ingestion_sources', 'ingestions', 'raw_records', 'normalized_transactions',
    'reconciliation_runs', 'reconciliation_matches', 'exports'
  ) THEN
    RAISE EXCEPTION 'Table % is not accessible for updates via this function', p_table_name;
  END IF;

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
  
  -- Build UPDATE query (RLS policies apply)
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
$$ LANGUAGE plpgsql SECURITY INVOKER; -- Changed from SECURITY DEFINER to INVOKER

-- Delete record (RLS policies apply)
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
  -- Validate table name
  IF p_table_schema != 'public' THEN
    RAISE EXCEPTION 'Only public schema tables are allowed';
  END IF;
  
  -- Whitelist allowed tables
  IF p_table_name NOT IN (
    'receipt_uploads', 'receipts', 'receipt_items',
    'recon_jobs', 'recon_results', 'recon_templates',
    'feature_flags', 'feature_flag_environments', 'feature_flag_overrides',
    'webhooks', 'webhook_deliveries',
    'api_keys', 'idempotency_keys',
    'usage_events', 'usage_counters',
    'ingestion_sources', 'ingestions', 'raw_records', 'normalized_transactions',
    'reconciliation_runs', 'reconciliation_matches', 'exports'
  ) THEN
    RAISE EXCEPTION 'Table % is not accessible for deletes via this function', p_table_name;
  END IF;

  v_table_name := quote_ident(p_table_schema) || '.' || quote_ident(p_table_name);
  
  -- Build DELETE query (RLS policies apply)
  v_query := format('DELETE FROM %s WHERE id = %L', v_table_name, p_id);
  EXECUTE v_query;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER; -- Changed from SECURITY DEFINER to INVOKER

-- Grant execute to authenticated users (RLS will enforce tenant isolation)
GRANT EXECUTE ON FUNCTION get_table_records(TEXT, TEXT, INTEGER, INTEGER, JSONB, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_table_record(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_table_record(TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_table_record(TEXT, TEXT, UUID) TO authenticated;

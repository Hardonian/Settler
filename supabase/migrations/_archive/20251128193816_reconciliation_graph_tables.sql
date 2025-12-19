-- Migration: reconciliation_graph_tables
-- Created: 2025-11-28 19:38:16 UTC
-- Description: Reconciliation graph tables for continuous reconciliation engine

BEGIN;

-- Enable vector extension for AI features (if available)
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- Continuous Reconciliation Graph
-- ============================================================================

-- Graph nodes (transactions, matches, etc.)
CREATE TABLE IF NOT EXISTS reconciliation_graph_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  node_type VARCHAR(50) NOT NULL CHECK (node_type IN ('transaction', 'match', 'unmatched', 'error')),
  source_id VARCHAR(255),
  target_id VARCHAR(255),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  amount DECIMAL(10, 2),
  currency VARCHAR(10),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence DECIMAL(3, 2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_job_id ON reconciliation_graph_nodes(job_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON reconciliation_graph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_source_id ON reconciliation_graph_nodes(source_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_target_id ON reconciliation_graph_nodes(target_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_timestamp ON reconciliation_graph_nodes(timestamp);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_job_type ON reconciliation_graph_nodes(job_id, node_type);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_data_gin ON reconciliation_graph_nodes USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_metadata_gin ON reconciliation_graph_nodes USING GIN (metadata);

-- Graph edges (relationships between nodes)
CREATE TABLE IF NOT EXISTS reconciliation_graph_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id UUID NOT NULL REFERENCES reconciliation_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES reconciliation_graph_nodes(id) ON DELETE CASCADE,
  edge_type VARCHAR(50) NOT NULL CHECK (edge_type IN ('matches', 'conflicts', 'related', 'derived')),
  confidence DECIMAL(3, 2) NOT NULL DEFAULT 1.0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON reconciliation_graph_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON reconciliation_graph_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_type ON reconciliation_graph_edges(edge_type);
CREATE INDEX IF NOT EXISTS idx_graph_edges_confidence ON reconciliation_graph_edges(confidence);
CREATE INDEX IF NOT EXISTS idx_graph_edges_metadata_gin ON reconciliation_graph_edges USING GIN (metadata);

-- Enable Realtime for graph updates (Supabase Realtime)
-- Note: This will be handled by Supabase automatically if tables are in public schema

COMMIT;

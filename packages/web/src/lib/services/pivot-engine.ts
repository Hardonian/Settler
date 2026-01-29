/**
 * Pivot Engine
 * 
 * Server-side pivot query engine for analytics datasets.
 * Validates and executes pivot queries safely.
 */

import { createClient } from '@/lib/supabase/server';

export type Aggregation = 'sum' | 'count' | 'avg' | 'min' | 'max' | 'p95';
export type Dataset = 'usage' | 'support' | 'cost' | 'revenue' | 'efficiency';

export interface PivotQuery {
  dataset: Dataset;
  rows: string[]; // Dimension names (max 2)
  columns: string[]; // Dimension names (max 2)
  measure: string;
  aggregation: Aggregation;
  filters: Record<string, any>;
  dateRange?: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
  };
}

export interface PivotResult {
  data: Array<Record<string, any>>;
  totals: Record<string, any>;
  rowLabels: string[];
  columnLabels: string[];
}

// Dataset schemas
const DATASET_SCHEMAS: Record<Dataset, {
  dimensions: string[];
  measures: string[];
}> = {
  usage: {
    dimensions: ['date', 'org', 'route', 'user', 'category'],
    measures: ['requests', 'jobs', 'events', 'errors', 'response_time'],
  },
  support: {
    dimensions: ['date', 'org', 'severity', 'status', 'category'],
    measures: ['tickets', 'triage_score', 'resolution_time'],
  },
  cost: {
    dimensions: ['date', 'source', 'org'],
    measures: ['total_cost', 'infra_cost', 'data_cost', 'messaging_cost'],
  },
  revenue: {
    dimensions: ['date', 'org', 'source'],
    measures: ['amount', 'mrr', 'arr'],
  },
  efficiency: {
    dimensions: ['date', 'org'],
    measures: ['cost_per_org', 'cost_per_user', 'cost_per_request', 'tickets_per_org'],
  },
};

/**
 * Validate pivot query
 */
export function validatePivotQuery(query: PivotQuery): {
  valid: boolean;
  error?: string;
} {
  // Check dataset exists
  if (!DATASET_SCHEMAS[query.dataset]) {
    return { valid: false, error: `Unknown dataset: ${query.dataset}` };
  }

  const schema = DATASET_SCHEMAS[query.dataset];

  // Check row dimensions (max 2)
  if (query.rows.length > 2) {
    return { valid: false, error: 'Maximum 2 row dimensions allowed' };
  }

  // Check column dimensions (max 2)
  if (query.columns.length > 2) {
    return { valid: false, error: 'Maximum 2 column dimensions allowed' };
  }

  // Validate dimensions exist in schema
  const allDims = [...query.rows, ...query.columns];
  for (const dim of allDims) {
    if (!schema.dimensions.includes(dim)) {
      return { valid: false, error: `Invalid dimension: ${dim}` };
    }
  }

  // Validate measure exists
  if (!schema.measures.includes(query.measure)) {
    return { valid: false, error: `Invalid measure: ${query.measure}` };
  }

  // Validate aggregation
  const validAggregations: Aggregation[] = ['sum', 'count', 'avg', 'min', 'max', 'p95'];
  if (!validAggregations.includes(query.aggregation)) {
    return { valid: false, error: `Invalid aggregation: ${query.aggregation}` };
  }

  return { valid: true };
}

/**
 * Execute pivot query
 */
export async function executePivotQuery(query: PivotQuery): Promise<PivotResult> {
  const validation = validatePivotQuery(query);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const supabase = await createClient();

  // Build SQL query based on dataset
  buildPivotSQL(query);
  
  // Execute query (using raw SQL via Supabase RPC or direct query)
  // For now, we'll use a simplified approach with Supabase queries
  const result = await executePivotSQL(supabase, query);

  return result;
}

/**
 * Build pivot SQL query
 */
function buildPivotSQL(_query: PivotQuery): string {
  // This is a simplified version - in production, you'd build proper SQL
  // For now, we'll use Supabase's query builder
  return '';
}

/**
 * Execute pivot using Supabase query builder (simplified)
 */
async function executePivotSQL(
  supabase: any,
  query: PivotQuery
): Promise<PivotResult> {
  // Get base data based on dataset
  let baseQuery: any;

  switch (query.dataset) {
    case 'usage':
      baseQuery = supabase.from('ops_usage_daily_rollups').select('*');
      break;
    case 'support':
      baseQuery = supabase
        .from('ops_support_tickets')
        .select('*, support_ticket_triage(*)');
      break;
    case 'cost':
      baseQuery = supabase.from('ops_cost_daily_rollups').select('*');
      break;
    case 'revenue':
      baseQuery = supabase.from('ops_revenue_inputs').select('*');
      break;
    case 'efficiency':
      // Efficiency requires joins - simplified for now
      baseQuery = supabase.from('ops_cost_daily_rollups').select('*');
      break;
    default:
      throw new Error(`Unsupported dataset: ${query.dataset}`);
  }

  // Apply date range filter
  if (query.dateRange) {
    baseQuery = baseQuery
      .gte('date', query.dateRange.start)
      .lte('date', query.dateRange.end);
  }

  // Apply other filters
  for (const [key, value] of Object.entries(query.filters)) {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        baseQuery = baseQuery.in(key, value);
      } else {
        baseQuery = baseQuery.eq(key, value);
      }
    }
  }

  const { data, error } = await baseQuery;

  if (error) {
    throw new Error(`Query failed: ${error.message}`);
  }

  // Pivot data in memory (simplified - for production, use SQL PIVOT)
  const pivoted = pivotDataInMemory(data || [], query);

  return pivoted;
}

/**
 * Pivot data in memory (simplified implementation)
 */
function pivotDataInMemory(
  data: any[],
  query: PivotQuery
): PivotResult {
  // Group by row dimensions
  const rowGroups = new Map<string, any[]>();
  const rowLabels: string[] = [];
  const columnLabels: string[] = [];

  for (const row of data) {
    // Build row key
    const rowKey = query.rows.map((dim) => row[dim] || 'null').join('|');
    if (!rowGroups.has(rowKey)) {
      rowGroups.set(rowKey, []);
      rowLabels.push(rowKey);
    }
    rowGroups.get(rowKey)!.push(row);
  }

  // Build column labels from column dimensions
  const colSet = new Set<string>();
  for (const row of data) {
    const colKey = query.columns.map((dim) => row[dim] || 'null').join('|');
    colSet.add(colKey);
  }
  columnLabels.push(...Array.from(colSet).sort());

  // Aggregate data
  const pivotedData: Array<Record<string, any>> = [];
  const totals: Record<string, number> = {};

  for (const rowLabel of rowLabels) {
    const rowData = rowGroups.get(rowLabel)!;
    const rowRecord: Record<string, any> = {};

    // Set row dimension values
    const rowParts = rowLabel.split('|');
    query.rows.forEach((dim, idx) => {
      rowRecord[dim] = rowParts[idx] === 'null' ? null : rowParts[idx];
    });

    // Aggregate for each column
    for (const colLabel of columnLabels) {
      const colParts = colLabel.split('|');
      const matchingRows = rowData.filter((r) => {
        return query.columns.every((dim, idx) => {
          const val = r[dim] || 'null';
          return val === colParts[idx] || (val === null && colParts[idx] === 'null');
        });
      });

      const value = aggregate(matchingRows, query.measure, query.aggregation);
      rowRecord[colLabel] = value;

      // Update totals
      totals[colLabel] = (totals[colLabel] || 0) + value;
    }

    pivotedData.push(rowRecord);
  }

  return {
    data: pivotedData,
    totals: totals as any,
    rowLabels,
    columnLabels,
  };
}

/**
 * Aggregate values
 */
function aggregate(rows: any[], measure: string, agg: Aggregation): number {
  if (rows.length === 0) return 0;

  const values = rows
    .map((r) => {
      const val = r[measure];
      return typeof val === 'number' ? val : 0;
    })
    .filter((v) => !isNaN(v));

  switch (agg) {
    case 'sum':
      return values.reduce((a: number, b: any) => a + b, 0);
    case 'count':
      return values.length;
    case 'avg':
      return values.length > 0 ? values.reduce((a: number, b: any) => a + b, 0) / values.length : 0;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'p95':
      const sorted = values.sort((a, b) => a - b);
      const idx = Math.floor(sorted.length * 0.95);
      return sorted[idx] || 0;
    default:
      return 0;
  }
}

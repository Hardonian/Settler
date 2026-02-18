/**
 * Cost Signal Engine
 * 
 * Derives cost estimates from existing telemetry data without relying on paid APIs.
 * All cost calculations are based on heuristics and baselines.
 */

// Cost baselines - inline definitions to avoid path issues
const COST_BASELINES = {
  vercel: {
    edgeRequest: { unit: 'request', costPerUnit: 0.0000001, description: 'Vercel Edge Request', confidence: 0.8, source: 'estimated' },
    serverlessRequest: { unit: 'request', costPerUnit: 0.0000002, description: 'Vercel Serverless Request', confidence: 0.8, source: 'estimated' },
    functionExecutionMs: { unit: 'ms', costPerUnit: 0.0000000001, description: 'Vercel Function Execution', confidence: 0.7, source: 'estimated' },
  },
  supabase: {
    query: { unit: 'query', costPerUnit: 0.0000001, description: 'Supabase Query', confidence: 0.8, source: 'estimated' },
    storageGb: { unit: 'GB', costPerUnit: 0.021, description: 'Supabase Storage', confidence: 0.9, source: 'estimated' },
    bandwidthGb: { unit: 'GB', costPerUnit: 0.09, description: 'Supabase Bandwidth', confidence: 0.9, source: 'estimated' },
  },
  email: {
    send: { unit: 'email', costPerUnit: 0.0001, description: 'Email Send', confidence: 0.9, source: 'estimated' },
  },
  webhook: {
    delivery: { unit: 'webhook', costPerUnit: 0.0000001, description: 'Webhook Delivery', confidence: 0.7, source: 'estimated' },
  },
  storage: {
    gb: { unit: 'GB', costPerUnit: 0.023, description: 'Storage', confidence: 0.8, source: 'estimated' },
  },
  compute: {
    hour: { unit: 'hour', costPerUnit: 0.1, description: 'Compute Hour', confidence: 0.7, source: 'estimated' },
  },
} as any;

export function getCostBaseline(category: string, type: string): any {
  const cat = (COST_BASELINES as any)[category];
  return cat?.[type] || null;
}

// Ensure COST_BASELINES is considered used
void COST_BASELINES;

export function calculateCost(unitCount: number, baseline: any): { totalCost: number; confidence: number } {
  if (!baseline) return { totalCost: 0, confidence: 0 };
  return {
    totalCost: unitCount * baseline.costPerUnit,
    confidence: baseline.confidence || 0.5,
  };
}
import { createClient } from '@/lib/supabase/server';

export interface CostInput {
  date: string; // YYYY-MM-DD
  source: 'vercel' | 'supabase' | 'email' | 'webhook' | 'storage' | 'compute' | 'other';
  unitCount: number;
  unitCostEst: number;
  totalCostEst: number;
  confidence: number;
  derivationMethod: string;
  derivationMetadata: Record<string, any>;
  organizationId?: string;
}

export interface CostRollup {
  date: string;
  totalCostEst: number;
  infraCostEst: number;
  dataCostEst: number;
  messagingCostEst: number;
  storageCostEst: number;
  computeCostEst: number;
  confidence: number;
  derivationSummary: Record<string, any>;
}

/**
 * Derive cost inputs from ops_events for a given date
 */
export async function deriveCostInputsFromEvents(
  date: string,
  organizationId?: string
): Promise<CostInput[]> {
  const supabase = await createClient();
  const inputs: CostInput[] = [];

  // Query ops_events for the date
  let query = supabase
    .from('ops_events')
    .select('*')
    .eq('created_at', date)
    .gte('created_at', `${date}T00:00:00Z`)
    .lt('created_at', `${date}T23:59:59Z`);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data: events, error } = await query;

  if (error || !events) {
    return inputs;
  }

  type EventRow = {
    event_type?: string;
    event_category?: string;
    duration_ms?: number;
  };

  const eventRows = (events || []) as EventRow[];

  // Group events by type and source
  const eventGroups = new Map<string, EventRow[]>();

  for (const event of eventRows) {
    const key = `${event.event_type || 'unknown'}:${event.event_category || 'unknown'}`;
    if (!eventGroups.has(key)) {
      eventGroups.set(key, []);
    }
    eventGroups.get(key)!.push(event);
  }

  // Derive costs for each group
  for (const [key, groupEvents] of eventGroups) {
    const [eventType, category] = key.split(':');

    // Vercel requests
    if (eventType === 'api_request' && category === 'infrastructure') {
      const baseline = getCostBaseline('vercel', 'edgeRequest');
      if (baseline) {
        const unitCount = groupEvents.length;
        const { totalCost, confidence } = calculateCost(unitCount, baseline);
        
        // Estimate execution time from duration_ms
        const totalDurationMs = groupEvents.reduce((sum: number, e: any) => sum + ((e as EventRow).duration_ms || 0), 0);
        const execBaseline = getCostBaseline('vercel', 'functionExecutionMs');
        let execCost = 0;
        if (execBaseline) {
          execCost = totalDurationMs * execBaseline.costPerUnit;
        }

        inputs.push({
          date,
          source: 'vercel',
          unitCount,
          unitCostEst: baseline.costPerUnit,
          totalCostEst: totalCost + execCost,
          confidence: Math.min(confidence, 0.7), // Lower confidence for derived data
          derivationMethod: 'request_count_from_ops_events',
          derivationMetadata: {
            eventType,
            eventCount: unitCount,
            totalDurationMs,
            avgDurationMs: totalDurationMs / unitCount,
          },
          organizationId,
        });
      }
    }

    // Webhook deliveries
    if (eventType === 'webhook_delivery') {
      const baseline = getCostBaseline('webhook', 'delivery');
      if (baseline) {
        const unitCount = groupEvents.length;
        const { totalCost, confidence } = calculateCost(unitCount, baseline);

        inputs.push({
          date,
          source: 'webhook',
          unitCount,
          unitCostEst: baseline.costPerUnit,
          totalCostEst: totalCost,
          confidence,
          derivationMethod: 'webhook_count_from_ops_events',
          derivationMetadata: {
            eventCount: unitCount,
          },
          organizationId,
        });
      }
    }

    // Database queries (estimated from API requests)
    if (eventType === 'api_request' && category === 'application') {
      // Estimate ~5 queries per API request on average
      const estimatedQueries = groupEvents.length * 5;
      const baseline = getCostBaseline('supabase', 'query');
      if (baseline) {
        const { totalCost, confidence } = calculateCost(estimatedQueries, baseline);

        inputs.push({
          date,
          source: 'supabase',
          unitCount: estimatedQueries,
          unitCostEst: baseline.costPerUnit,
          totalCostEst: totalCost,
          confidence: confidence * 0.5, // Lower confidence for estimated queries
          derivationMethod: 'estimated_query_count_from_api_requests',
          derivationMetadata: {
            apiRequestCount: groupEvents.length,
            queriesPerRequest: 5,
            estimatedQueries,
          },
          organizationId,
        });
      }
    }
  }

  return inputs;
}

/**
 * Calculate daily cost rollup from cost inputs
 */
export async function calculateDailyCostRollup(
  date: string
): Promise<CostRollup> {
  const supabase = await createClient();

  // Get all cost inputs for the date
  const { data: inputs, error } = await supabase
    .from('ops_cost_inputs')
    .select('*')
    .eq('date', date);

  type CostInputRow = {
    total_cost_est?: number;
    confidence?: number;
    source?: string;
  };

  const inputRows = (inputs || []) as CostInputRow[];

  if (error || !inputRows || inputRows.length === 0) {
    // Return zero rollup if no data
    return {
      date,
      totalCostEst: 0,
      infraCostEst: 0,
      dataCostEst: 0,
      messagingCostEst: 0,
      storageCostEst: 0,
      computeCostEst: 0,
      confidence: 0,
      derivationSummary: {
        message: 'No cost inputs available for this date',
      },
    };
  }

  // Aggregate by source category
  const infraSources = ['vercel', 'compute'];
  const dataSources = ['supabase'];
  const messagingSources = ['email', 'webhook'];
  const storageSources = ['storage'];

  let infraCost = 0;
  let dataCost = 0;
  let messagingCost = 0;
  let storageCost = 0;
  let computeCost = 0;
  let totalConfidence = 0;
  let confidenceCount = 0;

  for (const input of inputRows) {
    const cost = Number(input.total_cost_est || 0);
    const confidence = Number(input.confidence || 0);
    const source = input.source || '';

    if (infraSources.includes(source)) {
      infraCost += cost;
      if (source === 'compute') {
        computeCost += cost;
      }
    } else if (dataSources.includes(source)) {
      dataCost += cost;
    } else if (messagingSources.includes(source)) {
      messagingCost += cost;
    } else if (storageSources.includes(source)) {
      storageCost += cost;
    }

    totalConfidence += confidence;
    confidenceCount++;
  }

  const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

  return {
    date,
    totalCostEst: infraCost + dataCost + messagingCost + storageCost + computeCost,
    infraCostEst: infraCost,
    dataCostEst: dataCost,
    messagingCostEst: messagingCost,
    storageCostEst: storageCost,
    computeCostEst: computeCost,
    confidence: avgConfidence,
    derivationSummary: {
      inputCount: inputRows.length,
      sources: [...new Set(inputRows.map((i) => i.source || '').filter(Boolean))],
    },
  };
}

/**
 * Store cost inputs in database
 */
export async function storeCostInputs(inputs: CostInput[]): Promise<void> {
  const supabase = await createClient();

  const records = inputs.map((input) => ({
    date: input.date,
    source: input.source,
    unit_count: input.unitCount,
    unit_cost_est: input.unitCostEst,
    total_cost_est: input.totalCostEst,
    confidence: input.confidence,
    derivation_method: input.derivationMethod,
    derivation_metadata: input.derivationMetadata,
    organization_id: input.organizationId || null,
  }));

  const { error } = await supabase.from('ops_cost_inputs').upsert(records as any, {
    onConflict: 'date,source,organization_id',
  });

  if (error) {
    console.error('Failed to store cost inputs:', error);
    throw error;
  }
}

/**
 * Store daily cost rollup in database
 */
export async function storeCostRollup(rollup: CostRollup): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('ops_cost_daily_rollups').upsert(
    {
      date: rollup.date,
      total_cost_est: rollup.totalCostEst,
      infra_cost_est: rollup.infraCostEst,
      data_cost_est: rollup.dataCostEst,
      messaging_cost_est: rollup.messagingCostEst,
      storage_cost_est: rollup.storageCostEst,
      compute_cost_est: rollup.computeCostEst,
      confidence: rollup.confidence,
      derivation_summary: rollup.derivationSummary,
    } as any,
    {
      onConflict: 'date',
    }
  );

  if (error) {
    console.error('Failed to store cost rollup:', error);
    throw error;
  }
}

/**
 * Cost Baseline Configuration
 *
 * Defines cost estimation baselines for various infrastructure components.
 * These are used by the Cost Signal Engine to derive cost estimates from telemetry.
 *
 * All costs are in USD per unit.
 */

export interface CostBaseline {
  unit: string;
  costPerUnit: number;
  description: string;
  confidence: number; // 0-1, how confident we are in this estimate
  source: string; // Where this baseline came from
}

export interface CostBaselines {
  vercel: {
    edgeRequest: CostBaseline;
    serverlessRequest: CostBaseline;
    functionExecutionMs: CostBaseline;
  };
  supabase: {
    query: CostBaseline;
    storageGb: CostBaseline;
    bandwidthGb: CostBaseline;
  };
  email: {
    send: CostBaseline;
  };
  webhook: {
    delivery: CostBaseline;
  };
  storage: {
    artifactGb: CostBaseline;
    logGb: CostBaseline;
  };
}

/**
 * Default cost baselines
 * These are estimates based on typical SaaS pricing and should be updated
 * based on actual billing data when available.
 */
export const COST_BASELINES: CostBaselines = {
  vercel: {
    edgeRequest: {
      unit: "request",
      costPerUnit: 0.0000001, // $0.10 per million requests
      description: "Vercel Edge Function request",
      confidence: 0.7,
      source: "estimated_from_vercel_pricing",
    },
    serverlessRequest: {
      unit: "request",
      costPerUnit: 0.0000002, // $0.20 per million requests
      description: "Vercel Serverless Function request",
      confidence: 0.7,
      source: "estimated_from_vercel_pricing",
    },
    functionExecutionMs: {
      unit: "ms",
      costPerUnit: 0.0000000001, // $0.0000001 per ms (very small)
      description: "Vercel function execution time",
      confidence: 0.5,
      source: "estimated_from_vercel_pricing",
    },
  },
  supabase: {
    query: {
      unit: "query",
      costPerUnit: 0.000001, // $0.001 per 1000 queries (estimated)
      description: "Supabase database query",
      confidence: 0.6,
      source: "estimated_from_supabase_pricing",
    },
    storageGb: {
      unit: "GB",
      costPerUnit: 0.021, // $0.021 per GB/month
      description: "Supabase storage per GB",
      confidence: 0.8,
      source: "estimated_from_supabase_pricing",
    },
    bandwidthGb: {
      unit: "GB",
      costPerUnit: 0.09, // $0.09 per GB
      description: "Supabase bandwidth per GB",
      confidence: 0.7,
      source: "estimated_from_supabase_pricing",
    },
  },
  email: {
    send: {
      unit: "email",
      costPerUnit: 0.0001, // $0.0001 per email (e.g., SendGrid, Resend)
      description: "Email send cost",
      confidence: 0.8,
      source: "estimated_from_email_provider_pricing",
    },
  },
  webhook: {
    delivery: {
      unit: "delivery",
      costPerUnit: 0.00001, // $0.00001 per webhook delivery (mostly compute)
      description: "Webhook delivery cost",
      confidence: 0.6,
      source: "estimated_from_compute_cost",
    },
  },
  storage: {
    artifactGb: {
      unit: "GB",
      costPerUnit: 0.023, // $0.023 per GB/month (S3-like)
      description: "Artifact storage per GB",
      confidence: 0.7,
      source: "estimated_from_object_storage_pricing",
    },
    logGb: {
      unit: "GB",
      costPerUnit: 0.05, // $0.05 per GB/month (log storage typically more expensive)
      description: "Log storage per GB",
      confidence: 0.6,
      source: "estimated_from_log_storage_pricing",
    },
  },
};

/**
 * Get cost baseline for a specific source and type
 */
export function getCostBaseline(source: keyof CostBaselines, type: string): CostBaseline | null {
  const sourceBaselines = COST_BASELINES[source];
  if (!sourceBaselines) {
    return null;
  }

  // Type-safe access
  const baseline = (sourceBaselines as any)[type];
  return baseline || null;
}

/**
 * Calculate estimated cost for a given unit count and baseline
 */
export function calculateCost(
  unitCount: number,
  baseline: CostBaseline
): {
  totalCost: number;
  confidence: number;
} {
  return {
    totalCost: unitCount * baseline.costPerUnit,
    confidence: baseline.confidence,
  };
}

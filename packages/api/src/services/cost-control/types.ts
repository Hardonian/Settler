export interface CostDriver {
  id: string;
  name: string;
  category: "compute" | "storage" | "external_api" | "retries" | "support";
  unit: string; // 'requests', 'gb', 'api_calls', 'retries', 'tickets'
  baseCostPerUnit: number; // Estimated cost in USD
  scalingBehavior: "linear" | "sublinear" | "fixed";
}

export interface TenantCostLimits {
  tenantId: string;
  billingAccountId: string;
  planId: string;
  limits: Record<
    string,
    {
      daily: number;
      monthly: number;
      burst: number; // Max allowed in short window
    }
  >;
  currentUsage: Record<
    string,
    {
      daily: number;
      monthly: number;
      lastReset: Date;
    }
  >;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostControlResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  retryAfter?: number;
  degradedMode?: boolean;
}

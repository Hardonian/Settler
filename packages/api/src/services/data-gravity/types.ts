export interface LongitudinalInsight {
  id: string;
  tenantId: string;
  insightType: "pattern" | "anomaly" | "trend" | "correlation" | "baseline";
  entityType: string; // 'reconciliation', 'transaction', 'integration', etc.
  entityId?: string;
  metric: string;
  value: number;
  historicalValues: Array<{ date: Date; value: number }>;
  trend: "increasing" | "decreasing" | "stable" | "volatile";
  confidence: number; // 0-1
  firstObserved: Date;
  lastObserved: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DerivedArtifact {
  id: string;
  tenantId: string;
  artifactType:
    | "reconciliation_pattern"
    | "matching_rule"
    | "validation_baseline"
    | "drift_profile";
  sourceEntityType: string;
  sourceEntityIds: string[];
  derivedData: Record<string, unknown>;
  confidence: number;
  usageCount: number; // How many times this artifact has been used
  createdAt: Date;
  updatedAt: Date;
}

export interface DataGravityMetrics {
  tenantId: string;
  totalDataPoints: number;
  historicalDepth: number; // Days of history
  derivedArtifacts: number;
  longitudinalInsights: number;
  switchingCost: number; // Estimated cost to recreate data elsewhere
  dataValue: number; // Estimated value of accumulated data
}

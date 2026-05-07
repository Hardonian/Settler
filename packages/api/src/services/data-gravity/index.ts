import { supabase } from "../../infrastructure/supabase/client";
import { logError } from "../../utils/logger";
import { DataGravityMetrics } from "./types";
import { InsightsEngine } from "./insights";
import { DataGravityExporter } from "./exporter";

export * from "./types";
export * from "./analyzer";
export * from "./insights";
export * from "./exporter";

export class DataGravityService {
  private insightsEngine: InsightsEngine;
  private exporter: DataGravityExporter;

  constructor() {
    this.insightsEngine = new InsightsEngine();
    this.exporter = new DataGravityExporter();
  }

  /**
   * Record a data point and update longitudinal insights
   */
  async recordDataPoint(
    tenantId: string,
    entityType: string,
    entityId: string,
    metric: string,
    value: number,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const now = new Date();

      // Store raw data point
      await supabase.from("usage_events").insert({
        tenant_id: tenantId,
        event_type: `data_point:${entityType}:${metric}`,
        quantity: value,
        metadata: {
          entity_id: entityId,
          ...metadata,
        },
      });

      // Update or create longitudinal insight
      await this.insightsEngine.updateLongitudinalInsight(
        tenantId,
        entityType,
        entityId,
        metric,
        value,
        now
      );

      // Check for pattern detection
      await this.insightsEngine.detectPatterns(tenantId, entityType, entityId);
    } catch (error) {
      logError("Error recording data point", error);
    }
  }

  /**
   * Get data gravity metrics for a tenant
   */
  async getDataGravityMetrics(tenantId: string): Promise<DataGravityMetrics> {
    try {
      // Get total data points
      const { count: totalDataPoints } = await supabase
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      // Get historical depth
      const { data: oldest } = await supabase
        .from("usage_events")
        .select("timestamp")
        .eq("tenant_id", tenantId)
        .order("timestamp", { ascending: true })
        .limit(1)
        .single();

      const historicalDepth = oldest
        ? Math.floor(
            (new Date().getTime() - new Date(oldest.timestamp).getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      // Get derived artifacts count
      const { count: derivedArtifacts } = await supabase
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .like("event_type", "artifact:%");

      // Get longitudinal insights count
      const { count: longitudinalInsights } = await supabase
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .like("event_type", "insight:%");

      // Estimate switching cost (cost to recreate data elsewhere)
      // This is a function of data volume, complexity, and historical depth
      const switchingCost = this.estimateSwitchingCost(
        totalDataPoints || 0,
        historicalDepth,
        derivedArtifacts || 0
      );

      // Estimate data value (value of accumulated intelligence)
      const dataValue = this.estimateDataValue(
        totalDataPoints || 0,
        historicalDepth,
        derivedArtifacts || 0,
        longitudinalInsights || 0
      );

      return {
        tenantId,
        totalDataPoints: totalDataPoints || 0,
        historicalDepth,
        derivedArtifacts: derivedArtifacts || 0,
        longitudinalInsights: longitudinalInsights || 0,
        switchingCost,
        dataValue,
      };
    } catch (error) {
      logError("Error getting data gravity metrics", error);
      return {
        tenantId,
        totalDataPoints: 0,
        historicalDepth: 0,
        derivedArtifacts: 0,
        longitudinalInsights: 0,
        switchingCost: 0,
        dataValue: 0,
      };
    }
  }

  /**
   * Estimate switching cost
   */
  private estimateSwitchingCost(
    dataPoints: number,
    historicalDepth: number,
    derivedArtifacts: number
  ): number {
    // Base cost: $0.01 per 1000 data points
    const baseCost = (dataPoints / 1000) * 0.01;

    // Historical depth multiplier: deeper history = higher cost
    const depthMultiplier = 1 + (historicalDepth / 365) * 0.5;

    // Derived artifacts multiplier: more artifacts = higher cost
    const artifactMultiplier = 1 + derivedArtifacts * 0.1;

    return baseCost * depthMultiplier * artifactMultiplier;
  }

  /**
   * Estimate data value
   */
  private estimateDataValue(
    dataPoints: number,
    historicalDepth: number,
    derivedArtifacts: number,
    longitudinalInsights: number
  ): number {
    // Base value: $0.05 per 1000 data points
    const baseValue = (dataPoints / 1000) * 0.05;

    // Historical depth adds value
    const depthValue = historicalDepth * 0.1;

    // Derived artifacts add significant value
    const artifactValue = derivedArtifacts * 10;

    // Longitudinal insights add value
    const insightValue = longitudinalInsights * 5;

    return baseValue + depthValue + artifactValue + insightValue;
  }

  /**
   * Generate export (lossy - excludes derived artifacts and insights)
   */
  async generateExport(
    tenantId: string,
    format: "csv" | "json" = "json"
  ): Promise<{
    data: any[];
    metadata: {
      totalRecords: number;
      exportedAt: Date;
      lossy: boolean;
      excludedTypes: string[];
    };
  }> {
    return this.exporter.generateExport(tenantId, format);
  }
}

export const dataGravityService = new DataGravityService();

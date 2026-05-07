import { supabase } from "../../infrastructure/supabase/client";
import { logError } from "../../utils/logger";
import { calculateTrend, calculateConfidence, analyzePatterns } from "./analyzer";

export class InsightsEngine {
  /**
   * Update longitudinal insight
   */
  async updateLongitudinalInsight(
    tenantId: string,
    entityType: string,
    entityId: string | undefined,
    metric: string,
    value: number,
    timestamp: Date
  ): Promise<void> {
    try {
      // Get existing insight
      const { data: existing } = await supabase
        .from("usage_events")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("event_type", `insight:${entityType}:${metric}`)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        const historicalValues = (existing.metadata?.historicalValues || []) as Array<{
          date: string;
          value: number;
        }>;
        historicalValues.push({
          date: timestamp.toISOString(),
          value,
        });

        // Keep only last 365 days
        const oneYearAgo = new Date(timestamp);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const filteredValues = historicalValues.filter((v) => new Date(v.date) >= oneYearAgo);

        // Calculate trend
        const trend = calculateTrend(filteredValues);
        const confidence = calculateConfidence(filteredValues);

        // Update insight
        await supabase
          .from("usage_events")
          .update({
            quantity: value,
            metadata: {
              ...existing.metadata,
              historicalValues: filteredValues,
              trend,
              confidence,
              lastObserved: timestamp.toISOString(),
            },
            updated_at: timestamp.toISOString(),
          })
          .eq("id", existing.id);
      } else {
        // Create new insight
        await supabase.from("usage_events").insert({
          tenant_id: tenantId,
          event_type: `insight:${entityType}:${metric}`,
          quantity: value,
          metadata: {
            entity_id: entityId,
            historicalValues: [{ date: timestamp.toISOString(), value }],
            trend: "stable",
            confidence: 0.5,
            firstObserved: timestamp.toISOString(),
            lastObserved: timestamp.toISOString(),
          },
        });
      }
    } catch (error) {
      logError("Error updating longitudinal insight", error);
    }
  }

  /**
   * Detect patterns from historical data
   */
  async detectPatterns(tenantId: string, entityType: string, entityId: string): Promise<void> {
    try {
      // Get historical data for this entity
      const { data: historical } = await supabase
        .from("usage_events")
        .select("*")
        .eq("tenant_id", tenantId)
        .like("event_type", `data_point:${entityType}:%`)
        .eq("metadata->>entity_id", entityId)
        .order("timestamp", { ascending: false })
        .limit(100);

      if (!historical || historical.length < 10) {
        return; // Need at least 10 data points
      }

      // Detect patterns
      const patterns = analyzePatterns(historical);

      // Store derived artifacts
      for (const pattern of patterns) {
        await this.createDerivedArtifact(tenantId, entityType, entityId, pattern);
      }
    } catch (error) {
      logError("Error detecting patterns", error);
    }
  }

  /**
   * Create derived artifact
   */
  private async createDerivedArtifact(
    tenantId: string,
    entityType: string,
    entityId: string,
    pattern: { type: string; pattern: Record<string, unknown> }
  ): Promise<void> {
    try {
      // Check if artifact already exists
      const { data: existing } = await supabase
        .from("usage_events")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("event_type", `artifact:${entityType}:${pattern.type}`)
        .eq("metadata->>source_entity_id", entityId)
        .limit(1)
        .single();

      if (existing) {
        // Update existing artifact
        await supabase
          .from("usage_events")
          .update({
            metadata: {
              ...existing.metadata,
              derivedData: pattern.pattern,
              usageCount: (existing.metadata?.usageCount || 0) + 1,
              updated_at: new Date().toISOString(),
            },
          })
          .eq("id", existing.id);
      } else {
        // Create new artifact
        await supabase.from("usage_events").insert({
          tenant_id: tenantId,
          event_type: `artifact:${entityType}:${pattern.type}`,
          quantity: 1,
          metadata: {
            artifactType: pattern.type,
            sourceEntityType: entityType,
            sourceEntityId: entityId,
            derivedData: pattern.pattern,
            usageCount: 0,
            createdAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      logError("Error creating derived artifact", error);
    }
  }
}

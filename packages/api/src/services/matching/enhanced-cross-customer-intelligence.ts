/**
 * Enhanced Cross-Customer Intelligence
 *
 * Aggregates anonymized reconciliation patterns across all customers.
 * This creates a proprietary data moat that competitors cannot replicate.
 *
 * PHASE: Data Moat Reinforcement
 */

import { supabase } from "../../infrastructure/supabase/client";
import { logError, logInfo } from "../../utils/logger";
import { crossCustomerIntelligence } from "../network-effects/cross-customer-intelligence";

export interface ReconciliationPattern {
  sourceAdapter: string;
  targetAdapter: string;
  matchType: "exact" | "fuzzy" | "manual";
  averageConfidence: number;
  averageAmountDiff: number;
  averageDateDiff: number;
  frequency: number; // How many customers have this pattern
  firstSeen: Date;
  lastSeen: Date;
}

export interface PatternInsight {
  patternId: string;
  insight: string;
  confidence: number;
  recommendedAction: string;
}

/**
 * Enhanced Cross-Customer Intelligence Service
 *
 * Stores patterns in database and provides insights that improve matching
 */
export class EnhancedCrossCustomerIntelligence {
  /**
   * Record a reconciliation pattern (anonymized)
   */
  async recordPattern(
    tenantId: string,
    pattern: {
      sourceAdapter: string;
      targetAdapter: string;
      matchType: "exact" | "fuzzy" | "manual";
      confidence: number;
      amountDiff: number;
      dateDiff: number;
    }
  ): Promise<void> {
    try {
      // Check if tenant has opted in to pattern sharing
      const optedIn = await this.isOptedIn(tenantId);
      if (!optedIn) {
        return; // Skip if not opted in
      }

      // Create anonymized pattern hash
      const patternHash = this.hashPattern({
        sourceAdapter: pattern.sourceAdapter,
        targetAdapter: pattern.targetAdapter,
        matchType: pattern.matchType,
      });

      // Store pattern in database
      await supabase.from("usage_events").insert({
        tenant_id: tenantId,
        event_type: "cross_customer_pattern",
        quantity: 1,
        metadata: {
          patternHash,
          sourceAdapter: pattern.sourceAdapter,
          targetAdapter: pattern.targetAdapter,
          matchType: pattern.matchType,
          averageConfidence: pattern.confidence,
          averageAmountDiff: pattern.amountDiff,
          averageDateDiff: pattern.dateDiff,
          anonymized: true,
        },
        timestamp: new Date().toISOString(),
      });

      // Also submit to in-memory cross-customer intelligence
      crossCustomerIntelligence.submitPattern(tenantId, {
        type: "performance",
        data: {
          sourceAdapter: pattern.sourceAdapter,
          targetAdapter: pattern.targetAdapter,
          matchType: pattern.matchType,
          confidence: pattern.confidence,
        },
      });

      logInfo("Recorded cross-customer pattern", {
        tenantId,
        patternHash,
        sourceAdapter: pattern.sourceAdapter,
        targetAdapter: pattern.targetAdapter,
      });
    } catch (error) {
      logError("Failed to record cross-customer pattern", error, {
        tenantId,
      });
    }
  }

  /**
   * Get reconciliation pattern insights
   * Returns aggregated patterns across all customers (anonymized)
   */
  async getPatternInsights(
    sourceAdapter: string,
    targetAdapter: string
  ): Promise<PatternInsight[]> {
    try {
      // Query aggregated patterns from database
      const { data: patterns } = await supabase
        .from("usage_events")
        .select("metadata")
        .eq("event_type", "cross_customer_pattern")
        .eq("metadata->>sourceAdapter", sourceAdapter)
        .eq("metadata->>targetAdapter", targetAdapter);

      if (!patterns || patterns.length === 0) {
        return [];
      }

      // Aggregate patterns
      const aggregatedPatterns = new Map<string, ReconciliationPattern>();

      for (const pattern of patterns) {
        const metadata = pattern.metadata;
        const patternHash = metadata.patternHash;

        if (!aggregatedPatterns.has(patternHash)) {
          aggregatedPatterns.set(patternHash, {
            sourceAdapter: metadata.sourceAdapter,
            targetAdapter: metadata.targetAdapter,
            matchType: metadata.matchType,
            averageConfidence: metadata.averageConfidence || 0,
            averageAmountDiff: metadata.averageAmountDiff || 0,
            averageDateDiff: metadata.averageDateDiff || 0,
            frequency: 1,
            firstSeen: new Date(),
            lastSeen: new Date(),
          });
        } else {
          const existing = aggregatedPatterns.get(patternHash)!;
          existing.frequency += 1;
          existing.averageConfidence =
            (existing.averageConfidence * (existing.frequency - 1) +
              (metadata.averageConfidence || 0)) /
            existing.frequency;
          existing.averageAmountDiff =
            (existing.averageAmountDiff * (existing.frequency - 1) +
              (metadata.averageAmountDiff || 0)) /
            existing.frequency;
          existing.averageDateDiff =
            (existing.averageDateDiff * (existing.frequency - 1) +
              (metadata.averageDateDiff || 0)) /
            existing.frequency;
          existing.lastSeen = new Date();
        }
      }

      // Convert to insights
      const insights: PatternInsight[] = Array.from(aggregatedPatterns.values()).map((pattern) => {
        const insight = this.generateInsight(pattern);
        // Convert pattern to Record<string, unknown> for hashing
        const patternRecord: Record<string, unknown> = {
          sourceAdapter: pattern.sourceAdapter,
          targetAdapter: pattern.targetAdapter,
          matchType: pattern.matchType,
          averageConfidence: pattern.averageConfidence,
          averageAmountDiff: pattern.averageAmountDiff,
          averageDateDiff: pattern.averageDateDiff,
          frequency: pattern.frequency,
        };
        return {
          patternId: this.hashPattern(patternRecord),
          insight: insight.text,
          confidence: Math.min(1.0, pattern.frequency / 100), // Higher frequency = higher confidence
          recommendedAction: insight.action,
        };
      });

      return insights;
    } catch (error) {
      logError("Failed to get pattern insights", error);
      return [];
    }
  }

  /**
   * Get historical match rate for adapter pair
   * This is a proprietary feature that competitors cannot replicate
   */
  async getHistoricalMatchRate(sourceAdapter: string, targetAdapter: string): Promise<number> {
    try {
      const insights = await this.getPatternInsights(sourceAdapter, targetAdapter);

      if (insights.length === 0) {
        return 0.5; // Default to 50% if no data
      }

      // Calculate weighted average confidence
      const totalFrequency = insights.reduce((sum, insight) => sum + insight.confidence * 100, 0);
      const weightedConfidence = insights.reduce(
        (sum, insight) => sum + insight.confidence * insight.confidence * 100,
        0
      );

      return totalFrequency > 0 ? weightedConfidence / totalFrequency : 0.5;
    } catch (error) {
      logError("Failed to get historical match rate", error);
      return 0.5;
    }
  }

  /**
   * Opt in tenant to pattern sharing
   */
  async optIn(tenantId: string): Promise<void> {
    try {
      await supabase.from("usage_events").insert({
        tenant_id: tenantId,
        event_type: "cross_customer_opt_in",
        quantity: 1,
        metadata: {
          optedIn: true,
          optedInAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      crossCustomerIntelligence.optIn(tenantId);

      logInfo("Tenant opted in to cross-customer intelligence", { tenantId });
    } catch (error) {
      logError("Failed to opt in tenant", error, { tenantId });
    }
  }

  /**
   * Opt out tenant from pattern sharing
   */
  async optOut(tenantId: string): Promise<void> {
    try {
      await supabase.from("usage_events").insert({
        tenant_id: tenantId,
        event_type: "cross_customer_opt_out",
        quantity: 1,
        metadata: {
          optedOut: true,
          optedOutAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      crossCustomerIntelligence.optOut(tenantId);

      logInfo("Tenant opted out of cross-customer intelligence", { tenantId });
    } catch (error) {
      logError("Failed to opt out tenant", error, { tenantId });
    }
  }

  /**
   * Check if tenant has opted in
   */
  private async isOptedIn(tenantId: string): Promise<boolean> {
    try {
      const { data: optIn } = await supabase
        .from("usage_events")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("event_type", "cross_customer_opt_in")
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (!optIn) {
        return false;
      }

      // Check if there's a more recent opt-out
      const { data: optOut } = await supabase
        .from("usage_events")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("event_type", "cross_customer_opt_out")
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (optOut) {
        // Compare timestamps to see which is more recent
        const optInEvent = await supabase
          .from("usage_events")
          .select("timestamp")
          .eq("id", optIn.id)
          .single();

        const optOutEvent = await supabase
          .from("usage_events")
          .select("timestamp")
          .eq("id", optOut.id)
          .single();

        if (
          optInEvent.data &&
          optOutEvent.data &&
          new Date(optOutEvent.data.timestamp) > new Date(optInEvent.data.timestamp)
        ) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logError("Failed to check opt-in status", error, { tenantId });
      return false; // Default to not opted in
    }
  }

  /**
   * Hash pattern for anonymization
   */
  private hashPattern(pattern: Record<string, unknown>): string {
    const str = JSON.stringify(pattern, Object.keys(pattern).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate insight from pattern
   */
  private generateInsight(pattern: ReconciliationPattern): {
    text: string;
    action: string;
  } {
    const matchRate = pattern.averageConfidence;
    const frequency = pattern.frequency;

    let text = "";
    let action = "";

    if (frequency > 100 && matchRate > 0.9) {
      text = `This ${pattern.sourceAdapter} → ${pattern.targetAdapter} reconciliation pattern has been seen ${frequency} times with ${(matchRate * 100).toFixed(1)}% average confidence. This is a highly reliable pattern.`;
      action = "Use this pattern for high-confidence matching.";
    } else if (frequency > 50 && matchRate > 0.7) {
      text = `This ${pattern.sourceAdapter} → ${pattern.targetAdapter} reconciliation pattern has been seen ${frequency} times with ${(matchRate * 100).toFixed(1)}% average confidence.`;
      action = "Consider using this pattern for matching.";
    } else if (frequency > 10) {
      text = `This ${pattern.sourceAdapter} → ${pattern.targetAdapter} reconciliation pattern has been seen ${frequency} times.`;
      action = "Monitor this pattern for consistency.";
    } else {
      text = `This ${pattern.sourceAdapter} → ${pattern.targetAdapter} reconciliation pattern is new.`;
      action = "Review matches manually until pattern is established.";
    }

    return { text, action };
  }
}

export const enhancedCrossCustomerIntelligence = new EnhancedCrossCustomerIntelligence();

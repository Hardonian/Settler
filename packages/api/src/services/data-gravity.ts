/**
 * Data Gravity Service
 * 
 * PHASE 2: Data Gravity & Switching Friction
 * 
 * Creates accumulated intelligence that improves over time:
 * - Canonical internal data models
 * - Derived artifacts users cannot easily recreate
 * - Longitudinal insights (patterns over time, deltas, drift)
 * 
 * Goal: User value increases the longer they stay, exports are possible but lossy
 */

import { supabase } from '../infrastructure/supabase/client';
import { logError } from '../utils/logger';

export interface LongitudinalInsight {
  id: string;
  tenantId: string;
  insightType: 'pattern' | 'anomaly' | 'trend' | 'correlation' | 'baseline';
  entityType: string; // 'reconciliation', 'transaction', 'integration', etc.
  entityId?: string;
  metric: string;
  value: number;
  historicalValues: Array<{ date: Date; value: number }>;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
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
  artifactType: 'reconciliation_pattern' | 'matching_rule' | 'validation_baseline' | 'drift_profile';
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

export class DataGravityService {
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
      await supabase
        .from('usage_events')
        .insert({
          tenant_id: tenantId,
          event_type: `data_point:${entityType}:${metric}`,
          quantity: value,
          metadata: {
            entity_id: entityId,
            ...metadata,
          },
        });

      // Update or create longitudinal insight
      await this.updateLongitudinalInsight(tenantId, entityType, entityId, metric, value, now);

      // Check for pattern detection
      await this.detectPatterns(tenantId, entityType, entityId);
    } catch (error) {
      logError('Error recording data point', error);
    }
  }

  /**
   * Update longitudinal insight
   */
  private async updateLongitudinalInsight(
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
        .from('usage_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('event_type', `insight:${entityType}:${metric}`)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        const historicalValues = (existing.metadata?.historicalValues || []) as Array<{ date: string; value: number }>;
        historicalValues.push({
          date: timestamp.toISOString(),
          value,
        });

        // Keep only last 365 days
        const oneYearAgo = new Date(timestamp);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const filteredValues = historicalValues.filter(
          (v) => new Date(v.date) >= oneYearAgo
        );

        // Calculate trend
        const trend = this.calculateTrend(filteredValues);
        const confidence = this.calculateConfidence(filteredValues);

        // Update insight
        await supabase
          .from('usage_events')
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
          .eq('id', existing.id);
      } else {
        // Create new insight
        await supabase
          .from('usage_events')
          .insert({
            tenant_id: tenantId,
            event_type: `insight:${entityType}:${metric}`,
            quantity: value,
            metadata: {
              entity_id: entityId,
              historicalValues: [{ date: timestamp.toISOString(), value }],
              trend: 'stable',
              confidence: 0.5,
              firstObserved: timestamp.toISOString(),
              lastObserved: timestamp.toISOString(),
            },
          });
      }
    } catch (error) {
      logError('Error updating longitudinal insight', error);
    }
  }

  /**
   * Detect patterns from historical data
   */
  private async detectPatterns(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<void> {
    try {
      // Get historical data for this entity
      const { data: historical } = await supabase
        .from('usage_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .like('event_type', `data_point:${entityType}:%`)
        .eq('metadata->>entity_id', entityId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!historical || historical.length < 10) {
        return; // Need at least 10 data points
      }

      // Detect patterns
      const patterns = this.analyzePatterns(historical);

      // Store derived artifacts
      for (const pattern of patterns) {
        await this.createDerivedArtifact(tenantId, entityType, entityId, pattern);
      }
    } catch (error) {
      logError('Error detecting patterns', error);
    }
  }

  /**
   * Analyze patterns in historical data
   */
  private analyzePatterns(historical: any[]): Array<{ type: string; pattern: Record<string, unknown> }> {
    const patterns: Array<{ type: string; pattern: Record<string, unknown> }> = [];

    // Simple pattern detection: recurring values, trends, cycles
    const values = historical.map((h) => Number(h.quantity) || 0);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect volatility
    if (stdDev / avg > 0.3) {
      patterns.push({
        type: 'volatile',
        pattern: {
          average: avg,
          stdDev,
          coefficientOfVariation: stdDev / avg,
        },
      });
    }

    // Detect trends (simple linear regression)
    if (values.length >= 5) {
      const trend = this.detectLinearTrend(values);
      if (Math.abs(trend.slope) > avg * 0.1) {
        patterns.push({
          type: 'trend',
          pattern: {
            slope: trend.slope,
            direction: trend.slope > 0 ? 'increasing' : 'decreasing',
            strength: Math.abs(trend.slope) / avg,
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Detect linear trend
   */
  private detectLinearTrend(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    if (n === 0) {
      return { slope: 0, intercept: 0 };
    }
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => {
      const value = values[i];
      return sum + xi * (value ?? 0);
    }, 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate trend from historical values
   */
  private calculateTrend(
    historicalValues: Array<{ date: string; value: number }>
  ): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (historicalValues.length < 2) return 'stable';

    const values = historicalValues.map((v) => v.value);
    const trend = this.detectLinearTrend(values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const threshold = avg * 0.1;

    if (Math.abs(trend.slope) < threshold) {
      // Check volatility
      const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      return stdDev / avg > 0.3 ? 'volatile' : 'stable';
    }

    return trend.slope > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Calculate confidence based on data quality
   */
  private calculateConfidence(
    historicalValues: Array<{ date: string; value: number }>
  ): number {
    if (historicalValues.length === 0) return 0;

    // More data points = higher confidence
    const dataPointsScore = Math.min(historicalValues.length / 100, 1);

    // Consistency = higher confidence
    const values = historicalValues.map((v) => v.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = Math.max(0, 1 - stdDev / avg);

    // Recency = higher confidence (more recent data is better)
    const now = new Date();
    const lastValue = historicalValues[historicalValues.length - 1];
    const daysSinceLastUpdate = lastValue 
      ? (now.getTime() - new Date(lastValue.date).getTime()) / (1000 * 60 * 60 * 24)
      : 30; // Default to max if no data
    const recencyScore = Math.max(0, 1 - daysSinceLastUpdate / 30);

    return (dataPointsScore * 0.4 + consistencyScore * 0.4 + recencyScore * 0.2);
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
        .from('usage_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('event_type', `artifact:${entityType}:${pattern.type}`)
        .eq('metadata->>source_entity_id', entityId)
        .limit(1)
        .single();

      if (existing) {
        // Update existing artifact
        await supabase
          .from('usage_events')
          .update({
            metadata: {
              ...existing.metadata,
              derivedData: pattern.pattern,
              usageCount: (existing.metadata?.usageCount || 0) + 1,
              updated_at: new Date().toISOString(),
            },
          })
          .eq('id', existing.id);
      } else {
        // Create new artifact
        await supabase
          .from('usage_events')
          .insert({
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
      logError('Error creating derived artifact', error);
    }
  }

  /**
   * Get data gravity metrics for a tenant
   */
  async getDataGravityMetrics(tenantId: string): Promise<DataGravityMetrics> {
    try {
      // Get total data points
      const { count: totalDataPoints } = await supabase
        .from('usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Get historical depth
      const { data: oldest } = await supabase
        .from('usage_events')
        .select('timestamp')
        .eq('tenant_id', tenantId)
        .order('timestamp', { ascending: true })
        .limit(1)
        .single();

      const historicalDepth = oldest
        ? Math.floor((new Date().getTime() - new Date(oldest.timestamp).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Get derived artifacts count
      const { count: derivedArtifacts } = await supabase
        .from('usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .like('event_type', 'artifact:%');

      // Get longitudinal insights count
      const { count: longitudinalInsights } = await supabase
        .from('usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .like('event_type', 'insight:%');

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
      logError('Error getting data gravity metrics', error);
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
  async generateExport(tenantId: string, _format: 'csv' | 'json' = 'json'): Promise<{
    data: any[];
    metadata: {
      totalRecords: number;
      exportedAt: Date;
      lossy: boolean;
      excludedTypes: string[];
    };
  }> {
    try {
      // Export only raw data points, not derived artifacts or insights
      const { data: rawData } = await supabase
        .from('usage_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .like('event_type', 'data_point:%')
        .order('timestamp', { ascending: true });

      return {
        data: rawData || [],
        metadata: {
          totalRecords: rawData?.length || 0,
          exportedAt: new Date(),
          lossy: true,
          excludedTypes: ['artifact', 'insight', 'pattern', 'baseline'],
        },
      };
    } catch (error) {
      logError('Error generating export', error);
      throw error;
    }
  }
}

export const dataGravityService = new DataGravityService();

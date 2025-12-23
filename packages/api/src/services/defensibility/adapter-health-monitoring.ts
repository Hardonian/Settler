/**
 * Adapter Health Monitoring Service
 * 
 * Proactively monitors adapter health and tracks maintenance burden.
 * This demonstrates the value of Settler's adapter maintenance to customers.
 * 
 * PHASE: Integration & Adapter Gravity Reinforcement
 * 
 * Based on narrative compression requirements:
 * - Track adapter health metrics
 * - Proactively detect API changes
 * - Monitor adapter maintenance burden
 * - Demonstrate value of Settler's adapter maintenance
 */

import { logError, logInfo } from '../../utils/logger';
import { query } from '../../db';

export interface AdapterHealthMetrics {
  adapterType: string;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastChecked: Date;
  successRate: number; // 0-1
  averageResponseTime: number; // milliseconds
  errorRate: number; // 0-1
  apiChangesDetected: number;
  maintenanceEvents: number;
  lastMaintenanceEvent?: Date;
}

export interface AdapterMaintenanceEvent {
  adapterType: string;
  eventType: 'api_change' | 'bug_fix' | 'feature_update' | 'security_patch';
  description: string;
  affectedCustomers: number;
  resolvedAt: Date;
}

/**
 * Adapter Health Monitoring Service
 * 
 * Tracks adapter health and maintenance to demonstrate value
 */
export class AdapterHealthMonitoringService {
  /**
   * Record adapter health check
   */
  async recordHealthCheck(
    adapterType: string,
    metrics: {
      success: boolean;
      responseTime: number;
      error?: string;
    }
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO usage_events (
          tenant_id, event_type, quantity, metadata, timestamp
        ) VALUES (
          'system', 'adapter_health_check', 1, $1, NOW()
        )`,
        [
          JSON.stringify({
            adapterType,
            success: metrics.success,
            responseTime: metrics.responseTime,
            error: metrics.error,
            timestamp: new Date().toISOString(),
          }),
        ]
      );

      logInfo('Recorded adapter health check', {
        adapterType,
        success: metrics.success,
        responseTime: metrics.responseTime,
      });
    } catch (error) {
      logError('Failed to record adapter health check', error, { adapterType });
    }
  }

  /**
   * Get adapter health metrics
   */
  async getAdapterHealth(adapterType: string): Promise<AdapterHealthMetrics> {
    try {
      // Get health check events from last 24 hours
      const healthChecks = await query(
        `SELECT metadata
        FROM usage_events
        WHERE event_type = 'adapter_health_check'
        AND metadata->>'adapterType' = $1
        AND timestamp > NOW() - INTERVAL '24 hours'
        ORDER BY timestamp DESC`,
        [adapterType]
      );

      if (healthChecks.length === 0) {
        return {
          adapterType,
          healthStatus: 'unknown',
          lastChecked: new Date(),
          successRate: 0,
          averageResponseTime: 0,
          errorRate: 0,
          apiChangesDetected: 0,
          maintenanceEvents: 0,
        };
      }

      const checks = healthChecks.map(
        (h) => JSON.parse((h as { metadata: string }).metadata) as {
          success: boolean;
          responseTime: number;
          error?: string;
        }
      );

      const successCount = checks.filter((c) => c.success).length;
      const successRate = checks.length > 0 ? successCount / checks.length : 0;
      const averageResponseTime =
        checks.reduce((sum, c) => sum + c.responseTime, 0) / checks.length;
      const errorRate = checks.filter((c) => c.error).length / checks.length;

      // Determine health status
      let healthStatus: 'healthy' | 'degraded' | 'unhealthy';
      if (successRate >= 0.95 && errorRate < 0.05) {
        healthStatus = 'healthy';
      } else if (successRate >= 0.8 && errorRate < 0.2) {
        healthStatus = 'degraded';
      } else {
        healthStatus = 'unhealthy';
      }

      // Get maintenance events
      const maintenanceEvents = await query(
        `SELECT COUNT(*) as count
        FROM usage_events
        WHERE event_type = 'adapter_maintenance'
        AND metadata->>'adapterType' = $1
        AND timestamp > NOW() - INTERVAL '30 days'`,
        [adapterType]
      );

      const maintenanceCount = (maintenanceEvents[0] as { count: number }).count || 0;

      return {
        adapterType,
        healthStatus,
        lastChecked: new Date(),
        successRate,
        averageResponseTime,
        errorRate,
        apiChangesDetected: 0, // TODO: Track API changes
        maintenanceEvents: maintenanceCount,
      };
    } catch (error) {
      logError('Failed to get adapter health', error, { adapterType });
      return {
        adapterType,
        healthStatus: 'unknown',
        lastChecked: new Date(),
        successRate: 0,
        averageResponseTime: 0,
        errorRate: 0,
        apiChangesDetected: 0,
        maintenanceEvents: 0,
      };
    }
  }

  /**
   * Record adapter maintenance event
   * 
   * Tracks when adapters are updated, demonstrating maintenance value
   */
  async recordMaintenanceEvent(
    adapterType: string,
    event: AdapterMaintenanceEvent
  ): Promise<void> {
    try {
      // Count affected customers
      const customerCount = await query(
        `SELECT COUNT(DISTINCT tenant_id) as count
        FROM ingestion_sources
        WHERE adapter_type = $1
        AND deleted_at IS NULL`,
        [adapterType]
      );

      const affectedCustomers = (customerCount[0] as { count: number }).count || 0;

      await query(
        `INSERT INTO usage_events (
          tenant_id, event_type, quantity, metadata, timestamp
        ) VALUES (
          'system', 'adapter_maintenance', 1, $1, NOW()
        )`,
        [
          JSON.stringify({
            adapterType,
            eventType: event.eventType,
            description: event.description,
            affectedCustomers,
            resolvedAt: event.resolvedAt.toISOString(),
          }),
        ]
      );

      logInfo('Recorded adapter maintenance event', {
        adapterType,
        eventType: event.eventType,
        affectedCustomers,
      });
    } catch (error) {
      logError('Failed to record adapter maintenance event', error, { adapterType });
    }
  }

  /**
   * Get maintenance burden metrics
   * 
   * Demonstrates the value of Settler's adapter maintenance
   */
  async getMaintenanceBurdenMetrics(): Promise<{
    totalAdapters: number;
    totalMaintenanceEvents: number;
    averageEventsPerAdapter: number;
    totalAffectedCustomers: number;
    maintenanceCostEstimate: number; // Estimated cost if customers maintained themselves
  }> {
    try {
      // Get all adapters
      const adaptersResult = await query(
        `SELECT DISTINCT adapter_type
        FROM ingestion_sources
        WHERE deleted_at IS NULL`,
        []
      );

      const totalAdapters = adaptersResult.length;

      // Get maintenance events from last 30 days
      const maintenanceEvents = await query(
        `SELECT metadata
        FROM usage_events
        WHERE event_type = 'adapter_maintenance'
        AND timestamp > NOW() - INTERVAL '30 days'`,
        []
      );

      const totalMaintenanceEvents = maintenanceEvents.length;
      const averageEventsPerAdapter =
        totalAdapters > 0 ? totalMaintenanceEvents / totalAdapters : 0;

      // Calculate total affected customers
      let totalAffectedCustomers = 0;
      for (const event of maintenanceEvents) {
        const metadata = JSON.parse((event as { metadata: string }).metadata) as {
          affectedCustomers: number;
        };
        totalAffectedCustomers += metadata.affectedCustomers || 0;
      }

      // Estimate maintenance cost (200-400 hours/year per adapter × $100/hour)
      const maintenanceCostEstimate = totalAdapters * 300 * 100; // $30K per adapter per year

      return {
        totalAdapters,
        totalMaintenanceEvents,
        averageEventsPerAdapter,
        totalAffectedCustomers,
        maintenanceCostEstimate,
      };
    } catch (error) {
      logError('Failed to get maintenance burden metrics', error);
      return {
        totalAdapters: 0,
        totalMaintenanceEvents: 0,
        averageEventsPerAdapter: 0,
        totalAffectedCustomers: 0,
        maintenanceCostEstimate: 0,
      };
    }
  }
}

export const adapterHealthMonitoringService = new AdapterHealthMonitoringService();

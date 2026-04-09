/**
 * Automation Gravity Service
 *
 * PHASE 4: Irreversible Automation
 *
 * Creates configuration gravity and progressive automation:
 * - Configuration accumulates over time
 * - More automation = less manual effort
 * - Competitor onboarding feels expensive
 *
 * Goal: Onboarding cost is front-loaded, ongoing value compounds
 */

import { supabase } from "../infrastructure/supabase/client";
import { logError } from "../utils/logger";

export interface AutomationConfig {
  id: string;
  tenantId: string;
  configType: "mapping" | "rule" | "transformation" | "validation" | "schedule";
  configKey: string;
  configValue: Record<string, unknown>;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationGravityMetrics {
  tenantId: string;
  totalConfigs: number;
  activeAutomations: number;
  manualInterventions: number;
  automationEfficiency: number; // 0-1, higher = more automated
  onboardingCost: number; // Estimated cost to recreate configs elsewhere
  timeToValue: number; // Days until automation provides value
}

export class AutomationGravityService {
  /**
   * Store configuration (creates gravity)
   */
  async storeConfiguration(
    tenantId: string,
    configType: AutomationConfig["configType"],
    configKey: string,
    configValue: Record<string, unknown>
  ): Promise<AutomationConfig> {
    try {
      // Check if config exists
      const { data: existing } = await supabase
        .from("usage_events")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("event_type", `config:${configType}`)
        .eq("metadata->>config_key", configKey)
        .limit(1)
        .single();

      if (existing) {
        // Update existing config
        await supabase
          .from("usage_events")
          .update({
            metadata: {
              ...existing.metadata,
              config_value: configValue,
              usage_count: (existing.metadata?.usage_count || 0) + 1,
              last_used: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        return {
          id: existing.id,
          tenantId,
          configType,
          configKey,
          configValue,
          usageCount: (existing.metadata?.usage_count || 0) + 1,
          lastUsed: new Date(),
          createdAt: new Date(existing.created_at),
          updatedAt: new Date(),
        };
      }

      // Create new config
      const { data: newConfig } = await supabase
        .from("usage_events")
        .insert({
          tenant_id: tenantId,
          event_type: `config:${configType}`,
          quantity: 1,
          metadata: {
            config_type: configType,
            config_key: configKey,
            config_value: configValue,
            usage_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      return {
        id: newConfig!.id,
        tenantId,
        configType,
        configKey,
        configValue,
        usageCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logError("Error storing configuration", error);
      throw error;
    }
  }

  /**
   * Record configuration usage (increases gravity)
   */
  async recordConfigUsage(
    tenantId: string,
    configType: AutomationConfig["configType"],
    configKey: string
  ): Promise<void> {
    try {
      const { data: config } = await supabase
        .from("usage_events")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("event_type", `config:${configType}`)
        .eq("metadata->>config_key", configKey)
        .limit(1)
        .single();

      if (config) {
        await supabase
          .from("usage_events")
          .update({
            metadata: {
              ...config.metadata,
              usage_count: (config.metadata?.usage_count || 0) + 1,
              last_used: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", config.id);
      }
    } catch (error) {
      logError("Error recording config usage", error);
    }
  }

  /**
   * Record manual intervention (decreases automation efficiency)
   */
  async recordManualIntervention(
    tenantId: string,
    entityType: string,
    entityId: string,
    reason: string
  ): Promise<void> {
    try {
      await supabase.from("usage_events").insert({
        tenant_id: tenantId,
        event_type: "manual_intervention",
        quantity: 1,
        metadata: {
          entity_type: entityType,
          entity_id: entityId,
          reason,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logError("Error recording manual intervention", error);
    }
  }

  /**
   * Record automation success (increases efficiency)
   */
  async recordAutomationSuccess(
    tenantId: string,
    automationType: string,
    entityId: string,
    timeSaved: number // seconds
  ): Promise<void> {
    try {
      await supabase.from("usage_events").insert({
        tenant_id: tenantId,
        event_type: "automation_success",
        quantity: timeSaved,
        metadata: {
          automation_type: automationType,
          entity_id: entityId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logError("Error recording automation success", error);
    }
  }

  /**
   * Get automation gravity metrics
   */
  async getAutomationGravityMetrics(tenantId: string): Promise<AutomationGravityMetrics> {
    try {
      // Get total configs
      const { count: totalConfigs } = await supabase
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .like("event_type", "config:%");

      // Get active automations
      const { count: activeAutomations } = await supabase
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .like("event_type", "automation_hook:%")
        .eq("metadata->>is_active", true);

      // Get manual interventions
      const { count: manualInterventions } = await supabase
        .from("usage_events")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("event_type", "manual_intervention");

      // Calculate automation efficiency
      const totalOperations = (activeAutomations || 0) + (manualInterventions || 0);
      const automationEfficiency =
        totalOperations > 0 ? (activeAutomations || 0) / totalOperations : 0;

      // Estimate onboarding cost
      const onboardingCost = this.estimateOnboardingCost(totalConfigs || 0, activeAutomations || 0);

      // Estimate time to value
      const timeToValue = this.estimateTimeToValue(totalConfigs || 0, activeAutomations || 0);

      return {
        tenantId,
        totalConfigs: totalConfigs || 0,
        activeAutomations: activeAutomations || 0,
        manualInterventions: manualInterventions || 0,
        automationEfficiency,
        onboardingCost,
        timeToValue,
      };
    } catch (error) {
      logError("Error getting automation gravity metrics", error);
      return {
        tenantId,
        totalConfigs: 0,
        activeAutomations: 0,
        manualInterventions: 0,
        automationEfficiency: 0,
        onboardingCost: 0,
        timeToValue: 0,
      };
    }
  }

  /**
   * Estimate onboarding cost (cost to recreate configs elsewhere)
   */
  private estimateOnboardingCost(configs: number, automations: number): number {
    // Base cost: $100 per config (time to recreate)
    const configCost = configs * 100;

    // Automation cost: $500 per automation (more complex to recreate)
    const automationCost = automations * 500;

    return configCost + automationCost;
  }

  /**
   * Estimate time to value (days until automation provides value)
   */
  private estimateTimeToValue(configs: number, automations: number): number {
    // More configs and automations = faster time to value
    // Base: 30 days
    // Each config reduces by 1 day (min 7 days)
    // Each automation reduces by 2 days (min 7 days)
    const baseDays = 30;
    const configReduction = Math.min(configs, 20); // Max 20 days reduction
    const automationReduction = Math.min(automations * 2, 10); // Max 10 days reduction
    return Math.max(7, baseDays - configReduction - automationReduction);
  }

  /**
   * Get progressive automation suggestions
   */
  async getProgressiveAutomationSuggestions(tenantId: string): Promise<
    Array<{
      type: string;
      description: string;
      estimatedTimeSaved: number;
      priority: "high" | "medium" | "low";
    }>
  > {
    try {
      // Analyze manual interventions to suggest automations
      const { data: interventions } = await supabase
        .from("usage_events")
        .select("metadata")
        .eq("tenant_id", tenantId)
        .eq("event_type", "manual_intervention")
        .order("created_at", { ascending: false })
        .limit(100);

      const suggestions: Array<{
        type: string;
        description: string;
        estimatedTimeSaved: number;
        priority: "high" | "medium" | "low";
      }> = [];

      // Group interventions by reason
      const interventionGroups = new Map<string, number>();
      interventions?.forEach((i) => {
        const reason = i.metadata?.reason as string;
        if (reason) {
          interventionGroups.set(reason, (interventionGroups.get(reason) || 0) + 1);
        }
      });

      // Generate suggestions based on common interventions
      interventionGroups.forEach((count, reason) => {
        if (count >= 5) {
          suggestions.push({
            type: "automation",
            description: `Automate ${reason} (${count} manual interventions)`,
            estimatedTimeSaved: count * 300, // 5 minutes per intervention
            priority: count >= 10 ? "high" : count >= 7 ? "medium" : "low",
          });
        }
      });

      return suggestions;
    } catch (error) {
      logError("Error getting progressive automation suggestions", error);
      return [];
    }
  }
}

export const automationGravityService = new AutomationGravityService();

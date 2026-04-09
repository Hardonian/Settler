/**
 * Governance Layer
 *
 * Version pinning, immutability zones, migration guardrails, audit trails
 * Part 11: Resilience & Zero-Fault Hardening
 */

import { PrismaClient } from "@prisma/client";
import { logInfo } from "../../utils/logger";

export type ResourceType = "workflow" | "template" | "transform" | "mapping";

export interface GovernanceRule {
  type: "version_pinning" | "immutability" | "migration_guardrail" | "audit_requirement";
  resourceType: ResourceType;
  resourceId: string;
  rule: Record<string, unknown>;
}

export interface EvolutionEvent {
  type: "workflow_update" | "template_change" | "transform_modification" | "migration";
  resourceId: string;
  oldVersion: string;
  newVersion: string;
  timestamp: Date;
  actor: string;
  changes: Array<Record<string, unknown>>;
}

export class GovernanceLayer {
  private _prisma: PrismaClient;
  private rules: Map<string, GovernanceRule[]> = new Map();
  private evolutionEvents: EvolutionEvent[] = [];

  constructor(prisma: PrismaClient) {
    this._prisma = prisma;
    // Reserved for future database operations
    void this._prisma;
  }

  /**
   * Pin version
   */
  async pinVersion(resourceType: ResourceType, resourceId: string, version: string): Promise<void> {
    const rule: GovernanceRule = {
      type: "version_pinning",
      resourceType,
      resourceId,
      rule: { version },
    };

    this.addRule(resourceId, rule);
    logInfo("Version pinned", { resourceType, resourceId, version });
  }

  /**
   * Create immutability zone
   */
  async createImmutabilityZone(resourceType: ResourceType, resourceId: string): Promise<void> {
    const rule: GovernanceRule = {
      type: "immutability",
      resourceType,
      resourceId,
      rule: { immutable: true },
    };

    this.addRule(resourceId, rule);
    logInfo("Immutability zone created", { resourceType, resourceId });
  }

  /**
   * Add migration guardrail
   */
  async addMigrationGuardrail(
    resourceType: ResourceType,
    resourceId: string,
    guardrail: {
      allowBreakingChanges: boolean;
      requireApproval: boolean;
      maxVersionJump: number;
    }
  ): Promise<void> {
    const rule: GovernanceRule = {
      type: "migration_guardrail",
      resourceType,
      resourceId,
      rule: guardrail,
    };

    this.addRule(resourceId, rule);
    logInfo("Migration guardrail added", { resourceType, resourceId });
  }

  /**
   * Check if change is allowed
   */
  async isChangeAllowed(
    _resourceType: ResourceType,
    resourceId: string,
    proposedChange: Record<string, unknown>
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const rules = this.getRules(resourceId);

    // Check immutability
    const immutabilityRule = rules.find((r) => r.type === "immutability");
    if (immutabilityRule) {
      return {
        allowed: false,
        reason: "Resource is in immutability zone",
      };
    }

    // Check version pinning
    const versionRule = rules.find((r) => r.type === "version_pinning");
    if (versionRule && proposedChange.version !== versionRule.rule.version) {
      return {
        allowed: false,
        reason: `Version is pinned to ${versionRule.rule.version}`,
      };
    }

    // Check migration guardrails
    const migrationRule = rules.find((r) => r.type === "migration_guardrail");
    if (migrationRule) {
      const guardrail = migrationRule.rule;

      if (proposedChange.breakingChange && !guardrail.allowBreakingChanges) {
        return {
          allowed: false,
          reason: "Breaking changes not allowed",
        };
      }

      if (guardrail.requireApproval) {
        // TODO: Check for approval
        return {
          allowed: false,
          reason: "Approval required",
        };
      }

      const maxVersionJump =
        typeof guardrail.maxVersionJump === "number" ? guardrail.maxVersionJump : 0;
      const versionJump =
        typeof proposedChange.versionJump === "number" ? proposedChange.versionJump : 0;
      if (versionJump > maxVersionJump) {
        return {
          allowed: false,
          reason: `Version jump exceeds maximum (${maxVersionJump})`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Log evolution event
   */
  async logEvolutionEvent(event: EvolutionEvent): Promise<void> {
    this.evolutionEvents.push(event);
    logInfo("Evolution event logged", { event });
  }

  /**
   * Get evolution history
   */
  getEvolutionHistory(resourceId: string): EvolutionEvent[] {
    return this.evolutionEvents.filter((e) => e.resourceId === resourceId);
  }

  /**
   * Add rule
   */
  private addRule(resourceId: string, rule: GovernanceRule): void {
    if (!this.rules.has(resourceId)) {
      this.rules.set(resourceId, []);
    }
    this.rules.get(resourceId)!.push(rule);
  }

  /**
   * Get rules
   */
  private getRules(resourceId: string): GovernanceRule[] {
    return this.rules.get(resourceId) || [];
  }
}

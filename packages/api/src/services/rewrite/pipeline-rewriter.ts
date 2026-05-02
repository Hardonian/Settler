/**
 * Pipeline Auto-Rewrite Engine
 *
 * Recognizes outdated pipelines and rewrites them
 * Part 8: Self-Rewriting OS & Meta-Orchestration
 */

import { PrismaClient } from "@prisma/client";
import { logInfo, logError } from "../../utils/logger";

export interface PipelineRewrite {
  pipelineId: string;
  currentVersion: string;
  targetVersion: string;
  changes: PipelineChange[];
  backwardCompatible: boolean;
  risk: "low" | "medium" | "high";
}

export interface PipelineChange {
  type: "node_upgrade" | "logic_rewrite" | "patch" | "optimization";
  nodeId: string;
  description: string;
  oldLogic: Record<string, unknown>;
  newLogic: Record<string, unknown>;
}

interface OutdatedPattern {
  type: "outdated_node" | "incompatible_node" | "inefficient_logic";
  nodeId: string;
  oldLogic: Record<string, unknown>;
  newLogic: Record<string, unknown>;
}

interface WorkflowStep {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

interface WorkflowRun {
  workflowId: string;
  steps?: WorkflowStep[];
  [key: string]: unknown;
}

export class PipelineRewriter {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Analyze and rewrite outdated pipelines
   */
  async rewritePipelines(): Promise<PipelineRewrite[]> {
    const rewrites: PipelineRewrite[] = [];

    // Find workflows with old versions
    const workflows = await this.prisma.workflowRun.findMany({
      take: 1000,
      orderBy: { startedAt: "desc" },
    });

    // Group by workflow ID
    const workflowGroups = new Map<string, typeof workflows>();
    for (const workflow of workflows) {
      const id = workflow.workflowId;
      if (!workflowGroups.has(id)) {
        workflowGroups.set(id, []);
      }
      workflowGroups.get(id)!.push(workflow);
    }

    // Analyze each workflow for rewrite opportunities
    for (const [workflowId, runs] of workflowGroups.entries()) {
      const rewrite = await this.analyzeWorkflow(workflowId, runs);
      if (rewrite) {
        rewrites.push(rewrite);
      }
    }

    return rewrites;
  }

  /**
   * Analyze workflow for rewrite opportunities
   */
  private async analyzeWorkflow(
    workflowId: string,
    runs: Array<{ workflowId: string; [key: string]: unknown }>
  ): Promise<PipelineRewrite | null> {
    // Check for outdated patterns
    const outdatedPatterns = this.detectOutdatedPatterns(runs);

    if (outdatedPatterns.length === 0) {
      return null;
    }

    const changes: PipelineChange[] = [];

    // Upgrade outdated nodes
    for (const pattern of outdatedPatterns) {
      if (pattern.type === "outdated_node") {
        changes.push({
          type: "node_upgrade",
          nodeId: pattern.nodeId,
          description: `Upgrade ${pattern.nodeId} to latest version`,
          oldLogic: pattern.oldLogic,
          newLogic: pattern.newLogic,
        });
      } else if (pattern.type === "incompatible_node") {
        changes.push({
          type: "patch",
          nodeId: pattern.nodeId,
          description: `Patch incompatible node ${pattern.nodeId}`,
          oldLogic: pattern.oldLogic,
          newLogic: pattern.newLogic,
        });
      }
    }

    return {
      pipelineId: workflowId,
      currentVersion: "1.0.0",
      targetVersion: "2.0.0",
      changes,
      backwardCompatible: true,
      risk: changes.length > 5 ? "medium" : "low",
    };
  }

  /**
   * Detect outdated patterns in workflow runs
   */
  private detectOutdatedPatterns(runs: WorkflowRun[]): OutdatedPattern[] {
    const patterns: OutdatedPattern[] = [];

    // Analyze step configurations
    for (const run of runs) {
      const steps = run.steps || [];
      for (const step of steps) {
        // Check for deprecated step types
        if (this.isDeprecatedStepType(step.type)) {
          patterns.push({
            type: "outdated_node",
            nodeId: step.id,
            oldLogic: step,
            newLogic: this.upgradeStep(step),
          });
        }

        // Check for incompatible configurations
        if (this.isIncompatibleConfig(step)) {
          patterns.push({
            type: "incompatible_node",
            nodeId: step.id,
            oldLogic: step,
            newLogic: this.patchStep(step),
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Check if step type is deprecated
   */
  private isDeprecatedStepType(type: string): boolean {
    const deprecatedTypes = ["legacy_transform", "old_validator"];
    return deprecatedTypes.includes(type);
  }

  /**
   * Upgrade step to new version
   */
  private upgradeStep(step: WorkflowStep): Record<string, unknown> {
    // Map old step types to new ones
    const typeMapping: Record<string, string> = {
      legacy_transform: "transform",
      old_validator: "validate",
    };

    return {
      ...step,
      type: typeMapping[step.type] || step.type,
      version: "2.0.0",
    };
  }

  /**
   * Check if step has incompatible configuration
   */
  private isIncompatibleConfig(step: WorkflowStep): boolean {
    // Check for incompatible config patterns
    if (step.config && typeof step.config === "object" && "legacyFormat" in step.config) {
      return Boolean(step.config.legacyFormat);
    }
    return false;
  }

  /**
   * Patch step to fix incompatibility
   */
  private patchStep(step: WorkflowStep): Record<string, unknown> {
    return {
      ...step,
      config: {
        ...(step.config || {}),
        legacyFormat: false,
        migrated: true,
      },
    };
  }

  /**
   * Apply rewrite to pipeline
   */
  async applyRewrite(rewrite: PipelineRewrite): Promise<{ success: boolean; updatedWorkflow?: any }> {
    try {
      // Update workflow in database
      const workflow = await (this.prisma as any).workflow?.findUnique?.({
        where: { id: rewrite.pipelineId },
      });

      if (!workflow) {
        throw new Error(`Workflow ${rewrite.pipelineId} not found`);
      }

      // Apply changes to workflow config
      const updatedConfig = this.applyChangesToConfig(workflow.config, rewrite.changes);

      // Update workflow
      const updated = await (this.prisma as any).workflow?.update?.({
        where: { id: rewrite.pipelineId },
        data: {
          config: updatedConfig,
          version: rewrite.targetVersion,
          updatedAt: new Date(),
        },
      });

      logInfo("Pipeline rewrite applied", { pipelineId: rewrite.pipelineId, version: rewrite.targetVersion });
      return { success: true, updatedWorkflow: updated };
    } catch (error) {
      logError("Pipeline rewrite failed", { pipelineId: rewrite.pipelineId, error });
      return { success: false };
    }
  }

  private applyChangesToConfig(config: any, changes: any[]): any {
    let updated = typeof config === 'string' ? JSON.parse(config) : { ...config };
    for (const change of changes) {
      if (change.type === 'patch' && change.nodeId) {
        // Apply patch to specific node
        updated.nodes = updated.nodes || [];
        const nodeIdx = updated.nodes.findIndex((n: any) => n.id === change.nodeId);
        if (nodeIdx >= 0) {
          updated.nodes[nodeIdx].logic = change.newLogic;
        }
      }
    }
    return updated;
  }
}

/**
 * Agent-Driven Learning Loops
 *
 * Agents that continuously learn and improve
 * Part 7: Autonomous AIOS Evolution
 */

import type { PrismaClient } from "@prisma/client";

export interface LearningInsight {
  type: "transform" | "mapping" | "schema" | "validation" | "workflow";
  issue: string;
  currentState: Record<string, unknown>;
  proposedImprovement: Record<string, unknown>;
  confidence: number;
  impact: "low" | "medium" | "high";
}

export class AgentLearningLoops {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Run all learning loops
   */
  async runLearningLoops(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Detect suboptimal transforms
    const transformInsights = await this.detectSuboptimalTransforms();
    insights.push(...transformInsights);

    // Analyze mapping drift
    const mappingInsights = await this.analyzeMappingDrift();
    insights.push(...mappingInsights);

    // Propose improved schema relationships
    const schemaInsights = await this.proposeSchemaImprovements();
    insights.push(...schemaInsights);

    // Auto-refactor unreferenced validation rules
    const validationInsights = await this.refactorUnreferencedRules();
    insights.push(...validationInsights);

    // Generate synthetic failing cases
    const syntheticInsights = await this.generateSyntheticCases();
    insights.push(...syntheticInsights);

    // Optimize workflows
    const workflowInsights = await this.optimizeWorkflows();
    insights.push(...workflowInsights);

    return insights;
  }

  /**
   * Detect suboptimal transforms
   */
  private async detectSuboptimalTransforms(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    const transforms = await this.prisma.transformRecipe.findMany({
      where: { deletedAt: null },
      take: 100,
    });

    // Find transforms with high error rates
    for (const transform of transforms) {
      // Get jobs using this transform
      const jobs = await this.prisma.reconJob.findMany({
        where: {
          transformRecipeId: transform.id,
        },
        select: { id: true },
      });

      const results = await this.prisma.reconResult.findMany({
        where: {
          reconJobId: { in: jobs.map((j: { id: string }) => j.id) },
          status: "failed",
        },
        take: 10,
      });

      if (results.length > 5) {
        insights.push({
          type: "transform",
          issue: `Transform "${transform.name}" has high failure rate`,
          currentState: { errorRate: results.length / 10 },
          proposedImprovement: {
            action: "optimize_transform",
            transformId: transform.id,
            suggestedChanges: "add_error_handling",
          },
          confidence: 0.8,
          impact: "high",
        });
      }
    }

    return insights;
  }

  /**
   * Analyze mapping drift
   */
  private async analyzeMappingDrift(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    const drifts = await this.prisma.driftEvent.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    // Group by mapping template (through reconJob)
    const mappingGroups = new Map<string, number>();
    for (const drift of drifts) {
      if (drift.reconJobId) {
        const job = await this.prisma.reconJob.findUnique({
          where: { id: drift.reconJobId },
          select: { mappingTemplateId: true },
        });
        if (job?.mappingTemplateId) {
          mappingGroups.set(
            job.mappingTemplateId,
            (mappingGroups.get(job.mappingTemplateId) || 0) + 1
          );
        }
      }
    }

    // If a mapping has > 10 drifts, propose improvement
    for (const [mappingId, count] of mappingGroups.entries()) {
      if (count > 10) {
        insights.push({
          type: "mapping",
          issue: `Mapping template has ${count} drift events`,
          currentState: { driftCount: count },
          proposedImprovement: {
            action: "update_mapping_template",
            mappingId,
            suggestedChanges: "add_flexible_field_matching",
          },
          confidence: 0.9,
          impact: "medium",
        });
      }
    }

    return insights;
  }

  /**
   * Propose improved schema relationships
   */
  private async proposeSchemaImprovements(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Analyze contract versions
    const contracts = await this.prisma.contractVersion.findMany({
      take: 100,
    });

    // Find contracts with many versions (indicating instability)
    const versionCounts = new Map<string, number>();
    for (const contract of contracts) {
      const contractKey = `${contract.tenantId}:${contract.contractName}`;
      versionCounts.set(contractKey, (versionCounts.get(contractKey) || 0) + 1);
    }

    for (const [contractId, count] of versionCounts.entries()) {
      if (count > 5) {
        insights.push({
          type: "schema",
          issue: `Schema has ${count} versions - high volatility`,
          currentState: { versionCount: count },
          proposedImprovement: {
            action: "stabilize_schema",
            contractId,
            suggestedChanges: "add_versioning_strategy",
          },
          confidence: 0.7,
          impact: "medium",
        });
      }
    }

    return insights;
  }

  /**
   * Auto-refactor unreferenced validation rules
   */
  private async refactorUnreferencedRules(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    const rules = await this.prisma.validationRule.findMany({
      where: { deletedAt: null },
      take: 100,
    });

    // Find rules that are never used
    // Note: validationRules is a Json array field, so we check if rule.id is in the array
    for (const rule of rules) {
      const allJobs = await this.prisma.reconJob.findMany({
        select: { id: true, validationRules: true },
      });

      const usage = allJobs.filter((job: { id: string; validationRules: unknown }) => {
        const rules = job.validationRules;
        if (Array.isArray(rules)) {
          return rules.some(
            (r: unknown) =>
              (typeof r === "object" &&
                r !== null &&
                "id" in r &&
                (r as { id: string }).id === rule.id) ||
              r === rule.id
          );
        }
        return false;
      });

      if (usage.length === 0) {
        insights.push({
          type: "validation",
          issue: `Validation rule "${rule.name}" is never used`,
          currentState: { usageCount: 0 },
          proposedImprovement: {
            action: "deprecate_or_remove",
            ruleId: rule.id,
            suggestedChanges: "mark_as_unused",
          },
          confidence: 1.0,
          impact: "low",
        });
      }
    }

    return insights;
  }

  /**
   * Generate synthetic failing cases for robustness
   */
  private async generateSyntheticCases(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Analyze common failure patterns
    const failures = await this.prisma.reconResult.findMany({
      where: { status: "failed" },
      take: 100,
    });

    // Generate synthetic test cases based on failures
    const failurePatterns = new Set<string>();
    for (const failure of failures) {
      if (failure.errorMessage) {
        failurePatterns.add(failure.errorMessage.substring(0, 50));
      }
    }

    if (failurePatterns.size > 0) {
      insights.push({
        type: "workflow",
        issue: "Generate synthetic test cases for robustness",
        currentState: { failurePatterns: Array.from(failurePatterns) },
        proposedImprovement: {
          action: "generate_synthetic_tests",
          patterns: Array.from(failurePatterns),
          suggestedChanges: "add_robustness_tests",
        },
        confidence: 0.8,
        impact: "high",
      });
    }

    return insights;
  }

  /**
   * Optimize workflows for latency and cost
   */
  private async optimizeWorkflows(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    const workflows = await this.prisma.workflowRun.findMany({
      take: 1000,
      orderBy: { startedAt: "desc" },
    });

    // Find slow workflows
    const slowWorkflows = workflows.filter(
      (w: { completedAt: Date | null; startedAt: Date | null }) => {
        const duration =
          w.completedAt && w.startedAt ? w.completedAt.getTime() - w.startedAt.getTime() : 0;
        return duration > 60000; // > 1 minute
      }
    );

    if (slowWorkflows.length > 10) {
      insights.push({
        type: "workflow",
        issue: `${slowWorkflows.length} workflows taking > 1 minute`,
        currentState: { slowWorkflowCount: slowWorkflows.length },
        proposedImprovement: {
          action: "optimize_workflow_steps",
          suggestedChanges: "parallelize_steps",
        },
        confidence: 0.9,
        impact: "high",
      });
    }

    return insights;
  }
}

/**
 * Agentic Workflow Service
 *
 * Deterministic, evidence-backed automations for reconciliation operations.
 *
 * AUTOMATION STRATEGY:
 * - Suggestions are grounded in historical adjudications and proven provenance
 * - Auto-escalation requires explicit deterministic thresholds (time-based, ownership-based)
 * - All automations are audit-logged and expose degradation states
 * - Human approval gates for policy changes and bulk actions
 *
 * WHAT IS AUTOMATED:
 * - Stale exception escalation (time-based deterministic)
 * - Queue prioritization scoring (deterministic criteria)
 * - Similar case lookup for triage suggestions (evidence-backed)
 * - Evidence pack assembly from provenance chain
 *
 * WHAT IS SUGGESTED:
 * - Triage recommendations based on similar historical cases
 * - Policy evolution proposals grounded in recurrence patterns
 * - Resolution paths based on signature lifecycle
 *
 * WHAT REMAINS HUMAN-CONTROLLED:
 * - Final exception resolution (requires operator action)
 * - Policy approval/rejection (requires human decision)
 * - Bulk action execution (requires operator confirmation)
 */

import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { prisma } from "../../infrastructure/db/prisma";

export interface TriageSuggestion {
  exceptionId: string;
  suggestedAction: "manual_review" | "auto_match_candidate" | "policy_adjustment" | "escalate";
  confidence: number;
  basis: string[];
  similarCases: Array<{
    exceptionId: string;
    resolution: string;
    resolvedAt: string;
    similarityScore: number;
  }>;
  degraded: boolean;
  degradedReasons: string[];
}

export interface QueuePriorityScore {
  exceptionId: string;
  priorityScore: number;
  factors: {
    severity: number;
    age: number;
    unassigned: number;
    recurrence: number;
    evidenceGaps: number;
  };
  rationale: string;
}

export interface StaleEscalationResult {
  escalatedCount: number;
  escalatedIds: string[];
  degraded: boolean;
  degradedReasons: string[];
}

export interface EvidencePackAssembly {
  exceptionId: string;
  generatedAt: string;
  components: {
    provenance: Array<{ step: string; timestamp: string; details: string }>;
    similarCases: Array<{ exceptionId: string; resolution: string; similarityScore: number }>;
    signatureLifecycle: Record<string, unknown> | null;
    sourceTrust: Record<string, unknown> | null;
  };
  deterministicDigest: string;
  degraded: boolean;
  degradedReasons: string[];
}

export interface PolicyRecommendation {
  proposalType: "tolerance_adjustment" | "rule_addition" | "threshold_tuning";
  targetSignature: string;
  rationale: string;
  basis: Array<{ signature: string; frequency: number; resolutionRate: number }>;
  estimatedImpact: {
    manualReviewReduction: number;
    exceptionReduction: number;
  };
  status: "pending_review" | "auto_generated";
  requiresApproval: boolean;
}

export interface WorkflowAutomationState {
  tenantId: string;
  automationEnabled: boolean;
  staleEscalationEnabled: boolean;
  staleThresholdHours: number;
  autoAssignmentEnabled: boolean;
  policyProposalEnabled: boolean;
  lastEscalationRun: string | null;
}

const STALE_THRESHOLD_HOURS_DEFAULT = 72;
const PRIORITY_WEIGHTS = {
  severity: 0.35,
  age: 0.25,
  unassigned: 0.15,
  recurrence: 0.15,
  evidenceGaps: 0.1,
};

function computeDeterministicDigest(data: unknown): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 16);
}

function signatureFromMatch(match: {
  matchType: string;
  matchReason: string | null;
  metadata: unknown;
}): string {
  const construction = {
    matchType: match.matchType,
    reason: match.matchReason ?? "none",
    rationaleCodes:
      ((match.metadata as Record<string, unknown>)?.rationale_codes as string[]) ?? [],
  };
  return createHash("sha256").update(JSON.stringify(construction)).digest("hex").slice(0, 20);
}

export class AgenticWorkflowService {
  async getAutomationState(tenantId: string): Promise<WorkflowAutomationState> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { metadata: true },
    });

    const metadataJson = (tenant?.metadata as Record<string, unknown>) ?? {};

    return {
      tenantId,
      automationEnabled: (metadataJson.agenticAutomationEnabled as boolean) ?? true,
      staleEscalationEnabled: (metadataJson.staleEscalationEnabled as boolean) ?? true,
      staleThresholdHours:
        (metadataJson.staleThresholdHours as number) ?? STALE_THRESHOLD_HOURS_DEFAULT,
      autoAssignmentEnabled: (metadataJson.autoAssignmentEnabled as boolean) ?? false,
      policyProposalEnabled: (metadataJson.policyProposalEnabled as boolean) ?? true,
      lastEscalationRun: (metadataJson.lastEscalationRun as string) ?? null,
    };
  }

  async updateAutomationState(
    tenantId: string,
    updates: Partial<Omit<WorkflowAutomationState, "tenantId" | "lastEscalationRun">>
  ): Promise<WorkflowAutomationState> {
    const current = await this.getAutomationState(tenantId);
    const merged = { ...current, ...updates };

    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { metadata: true },
    });
    const existingMetadata = (existingTenant?.metadata as Record<string, unknown>) ?? {};

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        metadata: {
          ...existingMetadata,
          agenticAutomationEnabled: merged.automationEnabled,
          staleEscalationEnabled: merged.staleEscalationEnabled,
          staleThresholdHours: merged.staleThresholdHours,
          autoAssignmentEnabled: merged.autoAssignmentEnabled,
          policyProposalEnabled: merged.policyProposalEnabled,
          lastEscalationRun: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return this.getAutomationState(tenantId);
  }

  async getTriageSuggestions(
    tenantId: string,
    exceptionIds: string[]
  ): Promise<TriageSuggestion[]> {
    const suggestions: TriageSuggestion[] = [];

    const exceptions = await prisma.reconciliationMatch.findMany({
      where: {
        id: { in: exceptionIds },
        tenantId,
      },
      include: {
        sourceTransaction: {
          include: { source: { select: { id: true, name: true } } },
        },
        archetypeClassifications: {
          include: { archetype: true },
          orderBy: { confidence: "desc" },
          take: 3,
        },
      },
      take: 50,
    });

    for (const exception of exceptions) {
      const sig = signatureFromMatch(exception);
      const archetypeId = exception.archetypeClassifications[0]?.archetypeId;

      const similarMemories = await prisma.exceptionAdjudicationMemory.findMany({
        where: {
          tenantId,
          ...(archetypeId ? { archetypeId } : {}),
          resolution: { in: ["matched", "manual", "ignored"] },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const similarCases = similarMemories.slice(0, 5).map((m) => ({
        exceptionId: m.exceptionId,
        resolution: m.resolution,
        resolvedAt: m.createdAt.toISOString(),
        similarityScore: archetypeId && m.archetypeId === archetypeId ? 0.8 : 0.5,
      }));

      let suggestedAction: TriageSuggestion["suggestedAction"] = "manual_review";
      let confidence = 0.5;
      const basis: string[] = [];
      const degradedReasons: string[] = [];

      if (similarCases.length >= 3) {
        const resolvedCount = similarCases.filter(
          (c) => c.resolution === "matched" || c.resolution === "manual"
        ).length;
        const resolutionRate = resolvedCount / similarCases.length;

        if (resolutionRate >= 0.7) {
          suggestedAction = "auto_match_candidate";
          confidence = Math.min(0.9, resolutionRate);
          basis.push(`historical_resolution_rate=${resolutionRate.toFixed(2)}`);
          basis.push(`similar_case_count=${similarCases.length}`);
        } else if (resolutionRate <= 0.3) {
          suggestedAction = "policy_adjustment";
          confidence = Math.min(0.85, 1 - resolutionRate);
          basis.push(`high_dismissal_rate=${(1 - resolutionRate).toFixed(2)}`);
          basis.push("suggests_rule_too_strict");
        } else {
          suggestedAction = "manual_review";
          confidence = 0.6;
          basis.push("mixed_historical_outcomes");
        }
      } else {
        degradedReasons.push("insufficient_similar_case_history");
        suggestedAction = "manual_review";
        confidence = 0.4;
        basis.push("low_confidence_due_to_data_insufficiency");
      }

      const isUnassigned = !exception.assignedTo;
      if (isUnassigned && similarCases.length > 0) {
        suggestedAction = "escalate";
        confidence = Math.min(confidence + 0.1, 0.95);
        basis.push("unassigned_with_historical_precedent");
      }

      suggestions.push({
        exceptionId: exception.id,
        suggestedAction,
        confidence: Number(confidence.toFixed(2)),
        basis,
        similarCases,
        degraded: degradedReasons.length > 0,
        degradedReasons,
      });
    }

    return suggestions;
  }

  async calculateQueuePriorities(
    tenantId: string,
    exceptionIds?: string[]
  ): Promise<QueuePriorityScore[]> {
    const where: Prisma.ReconciliationMatchWhereInput = {
      tenantId,
    };

    if (exceptionIds?.length) {
      where.id = { in: exceptionIds };
    }

    const exceptions = await prisma.reconciliationMatch.findMany({
      where,
      include: {
        sourceTransaction: true,
        archetypeClassifications: true,
      },
      take: 500,
    });

    const activeExceptions = exceptions.filter(
      (e) => !e.reviewed && (e.status === "open" || e.status === "in_progress" || e.status === null)
    );

    const now = Date.now();
    const priorityScores: QueuePriorityScore[] = [];

    for (const exception of activeExceptions) {
      const createdAtMs = exception.createdAt.getTime();
      const ageHours = (now - createdAtMs) / (1000 * 60 * 60);

      const severityMap: Record<string, number> = {
        critical: 1.0,
        high: 0.75,
        medium: 0.5,
        low: 0.25,
      };
      const severityScore = severityMap[exception.severity ?? "medium"] ?? 0.5;

      const ageScore = Math.min(1, ageHours / 168);
      const unassignedScore = exception.assignedTo ? 0 : 1;

      const sig = signatureFromMatch(exception);
      const signatureCount = await prisma.reconciliationMatch.count({
        where: {
          tenantId,
          matchType: exception.matchType,
        },
      });
      const recurrenceScore = Math.min(1, signatureCount / 20);

      const hasEvidenceGap =
        exception.archetypeClassifications.length === 0 ||
        (exception.sourceTransaction?.description ?? "").length < 5;
      const evidenceGapsScore = hasEvidenceGap ? 1 : 0;

      const priorityScore =
        PRIORITY_WEIGHTS.severity * severityScore +
        PRIORITY_WEIGHTS.age * ageScore +
        PRIORITY_WEIGHTS.unassigned * unassignedScore +
        PRIORITY_WEIGHTS.recurrence * recurrenceScore +
        PRIORITY_WEIGHTS.evidenceGaps * evidenceGapsScore;

      const rationaleParts: string[] = [];
      if (severityScore >= 0.75) rationaleParts.push(`severity=${exception.severity}`);
      if (ageHours > 48) rationaleParts.push(`age_hours=${Math.round(ageHours)}`);
      if (!exception.assignedTo) rationaleParts.push("unassigned");
      if (signatureCount > 5) rationaleParts.push(`recurring_signature=${signatureCount}`);
      if (hasEvidenceGap) rationaleParts.push("evidence_gap");

      priorityScores.push({
        exceptionId: exception.id,
        priorityScore: Number(priorityScore.toFixed(3)),
        factors: {
          severity: Number(severityScore.toFixed(3)),
          age: Number(ageScore.toFixed(3)),
          unassigned: Number(unassignedScore.toFixed(3)),
          recurrence: Number(recurrenceScore.toFixed(3)),
          evidenceGaps: Number(evidenceGapsScore.toFixed(3)),
        },
        rationale: rationaleParts.length > 0 ? rationaleParts.join("; ") : "standard_priority",
      });
    }

    return priorityScores.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  async escalateStaleExceptions(
    tenantId: string,
    thresholdHours?: number
  ): Promise<StaleEscalationResult> {
    const state = await this.getAutomationState(tenantId);
    const threshold = thresholdHours ?? state.staleThresholdHours;

    if (!state.staleEscalationEnabled) {
      return {
        escalatedCount: 0,
        escalatedIds: [],
        degraded: true,
        degradedReasons: ["stale_escalation_disabled_in_settings"],
      };
    }

    const cutoff = new Date(Date.now() - threshold * 60 * 60 * 1000);

    const staleExceptions = await prisma.reconciliationMatch.findMany({
      where: {
        tenantId,
        createdAt: { lt: cutoff },
        assignedTo: null,
        reviewed: false,
      },
      select: { id: true, status: true },
    });

    const toEscalate = staleExceptions.filter((e) => e.status === "open" || e.status === null);

    if (toEscalate.length === 0) {
      return {
        escalatedCount: 0,
        escalatedIds: [],
        degraded: false,
        degradedReasons: [],
      };
    }

    const staleIds = toEscalate.map((e) => e.id);

    await prisma.reconciliationMatch.updateMany({
      where: { id: { in: staleIds }, tenantId },
      data: {
        status: "in_progress",
        metadata: {
          escalatedAt: new Date().toISOString(),
          escalationReason: "stale_unassigned_exception",
          thresholdHours: threshold,
        } as Prisma.JsonObject,
      },
    });

    await prisma.reconAudit.createMany({
      data: staleIds.map((id) => ({
        tenantId,
        auditType: "automation",
        action: "stale_escalation",
        entityType: "reconciliation_match",
        entityId: id,
        changes: {
          previousStatus: "open",
          newStatus: "in_progress",
          escalationType: "stale_unassigned",
          thresholdHours: threshold,
        },
        afterState: { status: "in_progress", escalatedAt: new Date().toISOString() },
      })),
    });

    await this.updateAutomationState(tenantId, {});

    return {
      escalatedCount: staleIds.length,
      escalatedIds: staleIds,
      degraded: false,
      degradedReasons: [],
    };
  }

  async assembleEvidencePack(tenantId: string, exceptionId: string): Promise<EvidencePackAssembly> {
    const exception = await prisma.reconciliationMatch.findFirst({
      where: { id: exceptionId, tenantId },
      include: {
        sourceTransaction: { include: { source: true } },
        targetTransaction: true,
        run: true,
      },
    });

    if (!exception) {
      return {
        exceptionId,
        generatedAt: new Date().toISOString(),
        components: {
          provenance: [],
          similarCases: [],
          signatureLifecycle: null,
          sourceTrust: null,
        },
        deterministicDigest: "",
        degraded: true,
        degradedReasons: ["exception_not_found"],
      };
    }

    const provenanceSteps: Array<{ step: string; timestamp: string; details: string }> = [];

    provenanceSteps.push({
      step: "exception_created",
      timestamp: exception.createdAt.toISOString(),
      details: `Match type: ${exception.matchType}, confidence: ${exception.confidence}`,
    });

    if (exception.runId) {
      const run = await prisma.reconciliationRun.findFirst({
        where: { id: exception.runId },
      });
      if (run) {
        provenanceSteps.push({
          step: "run_execution",
          timestamp: run.startedAt?.toISOString() ?? run.createdAt.toISOString(),
          details: `Run status: ${run.status}`,
        });
      }
    }

    const sig = signatureFromMatch(exception);
    const similarMemories = await prisma.exceptionAdjudicationMemory.findMany({
      where: {
        tenantId,
        exceptionId: { not: exceptionId },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const similarCases = similarMemories.map((m) => ({
      exceptionId: m.exceptionId,
      resolution: m.resolution,
      similarityScore: m.archetypeId ? 0.7 : 0.4,
    }));

    const signatureMatches = await prisma.reconciliationMatch.findMany({
      where: {
        tenantId,
        id: { not: exceptionId },
        matchType: exception.matchType,
      },
      select: { id: true, createdAt: true, reviewed: true },
      take: 100,
    });

    const resolvedCount = signatureMatches.filter((m) => m.reviewed).length;
    const signatureLifecycle = {
      signature: sig,
      observedCount: signatureMatches.length + 1,
      resolvedCount,
      resolutionRate: signatureMatches.length > 0 ? resolvedCount / signatureMatches.length : null,
      firstSeen: signatureMatches[signatureMatches.length - 1]?.createdAt?.toISOString(),
      lastSeen: signatureMatches[0]?.createdAt?.toISOString(),
    };

    const sourceTrust = exception.sourceTransaction?.source
      ? {
          sourceId: exception.sourceTransaction.source.id,
          sourceName: exception.sourceTransaction.source.name,
        }
      : null;

    const packData = {
      exceptionId,
      provenance: provenanceSteps,
      similarCases,
      signatureLifecycle,
      sourceTrust,
    };

    return {
      exceptionId,
      generatedAt: new Date().toISOString(),
      components: {
        provenance: provenanceSteps,
        similarCases,
        signatureLifecycle,
        sourceTrust,
      },
      deterministicDigest: computeDeterministicDigest(packData),
      degraded: similarCases.length === 0 && signatureMatches.length === 0,
      degradedReasons:
        similarCases.length === 0 && signatureMatches.length === 0
          ? ["limited_historical_context"]
          : [],
    };
  }

  async generatePolicyRecommendations(
    tenantId: string,
    lookbackDays: number = 30
  ): Promise<PolicyRecommendation[]> {
    const state = await this.getAutomationState(tenantId);

    if (!state.policyProposalEnabled) {
      return [];
    }

    const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const matches = await prisma.reconciliationMatch.findMany({
      where: {
        tenantId,
        createdAt: { gte: cutoff },
      },
      take: 2000,
    });

    const signatureMap = new Map<
      string,
      { matchType: string; total: number; resolved: number; open: number }
    >();

    for (const match of matches) {
      const sig = signatureFromMatch(match);
      const current = signatureMap.get(sig) ?? {
        matchType: match.matchType,
        total: 0,
        resolved: 0,
        open: 0,
      };
      current.total += 1;
      if (match.reviewed) {
        current.resolved += 1;
      } else {
        current.open += 1;
      }
      signatureMap.set(sig, current);
    }

    const recommendations: PolicyRecommendation[] = [];

    for (const [sig, data] of signatureMap) {
      if (data.total < 5) continue;

      const openRatio = data.open / data.total;

      if (openRatio > 0.6 && data.resolved / data.total > 0.3) {
        recommendations.push({
          proposalType: "tolerance_adjustment",
          targetSignature: sig,
          rationale: `High open rate (${(openRatio * 100).toFixed(1)}%) but good resolution rate - suggests tolerance too strict`,
          basis: [
            { signature: sig, frequency: data.total, resolutionRate: data.resolved / data.total },
          ],
          estimatedImpact: {
            manualReviewReduction: Math.round((1 - openRatio) * 100),
            exceptionReduction: Math.round(openRatio * 50),
          },
          status: "auto_generated",
          requiresApproval: true,
        });
      }
    }

    return recommendations.slice(0, 10);
  }
}

export const agenticWorkflowService = new AgenticWorkflowService();

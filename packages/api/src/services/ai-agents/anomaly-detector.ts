/**
 * Anomaly & Exploit Detector Agent
 *
 * Detects anomalies in reconciliation data, API usage patterns, and security threats.
 */

import {
  BaseAgent,
  AgentJobDraft,
  AgentExecutionContext,
  assertSignedPolicyToken,
  policyPayloadHash,
} from "./orchestrator";
import { logInfo, logError, logWarn } from "../../utils/logger";
import { prisma } from "../../infrastructure/db/prisma";

export interface Anomaly {
  id: string;
  type: "reconciliation" | "security" | "data_quality" | "business_logic" | "optimization";
  severity: "critical" | "high" | "medium" | "low";
  title?: string;
  description: string;
  detectedAt: Date;
  evidence?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  confidence: number; // 0-100
  recommendedAction?: string;
}

export class AnomalyDetectorAgent extends BaseAgent {
  id = "anomaly-detector";
  name = "Anomaly & Exploit Detector";
  type = "anomaly" as const;

  private detectedAnomalies: Anomaly[] = [];
  private lastDetection?: Date;

  async initialize(): Promise<void> {
    this.enabled = true;
  }

  async execute(
    action: string,
    params: Record<string, unknown>,
    context?: AgentExecutionContext
  ): Promise<unknown> {
    const tenantId = context?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant context is required for anomaly agent execution");
    }

    switch (action) {
      case "detect":
        return await this.detectAnomalies(tenantId);

      case "get_anomalies":
        return this.detectedAnomalies.filter((a) => {
          if (a.metadata?.tenantId !== tenantId) return false;
          if (params.severity) return a.severity === params.severity;
          if (params.type) return a.type === params.type;
          return true;
        });

      case "get_stats":
        return this.getTenantStats(tenantId);

      case "apply_remediation":
        assertSignedPolicyToken(params.policyToken as string | undefined, {
          tenantId,
          agentId: this.id,
          action,
          payloadHash: policyPayloadHash(params),
          nonce: params.policyNonce as string | undefined,
        });
        return { status: "remediation_applied_under_policy", anomalyId: params.anomalyId };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private getTenantStats(tenantId: string): Record<string, unknown> {
    const anomalies = this.detectedAnomalies.filter((a) => a.metadata?.tenantId === tenantId);
    return {
      totalAnomalies: anomalies.length,
      criticalAnomalies: anomalies.filter((a) => a.severity === "critical").length,
    };
  }

  async getStatus(): Promise<{
    enabled: boolean;
    lastExecution?: Date;
    metrics?: Record<string, unknown>;
  }> {
    const status: {
      enabled: boolean;
      lastExecution?: Date;
      metrics?: Record<string, unknown>;
    } = {
      enabled: this.enabled,
    };
    if (this.lastDetection) {
      status.lastExecution = this.lastDetection;
    }
    status.metrics = {
      totalAnomalies: this.detectedAnomalies.length,
      criticalAnomalies: this.detectedAnomalies.filter((a) => a.severity === "critical").length,
      falsePositiveRate: this.calculateFalsePositiveRate(),
    };
    return status;
  }

  /**
   * Detect anomalies
   */
  private async detectAnomalies(tenantId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Check reconciliation anomalies
    const reconciliationAnomalies = await this.detectReconciliationAnomalies(tenantId);
    anomalies.push(...reconciliationAnomalies);

    // Check security threats
    const securityThreats = await this.detectSecurityThreats(tenantId);
    anomalies.push(...securityThreats);

    // Check data quality issues
    const dataQualityIssues = await this.detectDataQualityIssues(tenantId);
    anomalies.push(...dataQualityIssues);

    // Check business logic anomalies
    const businessLogicAnomalies = await this.detectBusinessLogicAnomalies(tenantId);
    anomalies.push(...businessLogicAnomalies);

    const scopedAnomalies = anomalies.map((anomaly) => ({
      ...anomaly,
      metadata: { ...anomaly.metadata, tenantId },
    }));
    this.detectedAnomalies.push(...scopedAnomalies);
    this.lastDetection = new Date();

    // Emit draft-only job requests requiring human approval (Pillar 4 Invariant)
    for (const anomaly of scopedAnomalies) {
      const draft = this.createDraftJob(anomaly, tenantId);
      this.emit("draft_job_created", draft);
      if (anomaly.severity === "critical" || anomaly.severity === "high") {
        this.emit("anomaly_detected", anomaly);
        await this.sendAlert(anomaly);
      }
    }

    return scopedAnomalies;
  }

  /**
   * Generates strictly draft-only job request for anomaly remediation via JobForgeClient
   */
  createDraftJob(anomaly: Anomaly, tenantId: string): AgentJobDraft {
    return {
      agentId: this.id,
      jobType: `anomaly.remediation.${anomaly.type}`,
      payload: {
        anomalyId: anomaly.id,
        tenantId,
        severity: anomaly.severity,
        evidence: anomaly.evidence,
        recommendedAction: anomaly.recommendedAction,
      },
      autoExecute: false,
      requireApproval: true,
      governance: {
        riskLevel: anomaly.severity === "critical" ? "high" : anomaly.severity,
        estimatedImpact: anomaly.description,
        requiresHumanReview: true,
        signedPolicyBound: "pb_anomaly_remediation_draft_v1",
      },
    };
  }

  /**
   * Detect reconciliation anomalies
   */
  private async detectReconciliationAnomalies(tenantId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    try {
      const recentJobs = await prisma.reconJob.findMany({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          accuracy: { not: null },
        },
        select: {
          id: true,
          accuracy: true,
          status: true,
          connectorId: true,
          tenantId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const jobsByConnector = recentJobs.reduce(
        (acc: Record<string, typeof recentJobs>, job: any) => {
          const connectorId = job.connectorId || "unknown";
          if (!acc[connectorId]) acc[connectorId] = [];
          acc[connectorId]!.push(job);
          return acc;
        },
        {} as Record<string, typeof recentJobs>
      );

      for (const [connectorId, jobs] of Object.entries(jobsByConnector) as [string, any[]][]) {
        if (!jobs || jobs.length < 2) continue;
        jobs.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const [latest, previous] = jobs;
        if (latest.accuracy && previous.accuracy) {
          const drop = previous.accuracy - latest.accuracy;
          const pct = (drop / previous.accuracy) * 100;
          if (pct > 5) {
            anomalies.push({
              id: `anom_recon_${connectorId}_${Date.now()}`,
              type: "reconciliation",
              severity: pct > 10 ? "critical" : "high",
              title: "Reconciliation Accuracy Drop",
              description: `Accuracy dropped ${pct.toFixed(1)}% for ${connectorId}`,
              detectedAt: new Date(),
              evidence: {
                previousAccuracy: previous.accuracy,
                currentAccuracy: latest.accuracy,
                dropPercentage: pct,
                connectorId,
                jobId: latest.id,
              },
              confidence: Math.min(95, 70 + pct * 2),
              recommendedAction: "Review matching rules and data quality",
            });
          }
        }
      }
    } catch (error) {
      logError("Failed to detect reconciliation anomalies", error);
    }
    return anomalies;
  }

  /**
   * Detect security threats
   */
  private async detectSecurityThreats(tenantId: string): Promise<Anomaly[]> {
    const threats: Anomaly[] = [];

    try {
      // Analyze API logs for security threats
      // Check for API abuse, credential leaks, DDoS attacks, etc.

      const recentLogs = await prisma.usageEvent.findMany({
        where: {
          tenantId,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        select: {
          id: true,
          eventType: true,
          metadata: true,
          tenantId: true,
          userId: true,
          timestamp: true,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 1000,
      });

      // Check for rate limit violations (potential DDoS)
      const rateLimitViolations = recentLogs.filter((log: { tenantId: string | null }) => {
        const sameTenant = recentLogs.filter(
          (l: { tenantId: string | null }) => l.tenantId === log.tenantId
        );
        return sameTenant.length > 1000; // More than 1000 requests in 24h
      });

      if (rateLimitViolations.length > 0) {
        threats.push({
          id: `security-rate-limit-${Date.now()}`,
          type: "security",
          severity: "high",
          title: "Potential DDoS Attack Detected",
          description: `Tenant ${rateLimitViolations[0]?.tenantId || "unknown"} has exceeded rate limits`,
          detectedAt: new Date(),
          metadata: {
            tenantId: rateLimitViolations[0]?.tenantId,
            requestCount: rateLimitViolations.length,
          },
          confidence: 75,
        });
      }

      // Check for authentication failures (potential brute force)
      const authFailures = recentLogs.filter(
        (log: { eventType?: string | null }) =>
          log.eventType?.includes("auth_failed") || log.eventType?.includes("login_failed")
      );

      if (authFailures.length > 50) {
        threats.push({
          id: `security-auth-failures-${Date.now()}`,
          type: "security",
          severity: "medium",
          title: "Excessive Authentication Failures",
          description: `${authFailures.length} authentication failures detected in last 24 hours`,
          detectedAt: new Date(),
          metadata: {
            failureCount: authFailures.length,
          },
          confidence: 80,
        });
      }

      // Check metadata for potential credential leaks
      const potentialLeaks = recentLogs.filter((log: { metadata?: unknown }) => {
        const metadataStr = JSON.stringify(log.metadata || {});
        return (
          metadataStr.includes("password") ||
          metadataStr.includes("api_key") ||
          metadataStr.includes("secret") ||
          metadataStr.includes("token")
        );
      });

      if (potentialLeaks.length > 0) {
        threats.push({
          id: `security-credential-leak-${Date.now()}`,
          type: "security",
          severity: "critical",
          title: "Potential Credential Leak Detected",
          description: "API logs contain potential sensitive credentials",
          detectedAt: new Date(),
          metadata: {
            leakCount: potentialLeaks.length,
          },
          confidence: 90,
        });
      }

      logInfo("Security threat detection completed", {
        threatCount: threats.length,
        rateLimitViolations: rateLimitViolations.length,
        authFailures: authFailures.length,
        potentialLeaks: potentialLeaks.length,
      });
    } catch (error) {
      logError("Failed to detect security threats", error);
    }

    return threats;
  }

  /**
   * Detect data quality issues
   */
  private async detectDataQualityIssues(tenantId: string): Promise<Anomaly[]> {
    const issues: Anomaly[] = [];
    try {
      const missingDataCount = await prisma.normalizedTransaction.count({
        where: {
          tenantId,
          OR: [
            { amount: { equals: 0 } }, // Decimal check
            { description: null },
          ],
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (missingDataCount > 10) {
        issues.push({
          id: `dq-missing-${Date.now()}`,
          type: "data_quality",
          severity: missingDataCount > 50 ? "high" : "medium",
          title: "Missing Transaction Data",
          description: `${missingDataCount} transactions missing required fields in last 24h`,
          detectedAt: new Date(),
          metadata: { missingDataCount },
          confidence: 90,
          recommendedAction: "Review data import pipeline",
        });
      }
      const recent = await prisma.normalizedTransaction.findMany({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { amount: true, date: true, description: true },
        take: 10_000,
      });
      const fingerprints = new Set<string>();
      const duplicates = new Set<string>();
      for (const transaction of recent) {
        const fingerprint = `${transaction.amount.toString()}\u0000${transaction.date.toISOString()}\u0000${transaction.description ?? ""}`;
        if (fingerprints.has(fingerprint)) duplicates.add(fingerprint);
        fingerprints.add(fingerprint);
      }
      if (duplicates.size > 0) {
        issues.push({
          id: `dq-dup-${Date.now()}`,
          type: "data_quality",
          severity: "medium",
          title: "Potential Duplicate Transactions",
          description: `${duplicates.size} groups of duplicates detected`,
          detectedAt: new Date(),
          metadata: { duplicateGroups: duplicates.size },
          confidence: 75,
          recommendedAction: "Review duplicate detection rules",
        });
      }
    } catch (error) {
      logError("Failed to detect data quality issues", error);
    }
    return issues;
  }

  /**
   * Detect business logic anomalies
   */
  private async detectBusinessLogicAnomalies(tenantId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    try {
      const population = await prisma.normalizedTransaction.findMany({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { amount: true },
        take: 10_000,
      });
      const amounts = population.map((row) => Math.abs(Number(row.amount)));
      if (amounts.length >= 2) {
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const variance =
          amounts.reduce((sum, amount) => sum + (amount - mean) ** 2, 0) / amounts.length;
        const threshold = mean + 3 * Math.sqrt(variance);
        const outliers = await prisma.normalizedTransaction.findMany({
          where: {
            tenantId,
            amount: { gt: threshold },
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          select: { id: true, amount: true, description: true, tenantId: true },
          take: 10,
        });
        if (outliers.length > 0) {
          anomalies.push({
            id: `biz-outliers-${Date.now()}`,
            type: "business_logic",
            severity: "medium",
            title: "Unusual Transaction Amounts",
            description: `${outliers.length} transactions > 3σ from mean`,
            detectedAt: new Date(),
            evidence: {
              outliers: outliers.map((o: any) => ({
                id: o.id,
                amount: o.amount,
              })),
              threshold,
              mean,
            },
            confidence: 85,
            recommendedAction: "Review large/unusual transactions",
          });
        }
      }
      const recentHourlyAmounts = await prisma.normalizedTransaction.findMany({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
        select: { amount: true },
        take: 10_000,
      });
      const hourlyCounts = new Map<string, number>();
      for (const row of recentHourlyAmounts) {
        const amount = row.amount.toString();
        hourlyCounts.set(amount, (hourlyCounts.get(amount) ?? 0) + 1);
      }
      const rapidPatternCount = Array.from(hourlyCounts.values()).filter(
        (count) => count > 5
      ).length;
      if (rapidPatternCount > 0) {
        anomalies.push({
          id: `biz-fraud-${Date.now()}`,
          type: "business_logic",
          severity: "high",
          title: "Potential Fraud Pattern",
          description: "Multiple identical transactions within 1 hour",
          detectedAt: new Date(),
          metadata: { patterns: rapidPatternCount },
          confidence: 80,
          recommendedAction: "Review for potential fraud",
        });
      }
    } catch (error) {
      logError("Failed to detect business logic anomalies", error);
    }
    return anomalies;
  }

  /**
   * Load detection rules from database
   */
  private async loadDetectionRules(tenantId: string): Promise<DetectionRule[]> {
    try {
      const dbRules = await prisma.detectionRule.findMany({ where: { tenantId, enabled: true } });
      if (dbRules.length > 0) {
        return dbRules.map((r: any) => ({
          id: r.id,
          type: r.type,
          condition: r.condition,
          severity: r.severity as any,
        }));
      }
    } catch {
      // Table may not exist, use defaults
    }
    return [
      {
        id: "rule_1",
        type: "reconciliation",
        condition: "accuracy < 0.9",
        severity: "high",
      },
      {
        id: "rule_2",
        type: "security",
        condition: "api_calls_per_minute > 1000",
        severity: "medium",
      },
    ];
  }

  /**
   * Send alert for anomaly
   */
  private async sendAlert(anomaly: Anomaly): Promise<void> {
    logWarn(`ALERT: ${anomaly.severity.toUpperCase()} - ${anomaly.description}`, {
      severity: anomaly.severity,
      description: anomaly.description,
      anomalyId: anomaly.id,
    });
    try {
      const { notificationService } = await import("../notifications/notification-service");
      await notificationService.notify(
        (anomaly.metadata?.tenantId as string) || "00000000-0000-0000-0000-000000000000",
        `anomaly_${anomaly.type}`,
        anomaly.description,
        undefined,
        {
          severity: anomaly.severity,
          anomalyId: anomaly.id,
          confidence: anomaly.confidence,
          ...anomaly.metadata,
        }
      );
    } catch (error) {
      logError("Failed to send notification", error);
    }
    this.emit("alert_sent", anomaly);
  }

  /**
   * Calculate false positive rate from resolved anomalies
   */
  private calculateFalsePositiveRate(): number {
    if (this.detectedAnomalies.length === 0) return 0;
    const falsePositives = this.detectedAnomalies.filter(
      (a) => a.metadata?.falsePositive === true
    ).length;
    return Number((falsePositives / this.detectedAnomalies.length).toFixed(3));
  }
}

interface DetectionRule {
  id: string;
  type: string;
  condition: string;
  severity: Anomaly["severity"];
}

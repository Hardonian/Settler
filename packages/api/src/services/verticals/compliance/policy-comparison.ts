/**
 * Compliance Module - Policy Comparison
 *
 * Part of Phase IV: Vertical Modules
 */

import { PrismaClient } from "@prisma/client";
import { logInfo, logError } from "../../../utils/logger";

export interface PolicyDiff {
  added: string[];
  removed: string[];
  modified: Array<{
    section: string;
    before: string;
    after: string;
  }>;
  complianceScore: number;
  violations: Array<{
    section: string;
    violation: string;
    severity: "low" | "medium" | "high" | "critical";
  }>;
}

export class PolicyComparisonService {
  private _prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this._prisma = prisma;
  }

  /**
   * Compare privacy policies
   */
  async comparePrivacyPolicies(
    tenantId: string,
    policy1: string,
    policy2: string
  ): Promise<PolicyDiff> {
    try {
      // Extract sections from policies
      const sections1 = this.extractSections(policy1);
      const sections2 = this.extractSections(policy2);

      const added: string[] = [];
      const removed: string[] = [];
      const modified: PolicyDiff["modified"] = [];
      const violations: PolicyDiff["violations"] = [];

      // Find added sections
      for (const [section, content] of Object.entries(sections2)) {
        if (!sections1[section]) {
          added.push(section);
          // Check if new section introduces compliance issues
          const sectionViolations = this.checkSectionCompliance(section, content);
          violations.push(...sectionViolations);
        }
      }

      // Find removed sections
      for (const section of Object.keys(sections1)) {
        if (!sections2[section]) {
          removed.push(section);
          // Check if removed section was required for compliance
          if (this.isRequiredSection(section)) {
            violations.push({
              section,
              violation: `Required section "${section}" was removed`,
              severity: "high",
            });
          }
        }
      }

      // Find modified sections
      for (const [section, content1] of Object.entries(sections1)) {
        const content2 = sections2[section];
        if (content2 && content1 !== content2) {
          modified.push({
            section,
            before: content1.substring(0, 200),
            after: content2.substring(0, 200),
          });

          // Check for compliance violations in modified content
          const sectionViolations = this.checkSectionCompliance(section, content2);
          violations.push(...sectionViolations);
        }
      }

      // Calculate compliance score
      const requiredSections = [
        "data collection",
        "data use",
        "data sharing",
        "user rights",
        "contact",
      ];
      const hasRequiredSections = requiredSections.every((rs) =>
        Object.keys(sections2).some((s) => s.toLowerCase().includes(rs))
      );

      let complianceScore = 100;
      if (!hasRequiredSections) complianceScore -= 20;
      complianceScore -= violations.filter((v) => v.severity === "critical").length * 15;
      complianceScore -= violations.filter((v) => v.severity === "high").length * 10;
      complianceScore -= violations.filter((v) => v.severity === "medium").length * 5;
      complianceScore = Math.max(0, complianceScore);

      // Log comparison
      await this._prisma.policyComparison.create({
        data: {
          tenantId,
          sectionsAdded: added.length,
          sectionsRemoved: removed.length,
          sectionsModified: modified.length,
          complianceScore,
          violationCount: violations.length,
          createdAt: new Date(),
        },
      });

      logInfo("Privacy policy comparison completed", {
        tenantId,
        added: added.length,
        removed: removed.length,
        modified: modified.length,
        complianceScore,
      });

      return {
        added,
        removed,
        modified,
        complianceScore,
        violations,
      };
    } catch (error) {
      logError("Policy comparison failed", error);
      throw error;
    }
  }

  /**
   * Extract sections from policy text
   */
  private extractSections(policy: string): Record<string, string> {
    const sections: Record<string, string> = {};

    // Split by common section headers
    const lines = policy.split("\n");
    let currentSection = "general";
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect section headers (numbered, capitalized, or followed by colon)
      if (/^\d+\.|^[A-Z][A-Z\s]+$|.+:$/.test(trimmed) && trimmed.length < 100) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join("\n").trim();
        }
        currentSection = trimmed
          .replace(/[:\d\.]+$/, "")
          .trim()
          .toLowerCase();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Don't forget the last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join("\n").trim();
    }

    return sections;
  }

  /**
   * Check if section is required for compliance
   */
  private isRequiredSection(section: string): boolean {
    const required = ["data collection", "data use", "privacy", "rights", "contact"];
    return required.some((r) => section.toLowerCase().includes(r));
  }

  /**
   * Check section for compliance violations
   */
  private checkSectionCompliance(section: string, content: string): PolicyDiff["violations"] {
    const violations: PolicyDiff["violations"] = [];
    const lowerContent = content.toLowerCase();
    const lowerSection = section.toLowerCase();

    // Check for concerning clauses
    if (
      lowerContent.includes("sell your data") ||
      lowerContent.includes("third party advertisers")
    ) {
      violations.push({
        section,
        violation: "Data selling practices detected",
        severity: "high",
      });
    }

    if (lowerContent.includes("no liability") || lowerContent.includes("not responsible")) {
      violations.push({
        section,
        violation: "Broad liability limitation clause",
        severity: "medium",
      });
    }

    if (lowerSection.includes("children") && !lowerContent.includes("parental consent")) {
      violations.push({
        section,
        violation: "Children's section missing parental consent requirement",
        severity: "critical",
      });
    }

    if (
      lowerSection.includes("rights") &&
      !lowerContent.includes("delete") &&
      !lowerContent.includes("erase")
    ) {
      violations.push({
        section,
        violation: "User rights section missing deletion/erasure rights",
        severity: "high",
      });
    }

    return violations;
  }

  /**
   * Detect privacy drift
   */
  async detectPrivacyDrift(
    tenantId: string,
    currentPolicy: string,
    baselinePolicy: string
  ): Promise<{
    driftDetected: boolean;
    changes: string[];
    riskLevel: "low" | "medium" | "high";
  }> {
    const comparison = await this.comparePrivacyPolicies(tenantId, baselinePolicy, currentPolicy);

    const changes: string[] = [
      ...comparison.added.map((s) => `Added: ${s}`),
      ...comparison.removed.map((s) => `Removed: ${s}`),
      ...comparison.modified.map((m) => `Modified: ${m.section}`),
      ...comparison.violations.map((v) => `Violation: ${v.violation} (${v.severity})`),
    ];

    const driftDetected = changes.length > 0;

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" = "low";
    if (comparison.violations.some((v) => v.severity === "critical")) {
      riskLevel = "high";
    } else if (
      comparison.violations.some((v) => v.severity === "high") ||
      comparison.added.length > 2
    ) {
      riskLevel = "medium";
    }

    return { driftDetected, changes, riskLevel };
  }

  /**
   * Audit data retention compliance
   */
  async auditDataRetention(
    tenantId: string,
    retentionPolicy: Record<string, number>,
    actualData: Array<{ type: string; createdAt: Date }>
  ): Promise<{
    compliant: boolean;
    violations: Array<{
      dataType: string;
      retentionPeriod: number;
      actualAge: number;
      violation: string;
    }>;
  }> {
    const violations: Array<{
      dataType: string;
      retentionPeriod: number;
      actualAge: number;
      violation: string;
    }> = [];

    const now = new Date();

    for (const data of actualData) {
      const retentionDays = retentionPolicy[data.type];
      if (!retentionDays) continue;

      const ageDays = Math.floor(
        (now.getTime() - data.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (ageDays > retentionDays) {
        violations.push({
          dataType: data.type,
          retentionPeriod: retentionDays,
          actualAge: ageDays,
          violation: `Data retained ${ageDays - retentionDays} days beyond policy`,
        });
      }
    }

    // Also check database for expired data
    const dbViolations = await this._prisma.$queryRaw<
      Array<{
        data_type: string;
        max_age: number;
      }>
    >`
      SELECT 
        data_type,
        EXTRACT(DAY FROM NOW() - MIN(created_at)) as max_age
      FROM data_retention_audit
      WHERE tenant_id = ${tenantId}
      GROUP BY data_type
      HAVING EXTRACT(DAY FROM NOW() - MIN(created_at)) > (
        SELECT retention_days FROM retention_policies WHERE data_type = data_type AND tenant_id = ${tenantId}
      )
    `;

    for (const v of dbViolations) {
      const policy = retentionPolicy[v.data_type] || 365;
      if (v.max_age > policy) {
        violations.push({
          dataType: v.data_type,
          retentionPeriod: policy,
          actualAge: v.max_age,
          violation: `Database shows data ${v.max_age - policy} days over retention limit`,
        });
      }
    }

    return { compliant: violations.length === 0, violations };
  }

  /**
   * Generate DPIA (Data Protection Impact Assessment) helper
   */
  async generateDPIA(
    tenantId: string,
    processingActivity: {
      name: string;
      dataTypes: string[];
      dataSubjects: string[];
      purposes: string[];
      thirdParties: string[];
      retentionPeriod: number;
    }
  ): Promise<{
    riskAssessment: {
      overallRisk: "low" | "medium" | "high" | "critical";
      risks: Array<{
        category: string;
        likelihood: "low" | "medium" | "high";
        impact: "low" | "medium" | "high";
        description: string;
      }>;
    };
    recommendations: string[];
    requiredSafeguards: string[];
  }> {
    const risks: Array<{
      category: string;
      likelihood: "low" | "medium" | "high";
      impact: "low" | "medium" | "high";
      description: string;
    }> = [];

    // Assess risks based on processing activity
    if (
      processingActivity.dataTypes.includes("health") ||
      processingActivity.dataTypes.includes("biometric")
    ) {
      risks.push({
        category: "Sensitive Data",
        likelihood: "medium",
        impact: "high",
        description: "Processing of special category data requires enhanced safeguards",
      });
    }

    if (processingActivity.dataSubjects.includes("children")) {
      risks.push({
        category: "Vulnerable Subjects",
        likelihood: "medium",
        impact: "high",
        description: "Children require additional protection measures",
      });
    }

    if (processingActivity.thirdParties.length > 0) {
      risks.push({
        category: "Data Sharing",
        likelihood: "medium",
        impact: "medium",
        description: `Data shared with ${processingActivity.thirdParties.length} third parties increases exposure risk`,
      });
    }

    if (processingActivity.retentionPeriod > 2555) {
      // > 7 years
      risks.push({
        category: "Data Retention",
        likelihood: "low",
        impact: "medium",
        description: "Extended retention period increases data breach impact",
      });
    }

    // Calculate overall risk
    const criticalRisks = risks.filter(
      (r) => r.impact === "high" && r.likelihood === "high"
    ).length;
    const highRisks = risks.filter((r) => r.impact === "high" || r.likelihood === "high").length;

    let overallRisk: "low" | "medium" | "high" | "critical" = "low";
    if (criticalRisks > 0) overallRisk = "critical";
    else if (highRisks > 1) overallRisk = "high";
    else if (highRisks === 1) overallRisk = "medium";

    // Generate recommendations
    const recommendations: string[] = [];
    if (risks.some((r) => r.category === "Sensitive Data")) {
      recommendations.push("Implement encryption at rest and in transit for sensitive data");
      recommendations.push("Conduct Data Protection Officer consultation");
    }
    if (risks.some((r) => r.category === "Vulnerable Subjects")) {
      recommendations.push("Implement age verification mechanisms");
      recommendations.push("Provide simplified privacy notices for children");
    }
    if (risks.some((r) => r.category === "Data Sharing")) {
      recommendations.push("Establish data processing agreements with all third parties");
      recommendations.push("Implement data minimization for shared data");
    }

    // Required safeguards
    const requiredSafeguards = [
      "Maintain records of processing activities",
      "Implement privacy by design principles",
      "Establish data subject rights procedures",
      ...recommendations.slice(0, 3),
    ];

    // Log DPIA generation
    await this._prisma.dPIA.create({
      data: {
        tenantId,
        activityName: processingActivity.name,
        overallRisk,
        riskCount: risks.length,
        recommendations: recommendations as any,
        createdAt: new Date(),
      },
    });

    return {
      riskAssessment: { overallRisk, risks },
      recommendations,
      requiredSafeguards,
    };
  }
}

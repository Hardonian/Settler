/**
 * Ops Intelligence Recommendation Engine
 *
 * Rules-based action recommendations for insights.
 * Generates actionable, reversible recommendations.
 */

import { Insight } from "./insights-engine";
import { logInfo, logError } from "../../utils/logger";

export type ActionType =
  | "investigate"
  | "upgrade"
  | "throttle"
  | "outreach"
  | "document"
  | "fix"
  | "monitor"
  | "verify"
  | "retry";

export type RiskLevel = "low" | "med" | "high";

export interface Recommendation {
  insightId?: string; // Will be set when saving to database
  actionType: ActionType;
  description: string;
  riskLevel: RiskLevel;
  expectedImpact: string;
  reversibility: boolean;
  runbookLink?: string;
}

/**
 * Generate recommendations for an insight
 * Note: insightId will be set when saving to database
 */
export function generateRecommendations(insight: Insight): Recommendation[] {
  const recommendations: Recommendation[] = [];

  try {
    switch (insight.type) {
      case "cost":
        recommendations.push(...generateCostRecommendations(insight));
        break;
      case "support":
        recommendations.push(...generateSupportRecommendations(insight));
        break;
      case "usage":
        recommendations.push(...generateUsageRecommendations(insight));
        break;
      case "stability":
        recommendations.push(...generateStabilityRecommendations(insight));
        break;
    }

    logInfo("Generated recommendations", {
      insightType: insight.type,
      count: recommendations.length,
    });
  } catch (error) {
    logError("Failed to generate recommendations", error);
  }

  return recommendations;
}

/**
 * Generate cost-related recommendations
 */
function generateCostRecommendations(insight: Insight): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // High cost WoW increase
  if (insight.title.includes("Cost increased") && insight.severity !== "info") {
    recommendations.push({
      actionType: "investigate",
      description:
        "Review cost breakdown by source (infrastructure, data, messaging) to identify drivers",
      riskLevel: "low",
      expectedImpact: "Identify cost optimization opportunities",
      reversibility: true,
    });

    if (insight.severity === "critical") {
      recommendations.push({
        actionType: "throttle",
        description:
          "Consider temporary throttling for high-cost operations if cost spike continues",
        riskLevel: "med",
        expectedImpact: "Reduce immediate cost pressure",
        reversibility: true,
      });
    }
  }

  // High-cost orgs with low revenue
  if (insight.title.includes("high cost and low/no revenue")) {
    recommendations.push({
      actionType: "outreach",
      description:
        "Reach out to high-cost orgs to understand usage patterns and discuss plan upgrade",
      riskLevel: "low",
      expectedImpact: "Convert to paying customers or optimize their usage",
      reversibility: true,
    });

    recommendations.push({
      actionType: "throttle",
      description: "Consider rate limiting for non-paying orgs exceeding cost thresholds",
      riskLevel: "med",
      expectedImpact: "Reduce cost leakage",
      reversibility: true,
    });
  }

  // High cost per event
  if (insight.title.includes("High cost per event")) {
    recommendations.push({
      actionType: "investigate",
      description: "Analyze event processing pipeline for inefficiencies or unnecessary operations",
      riskLevel: "low",
      expectedImpact: "Optimize event processing cost",
      reversibility: true,
    });

    recommendations.push({
      actionType: "fix",
      description: "Optimize event processing code or caching strategy",
      riskLevel: "med",
      expectedImpact: "Reduce cost per event by 20-50%",
      reversibility: true,
    });
  }

  return recommendations;
}

/**
 * Generate support-related recommendations
 */
function generateSupportRecommendations(insight: Insight): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Ticket spike by category
  if (insight.title.includes("Support ticket spike")) {
    recommendations.push({
      actionType: "investigate",
      description: "Analyze ticket patterns to identify root cause",
      riskLevel: "low",
      expectedImpact: "Understand underlying issue",
      reversibility: true,
    });

    recommendations.push({
      actionType: "document",
      description: "Create or update runbook/documentation for common issues in this category",
      riskLevel: "low",
      expectedImpact: "Reduce future tickets through self-service",
      reversibility: true,
    });

    if (insight.severity === "critical") {
      recommendations.push({
        actionType: "fix",
        description: "Prioritize fixing the underlying product issue causing ticket spike",
        riskLevel: "high",
        expectedImpact: "Reduce ticket volume and improve user experience",
        reversibility: false, // Fixes may not be easily reversible
      });
    }
  }

  // Repeated tickets
  if (insight.title.includes("Repeated support issue")) {
    recommendations.push({
      actionType: "fix",
      description: "Address root cause of repeated issue to prevent future tickets",
      riskLevel: "med",
      expectedImpact: "Eliminate recurring support burden",
      reversibility: false,
    });

    recommendations.push({
      actionType: "document",
      description: "Add in-app notice or documentation to help users avoid this issue",
      riskLevel: "low",
      expectedImpact: "Prevent new tickets through proactive guidance",
      reversibility: true,
    });
  }

  // High ticket density orgs
  if (insight.title.includes("abnormally high ticket volume")) {
    recommendations.push({
      actionType: "outreach",
      description: "Proactively contact high-ticket orgs to provide support and identify issues",
      riskLevel: "low",
      expectedImpact: "Improve customer satisfaction and reduce ticket volume",
      reversibility: true,
    });

    recommendations.push({
      actionType: "investigate",
      description: "Review org usage patterns and configuration to identify misconfigurations",
      riskLevel: "low",
      expectedImpact: "Find and fix configuration issues",
      reversibility: true,
    });
  }

  return recommendations;
}

/**
 * Generate usage-related recommendations
 */
function generateUsageRecommendations(insight: Insight): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Feature adoption falling
  if (insight.title.includes("adoption decreased")) {
    recommendations.push({
      actionType: "investigate",
      description: "Survey users or analyze usage data to understand why adoption decreased",
      riskLevel: "low",
      expectedImpact: "Identify barriers to adoption",
      reversibility: true,
    });

    recommendations.push({
      actionType: "outreach",
      description: "Send targeted communication to inactive users about feature benefits",
      riskLevel: "low",
      expectedImpact: "Re-engage users and increase adoption",
      reversibility: true,
    });
  }

  // Inactive/churn-risk orgs
  if (insight.title.includes("inactive for")) {
    recommendations.push({
      actionType: "outreach",
      description: "Send re-engagement email to inactive orgs with helpful resources",
      riskLevel: "low",
      expectedImpact: "Reactivate dormant accounts",
      reversibility: true,
    });

    recommendations.push({
      actionType: "monitor",
      description: "Track inactive orgs and flag for churn prevention if no activity after 30 days",
      riskLevel: "low",
      expectedImpact: "Early warning for churn risk",
      reversibility: true,
    });
  }

  // Heavy users approaching limits
  if (insight.title.includes("approaching limits")) {
    recommendations.push({
      actionType: "outreach",
      description: "Proactively contact heavy users to discuss plan upgrade before hitting limits",
      riskLevel: "low",
      expectedImpact: "Prevent service interruption and increase revenue",
      reversibility: true,
    });
  }

  return recommendations;
}

/**
 * Generate stability-related recommendations
 */
function generateStabilityRecommendations(insight: Insight): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Error rate spike
  if (insight.title.includes("Error rate increased")) {
    recommendations.push({
      actionType: "investigate",
      description: "Review error logs and recent deployments to identify cause",
      riskLevel: "low",
      expectedImpact: "Identify root cause of errors",
      reversibility: true,
    });

    if (insight.severity === "critical") {
      recommendations.push({
        actionType: "fix",
        description: "Prioritize fixing critical errors immediately",
        riskLevel: "high",
        expectedImpact: "Restore system stability",
        reversibility: false,
      });
    }
  }

  // Webhook failures
  if (insight.title.includes("Webhook failure rate")) {
    recommendations.push({
      actionType: "verify",
      description: "Verify webhook secrets and endpoints are correct",
      riskLevel: "low",
      expectedImpact: "Fix configuration issues",
      reversibility: true,
    });

    recommendations.push({
      actionType: "retry",
      description: "Review retry logic and consider exponential backoff for failed webhooks",
      riskLevel: "low",
      expectedImpact: "Improve webhook delivery rate",
      reversibility: true,
    });

    recommendations.push({
      actionType: "investigate",
      description: "Check recent deployments or infrastructure changes that might affect webhooks",
      riskLevel: "low",
      expectedImpact: "Identify root cause",
      reversibility: true,
    });
  }

  // Job backlog
  if (insight.title.includes("Job backlog")) {
    recommendations.push({
      actionType: "investigate",
      description: "Review job queue and identify bottlenecks or slow jobs",
      riskLevel: "low",
      expectedImpact: "Identify optimization opportunities",
      reversibility: true,
    });

    recommendations.push({
      actionType: "monitor",
      description: "Set up alerts for job queue depth to catch issues early",
      riskLevel: "low",
      expectedImpact: "Proactive monitoring",
      reversibility: true,
    });

    if (insight.evidence.metrics.pendingJobs > 100) {
      recommendations.push({
        actionType: "fix",
        description: "Scale job workers or optimize slow jobs to clear backlog",
        riskLevel: "med",
        expectedImpact: "Reduce job backlog and improve processing time",
        reversibility: true,
      });
    }
  }

  // Route-level instability
  if (insight.title.includes("route(s) with high error rates")) {
    recommendations.push({
      actionType: "investigate",
      description: "Review error logs for unstable routes to identify patterns",
      riskLevel: "low",
      expectedImpact: "Identify root cause",
      reversibility: true,
    });

    recommendations.push({
      actionType: "fix",
      description: "Fix bugs or add error handling for unstable routes",
      riskLevel: "med",
      expectedImpact: "Improve route stability",
      reversibility: false,
    });

    recommendations.push({
      actionType: "monitor",
      description: "Add route-level error rate monitoring and alerts",
      riskLevel: "low",
      expectedImpact: "Early detection of route issues",
      reversibility: true,
    });
  }

  return recommendations;
}

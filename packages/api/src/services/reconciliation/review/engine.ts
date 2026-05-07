import { logError, logInfo } from "../../../utils/logger";
import { query } from "../../../db";
import { getMatchingRulesForJob, DEFAULT_TOLERANCES } from "../../matching-rules-loader";
import { ReviewResult, SYSTEM_USER_ID } from "./types";
import { getMatch, markMatchReviewed, logAuditTrail } from "./db";
import { applyRuleBasedResolution, handleException } from "./rules";

/**
 * Automatically review a single reconciliation match
 */
export async function autoReviewMatch(
  matchId: string,
  tenantId: string,
  jobId?: string
): Promise<ReviewResult> {
  try {
    // Fetch match details
    const match = await getMatch(matchId, tenantId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Load matching rules config from canonical loader
    const configJobId = jobId ?? match.runId;
    let matchingConfig;
    try {
      matchingConfig = await getMatchingRulesForJob(tenantId, configJobId);
    } catch (error) {
      logError("Failed to load matching rules, using defaults", error, {
        tenantId,
        jobId: configJobId,
      });
      matchingConfig = {
        amountTolerance: DEFAULT_TOLERANCES.amount,
        dateToleranceDays: DEFAULT_TOLERANCES.dateDays,
      };
    }

    // Use threshold from matching rules or fall back to default
    const autoApproveThreshold = 0.95; // High confidence for auto-approve
    const ruleBasedThreshold =
      matchingConfig.matchingRules?.find((r) => r.type === "fuzzy")?.threshold ?? 0.8;
    const exceptionThreshold = 0.6;

    // Skip if already reviewed
    if (match.reviewed) {
      logInfo("Match already reviewed", { matchId, tenantId });
      return {
        matchId,
        action: "auto_approved",
        confidence: match.confidence,
        auditEntryId: "",
      };
    }

    // Determine review action based on confidence
    let action: ReviewResult["action"];
    let resolutionRule: string | undefined;

    if (match.confidence >= autoApproveThreshold) {
      // Tier 1: Auto-approve high confidence matches
      action = "auto_approved";
      resolutionRule = "high_confidence_auto_approve";
    } else if (match.confidence >= ruleBasedThreshold) {
      // Tier 2: Apply rule-based resolution
      const ruleResult = await applyRuleBasedResolution(match, matchingConfig);
      action = ruleResult.action;
      resolutionRule = ruleResult.rule;
    } else if (match.confidence >= exceptionThreshold) {
      // Tier 3: Automated exception handling
      const exceptionResult = await handleException(match);
      action = exceptionResult.action;
      resolutionRule = exceptionResult.rule;
    } else {
      // Tier 4: System-level flagging (NOT human review)
      action = "system_flagged";
      resolutionRule = "low_confidence_system_review";
    }

    // Mark match as reviewed
    await markMatchReviewed(matchId, tenantId, action, resolutionRule);

    // Log audit trail
    const auditEntryId = await logAuditTrail({
      auditType: "auto_resolution",
      action,
      entityType: "reconciliation_match",
      entityId: matchId,
      tenantId,
      beforeState: {
        reviewed: false,
        reviewedBy: null,
        reviewedAt: null,
      },
      afterState: {
        reviewed: true,
        reviewedBy: SYSTEM_USER_ID,
        reviewedAt: new Date().toISOString(),
        action,
        resolutionRule,
      },
      metadata: {
        confidence: match.confidence,
        matchType: match.matchType,
        matchReason: match.matchReason,
        amountDiff: match.amountDiff,
        dateDiff: match.dateDiff,
        resolutionRule,
      },
    });

    logInfo("Match auto-reviewed", {
      matchId,
      tenantId,
      action,
      confidence: match.confidence,
      resolutionRule,
    });

    return {
      matchId,
      action,
      resolutionRule,
      confidence: match.confidence,
      auditEntryId,
    };
  } catch (error) {
    logError("Failed to auto-review match", error, { matchId, tenantId });
    throw error;
  }
}

/**
 * Automatically review all matches in a reconciliation run
 */
export async function autoReviewRun(
  runId: string,
  tenantId: string
): Promise<{
  reviewed: number;
  autoApproved: number;
  ruleResolved: number;
  exceptionHandled: number;
  systemFlagged: number;
  errors: number;
}> {
  try {
    // Fetch all unreviewed matches for this run
    const matches = await query<{
      id: string;
      confidence: number;
      match_type: string;
      amount_diff: number | null;
      date_diff: number | null;
    }>(
      `SELECT id, confidence, match_type, amount_diff, date_diff
       FROM reconciliation_matches
       WHERE run_id = $1 AND tenant_id = $2 AND reviewed = false
       ORDER BY confidence DESC`,
      [runId, tenantId]
    );

    const stats = {
      reviewed: 0,
      autoApproved: 0,
      ruleResolved: 0,
      exceptionHandled: 0,
      systemFlagged: 0,
      errors: 0,
    };

    // Review each match
    for (const match of matches) {
      try {
        const result = await autoReviewMatch(match.id, tenantId);
        stats.reviewed++;

        switch (result.action) {
          case "auto_approved":
            stats.autoApproved++;
            break;
          case "rule_resolved":
            stats.ruleResolved++;
            break;
          case "exception_handled":
            stats.exceptionHandled++;
            break;
          case "system_flagged":
            stats.systemFlagged++;
            break;
        }
      } catch (error) {
        stats.errors++;
        logError("Failed to review match in run", error, {
          matchId: match.id,
          runId,
          tenantId,
        });
      }
    }

    logInfo("Run auto-review completed", {
      runId,
      tenantId,
      ...stats,
    });

    return stats;
  } catch (error) {
    logError("Failed to auto-review run", error, { runId, tenantId });
    throw error;
  }
}

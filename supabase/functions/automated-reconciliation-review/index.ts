/**
 * Automated Reconciliation Review Edge Function
 * 
 * Processes completed reconciliation runs and automatically reviews matches
 * according to industry best practices. Eliminates all manual intervention.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_USER_ID = "system:automated_review";

// Industry-standard confidence thresholds
const CONFIDENCE_THRESHOLDS = {
  AUTO_APPROVE: 0.95,
  RULE_BASED: 0.80,
  EXCEPTION_HANDLING: 0.60,
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { runId, tenantId } = await req.json().catch(() => ({}));

    if (runId && tenantId) {
      // Process specific run
      const result = await processRun(supabaseClient, runId, tenantId);
      return new Response(
        JSON.stringify({ success: true, ...result }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // Process pending reviews
      const result = await processPendingReviews(supabaseClient);
      return new Response(
        JSON.stringify({ success: true, ...result }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Process a specific reconciliation run
 */
async function processRun(
  supabase: ReturnType<typeof createClient>,
  runId: string,
  tenantId: string
) {
  // Get all unreviewed matches
  const { data: matches, error: matchesError } = await supabase
    .from("reconciliation_matches")
    .select("*")
    .eq("run_id", runId)
    .eq("tenant_id", tenantId)
    .eq("reviewed", false)
    .order("confidence", { ascending: false });

  if (matchesError) {
    throw new Error(`Failed to fetch matches: ${matchesError.message}`);
  }

  const stats = {
    reviewed: 0,
    autoApproved: 0,
    ruleResolved: 0,
    exceptionHandled: 0,
    systemFlagged: 0,
  };

  // Review each match
  for (const match of matches || []) {
    const confidence = Number(match.confidence);
    let action: string;
    let resolutionRule: string;

    if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_APPROVE) {
      action = "auto_approved";
      resolutionRule = "high_confidence_auto_approve";
      stats.autoApproved++;
    } else if (confidence >= CONFIDENCE_THRESHOLDS.RULE_BASED) {
      // Apply rule-based resolution
      const ruleResult = applyRuleBasedResolution(match);
      action = ruleResult.action;
      resolutionRule = ruleResult.rule;
      stats.ruleResolved++;
    } else if (confidence >= CONFIDENCE_THRESHOLDS.EXCEPTION_HANDLING) {
      // Exception handling
      const exceptionResult = handleException(match);
      action = exceptionResult.action;
      resolutionRule = exceptionResult.rule;
      stats.exceptionHandled++;
    } else {
      action = "system_flagged";
      resolutionRule = "low_confidence_system_review";
      stats.systemFlagged++;
    }

    // Update match
    await supabase
      .from("reconciliation_matches")
      .update({
        reviewed: true,
        reviewed_by: SYSTEM_USER_ID,
        reviewed_at: new Date().toISOString(),
        metadata: {
          ...(match.metadata || {}),
          auto_reviewed: true,
          review_action: action,
          resolution_rule: resolutionRule,
          reviewed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.id);

    stats.reviewed++;

    // Log audit trail (if recon_audits table exists)
    try {
      await supabase.from("recon_audits").insert({
        tenant_id: tenantId,
        audit_type: "auto_resolution",
        action,
        entity_type: "reconciliation_match",
        entity_id: match.id,
        before_state: {
          reviewed: false,
          reviewed_by: null,
          reviewed_at: null,
        },
        after_state: {
          reviewed: true,
          reviewed_by: SYSTEM_USER_ID,
          reviewed_at: new Date().toISOString(),
          action,
          resolution_rule: resolutionRule,
        },
        metadata: {
          confidence,
          match_type: match.match_type,
          match_reason: match.match_reason,
          amount_diff: match.amount_diff,
          date_diff: match.date_diff,
          resolution_rule: resolutionRule,
        },
      });
    } catch (auditError) {
      // Non-fatal: audit logging may not be available
      console.warn("Audit logging failed (non-fatal):", auditError);
    }
  }

  return stats;
}

/**
 * Process pending reviews
 */
async function processPendingReviews(
  supabase: ReturnType<typeof createClient>
) {
  // Find completed runs that haven't been fully reviewed
  const { data: runs, error: runsError } = await supabase
    .from("reconciliation_runs")
    .select("id, tenant_id")
    .eq("status", "completed")
    .not("completed_at", "is", null)
    .limit(100);

  if (runsError) {
    throw new Error(`Failed to fetch runs: ${runsError.message}`);
  }

  const results = {
    processed: 0,
    reviewed: 0,
    errors: 0,
  };

  for (const run of runs || []) {
    try {
      const runStats = await processRun(supabase, run.id, run.tenant_id);
      results.processed++;
      results.reviewed += runStats.reviewed;
    } catch (error) {
      results.errors++;
      console.error(`Failed to process run ${run.id}:`, error);
    }
  }

  return results;
}

/**
 * Apply rule-based resolution
 */
function applyRuleBasedResolution(match: any): { action: string; rule: string } {
  const amountDiff = match.amount_diff ? Math.abs(Number(match.amount_diff)) : null;
  const dateDiff = match.date_diff ? Math.abs(Number(match.date_diff)) : null;

  // Rule 1: Amount mismatch within tolerance
  if (amountDiff !== null && amountDiff <= 1.00) {
    return {
      action: "rule_resolved",
      rule: "amount_mismatch_within_tolerance",
    };
  }

  // Rule 2: Date mismatch within window
  if (dateDiff !== null && dateDiff <= 3) {
    return {
      action: "rule_resolved",
      rule: "date_mismatch_within_window",
    };
  }

  // Rule 3: Exact match type
  if (match.match_type === "exact" && Number(match.confidence) >= 0.85) {
    return {
      action: "rule_resolved",
      rule: "exact_match_high_confidence",
    };
  }

  return {
    action: "exception_handled",
    rule: "rule_based_default_exception",
  };
}

/**
 * Handle exceptions
 */
function handleException(match: any): { action: string; rule: string } {
  const amountDiff = match.amount_diff ? Math.abs(Number(match.amount_diff)) : null;
  const dateDiff = match.date_diff ? Math.abs(Number(match.date_diff)) : null;

  // Exception 1: Rounding difference
  if (amountDiff !== null && amountDiff <= 0.01) {
    return {
      action: "exception_handled",
      rule: "rounding_difference_auto_resolve",
    };
  }

  // Exception 2: Timing difference
  if (dateDiff !== null && dateDiff <= 3) {
    return {
      action: "exception_handled",
      rule: "timing_difference_auto_resolve",
    };
  }

  return {
    action: "system_flagged",
    rule: "exception_default_system_review",
  };
}

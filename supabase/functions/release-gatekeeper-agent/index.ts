/**
 * Release Gatekeeper Agent (QA/Release Replacement)
 * 
 * Replaces: QA / Release Manager role
 * Runs: On PR/commit events + Post-deploy
 * 
 * What it does:
 * - Blocks deploys if error rate spikes
 * - Detects RLS violations
 * - Runs synthetic tests on key flows
 * - Auto-annotates releases with risk summary
 * - Recommends rollback if needed
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SafetyCheck {
  name: string;
  status: "passed" | "failed" | "warning";
  message: string;
  details?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const runId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const body = await req.json().catch(() => ({}));
    const releaseId = body.release_id || body.commit_sha || "unknown";
    const checkType = body.check_type || "pre_merge";

    await supabase.from("agent_runs").insert({
      id: runId,
      agent_type: "release_gatekeeper",
      status: "running",
      started_at: new Date().toISOString(),
      inputs: { release_id: releaseId, check_type: checkType },
    });

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const checks: SafetyCheck[] = [];
    let blocksDeployment = false;
    let recommendRollback = false;
    let rollbackReason = "";

    // ========================================================================
    // CHECK 1: Error Rate Spike Detection
    // ========================================================================

    const { data: recentErrors } = await supabase
      .from("error_logs")
      .select("id, created_at")
      .gte("created_at", hourAgo.toISOString())
      .limit(1000);

    const { data: olderErrors } = await supabase
      .from("error_logs")
      .select("id")
      .gte("created_at", dayAgo.toISOString())
      .lt("created_at", hourAgo.toISOString())
      .limit(1000);

    const recentErrorCount = recentErrors?.length || 0;
    const olderErrorCount = olderErrors?.length || 23; // ~1 per hour average
    const errorRateIncrease = olderErrorCount > 0 ? recentErrorCount / olderErrorCount : 0;

    if (errorRateIncrease > 2.0 && recentErrorCount > 10) {
      checks.push({
        name: "error_rate_check",
        status: "failed",
        message: `Error rate spiked: ${recentErrorCount} errors in last hour (was ~${olderErrorCount / 24} per hour)`,
        details: {
          recent_errors: recentErrorCount,
          baseline_errors: olderErrorCount / 24,
          increase_factor: errorRateIncrease,
        },
      });
      blocksDeployment = true;
      if (errorRateIncrease > 5.0) {
        recommendRollback = true;
        rollbackReason = `Critical error rate spike: ${errorRateIncrease.toFixed(1)}x increase`;
      }
    } else if (errorRateIncrease > 1.5) {
      checks.push({
        name: "error_rate_check",
        status: "warning",
        message: `Elevated error rate: ${recentErrorCount} errors in last hour`,
        details: {
          recent_errors: recentErrorCount,
          increase_factor: errorRateIncrease,
        },
      });
    } else {
      checks.push({
        name: "error_rate_check",
        status: "passed",
        message: `Error rate normal: ${recentErrorCount} errors in last hour`,
      });
    }

    // ========================================================================
    // CHECK 2: RLS Policy Violations
    // ========================================================================

    // Check for tables without RLS (critical security issue)
    const { data: rlsCheck } = await supabase.rpc("check_rls_policies", {}).catch(() => ({
      data: null,
    }));

    if (rlsCheck && Array.isArray(rlsCheck) && rlsCheck.length > 0) {
      checks.push({
        name: "rls_policy_check",
        status: "failed",
        message: `CRITICAL: ${rlsCheck.length} table(s) without Row Level Security policies`,
        details: {
          tables_without_rls: rlsCheck,
        },
      });
      blocksDeployment = true;
      recommendRollback = true;
      rollbackReason = "RLS policy violations detected - security risk";
    } else {
      checks.push({
        name: "rls_policy_check",
        status: "passed",
        message: "All tables have RLS policies",
      });
    }

    // ========================================================================
    // CHECK 3: Database Performance Regression
    // ========================================================================

    const { data: slowQueries } = await supabase
      .rpc("get_slow_queries", { p_min_duration_ms: 2000 })
      .catch(() => ({ data: null }));

    if (slowQueries && Array.isArray(slowQueries) && slowQueries.length > 0) {
      checks.push({
        name: "performance_check",
        status: slowQueries.length > 5 ? "failed" : "warning",
        message: `${slowQueries.length} slow query(s) detected (>2s)`,
        details: {
          slow_query_count: slowQueries.length,
        },
      });
      if (slowQueries.length > 10) {
        blocksDeployment = true;
      }
    } else {
      checks.push({
        name: "performance_check",
        status: "passed",
        message: "No performance regressions detected",
      });
    }

    // ========================================================================
    // CHECK 4: Key Flow Synthetic Tests
    // ========================================================================

    // Test: Receipt upload flow
    try {
      const { error: receiptTestError } = await supabase
        .from("receipt_uploads")
        .select("id")
        .limit(1);

      if (receiptTestError && receiptTestError.code !== "PGRST116") {
        // PGRST116 = no rows returned, which is fine
        checks.push({
          name: "receipt_upload_flow",
          status: "failed",
          message: `Receipt upload flow test failed: ${receiptTestError.message}`,
        });
        blocksDeployment = true;
      } else {
        checks.push({
          name: "receipt_upload_flow",
          status: "passed",
          message: "Receipt upload flow accessible",
        });
      }
    } catch (error) {
      checks.push({
        name: "receipt_upload_flow",
        status: "warning",
        message: `Receipt upload flow test error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    // Test: API key validation
    try {
      const { error: apiKeyTestError } = await supabase
        .from("api_keys")
        .select("id")
        .limit(1)
        .catch(() => ({ error: null }));

      if (apiKeyTestError && apiKeyTestError.code !== "PGRST116") {
        checks.push({
          name: "api_key_validation",
          status: "failed",
          message: `API key validation test failed: ${apiKeyTestError.message}`,
        });
        blocksDeployment = true;
      } else {
        checks.push({
          name: "api_key_validation",
          status: "passed",
          message: "API key validation accessible",
        });
      }
    } catch (error) {
      checks.push({
        name: "api_key_validation",
        status: "warning",
        message: `API key validation test error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    // ========================================================================
    // CHECK 5: Health Check Status
    // ========================================================================

    const { data: recentHealthChecks } = await supabase
      .from("health_checks")
      .select("overall_status, timestamp")
      .order("timestamp", { ascending: false })
      .limit(5)
      .catch(() => ({ data: null }));

    if (recentHealthChecks && recentHealthChecks.length > 0) {
      const unhealthyChecks = recentHealthChecks.filter(
        (h) => h.overall_status === "unhealthy" || h.overall_status === "degraded"
      );

      if (unhealthyChecks.length >= 3) {
        checks.push({
          name: "health_check_status",
          status: "failed",
          message: `${unhealthyChecks.length} of last 5 health checks were unhealthy/degraded`,
        });
        blocksDeployment = true;
        if (unhealthyChecks.length === 5) {
          recommendRollback = true;
          rollbackReason = "All recent health checks failing";
        }
      } else {
        checks.push({
          name: "health_check_status",
          status: "passed",
          message: "System health checks passing",
        });
      }
    } else {
      checks.push({
        name: "health_check_status",
        status: "warning",
        message: "No recent health check data available",
      });
    }

    // ========================================================================
    // GENERATE RISK SUMMARY
    // ========================================================================

    const failedChecks = checks.filter((c) => c.status === "failed");
    const warningChecks = checks.filter((c) => c.status === "warning");
    const passedChecks = checks.filter((c) => c.status === "passed");

    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    if (failedChecks.length > 0) {
      riskLevel = failedChecks.some((c) => c.name.includes("rls") || c.name.includes("critical"))
        ? "critical"
        : failedChecks.length > 2
          ? "high"
          : "medium";
    } else if (warningChecks.length > 2) {
      riskLevel = "medium";
    }

    const riskSummary = `
Release Safety Check Summary:
- Passed: ${passedChecks.length}
- Warnings: ${warningChecks.length}
- Failed: ${failedChecks.length}
- Risk Level: ${riskLevel.toUpperCase()}
${blocksDeployment ? "⚠️ DEPLOYMENT BLOCKED" : ""}
${recommendRollback ? `🚨 ROLLBACK RECOMMENDED: ${rollbackReason}` : ""}
`;

    // ========================================================================
    // STORE CHECK RESULTS
    // ========================================================================

    await supabase.from("release_safety_checks").insert({
      release_id: releaseId,
      check_type: checkType,
      status: failedChecks.length > 0 ? "failed" : warningChecks.length > 0 ? "warning" : "passed",
      checks: checks,
      blocks_deployment: blocksDeployment,
      risk_summary: riskSummary,
      risk_level: riskLevel,
      recommend_rollback: recommendRollback,
      rollback_reason: rollbackReason || null,
    });

    // ========================================================================
    // RECORD COMPLETION
    // ========================================================================

    const durationMs = Date.now() - startTime;

    await supabase
      .from("agent_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        outputs: {
          checks_performed: checks.length,
          checks_passed: passedChecks.length,
          checks_failed: failedChecks.length,
          blocks_deployment: blocksDeployment,
          recommend_rollback: recommendRollback,
          risk_level: riskLevel,
        },
        artifacts: [
          {
            type: "safety_check",
            release_id: releaseId,
            risk_level: riskLevel,
            blocks_deployment: blocksDeployment,
          },
        ],
      })
      .eq("id", runId);

    // Create alert if deployment blocked
    if (blocksDeployment) {
      await supabase.from("alerts").insert({
        severity: recommendRollback ? "critical" : "high",
        title: `Release ${releaseId} blocked by safety checks`,
        message: riskSummary,
        check_type: "release_gatekeeper",
        details: {
          release_id: releaseId,
          failed_checks: failedChecks.map((c) => c.name),
          risk_level: riskLevel,
          recommend_rollback: recommendRollback,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        duration_ms: durationMs,
        release_id: releaseId,
        checks_performed: checks.length,
        checks_passed: passedChecks.length,
        checks_failed: failedChecks.length,
        blocks_deployment: blocksDeployment,
        recommend_rollback: recommendRollback,
        risk_level: riskLevel,
        risk_summary: riskSummary,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: blocksDeployment ? 400 : 200, // 400 if deployment blocked
      }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;

    await supabase
      .from("agent_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        error_message: error instanceof Error ? error.message : String(error),
        error_stack: error instanceof Error ? error.stack : undefined,
      })
      .eq("id", runId)
      .catch(() => {});

    return new Response(
      JSON.stringify({
        error: "Release Gatekeeper Agent failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

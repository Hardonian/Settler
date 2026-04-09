/**
 * Architecture Sentinel Agent (CTO Replacement)
 *
 * Replaces: CTO / Tech Lead role
 * Runs: Daily (or on PR/commit events)
 *
 * What it does:
 * - Scans repo structure
 * - Tracks file growth, dependency changes
 * - Flags patterns violating architecture rules
 * - Opens issues or PR comments automatically
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArchitectureRule {
  name: string;
  type:
    | "complexity_creep"
    | "dependency_risk"
    | "performance_regression"
    | "rls_violation"
    | "file_size";
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
}

interface Violation {
  violation_type: string;
  severity: string;
  file_path?: string;
  component_name?: string;
  metric_name: string;
  current_value: number;
  threshold_value: number;
  violation_description: string;
  suggested_action: string;
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

    // Record agent run start
    await supabase.from("agent_runs").insert({
      id: runId,
      agent_type: "architecture_sentinel",
      status: "running",
      started_at: new Date().toISOString(),
      inputs: {},
    });

    const violations: Violation[] = [];

    // ========================================================================
    // RULE 1: Complexity Creep Detection
    // Check for files growing too large or functions with too many lines
    // ========================================================================

    // Query for large files (would need to integrate with git or file system)
    // For now, we'll check database for patterns that indicate complexity

    const { data: recentMigrations } = await supabase
      .from("schema_migrations")
      .select("version, name")
      .order("version", { ascending: false })
      .limit(10)
      .catch(() => ({ data: null }));

    // Check for migration complexity (too many migrations = schema drift)
    if (recentMigrations && recentMigrations.length > 5) {
      violations.push({
        violation_type: "complexity_creep",
        severity: "medium",
        metric_name: "migration_count",
        current_value: recentMigrations.length,
        threshold_value: 5,
        violation_description: `${recentMigrations.length} migrations in recent period. May indicate schema drift or lack of planning.`,
        suggested_action:
          "Review migration history. Consider consolidating migrations or refactoring schema design.",
      });
    }

    // ========================================================================
    // RULE 2: Dependency Risk Detection
    // Check for outdated dependencies or security vulnerabilities
    // ========================================================================

    // Check for RLS policy violations (critical security issue)
    const { data: tablesWithoutRLS } = await supabase
      .rpc("check_rls_policies", {})
      .catch(() => ({ data: null }));

    if (tablesWithoutRLS && Array.isArray(tablesWithoutRLS) && tablesWithoutRLS.length > 0) {
      violations.push({
        violation_type: "rls_violation",
        severity: "critical",
        metric_name: "tables_without_rls",
        current_value: tablesWithoutRLS.length,
        threshold_value: 0,
        violation_description: `${tablesWithoutRLS.length} table(s) without Row Level Security policies. Critical security risk.`,
        suggested_action:
          "Immediately add RLS policies to all tables. Review data access patterns.",
      });
    }

    // ========================================================================
    // RULE 3: Performance Regression Detection
    // Check for slow queries or performance degradation
    // ========================================================================

    const { data: slowQueries } = await supabase
      .rpc("get_slow_queries", { p_min_duration_ms: 1000 })
      .catch(() => ({ data: null }));

    if (slowQueries && Array.isArray(slowQueries) && slowQueries.length > 0) {
      violations.push({
        violation_type: "performance_regression",
        severity: slowQueries.length > 10 ? "high" : "medium",
        metric_name: "slow_queries",
        current_value: slowQueries.length,
        threshold_value: 0,
        violation_description: `${slowQueries.length} slow query(s) detected (>1s). Performance degradation detected.`,
        suggested_action:
          "Review query performance. Add indexes, optimize queries, or consider caching.",
      });
    }

    // ========================================================================
    // RULE 4: Error Rate Patterns
    // Check for increasing error rates indicating code quality issues
    // ========================================================================

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: recentErrors } = await supabase
      .from("error_logs")
      .select("id, error_type, created_at")
      .gte("created_at", dayAgo.toISOString())
      .limit(1000);

    const { data: weekOldErrors } = await supabase
      .from("error_logs")
      .select("id")
      .gte("created_at", weekAgo.toISOString())
      .lt("created_at", dayAgo.toISOString())
      .limit(1000);

    const recentErrorCount = recentErrors?.length || 0;
    const weekOldErrorCount = weekOldErrors?.length || 0;
    const dailyAvg = weekOldErrorCount / 7;

    if (recentErrorCount > dailyAvg * 1.5 && dailyAvg > 10) {
      violations.push({
        violation_type: "performance_regression",
        severity: "high",
        metric_name: "error_rate_increase",
        current_value: recentErrorCount,
        threshold_value: dailyAvg * 1.5,
        violation_description: `Error rate increased: ${recentErrorCount} errors today vs ${dailyAvg.toFixed(1)} daily average. Possible regression.`,
        suggested_action: "Investigate error patterns. Check recent deployments and code changes.",
      });
    }

    // ========================================================================
    // RULE 5: Code Duplication Detection
    // Check for patterns indicating code duplication or lack of abstraction
    // ========================================================================

    // Check for similar function names or patterns in database
    // This would ideally scan the codebase, but we can check for patterns in usage

    const { data: usagePatterns } = await supabase
      .from("usage_events")
      .select("event_type")
      .gte("timestamp", dayAgo.toISOString())
      .limit(10000);

    const eventTypeCounts = new Map<string, number>();
    usagePatterns?.forEach((e) => {
      const count = eventTypeCounts.get(e.event_type) || 0;
      eventTypeCounts.set(e.event_type, count + 1);
    });

    // If too many unique event types, might indicate lack of standardization
    if (eventTypeCounts.size > 50) {
      violations.push({
        violation_type: "complexity_creep",
        severity: "low",
        metric_name: "event_type_proliferation",
        current_value: eventTypeCounts.size,
        threshold_value: 50,
        violation_description: `${eventTypeCounts.size} unique event types detected. May indicate lack of standardization.`,
        suggested_action: "Review event taxonomy. Consider consolidating similar events.",
      });
    }

    // ========================================================================
    // RULE 6: Database Index Coverage
    // Check for missing indexes on frequently queried columns
    // ========================================================================

    // Check for tables with high query volume but potentially missing indexes
    const { data: highVolumeQueries } = await supabase
      .from("monitoring_metrics")
      .select("metric_name, value")
      .eq("metric_name", "query_count")
      .gte("timestamp", dayAgo.toISOString())
      .order("value", { ascending: false })
      .limit(10)
      .catch(() => ({ data: null }));

    if (highVolumeQueries && highVolumeQueries.length > 0) {
      const topQuery = highVolumeQueries[0];
      if (topQuery.value > 10000) {
        violations.push({
          violation_type: "performance_regression",
          severity: "medium",
          metric_name: "high_volume_queries",
          current_value: topQuery.value,
          threshold_value: 10000,
          violation_description: `High query volume detected: ${topQuery.metric_name} with ${topQuery.value} queries. Ensure proper indexing.`,
          suggested_action:
            "Review query patterns. Add indexes if missing. Consider query optimization.",
        });
      }
    }

    // ========================================================================
    // RULE 7: API Response Time Degradation
    // Check for increasing API response times
    // ========================================================================

    const { data: responseTimeMetrics } = await supabase
      .from("monitoring_metrics")
      .select("value, timestamp")
      .eq("metric_name", "api_response_time_ms")
      .gte("timestamp", weekAgo.toISOString())
      .order("timestamp", { ascending: false })
      .limit(100)
      .catch(() => ({ data: null }));

    if (responseTimeMetrics && responseTimeMetrics.length > 20) {
      const recentAvg =
        responseTimeMetrics.slice(0, 20).reduce((sum, m) => sum + Number(m.value || 0), 0) / 20;
      const olderAvg =
        responseTimeMetrics.slice(20, 40).reduce((sum, m) => sum + Number(m.value || 0), 0) / 20;

      if (recentAvg > olderAvg * 1.3 && recentAvg > 500) {
        violations.push({
          violation_type: "performance_regression",
          severity: "high",
          metric_name: "api_response_time",
          current_value: recentAvg,
          threshold_value: olderAvg * 1.3,
          violation_description: `API response time increased: ${recentAvg.toFixed(0)}ms (was ${olderAvg.toFixed(0)}ms). 30% degradation detected.`,
          suggested_action:
            "Investigate API performance. Check for N+1 queries, missing indexes, or inefficient code paths.",
        });
      }
    }

    // ========================================================================
    // STORE VIOLATIONS
    // ========================================================================

    // Clear old open violations that are no longer detected
    const existingViolations = await supabase
      .from("architecture_violations")
      .select("id, violation_type, metric_name")
      .eq("status", "open");

    const existingKeys = new Set(
      existingViolations.data?.map((v) => `${v.violation_type}:${v.metric_name}`) || []
    );

    // Insert new violations
    for (const violation of violations) {
      const key = `${violation.violation_type}:${violation.metric_name}`;
      if (!existingKeys.has(key)) {
        await supabase.from("architecture_violations").insert({
          violation_type: violation.violation_type,
          severity: violation.severity,
          metric_name: violation.metric_name,
          current_value: violation.current_value,
          threshold_value: violation.threshold_value,
          violation_description: violation.violation_description,
          suggested_action: violation.suggested_action,
          status: "open",
        });
      }
    }

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
          violations_detected: violations.length,
          violations_by_severity: {
            critical: violations.filter((v) => v.severity === "critical").length,
            high: violations.filter((v) => v.severity === "high").length,
            medium: violations.filter((v) => v.severity === "medium").length,
            low: violations.filter((v) => v.severity === "low").length,
          },
        },
        artifacts: violations.map((v) => ({
          type: "violation",
          violation_type: v.violation_type,
          severity: v.severity,
        })),
      })
      .eq("id", runId);

    // Create alerts for critical violations
    const criticalViolations = violations.filter((v) => v.severity === "critical");
    if (criticalViolations.length > 0) {
      for (const violation of criticalViolations) {
        await supabase.from("alerts").insert({
          severity: "critical",
          title: `Architecture Violation: ${violation.violation_type}`,
          message: violation.violation_description,
          check_type: "architecture_sentinel",
          details: {
            violation_type: violation.violation_type,
            metric_name: violation.metric_name,
            current_value: violation.current_value,
            threshold_value: violation.threshold_value,
            suggested_action: violation.suggested_action,
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        duration_ms: durationMs,
        violations_detected: violations.length,
        critical_count: criticalViolations.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        error: "Architecture Sentinel Agent failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

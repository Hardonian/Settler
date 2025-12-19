/**
 * Weekly Reality Loop
 * 
 * Automated weekly job that:
 * - Snapshots all Reality Metrics
 * - Compares week-over-week deltas
 * - Flags stagnant metrics, regressions, broken invariants
 * - Stores result in weekly_snapshots
 * - Emits reality_events for failures
 * - Generates WEEKLY_REALITY_REPORT.md
 * 
 * Runs via cron (typically Monday mornings).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekStartDate = weekStart.toISOString().split("T")[0];

    // Check if snapshot already exists for this week
    const { data: existing } = await supabase
      .from("weekly_snapshots")
      .select("id")
      .eq("week_start", weekStartDate)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Snapshot already exists for this week",
          weekStart: weekStartDate,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get all current reality metrics
    const { data: currentMetrics, error: metricsError } = await supabase
      .from("reality_metrics")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (metricsError) {
      throw metricsError;
    }

    // Get previous week's snapshot for comparison
    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekStartDate = previousWeekStart.toISOString().split("T")[0];

    const { data: previousSnapshot } = await supabase
      .from("weekly_snapshots")
      .select("metrics_snapshot")
      .eq("week_start", previousWeekStartDate)
      .single();

    // Calculate deltas
    const deltaSummary: Record<string, any> = {};
    const risks: any[] = [];
    const requiredActions: any[] = [];

    if (currentMetrics) {
      for (const metric of currentMetrics) {
        const key = `${metric.category}:${metric.name}`;
        
        // Find previous value
        let previousValue: any = null;
        if (previousSnapshot?.metrics_snapshot) {
          const prevMetrics = previousSnapshot.metrics_snapshot as any[];
          const prevMetric = prevMetrics.find(
            (m: any) => m.category === metric.category && m.name === metric.name
          );
          if (prevMetric) {
            previousValue = prevMetric.value;
          }
        }

        const currentValue = metric.value;
        const delta = previousValue !== null 
          ? calculateDelta(currentValue, previousValue)
          : null;

        deltaSummary[key] = {
          current: currentValue,
          previous: previousValue,
          delta: delta,
          status: metric.status,
        };

        // Flag risks
        if (metric.status === "broken") {
          risks.push({
            type: "broken_metric",
            severity: "critical",
            metric: key,
            message: `Metric ${key} is marked as BROKEN`,
          });
          requiredActions.push({
            action: `Fix data source for ${key}`,
            priority: "high",
            reason: "Metric is broken",
          });
        }

        if (metric.status === "assumed" && isCriticalMetric(metric.category, metric.name)) {
          risks.push({
            type: "unproven_critical_metric",
            severity: "warning",
            metric: key,
            message: `Critical metric ${key} is still ASSUMED - needs verification`,
          });
        }

        // Check for regressions
        if (delta !== null && isRegression(metric.category, metric.name, currentValue, previousValue, delta)) {
          risks.push({
            type: "regression",
            severity: "warning",
            metric: key,
            message: `Metric ${key} regressed: ${JSON.stringify(delta)}`,
          });
        }

        // Check for stagnation
        if (delta !== null && isStagnant(metric.category, metric.name, delta)) {
          risks.push({
            type: "stagnant_metric",
            severity: "info",
            metric: key,
            message: `Metric ${key} has not changed`,
          });
        }
      }
    }

    // Check invariants
    const invariantViolations = await checkInvariants(supabase);
    if (invariantViolations.length > 0) {
      risks.push(...invariantViolations);
      requiredActions.push(...invariantViolations.map((v: any) => ({
        action: v.message,
        priority: v.severity === "critical" ? "high" : "medium",
        reason: "Invariant violation",
      })));
    }

    // Get events summary for the week
    const weekAgo = new Date(weekStart);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: weekEvents } = await supabase
      .from("reality_events")
      .select("*")
      .gte("created_at", weekAgo.toISOString())
      .lt("created_at", weekStart.toISOString())
      .order("created_at", { ascending: false });

    const eventsSummary = {
      total: weekEvents?.length || 0,
      byCategory: groupBy(weekEvents || [], "category"),
      bySeverity: groupBy(weekEvents || [], "severity"),
      critical: weekEvents?.filter((e: any) => e.severity === "critical").length || 0,
    };

    // Generate summary
    const summary = {
      week_start: weekStartDate,
      metrics_count: currentMetrics?.length || 0,
      proven_metrics: currentMetrics?.filter((m: any) => m.status === "proven").length || 0,
      assumed_metrics: currentMetrics?.filter((m: any) => m.status === "assumed").length || 0,
      broken_metrics: currentMetrics?.filter((m: any) => m.status === "broken").length || 0,
      risks_count: risks.length,
      critical_risks: risks.filter((r: any) => r.severity === "critical").length,
      events_count: eventsSummary.total,
    };

    // Save snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from("weekly_snapshots")
      .insert({
        week_start: weekStartDate,
        summary: summary,
        metrics_snapshot: currentMetrics || [],
        events_summary: eventsSummary,
        delta_summary: deltaSummary,
        risks: risks,
        required_actions: requiredActions,
      })
      .select()
      .single();

    if (snapshotError) {
      throw snapshotError;
    }

    // Generate markdown report
    const markdownReport = generateWeeklyReport({
      weekStart: weekStartDate,
      summary,
      metrics: currentMetrics || [],
      risks,
      requiredActions,
      eventsSummary,
      deltaSummary,
    });

    // Record event
    await supabase.rpc("record_reality_event", {
      p_category: "system",
      p_event_name: "weekly_reality_snapshot_completed",
      p_severity: risks.filter((r: any) => r.severity === "critical").length > 0 ? "warning" : "info",
      p_meta: {
        week_start: weekStartDate,
        snapshot_id: snapshot.id,
        risks_count: risks.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        snapshotId: snapshot.id,
        weekStart: weekStartDate,
        summary,
        risksCount: risks.length,
        report: markdownReport,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in weekly reality loop:", error);
    
    // Record failure event
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      await supabase.rpc("record_reality_event", {
        p_category: "system",
        p_event_name: "weekly_reality_loop_failed",
        p_severity: "critical",
        p_meta: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } catch (eventError) {
      console.error("Failed to record failure event:", eventError);
    }

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

// Helper functions

function calculateDelta(current: any, previous: any): any {
  if (typeof current === "number" && typeof previous === "number") {
    return {
      absolute: current - previous,
      percent: previous !== 0 ? ((current - previous) / previous) * 100 : 0,
    };
  }
  return { changed: current !== previous };
}

function isCriticalMetric(category: string, name: string): boolean {
  const critical = [
    "revenue:mrr",
    "revenue:active_subscriptions",
    "tenant_isolation:rls_violations",
    "failure:hard_500_count",
  ];
  return critical.includes(`${category}:${name}`);
}

function isRegression(
  category: string,
  name: string,
  current: any,
  previous: any,
  delta: any
): boolean {
  // Revenue metrics should not decrease
  if (category === "revenue" && typeof current === "number" && typeof previous === "number") {
    return current < previous;
  }
  
  // Failure metrics should not increase
  if (category === "failure" && typeof current === "number" && typeof previous === "number") {
    return current > previous;
  }
  
  return false;
}

function isStagnant(category: string, name: string, delta: any): boolean {
  if (delta.absolute !== undefined) {
    return Math.abs(delta.absolute) < 0.01; // Essentially unchanged
  }
  return false;
}

async function checkInvariants(supabase: any): Promise<any[]> {
  const violations: any[] = [];

  // Invariant 1: RLS violations must be zero
  const { data: rlsMetric } = await supabase
    .from("reality_metrics")
    .select("value")
    .eq("category", "tenant_isolation")
    .eq("name", "rls_violations")
    .single();

  if (rlsMetric && typeof rlsMetric.value === "number" && rlsMetric.value > 0) {
    violations.push({
      type: "invariant_violation",
      severity: "critical",
      metric: "tenant_isolation:rls_violations",
      message: `RLS violations must be zero, but found ${rlsMetric.value}`,
    });
  }

  // Invariant 2: Hard 500 count must be zero
  const { data: error500Metric } = await supabase
    .from("reality_metrics")
    .select("value")
    .eq("category", "failure")
    .eq("name", "hard_500_count")
    .single();

  if (error500Metric && typeof error500Metric.value === "number" && error500Metric.value > 0) {
    violations.push({
      type: "invariant_violation",
      severity: "critical",
      metric: "failure:hard_500_count",
      message: `Hard 500 errors must be zero, but found ${error500Metric.value}`,
    });
  }

  return violations;
}

function groupBy(array: any[], key: string): Record<string, number> {
  return array.reduce((acc, item) => {
    const value = item[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function generateWeeklyReport(params: {
  weekStart: string;
  summary: any;
  metrics: any[];
  risks: any[];
  requiredActions: any[];
  eventsSummary: any;
  deltaSummary: any;
}): string {
  const { weekStart, summary, metrics, risks, requiredActions, eventsSummary } = params;

  let report = `# Weekly Reality Report\n\n`;
  report += `**Week Starting:** ${weekStart}\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `---\n\n`;

  report += `## Executive Summary\n\n`;
  report += `- **Total Metrics:** ${summary.metrics_count}\n`;
  report += `- **Proven:** ${summary.proven_metrics} (${((summary.proven_metrics / summary.metrics_count) * 100).toFixed(1)}%)\n`;
  report += `- **Assumed:** ${summary.assumed_metrics} (${((summary.assumed_metrics / summary.metrics_count) * 100).toFixed(1)}%)\n`;
  report += `- **Broken:** ${summary.broken_metrics}\n`;
  report += `- **Risks Identified:** ${summary.risks_count} (${summary.critical_risks} critical)\n`;
  report += `- **Events This Week:** ${eventsSummary.total}\n\n`;

  report += `## Top 5 Risks\n\n`;
  const topRisks = risks
    .sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
             (severityOrder[a.severity as keyof typeof severityOrder] || 0);
    })
    .slice(0, 5);

  topRisks.forEach((risk, i) => {
    report += `${i + 1}. **[${risk.severity.toUpperCase()}]** ${risk.message}\n`;
  });
  report += `\n`;

  report += `## Metrics That Moved\n\n`;
  const movedMetrics = Object.entries(params.deltaSummary)
    .filter(([_, delta]: [string, any]) => delta.delta && Math.abs(delta.delta.absolute || 0) > 0.01)
    .slice(0, 10);

  if (movedMetrics.length > 0) {
    movedMetrics.forEach(([key, delta]: [string, any]) => {
      report += `- **${key}**: ${JSON.stringify(delta.current)} (was ${JSON.stringify(delta.previous)})\n`;
    });
  } else {
    report += `No significant metric changes this week.\n`;
  }
  report += `\n`;

  report += `## Required Actions for Next Week\n\n`;
  if (requiredActions.length > 0) {
    requiredActions.slice(0, 10).forEach((action, i) => {
      report += `${i + 1}. **[${action.priority.toUpperCase()}]** ${action.action}\n`;
      if (action.reason) {
        report += `   Reason: ${action.reason}\n`;
      }
    });
  } else {
    report += `No urgent actions required.\n`;
  }
  report += `\n`;

  report += `---\n\n`;
  report += `*This report was automatically generated by the Reality System.*\n`;

  return report;
}

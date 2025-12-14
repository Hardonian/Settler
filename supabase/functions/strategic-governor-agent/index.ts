/**
 * Strategic Governor Agent (CEO Replacement)
 * 
 * Replaces: CEO / Strategy role
 * Runs: Weekly (every Monday)
 * 
 * What it does:
 * - Ingests metrics (usage, churn, errors, revenue)
 * - Compares against business goals
 * - Produces ranked backlog with rationale
 * - Writes to /docs/strategy/weekly.md
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BusinessGoal {
  metric: string;
  target: number;
  current: number;
  trend: "improving" | "declining" | "stable";
  priority: number; // 1-10, higher = more important
}

interface BacklogItem {
  priority: number;
  title: string;
  description: string;
  category: "feature" | "bug" | "debt" | "growth" | "retention";
  rationale: string;
  driving_metrics: Record<string, unknown>;
  estimated_impact: "high" | "medium" | "low";
  estimated_effort: "high" | "medium" | "low";
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
      agent_type: "strategic_governor",
      status: "running",
      started_at: new Date().toISOString(),
      inputs: {},
    });

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ========================================================================
    // STEP 1: INGEST METRICS
    // ========================================================================

    // User metrics
    const { data: newUsers } = await supabase
      .from("users")
      .select("id, created_at")
      .gte("created_at", weekAgo.toISOString());

    const { data: totalUsers } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    const { data: prevWeekUsers } = await supabase
      .from("users")
      .select("id")
      .gte("created_at", new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lt("created_at", weekAgo.toISOString());

    // Revenue metrics
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("plan_id, status, current_period_start, current_period_end")
      .eq("status", "active");

    const mrr = subscriptions?.reduce((sum, s) => {
      // Simplified MRR calculation (would need actual plan pricing)
      const planMultiplier: Record<string, number> = {
        base: 29,
        pro: 99,
        enterprise: 299,
      };
      return sum + (planMultiplier[s.plan_id as string] || 0);
    }, 0) || 0;

    // Churn metrics
    const { data: cancelledSubs } = await supabase
      .from("subscriptions")
      .select("id, cancelled_at")
      .eq("status", "cancelled")
      .gte("cancelled_at", weekAgo.toISOString());

    const { data: atRiskUsers } = await supabase
      .from("user_lifecycle")
      .select("user_id, churn_risk_score")
      .gt("churn_risk_score", 0.7)
      .limit(100);

    // Usage metrics
    const { data: usageEvents } = await supabase
      .from("usage_events")
      .select("event_type, quantity, timestamp")
      .gte("timestamp", weekAgo.toISOString());

    const totalUsage = usageEvents?.reduce((sum, e) => sum + Number(e.quantity || 0), 0) || 0;

    // Error metrics
    const { data: errors } = await supabase
      .from("error_logs")
      .select("id, error_type, created_at")
      .gte("created_at", weekAgo.toISOString())
      .limit(1000);

    const errorCount = errors?.length || 0;
    const errorRate = totalUsage > 0 ? errorCount / totalUsage : 0;

    // Support metrics
    const { data: supportTickets } = await supabase
      .from("support_tickets")
      .select("id, status, created_at")
      .gte("created_at", weekAgo.toISOString())
      .limit(1000);

    const openTickets = supportTickets?.filter((t) => t.status === "open").length || 0;

    // ========================================================================
    // STEP 2: COMPARE AGAINST BUSINESS GOALS
    // ========================================================================

    const goals: BusinessGoal[] = [
      {
        metric: "user_growth",
        target: 50, // 50 new users per week
        current: newUsers?.length || 0,
        trend: (newUsers?.length || 0) > (prevWeekUsers?.length || 0) ? "improving" : "declining",
        priority: 9,
      },
      {
        metric: "mrr",
        target: 10000, // $10k MRR target
        current: mrr,
        trend: mrr > 5000 ? "improving" : "declining",
        priority: 10,
      },
      {
        metric: "churn_rate",
        target: 0.05, // <5% monthly churn
        current: cancelledSubs?.length || 0 / (subscriptions?.length || 1),
        trend: (cancelledSubs?.length || 0) < 5 ? "improving" : "declining",
        priority: 8,
      },
      {
        metric: "error_rate",
        target: 0.01, // <1% error rate
        current: errorRate,
        trend: errorRate < 0.01 ? "improving" : "declining",
        priority: 7,
      },
      {
        metric: "support_load",
        target: 10, // <10 open tickets
        current: openTickets,
        trend: openTickets < 10 ? "improving" : "declining",
        priority: 6,
      },
    ];

    // ========================================================================
    // STEP 3: GENERATE PRIORITIZED BACKLOG
    // ========================================================================

    const backlog: BacklogItem[] = [];

    // Growth items
    if ((newUsers?.length || 0) < 30) {
      backlog.push({
        priority: 1,
        title: "Increase user acquisition",
        description: "User growth is below target. Need to improve signup conversion and marketing reach.",
        category: "growth",
        rationale: `Only ${newUsers?.length || 0} new users this week (target: 50). Growth trend: ${goals.find((g) => g.metric === "user_growth")?.trend}.`,
        driving_metrics: {
          new_users: newUsers?.length || 0,
          target: 50,
          trend: goals.find((g) => g.metric === "user_growth")?.trend,
        },
        estimated_impact: "high",
        estimated_effort: "medium",
      });
    }

    // Revenue items
    if (mrr < 5000) {
      backlog.push({
        priority: 2,
        title: "Improve upgrade conversion",
        description: "MRR is below target. Focus on converting free users to paid plans.",
        category: "growth",
        rationale: `Current MRR: $${mrr} (target: $10k). Need to increase upgrade rate and average revenue per user.`,
        driving_metrics: {
          mrr,
          target: 10000,
          active_subscriptions: subscriptions?.length || 0,
        },
        estimated_impact: "high",
        estimated_effort: "medium",
      });
    }

    // Churn prevention
    if ((atRiskUsers?.length || 0) > 20) {
      backlog.push({
        priority: 3,
        title: "Reduce churn risk",
        description: "High number of users at risk of churning. Implement retention campaigns.",
        category: "retention",
        rationale: `${atRiskUsers?.length || 0} users have churn risk > 0.7. Need proactive engagement.`,
        driving_metrics: {
          at_risk_users: atRiskUsers?.length || 0,
          churn_rate: cancelledSubs?.length || 0,
        },
        estimated_impact: "high",
        estimated_effort: "low",
      });
    }

    // Error reduction
    if (errorRate > 0.01) {
      backlog.push({
        priority: 4,
        title: "Reduce error rate",
        description: "Error rate is above target. Investigate and fix top error sources.",
        category: "bug",
        rationale: `Error rate: ${(errorRate * 100).toFixed(2)}% (target: <1%). ${errorCount} errors in ${totalUsage} requests.`,
        driving_metrics: {
          error_rate: errorRate,
          error_count: errorCount,
          total_requests: totalUsage,
        },
        estimated_impact: "high",
        estimated_effort: "medium",
      });
    }

    // Support load reduction
    if (openTickets > 10) {
      backlog.push({
        priority: 5,
        title: "Reduce support ticket volume",
        description: "High support load. Identify common issues and create self-service solutions.",
        category: "debt",
        rationale: `${openTickets} open support tickets (target: <10). Need better documentation and error handling.`,
        driving_metrics: {
          open_tickets: openTickets,
          total_tickets: supportTickets?.length || 0,
        },
        estimated_impact: "medium",
        estimated_effort: "medium",
      });
    }

    // Usage-based feature requests
    const usageByType = new Map<string, number>();
    usageEvents?.forEach((e) => {
      const current = usageByType.get(e.event_type) || 0;
      usageByType.set(e.event_type, current + Number(e.quantity || 0));
    });

    // If receipts API has high usage but low success rate, suggest improvements
    const receiptUsage = usageByType.get("receipt_upload") || 0;
    const receiptErrors = errors?.filter((e) => e.error_type?.includes("receipt")).length || 0;
    if (receiptUsage > 100 && receiptErrors > receiptUsage * 0.1) {
      backlog.push({
        priority: 6,
        title: "Improve receipt parsing accuracy",
        description: "Receipt API has high usage but also high error rate. Improve parsing reliability.",
        category: "feature",
        rationale: `${receiptUsage} receipt uploads with ${receiptErrors} errors (${((receiptErrors / receiptUsage) * 100).toFixed(1)}% error rate).`,
        driving_metrics: {
          receipt_usage: receiptUsage,
          receipt_errors: receiptErrors,
          error_rate: receiptErrors / receiptUsage,
        },
        estimated_impact: "medium",
        estimated_effort: "high",
      });
    }

    // Sort by priority
    backlog.sort((a, b) => a.priority - b.priority);

    // ========================================================================
    // STEP 4: WRITE TO DATABASE
    // ========================================================================

    // Clear old proposed items
    await supabase
      .from("strategic_backlog")
      .delete()
      .eq("status", "proposed");

    // Insert new backlog items
    for (const item of backlog) {
      await supabase.from("strategic_backlog").insert({
        priority: item.priority,
        title: item.title,
        description: item.description,
        category: item.category,
        rationale: item.rationale,
        driving_metrics: item.driving_metrics,
        estimated_impact: item.estimated_impact,
        estimated_effort: item.estimated_effort,
        status: "proposed",
      });
    }

    // ========================================================================
    // STEP 5: GENERATE MARKDOWN ARTIFACT
    // ========================================================================

    const markdown = `# Weekly Strategy Report - ${now.toISOString().split("T")[0]}

Generated by Strategic Governor Agent

## Executive Summary

- **New Users**: ${newUsers?.length || 0} (target: 50)
- **MRR**: $${mrr.toLocaleString()} (target: $10,000)
- **Churn Risk Users**: ${atRiskUsers?.length || 0}
- **Error Rate**: ${(errorRate * 100).toFixed(2)}% (target: <1%)
- **Open Support Tickets**: ${openTickets} (target: <10)

## Business Goals Status

${goals
  .map(
    (g) => `### ${g.metric}
- Current: ${g.current}
- Target: ${g.target}
- Trend: ${g.trend}
- Status: ${g.current >= g.target ? "✅ On track" : "⚠️ Needs attention"}`
  )
  .join("\n\n")}

## Prioritized Backlog

${backlog
  .map(
    (item, idx) => `### ${idx + 1}. ${item.title} (Priority: ${item.priority})

**Category**: ${item.category}  
**Impact**: ${item.estimated_impact} | **Effort**: ${item.estimated_effort}

${item.description}

**Rationale**: ${item.rationale}

**Driving Metrics**:
${Object.entries(item.driving_metrics)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}`
  )
  .join("\n\n")}

## Recommendations

${backlog
  .slice(0, 3)
  .map((item) => `- **${item.title}**: ${item.rationale}`)
  .join("\n")}

---
*Generated automatically by Strategic Governor Agent*`;

    // Store markdown as artifact
    const artifacts = [
      {
        type: "markdown",
        path: `/docs/strategy/weekly-${now.toISOString().split("T")[0]}.md`,
        content: markdown,
      },
    ];

    // ========================================================================
    // STEP 6: RECORD COMPLETION
    // ========================================================================

    const durationMs = Date.now() - startTime;

    await supabase
      .from("agent_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        inputs: {
          week_start: weekAgo.toISOString(),
          week_end: now.toISOString(),
        },
        outputs: {
          goals_analyzed: goals.length,
          backlog_items: backlog.length,
          metrics: {
            new_users: newUsers?.length || 0,
            mrr,
            at_risk_users: atRiskUsers?.length || 0,
            error_rate: errorRate,
            open_tickets: openTickets,
          },
        },
        artifacts,
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        duration_ms: durationMs,
        backlog_items: backlog.length,
        artifacts,
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
      .catch(() => {}); // Ignore errors in error handling

    return new Response(
      JSON.stringify({
        error: "Strategic Governor Agent failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

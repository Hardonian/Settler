/**
 * Generate Weekly Founder Briefing
 *
 * Weekly scheduled function to generate founder briefings from insights.
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

    // Determine week period (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const periodStart = weekAgo.toISOString();
    const periodEnd = now.toISOString();

    // Check if briefing already exists for this period
    const { data: existing } = await supabase
      .from("ops_briefings")
      .select("id")
      .eq("period_start", periodStart)
      .eq("period_end", periodEnd)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Briefing already exists for this period",
          briefingId: existing[0].id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get active insights from the period
    const { data: insights } = await supabase
      .from("ops_insights")
      .select("*")
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd)
      .order("severity", { ascending: false })
      .order("confidence", { ascending: false });

    // Get recommendations
    const insightIds = insights?.map((i) => i.id) || [];
    const { data: recommendations } = await supabase
      .from("ops_recommendations")
      .select("*")
      .in("insight_id", insightIds)
      .eq("status", "suggested")
      .order("risk_level", { ascending: false });

    // Get actions taken
    const { data: actions } = await supabase
      .from("ops_actions")
      .select("*")
      .gte("executed_at", periodStart)
      .lte("executed_at", periodEnd)
      .order("executed_at", { ascending: false });

    // Get cost metrics
    const { data: costData } = await supabase
      .from("usage_aggregate_daily")
      .select("estimated_cost")
      .gte("date", weekAgo.toISOString().split("T")[0])
      .lt("date", now.toISOString().split("T")[0]);

    const totalCost = costData?.reduce((sum, r) => sum + (r.estimated_cost || 0), 0) || 0;

    // Get support metrics
    const { data: tickets } = await supabase
      .from("ops_support_tickets")
      .select("id, status, priority")
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd);

    const ticketCount = tickets?.length || 0;
    const openTickets = tickets?.filter((t) => t.status === "open").length || 0;
    const criticalTickets = tickets?.filter((t) => t.priority === "critical").length || 0;

    // Generate markdown briefing
    const briefing = generateBriefingMarkdown({
      periodStart,
      periodEnd,
      insights: insights || [],
      recommendations: recommendations || [],
      actions: actions || [],
      metrics: {
        totalCost,
        ticketCount,
        openTickets,
        criticalTickets,
      },
    });

    // Generate structured JSON summary
    const summaryJson = {
      period: { start: periodStart, end: periodEnd },
      metrics: {
        totalCost,
        ticketCount,
        openTickets,
        criticalTickets,
      },
      insights: {
        total: insights?.length || 0,
        byType: {
          cost: insights?.filter((i) => i.type === "cost").length || 0,
          support: insights?.filter((i) => i.type === "support").length || 0,
          usage: insights?.filter((i) => i.type === "usage").length || 0,
          stability: insights?.filter((i) => i.type === "stability").length || 0,
        },
        bySeverity: {
          critical: insights?.filter((i) => i.severity === "critical").length || 0,
          warn: insights?.filter((i) => i.severity === "warn").length || 0,
          info: insights?.filter((i) => i.severity === "info").length || 0,
        },
        topInsights: insights?.slice(0, 5).map((i) => ({
          id: i.id,
          type: i.type,
          title: i.title,
          severity: i.severity,
        })),
      },
      recommendations: {
        total: recommendations?.length || 0,
        byRiskLevel: {
          high: recommendations?.filter((r) => r.risk_level === "high").length || 0,
          med: recommendations?.filter((r) => r.risk_level === "med").length || 0,
          low: recommendations?.filter((r) => r.risk_level === "low").length || 0,
        },
      },
      actions: {
        total: actions?.length || 0,
        verified: actions?.filter((a) => a.verification_status === "verified").length || 0,
      },
    };

    // Save briefing
    const { data: briefingData, error } = await supabase
      .from("ops_briefings")
      .insert({
        period_start: periodStart,
        period_end: periodEnd,
        summary_markdown: briefing,
        summary_json: summaryJson,
        insights_count: insights?.length || 0,
        recommendations_count: recommendations?.length || 0,
        actions_count: actions?.length || 0,
        generated_by: null, // System-generated
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        briefingId: briefingData.id,
        period: { start: periodStart, end: periodEnd },
        insightsCount: insights?.length || 0,
        recommendationsCount: recommendations?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating weekly briefing:", error);
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
 * Generate markdown briefing
 */
function generateBriefingMarkdown(params: {
  periodStart: string;
  periodEnd: string;
  insights: any[];
  recommendations: any[];
  actions: any[];
  metrics: {
    totalCost: number;
    ticketCount: number;
    openTickets: number;
    criticalTickets: number;
  };
}): string {
  const { periodStart, periodEnd, insights, recommendations, actions, metrics } = params;

  const startDate = new Date(periodStart).toLocaleDateString();
  const endDate = new Date(periodEnd).toLocaleDateString();

  const criticalInsights = insights.filter((i) => i.severity === "critical");
  const warnInsights = insights.filter((i) => i.severity === "warn");

  const highRiskRecs = recommendations.filter((r) => r.risk_level === "high");
  const medRiskRecs = recommendations.filter((r) => r.risk_level === "med");

  let markdown = `# Weekly Founder Briefing\n\n`;
  markdown += `**Period:** ${startDate} - ${endDate}\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;

  markdown += `---\n\n`;

  markdown += `## What Changed This Week\n\n`;
  markdown += `- **${insights.length}** insights generated\n`;
  markdown += `- **${criticalInsights.length}** critical issues detected\n`;
  markdown += `- **${warnInsights.length}** warnings surfaced\n`;
  markdown += `- **${recommendations.length}** recommendations suggested\n`;
  markdown += `- **${actions.length}** actions taken\n\n`;

  markdown += `## What Matters Now\n\n`;
  if (criticalInsights.length > 0) {
    markdown += `### 🚨 Critical Issues\n\n`;
    criticalInsights.slice(0, 5).forEach((insight) => {
      markdown += `- **${insight.title}**\n`;
      markdown += `  ${insight.summary}\n\n`;
    });
  }

  if (highRiskRecs.length > 0) {
    markdown += `### ⚠️ High-Priority Recommendations\n\n`;
    highRiskRecs.slice(0, 5).forEach((rec) => {
      markdown += `- **${rec.action_type}**: ${rec.description}\n`;
      markdown += `  Expected impact: ${rec.expected_impact}\n\n`;
    });
  }

  markdown += `## Where Money Is Going\n\n`;
  markdown += `- **Total Cost:** $${metrics.totalCost.toFixed(2)}\n`;
  markdown += `- **Cost per Day:** $${(metrics.totalCost / 7).toFixed(2)}\n\n`;

  const costInsights = insights.filter((i) => i.type === "cost");
  if (costInsights.length > 0) {
    markdown += `### Cost Insights\n\n`;
    costInsights.slice(0, 3).forEach((insight) => {
      markdown += `- ${insight.title}\n`;
    });
    markdown += `\n`;
  }

  markdown += `## Support & Risk Highlights\n\n`;
  markdown += `- **Total Tickets:** ${metrics.ticketCount}\n`;
  markdown += `- **Open Tickets:** ${metrics.openTickets}\n`;
  markdown += `- **Critical Tickets:** ${metrics.criticalTickets}\n\n`;

  const supportInsights = insights.filter((i) => i.type === "support");
  if (supportInsights.length > 0) {
    markdown += `### Support Insights\n\n`;
    supportInsights.slice(0, 3).forEach((insight) => {
      markdown += `- ${insight.title}\n`;
    });
    markdown += `\n`;
  }

  markdown += `## Recommended Next Actions\n\n`;
  if (medRiskRecs.length > 0) {
    medRiskRecs.slice(0, 5).forEach((rec) => {
      markdown += `1. **${rec.action_type}**: ${rec.description}\n`;
    });
  } else if (recommendations.length > 0) {
    recommendations.slice(0, 5).forEach((rec) => {
      markdown += `1. **${rec.action_type}**: ${rec.description}\n`;
    });
  } else {
    markdown += `No urgent actions required. System is operating normally.\n`;
  }

  markdown += `\n---\n\n`;
  markdown += `*This briefing was automatically generated by the Ops Intelligence system.*\n`;

  return markdown;
}

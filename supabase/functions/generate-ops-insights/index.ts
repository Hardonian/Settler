/**
 * Generate Ops Insights
 *
 * Daily scheduled function to generate insights and recommendations.
 * Runs via cron or manual trigger.
 *
 * Note: This is a simplified version that works in Deno.
 * For full logic, see packages/api/src/services/ops-intelligence/
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

    // Determine time window (default: last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const timeWindow = { start: weekAgo, end: now };

    // Call the insights generation API endpoint (which uses the full service)
    // For now, we'll use a simplified inline version
    const insights = await generateInsightsInline(supabase, timeWindow);

    // Save insights to database
    const savedInsights: Array<{ id: string; insight: any }> = [];

    for (const insight of insights) {
      // Check if similar insight already exists (avoid duplicates)
      const { data: existing } = await supabase
        .from("ops_insights")
        .select("id")
        .eq("type", insight.type)
        .eq("title", insight.title)
        .eq("status", "active")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing insight
        const { data: updated } = await supabase
          .from("ops_insights")
          .update({
            confidence: insight.confidence,
            evidence: insight.evidence,
            related_entities: insight.relatedEntities,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing[0].id)
          .select()
          .single();

        if (updated) {
          savedInsights.push({ id: updated.id, insight });
        }
      } else {
        // Create new insight
        const expiresAt = insight.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const { data: inserted } = await supabase
          .from("ops_insights")
          .insert({
            type: insight.type,
            title: insight.title,
            summary: insight.summary,
            severity: insight.severity,
            confidence: insight.confidence,
            time_window: insight.timeWindow,
            evidence: insight.evidence,
            related_entities: insight.relatedEntities,
            expires_at: expiresAt.toISOString(),
            status: "active",
          })
          .select()
          .single();

        if (inserted) {
          savedInsights.push({ id: inserted.id, insight });
        }
      }
    }

    // Generate and save recommendations for each insight
    let recommendationsCount = 0;
    for (const { id: insightId, insight } of savedInsights) {
      if (!insight) continue;

      const recommendations = generateRecommendationsInline(insight);

      for (const rec of recommendations) {
        const { error } = await supabase.from("ops_recommendations").insert({
          insight_id: insightId,
          action_type: rec.actionType,
          description: rec.description,
          risk_level: rec.riskLevel,
          expected_impact: rec.expectedImpact,
          reversibility: rec.reversibility,
          runbook_link: rec.runbookLink,
          status: "suggested",
        });

        if (!error) {
          recommendationsCount++;
        }
      }
    }

    // Expire old insights
    await supabase.rpc("expire_insights");

    return new Response(
      JSON.stringify({
        success: true,
        insightsGenerated: insights.length,
        insightsSaved: savedInsights.length,
        recommendationsGenerated: recommendationsCount,
        generatedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating ops insights:", error);
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

// Simplified inline insight generation (full version in packages/api)
async function generateInsightsInline(supabase: any, timeWindow: { start: Date; end: Date }) {
  const insights: any[] = [];
  const now = timeWindow.end;
  const weekAgo = timeWindow.start;

  try {
    // Cost insights: WoW change
    const { data: currentWeekCost } = await supabase
      .from("usage_aggregate_daily")
      .select("estimated_cost")
      .gte("date", weekAgo.toISOString().split("T")[0])
      .lt("date", now.toISOString().split("T")[0]);

    const { data: previousWeekCost } = await supabase
      .from("usage_aggregate_daily")
      .select("estimated_cost")
      .gte(
        "date",
        new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      )
      .lt("date", weekAgo.toISOString().split("T")[0]);

    const currentTotal =
      currentWeekCost?.reduce((sum: number, r: any) => sum + (r.estimated_cost || 0), 0) || 0;
    const previousTotal =
      previousWeekCost?.reduce((sum: number, r: any) => sum + (r.estimated_cost || 0), 0) || 0;
    const wowChange =
      previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    if (Math.abs(wowChange) > 20) {
      insights.push({
        type: "cost",
        title: `Cost ${wowChange > 0 ? "increased" : "decreased"} ${Math.abs(wowChange).toFixed(1)}% week-over-week`,
        summary: `Weekly cost ${wowChange > 0 ? "spike" : "drop"} detected. Current week: $${currentTotal.toFixed(2)}, Previous week: $${previousTotal.toFixed(2)}.`,
        severity: wowChange > 50 ? "critical" : wowChange > 30 ? "warn" : "info",
        confidence: 0.85,
        timeWindow: {
          start: weekAgo.toISOString(),
          end: now.toISOString(),
        },
        evidence: {
          metrics: {
            currentWeekCost: currentTotal,
            previousWeekCost: previousTotal,
            wowChangePercent: wowChange,
          },
        },
        relatedEntities: {},
      });
    }

    // Support insights: Ticket spike
    const { data: currentWeekTickets } = await supabase
      .from("ops_support_tickets")
      .select("category, id")
      .gte("created_at", weekAgo.toISOString())
      .lt("created_at", now.toISOString());

    const { data: previousWeekTickets } = await supabase
      .from("ops_support_tickets")
      .select("category, id")
      .gte("created_at", new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lt("created_at", weekAgo.toISOString());

    if (currentWeekTickets && previousWeekTickets) {
      const currentCount = currentWeekTickets.length;
      const previousCount = previousWeekTickets.length;
      if (previousCount > 0) {
        const change = ((currentCount - previousCount) / previousCount) * 100;
        if (change > 50 && currentCount >= 5) {
          insights.push({
            type: "support",
            title: `Support ticket spike: ${currentCount} tickets (+${change.toFixed(0)}%)`,
            summary: `Ticket volume increased from ${previousCount} to ${currentCount} this week.`,
            severity: change > 100 ? "critical" : "warn",
            confidence: 0.9,
            timeWindow: {
              start: weekAgo.toISOString(),
              end: now.toISOString(),
            },
            evidence: {
              metrics: {
                currentWeekCount: currentCount,
                previousWeekCount: previousCount,
                changePercent: change,
              },
            },
            relatedEntities: {},
          });
        }
      }
    }

    // Stability insights: Error rate
    const { data: currentWeekErrors } = await supabase
      .from("error_logs")
      .select("id, severity")
      .gte("created_at", weekAgo.toISOString())
      .lt("created_at", now.toISOString());

    const { data: previousWeekErrors } = await supabase
      .from("error_logs")
      .select("id, severity")
      .gte("created_at", new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lt("created_at", weekAgo.toISOString());

    if (currentWeekErrors && previousWeekErrors) {
      const currentCount = currentWeekErrors.length;
      const previousCount = previousWeekErrors.length;
      if (previousCount > 0) {
        const errorRateChange = ((currentCount - previousCount) / previousCount) * 100;
        if (errorRateChange > 50) {
          insights.push({
            type: "stability",
            title: `Error rate increased ${errorRateChange.toFixed(0)}% week-over-week`,
            summary: `Current week: ${currentCount} errors vs ${previousCount} last week.`,
            severity: errorRateChange > 100 ? "critical" : "warn",
            confidence: 0.95,
            timeWindow: {
              start: weekAgo.toISOString(),
              end: now.toISOString(),
            },
            evidence: {
              metrics: {
                currentWeekErrors: currentCount,
                previousWeekErrors: previousCount,
                errorRateChangePercent: errorRateChange,
              },
            },
            relatedEntities: {},
          });
        }
      }
    }
  } catch (error) {
    console.error("Error generating insights:", error);
  }

  return insights;
}

// Simplified inline recommendation generation
function generateRecommendationsInline(insight: any) {
  const recommendations: any[] = [];

  if (insight.type === "cost" && insight.title.includes("Cost increased")) {
    recommendations.push({
      actionType: "investigate",
      description: "Review cost breakdown by source to identify drivers",
      riskLevel: "low",
      expectedImpact: "Identify cost optimization opportunities",
      reversibility: true,
    });
  }

  if (insight.type === "support" && insight.title.includes("ticket spike")) {
    recommendations.push({
      actionType: "investigate",
      description: "Analyze ticket patterns to identify root cause",
      riskLevel: "low",
      expectedImpact: "Understand underlying issue",
      reversibility: true,
    });
  }

  if (insight.type === "stability" && insight.title.includes("Error rate")) {
    recommendations.push({
      actionType: "investigate",
      description: "Review error logs and recent deployments",
      riskLevel: "low",
      expectedImpact: "Identify root cause of errors",
      reversibility: true,
    });
  }

  return recommendations;
}

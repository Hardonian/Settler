/**
 * User Intent Synthesizer Agent (PM Replacement)
 * 
 * Replaces: Product Manager role
 * Runs: Daily
 * 
 * What it does:
 * - Reads receipt usage patterns
 * - Analyzes console abandonment points
 * - Examines error logs for pain points
 * - Outputs: "Users trying to do X but failing"
 * - Outputs: "Features already being misused as Y"
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// OpenAI helper
async function generateInsights(
  context: string,
  data: Record<string, unknown>,
  task: string
): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return "";

  try {
    const prompt = `Given the following ${context}:\n\n${JSON.stringify(data, null, 2)}\n\n${task}\n\nProvide concise, actionable insights. Be specific and data-driven.`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert analyst providing strategic insights. Be concise, specific, and actionable." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) return "";
    const result = await response.json();
    return result.choices[0]?.message?.content || "";
  } catch {
    return "";
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserIntentInsight {
  insight_type: "pain_point" | "feature_demand" | "usage_pattern" | "drop_off_point";
  user_goal: string;
  observed_behavior: string;
  failure_pattern?: string;
  affected_user_count: number;
  frequency_score: number;
  severity_score: number;
  evidence: Array<Record<string, unknown>>;
  recommended_action: string;
  feature_suggestion?: string;
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

    await supabase.from("agent_runs").insert({
      id: runId,
      agent_type: "user_intent_synthesizer",
      status: "running",
      started_at: new Date().toISOString(),
      inputs: {},
    });

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const insights: UserIntentInsight[] = [];

    // ========================================================================
    // INSIGHT 1: Receipt Upload Failures (Pain Point)
    // ========================================================================

    const { data: receiptUploads } = await supabase
      .from("receipt_uploads")
      .select("id, status, error_message, created_at")
      .gte("created_at", weekAgo.toISOString())
      .limit(1000);

    const failedUploads = receiptUploads?.filter((u) => u.status === "failed") || [];
    const successUploads = receiptUploads?.filter((u) => u.status === "completed") || [];

    if (failedUploads.length > 0) {
      const failureRate = failedUploads.length / receiptUploads!.length;
      const errorGroups = new Map<string, number>();

      failedUploads.forEach((u) => {
        const errorType = u.error_message?.split(":")[0] || "unknown";
        errorGroups.set(errorType, (errorGroups.get(errorType) || 0) + 1);
      });

      const topError = Array.from(errorGroups.entries()).sort((a, b) => b[1] - a[1])[0];

      if (failureRate > 0.1) {
        insights.push({
          insight_type: "pain_point",
          user_goal: "Upload and parse receipts",
          observed_behavior: `${failedUploads.length} receipt uploads failed out of ${receiptUploads!.length} attempts`,
          failure_pattern: topError ? `${topError[0]}: ${topError[1]} occurrences` : "Various errors",
          affected_user_count: new Set(failedUploads.map((u) => u.id)).size,
          frequency_score: failureRate,
          severity_score: failureRate > 0.3 ? 0.9 : failureRate > 0.2 ? 0.7 : 0.5,
          evidence: failedUploads.slice(0, 10).map((u) => ({
            upload_id: u.id,
            error: u.error_message,
            timestamp: u.created_at,
          })),
          recommended_action: `Fix top error: ${topError?.[0]}. Improve error messages and validation.`,
          feature_suggestion: "Add receipt validation preview before upload",
        });
      }
    }

    // ========================================================================
    // INSIGHT 2: Console Abandonment Points (Drop-off)
    // ========================================================================

    const { data: analyticsEvents } = await supabase
      .from("analytics_events")
      .select("event, properties, user_id, created_at")
      .gte("created_at", weekAgo.toISOString())
      .in("event", [
        "onboarding.step_started",
        "onboarding.step_completed",
        "onboarding.abandoned",
        "console.page_view",
        "console.feature_accessed",
      ])
      .limit(5000);

    // Group by user to find drop-off patterns
    const userJourneys = new Map<string, string[]>();
    analyticsEvents?.forEach((e) => {
      const userId = e.user_id;
      if (!userJourneys.has(userId)) {
        userJourneys.set(userId, []);
      }
      userJourneys.get(userId)!.push(e.event);
    });

    // Find common drop-off points
    const dropOffPoints = new Map<string, number>();
    userJourneys.forEach((journey) => {
      const lastEvent = journey[journey.length - 1];
      if (lastEvent.includes("step_started") && !journey.some((e) => e.includes("completed"))) {
        dropOffPoints.set(lastEvent, (dropOffPoints.get(lastEvent) || 0) + 1);
      }
    });

    if (dropOffPoints.size > 0) {
      const topDropOff = Array.from(dropOffPoints.entries()).sort((a, b) => b[1] - a[1])[0];
      const totalUsers = userJourneys.size;
      const dropOffRate = topDropOff[1] / totalUsers;

      if (dropOffRate > 0.15) {
        insights.push({
          insight_type: "drop_off_point",
          user_goal: "Complete onboarding/setup",
          observed_behavior: `${topDropOff[1]} users abandoned at ${topDropOff[0]}`,
          failure_pattern: `Users start ${topDropOff[0]} but don't complete it`,
          affected_user_count: topDropOff[1],
          frequency_score: dropOffRate,
          severity_score: dropOffRate > 0.3 ? 0.8 : 0.6,
          evidence: Array.from(userJourneys.entries())
            .filter(([, journey]) => journey[journey.length - 1] === topDropOff[0])
            .slice(0, 10)
            .map(([userId, journey]) => ({
              user_id: userId,
              journey,
              last_event: journey[journey.length - 1],
            })),
          recommended_action: `Simplify or improve UX at ${topDropOff[0]}. Add progress indicators or help text.`,
          feature_suggestion: "Add contextual help or tooltips at drop-off points",
        });
      }
    }

    // ========================================================================
    // INSIGHT 3: Feature Misuse Patterns (Usage Pattern)
    // ========================================================================

    // Check if users are using receipts API for non-receipt documents
    const { data: receipts } = await supabase
      .from("receipts")
      .select("id, confidence_score, vendor, created_at")
      .gte("created_at", weekAgo.toISOString())
      .limit(1000);

    const lowConfidenceReceipts = receipts?.filter((r) => (r.confidence_score || 0) < 0.5) || [];

    if (lowConfidenceReceipts.length > 50) {
      const lowConfRate = lowConfidenceReceipts.length / receipts!.length;
      const vendors = new Map<string, number>();
      lowConfidenceReceipts.forEach((r) => {
        const vendor = r.vendor || "unknown";
        vendors.set(vendor, (vendors.get(vendor) || 0) + 1);
      });

      insights.push({
        insight_type: "usage_pattern",
        user_goal: "Parse documents (possibly non-receipts)",
        observed_behavior: `${lowConfidenceReceipts.length} receipts with low confidence (<0.5)`,
        failure_pattern: `Users uploading non-receipt documents to receipt parser`,
        affected_user_count: new Set(lowConfidenceReceipts.map((r) => r.id)).size,
        frequency_score: lowConfRate,
        severity_score: 0.4, // Not critical, but indicates feature gap
        evidence: lowConfidenceReceipts.slice(0, 10).map((r) => ({
          receipt_id: r.id,
          confidence: r.confidence_score,
          vendor: r.vendor,
        })),
        recommended_action: "Consider adding general document parsing API or better validation",
        feature_suggestion: "Add 'document parser' API endpoint for non-receipt documents",
      });
    }

    // ========================================================================
    // INSIGHT 4: API Usage Patterns (Feature Demand)
    // ========================================================================

    const { data: usageEvents } = await supabase
      .from("usage_events")
      .select("event_type, quantity, timestamp, user_id")
      .gte("timestamp", weekAgo.toISOString())
      .limit(10000);

    const usageByType = new Map<string, { count: number; users: Set<string> }>();
    usageEvents?.forEach((e) => {
      const type = e.event_type;
      if (!usageByType.has(type)) {
        usageByType.set(type, { count: 0, users: new Set() });
      }
      const stats = usageByType.get(type)!;
      stats.count += Number(e.quantity || 0);
      if (e.user_id) stats.users.add(e.user_id);
    });

    // Find high-demand but low-usage features (might indicate friction)
    const highDemandLowUsage: Array<{ type: string; users: number; count: number }> = [];
    usageByType.forEach((stats, type) => {
      if (stats.users.size > 10 && stats.count / stats.users.size < 5) {
        highDemandLowUsage.push({
          type,
          users: stats.users.size,
          count: stats.count,
        });
      }
    });

    if (highDemandLowUsage.length > 0) {
      const topFeature = highDemandLowUsage.sort((a, b) => b.users - a.users)[0];
      insights.push({
        insight_type: "feature_demand",
        user_goal: `Use ${topFeature.type} feature`,
        observed_behavior: `${topFeature.users} users tried ${topFeature.type} but only ${topFeature.count} total uses`,
        failure_pattern: "High interest but low actual usage suggests friction or complexity",
        affected_user_count: topFeature.users,
        frequency_score: topFeature.users / (usageEvents?.length || 1),
        severity_score: 0.6,
        evidence: [
          {
            feature: topFeature.type,
            unique_users: topFeature.users,
            total_uses: topFeature.count,
            avg_uses_per_user: topFeature.count / topFeature.users,
          },
        ],
        recommended_action: `Simplify ${topFeature.type} feature. Reduce friction or improve documentation.`,
        feature_suggestion: `Add quick-start guide or simplified workflow for ${topFeature.type}`,
      });
    }

    // ========================================================================
    // INSIGHT 5: Error Clustering (Pain Point)
    // ========================================================================

    const { data: errors } = await supabase
      .from("error_logs")
      .select("id, error_type, error_message, user_id, created_at")
      .gte("created_at", weekAgo.toISOString())
      .limit(1000);

    if (errors && errors.length > 0) {
      const errorGroups = new Map<string, { count: number; users: Set<string>; samples: string[] }>();
      errors.forEach((e) => {
        const key = e.error_type || "unknown";
        if (!errorGroups.has(key)) {
          errorGroups.set(key, { count: 0, users: new Set(), samples: [] });
        }
        const group = errorGroups.get(key)!;
        group.count++;
        if (e.user_id) group.users.add(e.user_id);
        if (group.samples.length < 3 && e.error_message) {
          group.samples.push(e.error_message);
        }
      });

      // Find errors affecting multiple users (systemic issues)
      const systemicErrors = Array.from(errorGroups.entries())
        .filter(([, group]) => group.users.size > 3)
        .sort((a, b) => b[1].users.size - a[1].users.size);

      if (systemicErrors.length > 0) {
        const topError = systemicErrors[0];
        insights.push({
          insight_type: "pain_point",
          user_goal: "Use the product without errors",
          observed_behavior: `${topError[1].users.size} users experiencing ${topError[0]} errors`,
          failure_pattern: `${topError[1].count} occurrences of ${topError[0]}`,
          affected_user_count: topError[1].users.size,
          frequency_score: topError[1].count / errors.length,
          severity_score: topError[1].users.size > 10 ? 0.9 : 0.7,
          evidence: topError[1].samples.map((msg) => ({
            error_type: topError[0],
            sample_message: msg,
          })),
          recommended_action: `Fix ${topError[0]} error. This affects ${topError[1].users.size} users.`,
          feature_suggestion: `Add better error handling or validation to prevent ${topError[0]}`,
        });
      }
    }

    // ========================================================================
    // ENHANCE INSIGHTS WITH AI (if OpenAI available)
    // ========================================================================

    if (Deno.env.get("OPENAI_API_KEY")) {
      try {
        // Enhance each insight with AI-generated recommendations
        for (const insight of insights) {
          const aiRecommendation = await generateInsights(
            "user behavior pattern",
            {
              insight_type: insight.insight_type,
              user_goal: insight.user_goal,
              observed_behavior: insight.observed_behavior,
              failure_pattern: insight.failure_pattern,
              affected_users: insight.affected_user_count,
              evidence: insight.evidence.slice(0, 3), // Limit evidence for context
            },
            `Based on this user behavior pattern, provide specific, actionable recommendations. What should we build or fix?`
          );

          if (aiRecommendation) {
            insight.recommended_action = `${insight.recommended_action}\n\nAI Analysis: ${aiRecommendation}`;
          }
        }
      } catch (error) {
        console.warn("AI enhancement failed, using default insights:", error);
      }
    }

    // ========================================================================
    // STORE INSIGHTS
    // ========================================================================

    // Clear old "new" insights that are no longer relevant
    await supabase
      .from("user_intent_insights")
      .update({ status: "dismissed" })
      .eq("status", "new")
      .lt("created_at", weekAgo.toISOString());

    // Insert new insights
    for (const insight of insights) {
      await supabase.from("user_intent_insights").insert({
        insight_type: insight.insight_type,
        user_goal: insight.user_goal,
        observed_behavior: insight.observed_behavior,
        failure_pattern: insight.failure_pattern,
        affected_user_count: insight.affected_user_count,
        frequency_score: insight.frequency_score,
        severity_score: insight.severity_score,
        evidence: insight.evidence,
        recommended_action: insight.recommended_action,
        feature_suggestion: insight.feature_suggestion,
        status: "new",
      });
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
          insights_generated: insights.length,
          insights_by_type: {
            pain_point: insights.filter((i) => i.insight_type === "pain_point").length,
            feature_demand: insights.filter((i) => i.insight_type === "feature_demand").length,
            usage_pattern: insights.filter((i) => i.insight_type === "usage_pattern").length,
            drop_off_point: insights.filter((i) => i.insight_type === "drop_off_point").length,
          },
        },
        artifacts: insights.map((i) => ({
          type: "insight",
          insight_type: i.insight_type,
          user_goal: i.user_goal,
        })),
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        duration_ms: durationMs,
        insights_generated: insights.length,
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
        error: "User Intent Synthesizer Agent failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

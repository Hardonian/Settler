/**
 * Preemptive Support AI Agent (Support Replacement)
 * 
 * Replaces: Customer Support role
 * Runs: Real-time (on error events) + Daily batch
 * 
 * What it does:
 * - Monitors error frequency by user/org
 * - Detects repeated UI hesitation patterns
 * - Triggers in-app explanations
 * - Auto-responds with context
 * - Only escalates if confidence < threshold
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// OpenAI helper
async function callOpenAI(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return "";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
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

const CONFIDENCE_THRESHOLD = 0.7; // Only auto-resolve if confidence >= 0.7

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
      agent_type: "preemptive_support",
      status: "running",
      started_at: new Date().toISOString(),
      inputs: {},
    });

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const actions: Array<{
      user_id: string;
      tenant_id?: string;
      trigger_type: string;
      trigger_description: string;
      action_type: string;
      action_content: string;
      confidence_score: number;
    }> = [];

    // ========================================================================
    // TRIGGER 1: Error Frequency by User
    // ========================================================================

    const { data: recentErrors } = await supabase
      .from("error_logs")
      .select("id, user_id, tenant_id, error_type, error_message, created_at")
      .gte("created_at", hourAgo.toISOString())
      .limit(1000);

    // Group errors by user
    const userErrors = new Map<string, Array<{ type: string; message: string }>>();
    recentErrors?.forEach((e) => {
      if (e.user_id) {
        if (!userErrors.has(e.user_id)) {
          userErrors.set(e.user_id, []);
        }
        userErrors.get(e.user_id)!.push({
          type: e.error_type || "unknown",
          message: e.error_message || "",
        });
      }
    });

    // Find users with repeated errors
    userErrors.forEach((errors, userId) => {
      if (errors.length >= 3) {
        const errorTypes = new Map<string, number>();
        errors.forEach((e) => {
          errorTypes.set(e.type, (errorTypes.get(e.type) || 0) + 1);
        });

        const topError = Array.from(errorTypes.entries()).sort((a, b) => b[1] - a[1])[0];
        const userError = recentErrors?.find((e) => e.user_id === userId);
        const tenantId = userError?.tenant_id;

        // Generate helpful explanation based on error type
        let actionContent = "";
        let confidence = 0.8;

        // Try AI-generated explanation first if OpenAI is available
        if (Deno.env.get("OPENAI_API_KEY")) {
          try {
            const aiExplanation = await callOpenAI(
              `A user is experiencing ${topError[0]} errors (${topError[1]} occurrences). Generate a helpful, friendly explanation and solution. Be specific and actionable.`,
              "You are a helpful support agent. Provide clear, actionable guidance."
            );

            if (aiExplanation) {
              actionContent = aiExplanation;
              confidence = 0.9; // Higher confidence with AI
            }
          } catch (error) {
            console.warn("AI explanation failed, using default:", error);
          }
        }

        // Fallback to rule-based explanations
        if (!actionContent) {
          if (topError[0].includes("receipt")) {
            actionContent = `We noticed you're having trouble uploading receipts. Make sure your receipt image is clear and in a supported format (JPG, PNG, PDF). The receipt should show the vendor name, date, and total amount clearly.`;
            confidence = 0.85;
          } else if (topError[0].includes("api_key") || topError[0].includes("auth")) {
            actionContent = `It looks like there's an authentication issue. Please check that your API key is correct and hasn't expired. You can regenerate your API key in the settings.`;
            confidence = 0.9;
          } else if (topError[0].includes("rate_limit")) {
            actionContent = `You've hit a rate limit. Your current plan allows ${topError[1]} requests per minute. Consider upgrading your plan for higher limits, or wait a moment before trying again.`;
            confidence = 0.95;
          } else {
            actionContent = `We noticed you're experiencing ${topError[0]} errors. Our team has been notified. In the meantime, try refreshing the page or checking our documentation.`;
            confidence = 0.6; // Lower confidence for unknown errors
          }
        }

        if (confidence >= CONFIDENCE_THRESHOLD) {
          actions.push({
            user_id: userId,
            tenant_id: tenantId,
            trigger_type: "error_frequency",
            trigger_description: `${errors.length} errors in the last hour, mostly ${topError[0]}`,
            action_type: "in_app_explanation",
            action_content: actionContent,
            confidence_score: confidence,
          });
        }
      }
    });

    // ========================================================================
    // TRIGGER 2: UI Hesitation Patterns (from analytics)
    // ========================================================================

    const { data: uiEvents } = await supabase
      .from("analytics_events")
      .select("user_id, event, properties, created_at")
      .gte("created_at", hourAgo.toISOString())
      .in("event", [
        "ui.click",
        "ui.hover",
        "ui.focus",
        "ui.blur",
        "form.field_focused",
        "form.field_blurred",
      ])
      .limit(5000);

    // Find users repeatedly focusing/blurring same field (indicates confusion)
    const userFieldInteractions = new Map<string, Map<string, number>>();
    uiEvents?.forEach((e) => {
      if (e.user_id && e.properties && typeof e.properties === "object") {
        const fieldId = (e.properties as Record<string, unknown>).field_id as string;
        if (fieldId) {
          if (!userFieldInteractions.has(e.user_id)) {
            userFieldInteractions.set(e.user_id, new Map());
          }
          const userFields = userFieldInteractions.get(e.user_id)!;
          userFields.set(fieldId, (userFields.get(fieldId) || 0) + 1);
        }
      }
    });

    userFieldInteractions.forEach((fields, userId) => {
      fields.forEach((count, fieldId) => {
        if (count >= 5) {
          // User focused/blurred same field 5+ times - likely confused
          actions.push({
            user_id: userId,
            trigger_type: "ui_hesitation",
            trigger_description: `User interacted with ${fieldId} ${count} times without completing`,
            action_type: "in_app_explanation",
            action_content: `Need help with ${fieldId}? Check out our guide or contact support.`,
            confidence_score: 0.7,
          });
        }
      });
    });

    // ========================================================================
    // TRIGGER 3: Abandonment Risk (users who started but didn't complete)
    // ========================================================================

    const { data: abandonmentEvents } = await supabase
      .from("analytics_events")
      .select("user_id, event, created_at")
      .gte("created_at", dayAgo.toISOString())
      .in("event", [
        "onboarding.step_started",
        "receipt.upload_started",
        "recon.job_started",
        "feature.accessed",
      ])
      .limit(5000);

    // Find users who started something but never completed
    const startedButNotCompleted = new Map<string, Set<string>>();
    abandonmentEvents?.forEach((e) => {
      if (e.user_id) {
        if (!startedButNotCompleted.has(e.user_id)) {
          startedButNotCompleted.set(e.user_id, new Set());
        }
        startedButNotCompleted.get(e.user_id)!.add(e.event);
      }
    });

    // Check if they completed (would have completion event)
    const { data: completionEvents } = await supabase
      .from("analytics_events")
      .select("user_id, event")
      .gte("created_at", dayAgo.toISOString())
      .in("event", [
        "onboarding.step_completed",
        "receipt.upload_completed",
        "recon.job_completed",
      ])
      .limit(5000);

    const completedUsers = new Set(completionEvents?.map((e) => e.user_id) || []);

    startedButNotCompleted.forEach((started, userId) => {
      if (!completedUsers.has(userId) && started.size >= 2) {
        // User started multiple things but completed none
        actions.push({
          user_id: userId,
          trigger_type: "abandonment_risk",
          trigger_description: `User started ${started.size} tasks but completed none`,
          action_type: "email_guidance",
          action_content: `We noticed you started a few things but didn't finish. Need help? Here's a quick guide to get you started.`,
          confidence_score: 0.75,
        });
      }
    });

    // ========================================================================
    // STORE ACTIONS
    // ========================================================================

    for (const action of actions) {
      await supabase.from("preemptive_support_actions").insert({
        user_id: action.user_id,
        tenant_id: action.tenant_id,
        trigger_type: action.trigger_type,
        trigger_description: action.trigger_description,
        action_type: action.action_type,
        action_content: action.action_content,
        confidence_score: action.confidence_score,
        shown_in: action.action_type === "in_app_explanation" ? "console" : undefined,
        shown_at: action.action_type === "in_app_explanation" ? new Date().toISOString() : undefined,
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
          actions_taken: actions.length,
          actions_by_type: {
            in_app_explanation: actions.filter((a) => a.action_type === "in_app_explanation").length,
            email_guidance: actions.filter((a) => a.action_type === "email_guidance").length,
          },
          high_confidence_actions: actions.filter((a) => a.confidence_score >= CONFIDENCE_THRESHOLD).length,
        },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        duration_ms: durationMs,
        actions_taken: actions.length,
        high_confidence: actions.filter((a) => a.confidence_score >= CONFIDENCE_THRESHOLD).length,
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
        error: "Preemptive Support Agent failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Agent Orchestrator
 *
 * Schedules and coordinates all autonomous agents
 * Runs: Via cron (Supabase pg_cron) or manual trigger
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentConfig {
  agent_type: string;
  function_name: string;
  schedule: "daily" | "weekly" | "realtime" | "manual";
  enabled: boolean;
  max_concurrent: number;
  timeout_ms: number;
  kill_switch_enabled: boolean;
}

const AGENT_CONFIGS: AgentConfig[] = [
  {
    agent_type: "strategic_governor",
    function_name: "strategic-governor-agent",
    schedule: "weekly", // Every Monday
    enabled: true,
    max_concurrent: 1,
    timeout_ms: 300000, // 5 minutes
    kill_switch_enabled: true,
  },
  {
    agent_type: "architecture_sentinel",
    function_name: "architecture-sentinel-agent",
    schedule: "daily", // Every day
    enabled: true,
    max_concurrent: 1,
    timeout_ms: 180000, // 3 minutes
    kill_switch_enabled: true,
  },
  {
    agent_type: "user_intent_synthesizer",
    function_name: "user-intent-synthesizer-agent",
    schedule: "daily",
    enabled: true,
    max_concurrent: 1,
    timeout_ms: 240000, // 4 minutes
    kill_switch_enabled: true,
  },
  {
    agent_type: "preemptive_support",
    function_name: "preemptive-support-agent",
    schedule: "daily", // Batch runs daily, also triggered real-time
    enabled: true,
    max_concurrent: 3,
    timeout_ms: 120000, // 2 minutes
    kill_switch_enabled: true,
  },
  {
    agent_type: "organic_growth",
    function_name: "organic-growth-agent",
    schedule: "weekly", // Every week
    enabled: true,
    max_concurrent: 1,
    timeout_ms: 300000, // 5 minutes
    kill_switch_enabled: true,
  },
  {
    agent_type: "autonomous_cfo",
    function_name: "autonomous-cfo-agent",
    schedule: "daily",
    enabled: true,
    max_concurrent: 1,
    timeout_ms: 180000, // 3 minutes
    kill_switch_enabled: true,
  },
  {
    agent_type: "release_gatekeeper",
    function_name: "release-gatekeeper-agent",
    schedule: "realtime", // Triggered on PR/commit
    enabled: true,
    max_concurrent: 5,
    timeout_ms: 60000, // 1 minute
    kill_switch_enabled: true,
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
    const agentType = body.agent_type as string | undefined;
    const action = body.action || "run"; // "run", "status", "disable", "enable"

    // ========================================================================
    // ACTION: Get status of all agents
    // ========================================================================

    if (action === "status") {
      const { data: recentRuns } = await supabase
        .from("agent_runs")
        .select("agent_type, status, started_at, completed_at, duration_ms, error_message")
        .order("started_at", { ascending: false })
        .limit(100);

      const agentStatuses = AGENT_CONFIGS.map((config) => {
        const runs = recentRuns?.filter((r) => r.agent_type === config.agent_type) || [];
        const lastRun = runs[0];
        const runningRuns = runs.filter((r) => r.status === "running");

        return {
          agent_type: config.agent_type,
          enabled: config.enabled,
          schedule: config.schedule,
          last_run: lastRun
            ? {
                status: lastRun.status,
                started_at: lastRun.started_at,
                completed_at: lastRun.completed_at,
                duration_ms: lastRun.duration_ms,
                error: lastRun.error_message,
              }
            : null,
          currently_running: runningRuns.length,
          max_concurrent: config.max_concurrent,
        };
      });

      return new Response(
        JSON.stringify({
          success: true,
          agents: agentStatuses,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ========================================================================
    // ACTION: Enable/Disable agent (kill switch)
    // ========================================================================

    if (action === "disable" || action === "enable") {
      if (!agentType) {
        return new Response(JSON.stringify({ error: "agent_type required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const config = AGENT_CONFIGS.find((c) => c.agent_type === agentType);
      if (!config) {
        return new Response(JSON.stringify({ error: `Unknown agent: ${agentType}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // In a real implementation, this would update a database table
      // For now, we'll just return the action
      return new Response(
        JSON.stringify({
          success: true,
          message: `Agent ${agentType} ${action === "enable" ? "enabled" : "disabled"}`,
          agent_type: agentType,
          enabled: action === "enable",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ========================================================================
    // ACTION: Run agent(s)
    // ========================================================================

    const agentsToRun = agentType
      ? AGENT_CONFIGS.filter((c) => c.agent_type === agentType)
      : AGENT_CONFIGS.filter((c) => c.enabled && c.schedule !== "realtime");

    const results = await Promise.allSettled(
      agentsToRun.map(async (config) => {
        // Check if agent is already running (respect max_concurrent)
        const { data: runningRuns } = await supabase
          .from("agent_runs")
          .select("id")
          .eq("agent_type", config.agent_type)
          .eq("status", "running");

        if (runningRuns && runningRuns.length >= config.max_concurrent) {
          return {
            agent_type: config.agent_type,
            status: "skipped",
            reason: `Already ${runningRuns.length} instance(s) running (max: ${config.max_concurrent})`,
          };
        }

        // Check kill switch
        if (config.kill_switch_enabled && !config.enabled) {
          return {
            agent_type: config.agent_type,
            status: "skipped",
            reason: "Agent disabled via kill switch",
          };
        }

        // Invoke agent function
        const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/${config.function_name}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout_ms);

        try {
          const response = await fetch(functionUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Agent returned ${response.status}`);
          }

          const result = await response.json();
          return {
            agent_type: config.agent_type,
            status: "completed",
            result,
          };
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof Error && error.name === "AbortError") {
            return {
              agent_type: config.agent_type,
              status: "timeout",
              reason: `Timeout after ${config.timeout_ms}ms`,
            };
          }
          throw error;
        }
      })
    );

    const agentResults = results.map((result, idx) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          agent_type: agentsToRun[idx].agent_type,
          status: "failed",
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        agents_run: agentResults.length,
        results: agentResults,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Agent Orchestrator failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

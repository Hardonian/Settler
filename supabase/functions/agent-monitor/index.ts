/**
 * Agent Monitor & Dead-Man Switch System
 *
 * Monitors all agents for missed runs and triggers alerts
 * Runs: Every 30 minutes via cron
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentSchedule {
  agent_type: string;
  expected_interval_hours: number;
  grace_period_hours: number;
  enabled: boolean;
}

const AGENT_SCHEDULES: AgentSchedule[] = [
  {
    agent_type: "strategic_governor",
    expected_interval_hours: 168, // Weekly
    grace_period_hours: 24, // 24h grace
    enabled: true,
  },
  {
    agent_type: "architecture_sentinel",
    expected_interval_hours: 24, // Daily
    grace_period_hours: 6, // 6h grace
    enabled: true,
  },
  {
    agent_type: "user_intent_synthesizer",
    expected_interval_hours: 24, // Daily
    grace_period_hours: 6,
    enabled: true,
  },
  {
    agent_type: "preemptive_support",
    expected_interval_hours: 24, // Daily
    grace_period_hours: 6,
    enabled: true,
  },
  {
    agent_type: "autonomous_cfo",
    expected_interval_hours: 24, // Daily
    grace_period_hours: 6,
    enabled: true,
  },
  {
    agent_type: "organic_growth",
    expected_interval_hours: 168, // Weekly
    grace_period_hours: 24,
    enabled: true,
  },
  // release_gatekeeper is real-time, no schedule check needed
];

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

    // Record monitor run
    await supabase.from("agent_runs").insert({
      id: runId,
      agent_type: "agent_monitor",
      status: "running",
      started_at: new Date().toISOString(),
      inputs: {},
    });

    const now = new Date();
    const issues: Array<{
      agent_type: string;
      issue: string;
      severity: "critical" | "high" | "medium";
      last_run: string | null;
      expected_run: string;
      hours_overdue: number;
    }> = [];

    // Check each agent
    for (const schedule of AGENT_SCHEDULES.filter((s) => s.enabled)) {
      const { data: recentRuns } = await supabase
        .from("agent_runs")
        .select("started_at, status")
        .eq("agent_type", schedule.agent_type)
        .order("started_at", { ascending: false })
        .limit(1);

      const lastRun =
        recentRuns && recentRuns.length > 0 ? new Date(recentRuns[0].started_at) : null;

      if (!lastRun) {
        // Agent has never run
        issues.push({
          agent_type: schedule.agent_type,
          issue: "Agent has never run",
          severity: "critical",
          last_run: null,
          expected_run: new Date(
            now.getTime() - schedule.expected_interval_hours * 60 * 60 * 1000
          ).toISOString(),
          hours_overdue: schedule.expected_interval_hours,
        });
        continue;
      }

      const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
      const expectedRun = new Date(
        lastRun.getTime() + schedule.expected_interval_hours * 60 * 60 * 1000
      );
      const hoursOverdue = hoursSinceLastRun - schedule.expected_interval_hours;

      if (hoursOverdue > schedule.grace_period_hours) {
        const severity =
          hoursOverdue > schedule.expected_interval_hours * 2
            ? "critical"
            : hoursOverdue > schedule.expected_interval_hours
              ? "high"
              : "medium";

        issues.push({
          agent_type: schedule.agent_type,
          issue: `Agent has not run in ${hoursSinceLastRun.toFixed(1)} hours (expected every ${schedule.expected_interval_hours}h)`,
          severity,
          last_run: lastRun.toISOString(),
          expected_run: expectedRun.toISOString(),
          hours_overdue: Math.floor(hoursOverdue),
        });
      }

      // Check if last run failed
      if (recentRuns && recentRuns[0].status === "failed") {
        issues.push({
          agent_type: schedule.agent_type,
          issue: "Last agent run failed",
          severity: "high",
          last_run: lastRun.toISOString(),
          expected_run: expectedRun.toISOString(),
          hours_overdue: 0,
        });
      }
    }

    // Send alerts for issues
    if (issues.length > 0) {
      const alerts = issues.map((issue) => ({
        severity: issue.severity,
        title: `Agent Monitor: ${issue.agent_type}`,
        message: issue.issue,
        check: "deadman_switch",
        source: "agent_monitor",
        details: {
          agent_type: issue.agent_type,
          last_run: issue.last_run,
          expected_run: issue.expected_run,
          hours_overdue: issue.hours_overdue,
        },
      }));

      // Call automated-alerting
      const alertingUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/automated-alerting`;
      await fetch(alertingUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alerts }),
      }).catch((err) => {
        console.error("Failed to send alerts:", err);
      });
    }

    // Record completion
    const durationMs = Date.now() - startTime;

    await supabase
      .from("agent_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        outputs: {
          agents_checked: AGENT_SCHEDULES.length,
          issues_found: issues.length,
          issues,
        },
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        duration_ms: durationMs,
        agents_checked: AGENT_SCHEDULES.length,
        issues_found: issues.length,
        issues,
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
      })
      .eq("id", runId)
      .catch(() => {});

    return new Response(
      JSON.stringify({
        error: "Agent Monitor failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

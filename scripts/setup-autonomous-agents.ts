/**
 * TypeScript setup script for Autonomous Agents
 * Can be run with: npx tsx scripts/setup-autonomous-agents.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkTableExists(tableName: string): Promise<boolean> {
  const { error } = await supabase.from(tableName).select("id").limit(1);
  return !error;
}

async function verifyDatabaseSetup() {
  console.log("🔍 Verifying database setup...");

  const requiredTables = [
    "agent_runs",
    "strategic_backlog",
    "architecture_violations",
    "user_intent_insights",
    "preemptive_support_actions",
    "growth_content",
    "financial_insights",
    "release_safety_checks",
  ];

  const missingTables: string[] = [];

  for (const table of requiredTables) {
    const exists = await checkTableExists(table);
    if (exists) {
      console.log(`  ✓ ${table}`);
    } else {
      console.log(`  ✗ ${table} (missing)`);
      missingTables.push(table);
    }
  }

  if (missingTables.length > 0) {
    console.error(`\n❌ Missing tables: ${missingTables.join(", ")}`);
    console.error("   Run: supabase db push");
    return false;
  }

  console.log("\n✓ All required tables exist");
  return true;
}

async function testAgentOrchestrator() {
  console.log("\n🧪 Testing agent orchestrator...");

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/agent-orchestrator`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "status" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log("  ✓ Orchestrator responding");

    if (data.agents) {
      console.log(`\n  Found ${data.agents.length} agents:`);
      data.agents.forEach((agent: any) => {
        const status = agent.enabled ? "✓" : "✗";
        const lastRun = agent.last_run
          ? `${agent.last_run.status} (${new Date(agent.last_run.started_at).toLocaleString()})`
          : "never";
        console.log(`    ${status} ${agent.agent_type}: ${lastRun}`);
      });
    }

    return true;
  } catch (error) {
    console.error(`  ✗ Orchestrator test failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function getAgentMetrics() {
  console.log("\n📊 Agent Metrics (last 7 days):");

  const { data: runs, error } = await supabase
    .from("agent_runs")
    .select("agent_type, status, started_at, duration_ms, error_message")
    .gte("started_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("started_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error(`  ✗ Failed to fetch metrics: ${error.message}`);
    return;
  }

  const byAgent = new Map<string, { total: number; success: number; failed: number; avgDuration: number }>();

  runs?.forEach((run) => {
    if (!byAgent.has(run.agent_type)) {
      byAgent.set(run.agent_type, { total: 0, success: 0, failed: 0, avgDuration: 0 });
    }
    const stats = byAgent.get(run.agent_type)!;
    stats.total++;
    if (run.status === "completed") stats.success++;
    if (run.status === "failed") stats.failed++;
    if (run.duration_ms) {
      stats.avgDuration = (stats.avgDuration * (stats.total - 1) + run.duration_ms) / stats.total;
    }
  });

  byAgent.forEach((stats, agentType) => {
    const successRate = ((stats.success / stats.total) * 100).toFixed(1);
    const avgDuration = (stats.avgDuration / 1000).toFixed(1);
    console.log(`  ${agentType}:`);
    console.log(`    Runs: ${stats.total} | Success: ${stats.success} (${successRate}%) | Failed: ${stats.failed}`);
    console.log(`    Avg Duration: ${avgDuration}s`);
  });
}

async function getArtifactCounts() {
  console.log("\n📦 Artifacts Produced (last 7 days):");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const tables = [
    { name: "strategic_backlog", label: "Strategic Backlog Items" },
    { name: "architecture_violations", label: "Architecture Violations" },
    { name: "user_intent_insights", label: "User Insights" },
    { name: "preemptive_support_actions", label: "Support Actions" },
    { name: "growth_content", label: "Growth Content" },
    { name: "financial_insights", label: "Financial Insights" },
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table.name)
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);

    if (error) {
      console.log(`  ✗ ${table.label}: Error - ${error.message}`);
    } else {
      console.log(`  ✓ ${table.label}: ${count || 0}`);
    }
  }
}

async function main() {
  console.log("🚀 Autonomous Agents Setup Verification\n");
  console.log("==========================================\n");

  // Step 1: Verify database
  const dbOk = await verifyDatabaseSetup();
  if (!dbOk) {
    process.exit(1);
  }

  // Step 2: Test orchestrator
  const orchestratorOk = await testAgentOrchestrator();
  if (!orchestratorOk) {
    console.error("\n⚠️  Orchestrator not responding. Functions may not be deployed.");
    console.error("   Run: supabase functions deploy agent-orchestrator");
  }

  // Step 3: Get metrics
  await getAgentMetrics();

  // Step 4: Get artifact counts
  await getArtifactCounts();

  console.log("\n✅ Setup verification complete!");
  console.log("\nNext steps:");
  console.log("1. Set up cron jobs: See supabase/migrations/20260127000001_agent_cron_jobs.sql");
  console.log("2. Monitor agents: Run scripts/monitor-agents.sh");
  console.log("3. Review documentation: docs/autonomous-company/");
}

main().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});

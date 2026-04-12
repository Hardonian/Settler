/**
 * Orchestrator Agent - Master Controller for All Agents
 *
 * Coordinates:
 * - Monitor Agent (health checks)
 * - Deploy Agent (deployments)
 * - Maintenance Agent (cleanup/optimization)
 * - Communication Agent (alerts)
 * - Security Agent (vulnerability scanning)
 *
 * Usage: node agents/orchestrator-agent.js
 */

import { createClient } from "@supabase/supabase-js";
import { createLogger } from "@settler/logger";

const log = createLogger("orchestrator");

interface OrchestratorConfig {
  supabaseUrl: string;
  supabaseKey: string;
  slackWebhook?: string;
  interval: number; // ms between checks
}

interface AgentStatus {
  name: string;
  status: "running" | "stopped" | "error";
  lastRun?: Date;
  lastError?: string;
}

class OrchestratorAgent {
  private config: OrchestratorConfig;
  private agents: Map<string, AgentStatus> = new Map();
  private isRunning = false;

  constructor(config: OrchestratorConfig) {
    this.config = config;
  }

  async start() {
    log.info("Starting Orchestrator Agent...");
    this.isRunning = true;

    // Initialize agent statuses
    this.agents.set("monitor", { name: "Monitor", status: "stopped" });
    this.agents.set("maintenance", { name: "Maintenance", status: "stopped" });
    this.agents.set("security", { name: "Security", status: "stopped" });

    // Start main loop
    while (this.isRunning) {
      await this.runCycle();
      await this.sleep(this.config.interval);
    }
  }

  stop() {
    log.info("Stopping Orchestrator Agent...");
    this.isRunning = false;
  }

  async runCycle() {
    const now = new Date();

    // Run monitor agent every minute
    if (now.getMinutes() !== this.agents.get("monitor")?.lastRun?.getMinutes()) {
      await this.runAgent("monitor", async () => {
        // Would spawn monitor agent process
        log.info("Monitor agent cycle complete");
      });
    }

    // Run maintenance agent daily at 3 AM
    if (now.getHours() === 3 && now.getMinutes() === 0) {
      await this.runAgent("maintenance", async () => {
        // Would spawn maintenance agent process
        log.info("Maintenance agent cycle complete");
      });
    }

    // Run security agent weekly on Sundays at 2 AM
    if (now.getDay() === 0 && now.getHours() === 2 && now.getMinutes() === 0) {
      await this.runAgent("security", async () => {
        // Would spawn security agent process
        log.info("Security agent cycle complete");
      });
    }

    // Log status
    await this.logStatus();
  }

  async runAgent(name: string, task: () => Promise<void>) {
    const agent = this.agents.get(name);
    if (!agent) return;

    try {
      agent.status = "running";
      agent.lastRun = new Date();
      await task();
      agent.status = "stopped";
    } catch (error) {
      agent.status = "error";
      agent.lastError = error instanceof Error ? error.message : "Unknown error";
      log.error(`Agent ${name} failed: ${agent.lastError}`);
    }

    this.agents.set(name, agent);
  }

  async logStatus() {
    try {
      const supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
      await supabase.from("agent_status").insert({
        timestamp: new Date().toISOString(),
        agents: Array.from(this.agents.entries()).map(([name, status]) => ({
          name,
          status: status.status,
          lastRun: status.lastRun,
        })),
      });
    } catch (e) {
      log.error("Failed to log agent status", e);
    }
  }

  getStatus(): AgentStatus[] {
    return Array.from(this.agents.values());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// CLI
const config: OrchestratorConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  interval: parseInt(process.env.CHECK_INTERVAL || "60000", 10),
};

const orchestrator = new OrchestratorAgent(config);

// Handle graceful shutdown
process.on("SIGINT", () => orchestrator.stop());
process.on("SIGTERM", () => orchestrator.stop());

orchestrator.start().catch(log.error);

export { OrchestratorAgent };

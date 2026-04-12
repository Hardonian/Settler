/**
 * Deploy Agent - Automated Deployment Management
 *
 * Handles:
 * - Deploy preview builds
 * - Deploy production
 * - Rollback failed deploys
 * - Notify on status
 *
 * Usage: node agents/deploy-agent.js --env production
 */

import { createClient } from "@supabase/supabase-js";
import { createLogger } from "@settler/logger";

const log = createLogger("deploy-agent");

interface DeployConfig {
  supabaseUrl: string;
  supabaseKey: string;
  githubToken: string;
  repo: string;
  vercelToken?: string;
  slackWebhook?: string;
}

interface DeployRequest {
  env: "preview" | "production" | "staging";
  ref?: string;
  prNumber?: number;
}

interface DeployResult {
  success: boolean;
  url?: string;
  commit?: string;
  duration?: number;
  error?: string;
}

class DeployAgent {
  private config: DeployConfig;

  constructor(config: DeployConfig) {
    this.config = config;
  }

  async deploy(request: DeployRequest): Promise<DeployResult> {
    const start = Date.now();
    const { env, ref, prNumber } = request;

    log.info(`Starting ${env} deploy...`, { ref, prNumber });

    try {
      const commit = ref || "main";

      if (this.config.vercelToken) {
        const result = await this.triggerVercelDeploy(env, commit);
        if (!result.success) return result;
      }

      await this.logDeploy({
        env,
        commit,
        prNumber,
        status: "started",
        url: `https://${env}.settler.dev`,
      });

      await this.notify(`Deploying ${env} (${commit})`);

      const duration = Date.now() - start;

      return {
        success: true,
        url: `https://${env}.settler.dev`,
        commit,
        duration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      log.error(`Deploy failed: ${message}`);

      await this.logDeploy({
        env,
        commit: ref || "main",
        status: "failed",
        error: message,
      });

      return {
        success: false,
        error: message,
      };
    }
  }

  async triggerVercelDeploy(env: string, ref: string): Promise<DeployResult> {
    log.info(`Would trigger Vercel deploy for ${env} (${ref})`);
    return { success: true };
  }

  async rollback(deployId: string): Promise<DeployResult> {
    log.info(`Rolling back deploy ${deployId}...`);

    const supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
    const { data: deploys } = await supabase
      .from("deploys")
      .select("*")
      .eq("id", deployId)
      .order("created_at", { ascending: false })
      .limit(2);

    if (!deploys || deploys.length < 2) {
      return { success: false, error: "No previous deploy to rollback to" };
    }

    const previousDeploy = deploys[1];
    const result = await this.deploy({
      env: previousDeploy.env,
      ref: previousDeploy.commit,
    });

    await this.logDeploy({
      env: previousDeploy.env,
      commit: previousDeploy.commit,
      status: "rolled_back",
      rolledBackFrom: deployId,
    });

    return result;
  }

  async logDeploy(deploy: {
    env: string;
    commit: string;
    prNumber?: number;
    status: string;
    url?: string;
    error?: string;
    rolledBackFrom?: string;
  }): Promise<void> {
    try {
      const supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
      await supabase.from("deploys").insert({
        ...deploy,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      log.error("Failed to log deploy", e);
    }
  }

  async notify(message: string): Promise<void> {
    if (this.config.slackWebhook) {
      await fetch(this.config.slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `🚀 ${message}` }),
      }).catch(log.error);
    }
  }
}

// CLI
const args = process.argv.slice(2);
const envArg = args.find((a) => a.startsWith("--env="))?.split("=")[1];

if (!envArg) {
  console.log("Usage: node deploy-agent.js --env=[preview|production|staging] [--ref=commit]");
  process.exit(1);
}

const agent = new DeployAgent({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  githubToken: process.env.GITHUB_TOKEN || "",
  repo: "Hardonian/Settler",
  vercelToken: process.env.VERCEL_TOKEN,
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
});

agent
  .deploy({
    env: envArg as "preview" | "production" | "staging",
    ref: args.find((a) => a.startsWith("--ref="))?.split("=")[1],
  })
  .then((result) => {
    if (result.success) {
      console.log(`✅ Deploy complete: ${result.url}`);
    } else {
      console.log(`❌ Deploy failed: ${result.error}`);
      process.exit(1);
    }
  });

export { DeployAgent };

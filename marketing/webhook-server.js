/**
 * Marketing Webhook Server
 *
 * Handles incoming webhooks from various services
 * Triggers automated actions
 *
 * Endpoints:
 * - /webhook/slack - Slack notifications
 * - /webhook/github - GitHub events
 * - /webhook/stripe - Stripe events
 * - /webhook/approval - Approval decisions
 */

const http = require("http");
const url = require("url");
const { execSync } = require("child_process");

const PORT = process.env.WEBHOOK_PORT || 3456;
const MARKETING_DIR = "/root/.openclaw/workspace/Settler/marketing";

class WebhookServer {
  constructor() {
    this.routes = {
      "/webhook/slack": this.handleSlack.bind(this),
      "/webhook/github": this.handleGitHub.bind(this),
      "/webhook/approval": this.handleApproval.bind(this),
      "/webhook/trigger": this.handleTrigger.bind(this),
    };
  }

  start() {
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const route = this.routes[parsedUrl.pathname];

      if (route) {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const data = body ? JSON.parse(body) : {};
            route(data, res);
          } catch (e) {
            this.respond(res, 400, { error: "Invalid JSON" });
          }
        });
      } else {
        this.respond(res, 404, { error: "Not found" });
      }
    });

    server.listen(PORT, () => {
      console.log(`🌐 Webhook server running on port ${PORT}`);
      console.log("");
      console.log("Endpoints:");
      Object.keys(this.routes).forEach((r) => console.log(`  POST ${r}`));
    });
  }

  respond(res, status, data) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  handleSlack(data, res) {
    console.log("📱 Slack webhook received:", data);

    // Handle Slack commands or events
    if (data.command === "/approve") {
      // Trigger approval workflow
      execSync(
        `cd ${MARKETING_DIR} && node approval-workflow.js --action=approve --id=${data.text}`
      );
      this.respond(res, 200, { text: "✅ Content approved!" });
    } else if (data.command === "/generate") {
      // Trigger content generation
      execSync(`cd ${MARKETING_DIR} && node daily-run.js`);
      this.respond(res, 200, { text: "🚀 Content generation started!" });
    } else {
      this.respond(res, 200, { text: "Command received" });
    }
  }

  handleGitHub(data, res) {
    console.log("🐙 GitHub webhook received:", data);

    // Handle GitHub events
    if (data.event === "release") {
      // New release - generate announcement content
      console.log("📦 New release detected, generating announcement...");
      this.respond(res, 200, { message: "Release processed" });
    } else {
      this.respond(res, 200, { message: "Event received" });
    }
  }

  handleApproval(data, res) {
    console.log("✅ Approval webhook received:", data);

    // Handle approval decisions
    const { action, id, approver } = data;

    try {
      execSync(
        `cd ${MARKETING_DIR} && node approval-workflow.js --action=${action} --id=${id} --approver=${approver}`
      );
      this.respond(res, 200, { message: `Content ${action}d` });
    } catch (e) {
      this.respond(res, 500, { error: e.message });
    }
  }

  handleTrigger(data, res) {
    console.log("🎯 Custom trigger received:", data);

    // Handle custom automation triggers
    const { type, params } = data;

    switch (type) {
      case "generate-content":
        execSync(`cd ${MARKETING_DIR} && node daily-run.js`);
        this.respond(res, 200, { message: "Content generation triggered" });
        break;

      case "publish-social":
        const { platform, content } = params;
        execSync(
          `cd ${MARKETING_DIR} && node integrations/social-publisher.js publish --platform=${platform} --content="${content}"`
        );
        this.respond(res, 200, { message: "Social post published" });
        break;

      case "research-prospects":
        execSync(`cd ${MARKETING_DIR} && node lead-gen/prospect-researcher.ts --source=all`);
        this.respond(res, 200, { message: "Prospect research triggered" });
        break;

      default:
        this.respond(res, 400, { error: "Unknown trigger type" });
    }
  }
}

// Start server
const server = new WebhookServer();
server.start();

module.exports = { WebhookServer };

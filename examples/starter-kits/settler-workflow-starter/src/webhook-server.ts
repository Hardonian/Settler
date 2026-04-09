/**
 * Minimal webhook receiver for Settler events.
 *
 * Run in a separate terminal:
 *   npm run webhook-server
 *
 * This server:
 *   - Verifies webhook signatures using the SDK
 *   - Logs events to the console
 *   - Shows how to handle reconciliation lifecycle events
 */

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { verifyWebhookSignature } from "@settler/sdk";

const PORT = Number(process.env.WEBHOOK_PORT) || 8080;
const WEBHOOK_SECRET = process.env.SETTLER_WEBHOOK_SECRET || "";

if (!WEBHOOK_SECRET) {
  console.warn("WARNING: SETTLER_WEBHOOK_SECRET not set – signature verification will be skipped.");
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // Webhook endpoint
  if (req.method === "POST" && req.url === "/settler/webhook") {
    const body = await readBody(req);

    // Verify signature
    if (WEBHOOK_SECRET) {
      const signature = req.headers["x-settler-signature"] as string | undefined;
      if (!signature || !verifyWebhookSignature(body, signature, WEBHOOK_SECRET)) {
        console.error("  ✗ Invalid webhook signature – rejecting");
        res.writeHead(401);
        res.end("Invalid signature");
        return;
      }
    }

    const event = JSON.parse(body);
    const ts = new Date().toISOString().slice(11, 19);

    switch (event.type) {
      case "reconciliation.completed":
        console.log(
          `[${ts}] ✓ Reconciliation completed – job=${event.data.jobId} matched=${event.data.matched} unmatched=${event.data.unmatched}`
        );
        break;

      case "reconciliation.failed":
        console.log(
          `[${ts}] ✗ Reconciliation failed – job=${event.data.jobId} error=${event.data.error}`
        );
        break;

      case "exception.created":
        console.log(`[${ts}] ! Exception created – id=${event.data.id} type=${event.data.type}`);
        break;

      default:
        console.log(`[${ts}] ? Unknown event: ${event.type}`);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: true }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`\nSettler webhook server listening on http://localhost:${PORT}`);
  console.log(`Webhook endpoint: POST http://localhost:${PORT}/settler/webhook`);
  console.log(`Health check:     GET  http://localhost:${PORT}/health\n`);
});

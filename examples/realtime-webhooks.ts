/**
 * Example: Real-Time Webhook Reconciliation
 * Reconcile as events happen via webhooks
 */

import Settler from "@settler/sdk";
import express from "express";
import crypto from "crypto";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

const app = express();
app.use(express.json());

async function setupRealtimeReconciliation() {
  // Create job
  const job = await settler.jobs.create({
    name: "Real-Time Reconciliation",
    source: {
      adapter: "shopify",
      config: {
        apiKey: process.env.SHOPIFY_API_KEY!,
        shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
      },
    },
    target: {
      adapter: "stripe",
      config: {
        apiKey: process.env.STRIPE_SECRET_KEY!,
      },
    },
    rules: {
      matching: [
        { field: "order_id", type: "exact" },
        { field: "amount", type: "exact", tolerance: 0.01 },
      ],
    },
  });

  // Set up webhook
  const webhook = await settler.webhooks.create({
    url: "https://your-app.com/webhooks/settler",
    events: [
      "reconciliation.matched",
      "reconciliation.mismatch",
      "reconciliation.error",
    ],
  });

  console.log("Webhook created:", webhook.data.id);
  console.log("Webhook secret:", webhook.data.secret);

  return { job, webhook };
}

// Handle webhook events
app.post("/webhooks/settler", async (req, res) => {
  const signature = req.headers["x-settler-signature"] as string;
  const webhookSecret = process.env.SETTLER_WEBHOOK_SECRET!;

  // Verify webhook signature
  const payload = JSON.stringify(req.body);
  const [timestamp, hash] = signature.split(",");
  const [t, v1] = hash.split("=");

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const { event, data } = req.body;

  if (event === "reconciliation.mismatch") {
    // Alert finance team
    await notifyFinanceTeam({
      jobId: data.jobId,
      sourceId: data.sourceId,
      expectedAmount: data.expectedAmount,
      actualAmount: data.actualAmount,
    });
  }

  res.json({ received: true });
});

async function notifyFinanceTeam(data: {
  jobId: string;
  sourceId: string;
  expectedAmount: number;
  actualAmount: number;
}) {
  // Send notification (email, Slack, etc.)
  console.log("Mismatch detected:", data);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  setupRealtimeReconciliation().catch(console.error);
});

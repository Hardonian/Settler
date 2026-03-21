import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(): Promise<NextResponse> {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Query real webhook delivery retry queue from database
        const [pendingWebhooks, failedWebhooks, pendingRecons] = await Promise.all([
          prisma.webhookDelivery
            .count({
              where: { status: "pending" },
            })
            .catch(() => 0),
          prisma.webhookDelivery
            .count({
              where: { status: "failed", nextRetryAt: { not: null } },
            })
            .catch(() => 0),
          prisma.reconciliationRun
            .count({
              where: { status: "pending" },
            })
            .catch(() => 0),
        ]);

        const queues = [
          {
            queueName: "webhook-delivery",
            pending: pendingWebhooks,
            failed: failedWebhooks,
          },
          {
            queueName: "reconciliation-runs",
            pending: pendingRecons,
            failed: 0,
          },
        ];

        return NextResponse.json({ queues, dataSource: "live" });
      } catch (error) {
        appLogger.error("Error in retry-queues GET", error);
        return NextResponse.json(
          {
            queues: [],
            error: "Failed to retrieve queue status",
          },
          { status: 503 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

/**
 * Console Receipts API Route - Get Detail
 *
 * Supports both session auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/unified-auth";
import { prisma } from "@/shared/db/prismaClient";
import { getReceiptDetail } from "@/domain/console/receipts";
import {
  getCorrelationId,
  addCorrelationHeaders,
  createLogger,
} from "@/lib/monitoring/correlation";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest, { params }: RouteParams) {
      const correlationId = await getCorrelationId();
      const logger = await createLogger({ route: "/api/console/receipts/[id]", method: "GET" });

      try {
        const { id } = await params;
        logger.info("Console receipt detail request started", {
          correlationId,
          receiptId: id || "unknown",
        });

        // Validate receipt ID format
        if (!id || typeof id !== "string") {
          logger.warn("Invalid receipt ID format", { correlationId, receiptId: id });
          const response = NextResponse.json({ error: "Invalid receipt ID" }, { status: 400 });
          return addCorrelationHeaders(response, correlationId);
        }

        // ID is now validated as string
        console.assert(typeof id === "string", "ID should be string after validation");

        // Authenticate using unified auth (session or API key)
        const authContext = await requireAuth(request);
        logger.info("Authentication successful", {
          correlationId,
          userId: authContext.userId,
          type: authContext.type,
        });

        // Get billing account
        let billingAccountId = authContext.billingAccountId;

        if (!billingAccountId) {
          logger.warn("No billing account in auth context, looking up", { correlationId });
          const response = NextResponse.json({ error: "Receipt not found" }, { status: 404 });
          return addCorrelationHeaders(response, correlationId);
        }

        const billingAccount = await prisma.billingAccount.findFirst({
          where: { userId: authContext.userId },
          select: { id: true },
        });

        if (!billingAccount) {
          logger.warn("No billing account found", { correlationId });
          const response = NextResponse.json({ error: "Receipt not found" }, { status: 404 });
          return addCorrelationHeaders(response, correlationId);
        }

        billingAccountId = billingAccount?.id || "";
        logger.info("Found billing account", { correlationId, billingAccountId });

        logger.info("Fetching receipt detail", { correlationId, receiptId: id, billingAccountId });
        const receipt = await getReceiptDetail(id as string, billingAccountId);

        if (!receipt) {
          // Receipt not found or doesn't belong to user's billing account
          logger.warn("Receipt not found or access denied", {
            correlationId,
            receiptId: id,
            billingAccountId,
          });
          const response = NextResponse.json({ error: "Receipt not found" }, { status: 404 });
          return addCorrelationHeaders(response, correlationId);
        }

        logger.info("Receipt detail fetched successfully", { correlationId, receiptId: id });
        const response = NextResponse.json({ receipt });
        return addCorrelationHeaders(response, correlationId);
      } catch (error) {
        // If auth error, return 401
        if (error instanceof Error && error.message.includes("Unauthorized")) {
          logger.warn("Authentication failed", { correlationId, error: error.message });
          const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          return addCorrelationHeaders(response, correlationId);
        }

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error("Error fetching receipt detail", {
          correlationId,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });

        // Return 404 instead of 500 to prevent page crashes
        const response = NextResponse.json({ error: "Receipt not found" }, { status: 404 });
        return addCorrelationHeaders(response, correlationId);
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

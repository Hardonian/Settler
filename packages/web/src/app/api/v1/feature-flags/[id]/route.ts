/**
 * Feature Flags API - Update flag
 *
 * PATCH /api/v1/feature-flags/:id - Update flag settings
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateApiKey } from "@/shared/auth/apiKey";
import { prisma } from "@/shared/db/prismaClient";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

const patchFeatureFlagBodySchema = z
  .object({
    name: z.string().min(1).max(256).optional(),
    description: z.string().max(4000).nullable().optional(),
    isGlobal: z.boolean().optional(),
    defaultValue: z.unknown().optional(),
  })
  .strict();

function jsonError(message: string, details?: unknown) {
  return NextResponse.json(
    { error: "Invalid request body", code: "VALIDATION_ERROR", message, details },
    { status: 400 }
  );
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Prisma binary engine

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const PATCH = withSecurity(
  withUniversalBillingGate(
    async function PATCH(request: NextRequest, { params }: RouteParams) {
      try {
        // Try to authenticate, but allow unauthenticated access for playground
        let auth: Awaited<ReturnType<typeof authenticateApiKey>> | undefined;
        let isAuthenticated = false;

        auth = await authenticateApiKey(request);
        if (auth) {
          isAuthenticated = true;
        } else {
          auth = undefined;
        }
        // Unauthenticated access allowed for playground (graceful degradation)

        const { id } = await params;
        let rawBody: unknown;
        try {
          rawBody = await request.json();
        } catch {
          return jsonError("Request body must be valid JSON");
        }

        const parsed = patchFeatureFlagBodySchema.safeParse(rawBody);
        if (!parsed.success) {
          return jsonError("Malformed PATCH body", parsed.error.flatten());
        }
        const body = parsed.data;

        // For unauthenticated users, return demo response
        if (!isAuthenticated) {
          return NextResponse.json(
            {
              id: `demo_${id}`,
              key: "demo_flag",
              name: body.name || "Demo Feature Flag",
              description: body.description ?? "This is a demo response",
              type: "boolean",
              isGlobal: false,
              defaultValue: false,
              updatedAt: new Date().toISOString(),
              demo: true,
              message: "This is a demo response. Sign in to update real feature flags.",
            },
            { status: 200 }
          );
        }

        if (!auth || !auth.billingAccountId) {
          return NextResponse.json({ error: "Billing account required" }, { status: 402 });
        }

        // Verify flag belongs to billing account
        const existing = await prisma.featureFlag.findFirst({
          where: {
            id,
            billingAccountId: auth!.billingAccountId,
          },
        });

        if (!existing) {
          return NextResponse.json({ error: "Feature flag not found" }, { status: 404 });
        }

        // Update flag
        const flag = await prisma.featureFlag.update({
          where: { id },
          data: {
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.isGlobal !== undefined ? { isGlobal: body.isGlobal } : {}),
            ...(body.defaultValue !== undefined
              ? { defaultValue: body.defaultValue as object }
              : {}),
          },
        });

        return NextResponse.json({
          id: flag.id,
          key: flag.key,
          name: flag.name,
          description: flag.description,
          type: flag.type,
          isGlobal: flag.isGlobal,
          defaultValue: flag.defaultValue,
          updatedAt: flag.updatedAt,
        });
      } catch (error) {
        appLogger.error("Error updating feature flag", error);
        return NextResponse.json({ error: "Failed to update feature flag" }, { status: 500 });
      }
    },
    { feature: "PATCH API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);

// try catch

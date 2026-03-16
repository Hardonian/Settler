/**
 * Feature Flags API - CRUD operations
 *
 * POST /api/v1/feature-flags - Create a flag
 * GET /api/v1/feature-flags - List flags
 */

// ROUTE_CLASS: api-key-service
// AUTH: API key auth — tenant-scoped

import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/shared/auth/apiKey";
import { prisma } from "@/shared/db/prismaClient";
import { FlagType } from "@/domain/featureFlags/types";
import { requireActiveSubscription } from "@/lib/security/billing-enforcement";
import { withSecurity } from "@/lib/middleware/api-security";
import { appLogger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Prisma binary engine

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    try {
      // Try to authenticate, but allow unauthenticated access for playground
      let isAuthenticated = false;

      const auth = await authenticateApiKey(request);
      if (auth) {
        isAuthenticated = true;
      }
      // Unauthenticated access allowed for playground (graceful degradation)

      // For unauthenticated users, return demo response
      if (!isAuthenticated) {
        const body = await request.json();
        const { key, name } = body;

        return NextResponse.json(
          {
            id: `demo_${Date.now()}`,
            key: key || "demo_flag",
            name: name || "Demo Feature Flag",
            description: "This is a demo response. Sign in to create real feature flags.",
            type: "boolean",
            isGlobal: false,
            defaultValue: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            demo: true,
            message: "This is a demo response. Sign in to create real feature flags.",
          },
          { status: 201 }
        );
      }

      // CRITICAL: Enforce active subscription requirement
      const subscriptionCheck = await requireActiveSubscription(request, auth?.userId);
      if (!subscriptionCheck.allowed) {
        return subscriptionCheck.error!;
      }

      if (!auth || !auth.billingAccountId) {
        return NextResponse.json({ error: "Billing account required" }, { status: 402 });
      }

      const body = await request.json();
      const { key, name, description, type, isGlobal, defaultValue, projectId } = body;

      if (!key || !name) {
        return NextResponse.json({ error: "key and name are required" }, { status: 400 });
      }

      const flagType: FlagType = type || "boolean";

      // Create flag
      const flag = await prisma.featureFlag.create({
        data: {
          billingAccountId: auth.billingAccountId,
          projectId: projectId || null,
          key,
          name,
          description,
          type: flagType,
          isGlobal: isGlobal || false,
          defaultValue: defaultValue ? JSON.parse(JSON.stringify(defaultValue)) : null,
          metadata: {},
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
        createdAt: flag.createdAt,
        updatedAt: flag.updatedAt,
      });
    } catch (error) {
      // Never return 500 - always return 200 with error info for playground
      appLogger.error("Error creating feature flag", error);
      return NextResponse.json(
        {
          error: "Failed to create feature flag",
          message: error instanceof Error ? error.message : "Unknown error",
          demo: true,
        },
        { status: 200 }
      );
    }
  },
  {
    rateLimit: { maxRequests: 100, windowMs: 60 * 1000 },
    requireAuth: false, // Allow playground access
  }
);

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    try {
      // Try to authenticate, but allow unauthenticated access for playground
      let isAuthenticated = false;

      const auth = await authenticateApiKey(request);
      if (auth) {
        isAuthenticated = true;
      }
      // Unauthenticated access allowed for playground (graceful degradation)

      // For unauthenticated users, return demo response
      if (!isAuthenticated) {
        return NextResponse.json(
          {
            flags: [
              {
                id: "demo_1",
                key: "demo_feature",
                name: "Demo Feature Flag",
                description: "This is a demo feature flag",
                type: "boolean",
                isGlobal: false,
                defaultValue: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                demo: true,
              },
            ],
            message: "This is a demo response. Sign in to see your real feature flags.",
          },
          { status: 200 }
        );
      }

      // CRITICAL: Enforce active subscription requirement
      const subscriptionCheck = await requireActiveSubscription(request, auth?.userId);
      if (!subscriptionCheck.allowed) {
        return subscriptionCheck.error!;
      }

      if (!auth || !auth.billingAccountId) {
        return NextResponse.json({ error: "Billing account required" }, { status: 402 });
      }

      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get("projectId");

      // List flags
      const flags = await prisma.featureFlag.findMany({
        where: {
          billingAccountId: auth.billingAccountId,
          projectId: projectId || undefined,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        flags: flags.map((flag: (typeof flags)[number]) => ({
          id: flag.id,
          key: flag.key,
          name: flag.name,
          description: flag.description,
          type: flag.type,
          isGlobal: flag.isGlobal,
          defaultValue: flag.defaultValue,
          createdAt: flag.createdAt,
          updatedAt: flag.updatedAt,
        })),
      });
    } catch (error) {
      // Never return 500 - always return 200 with empty array for playground
      const { appLogger } = await import("@/lib/utils/logger");
      appLogger.error("Error listing feature flags", error);
      return NextResponse.json(
        {
          flags: [],
          message: "Failed to list feature flags, returning empty list",
        },
        { status: 200 }
      );
    }
  },
  {
    rateLimit: { maxRequests: 100, windowMs: 60 * 1000 },
    requireAuth: false, // Allow playground access
  }
);

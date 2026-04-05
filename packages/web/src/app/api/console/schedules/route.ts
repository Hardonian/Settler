/**
 * Schedules API Route
 *
 * GET - List recon jobs with schedule info
 * PATCH - Update schedule (cron + timezone) for a specific job
 */

import { NextRequest, NextResponse } from "next/server";
import {
  buildTenantContextErrorResponse,
  requireTenantRequestContext,
} from "@/lib/api/tenant-context";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      try {
        const tenantContext = await requireTenantRequestContext(request);

        const jobs = await prisma.reconJob.findMany({
          where: {
            tenantId: tenantContext.tenantId,
            deletedAt: null,
          },
          include: {
            results: {
              orderBy: { startedAt: "desc" },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
        });

        const items = jobs.map((job: (typeof jobs)[number]) => {
          const latestResult = job.results[0] ?? null;
          return {
            id: job.id,
            name: job.name,
            status: job.status,
            sourceAdapter: job.sourceAdapter,
            targetAdapter: job.targetAdapter,
            scheduleCron: job.scheduleCron,
            scheduleTimezone: job.scheduleTimezone,
            createdAt: job.createdAt.toISOString(),
            updatedAt: job.updatedAt.toISOString(),
            lastExecution: latestResult
              ? {
                  id: latestResult.id,
                  status: latestResult.status,
                  startedAt: latestResult.startedAt.toISOString(),
                  completedAt: latestResult.completedAt?.toISOString() ?? null,
                }
              : null,
          };
        });

        return NextResponse.json({
          items,
          capability: { state: "available" },
        });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          "capability" in error
        ) {
          return buildTenantContextErrorResponse(error);
        }
        appLogger.error("[Schedules API] GET error", error);
        return NextResponse.json(
          {
            error: "Failed to load schedule data",
            items: [],
            capability: { state: "degraded", reason: "schedules_unavailable" },
          },
          { status: 503 }
        );
      }
    },
    { feature: "Schedules GET" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

export const PATCH = withSecurity(
  withUniversalBillingGate(
    async function PATCH(request: NextRequest) {
      try {
        const tenantContext = await requireTenantRequestContext(request);

        const body = await request.json().catch(() => ({}));

        const { jobId, scheduleCron, scheduleTimezone } = body as {
          jobId?: string;
          scheduleCron?: string | null;
          scheduleTimezone?: string;
        };

        if (!jobId || typeof jobId !== "string") {
          return NextResponse.json(
            { error: "jobId is required" },
            { status: 400 }
          );
        }

        // Verify job belongs to this tenant
        const existing = await prisma.reconJob.findFirst({
          where: {
            id: jobId,
            tenantId: tenantContext.tenantId,
            deletedAt: null,
          },
        });

        if (!existing) {
          return NextResponse.json(
            { error: "Job not found" },
            { status: 404 }
          );
        }

        // Basic cron validation (5 or 6 fields)
        if (scheduleCron !== null && scheduleCron !== undefined) {
          const parts = scheduleCron.trim().split(/\s+/);
          if (parts.length < 5 || parts.length > 6) {
            return NextResponse.json(
              { error: "Invalid cron expression. Expected 5 or 6 fields." },
              { status: 400 }
            );
          }
        }

        const updated = await prisma.reconJob.update({
          where: { id: jobId },
          data: {
            scheduleCron: scheduleCron ?? null,
            scheduleTimezone: scheduleTimezone || existing.scheduleTimezone,
          },
        });

        appLogger.info("[Schedules API] Schedule updated", {
          jobId,
          tenantId: tenantContext.tenantId,
          scheduleCron: updated.scheduleCron,
          scheduleTimezone: updated.scheduleTimezone,
        });

        return NextResponse.json({
          id: updated.id,
          scheduleCron: updated.scheduleCron,
          scheduleTimezone: updated.scheduleTimezone,
          capability: { state: "available" },
        });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          "capability" in error
        ) {
          return buildTenantContextErrorResponse(error);
        }
        appLogger.error("[Schedules API] PATCH error", error);
        return NextResponse.json(
          {
            error: "Failed to update schedule",
            capability: { state: "degraded", reason: "schedule_update_unavailable" },
          },
          { status: 503 }
        );
      }
    },
    { feature: "Schedules PATCH" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 30 }, requireAuth: true }
);

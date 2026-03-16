/**
 * Admin Audit Trail API
 *
 * Returns audit trail items for admin dashboard.
 * Requires super admin access.
 */

// ROUTE_CLASS: admin-internal
// AUTH: session + superAdmin

import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { AuditQueryParamsSchema, AuditItemSchema } from "@/lib/admin/metrics/types";
import { prisma } from "@/shared/db/prismaClient";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    try {
      // Check admin access
      const adminCheck = await isSuperAdmin();
      if (!adminCheck) {
        return NextResponse.json(
          { error: "Forbidden", message: "Super admin access required" },
          { status: 403 }
        );
      }

      // Parse query params
      const { searchParams } = new URL(request.url);
      const params = AuditQueryParamsSchema.parse({
        ruleId: searchParams.get("ruleId") || undefined,
        source: searchParams.get("source") || undefined,
        status: searchParams.get("status") || undefined,
        actor: searchParams.get("actor") || undefined,
        tenantId: searchParams.get("tenantId") || undefined,
        limit: searchParams.get("limit") || "50",
        offset: searchParams.get("offset") || "0",
      });

      // Build where clause
      const whereClause: {
        tenantId?: string;
        userId?: string;
        auditType?: string;
      } = {};
      if (params.tenantId) {
        whereClause.tenantId = params.tenantId;
      }
      if (params.actor) {
        whereClause.userId = params.actor;
      }
      if (params.source) {
        whereClause.auditType = params.source;
      }

      // Fetch audit logs (using ReconAudit)
      const [audits, total] = await Promise.all([
        prisma.reconAudit.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          take: params.limit,
          skip: params.offset,
          select: {
            id: true,
            tenantId: true,
            userId: true,
            auditType: true,
            action: true,
            entityType: true,
            entityId: true,
            changes: true,
            beforeState: true,
            afterState: true,
            ipAddress: true,
            userAgent: true,
            metadata: true,
            createdAt: true,
          },
        }),
        prisma.reconAudit.count({ where: whereClause }),
      ]);

      // Transform to AuditItem format
      const items = audits.map((audit: (typeof audits)[0]) => {
        return AuditItemSchema.parse({
          id: audit.id,
          tenantId: audit.tenantId,
          userId: audit.userId || null,
          auditType: audit.auditType,
          action: audit.action,
          entityType: audit.entityType || null,
          entityId: audit.entityId || null,
          changes: (audit.changes as Record<string, unknown>) || null,
          beforeState: (audit.beforeState as Record<string, unknown>) || null,
          afterState: (audit.afterState as Record<string, unknown>) || null,
          ipAddress: audit.ipAddress || null,
          userAgent: audit.userAgent || null,
          metadata: (audit.metadata as Record<string, unknown>) || {},
          createdAt: audit.createdAt.toISOString(),
        });
      });

      return NextResponse.json({
        items,
        total,
        limit: params.limit,
        offset: params.offset,
      });
    } catch (error) {
      appLogger.error("[Admin Audit] Error", error);

      if (error instanceof Error && error.name === "ZodError") {
        return NextResponse.json(
          { error: "Invalid request parameters", details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to retrieve audit trail",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  },
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

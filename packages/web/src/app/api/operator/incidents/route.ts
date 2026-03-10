import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/auth-gate";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateSchema = z.object({
  incidentId: z.string().uuid(),
  action: z.enum(["acknowledge", "link_run"]),
  runId: z.string().uuid().optional(),
});

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) return adminCheck.error!;

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") ?? "").trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20") || 20));
    const offset = (page - 1) * pageSize;

    const [countRow] = await prisma.$queryRaw<Array<{ total: number }>>(
      `
      SELECT COUNT(*)::int AS total
      FROM system_incidents si
      WHERE ($1::text = '' OR si.status = $1::text)
      `,
      status
    );

    const incidents = await prisma.$queryRaw<
      Array<{
        id: string;
        incident_type: string;
        severity: string;
        tenant_id: string | null;
        run_id: string | null;
        linked_run_id: string | null;
        status: string;
        summary: string;
        evidence: Record<string, unknown>;
        created_at: string;
        acknowledged_at: string | null;
        acknowledged_by: string | null;
      }>
    >(
      `
      SELECT
        si.id::text,
        si.incident_type,
        si.severity,
        si.tenant_id::text,
        si.run_id::text,
        si.linked_run_id::text,
        si.status,
        si.summary,
        si.evidence,
        si.created_at::text,
        si.acknowledged_at::text,
        si.acknowledged_by
      FROM system_incidents si
      WHERE ($1::text = '' OR si.status = $1::text)
      ORDER BY si.created_at DESC, si.id DESC
      LIMIT $2 OFFSET $3
      `,
      status,
      pageSize,
      offset
    );

    return NextResponse.json({
      data: incidents,
      pagination: {
        page,
        pageSize,
        total: Number(countRow?.total ?? 0),
        totalPages: Math.max(1, Math.ceil(Number(countRow?.total ?? 0) / pageSize)),
      },
    });
  },
  { requireAuth: true }
);

export const PATCH = withSecurity(
  async function PATCH(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) return adminCheck.error!;

    const payload = updateSchema.parse(await request.json());

    if (payload.action === "acknowledge") {
      const [result] = await prisma.$queryRaw<Array<{ id: string }>>(
        `
        UPDATE system_incidents
        SET
          status = 'acknowledged',
          acknowledged_at = NOW(),
          acknowledged_by = $2,
          updated_at = NOW()
        WHERE id = $1::uuid
        RETURNING id::text
        `,
        payload.incidentId,
        adminCheck.user?.email ?? "operator"
      );

      return NextResponse.json({ success: Boolean(result?.id) });
    }

    const [result] = await prisma.$queryRaw<Array<{ id: string }>>(
      `
      UPDATE system_incidents
      SET
        linked_run_id = $2::uuid,
        updated_at = NOW()
      WHERE id = $1::uuid
      RETURNING id::text
      `,
      payload.incidentId,
      payload.runId ?? null
    );

    return NextResponse.json({ success: Boolean(result?.id) });
  },
  { requireAuth: true }
);

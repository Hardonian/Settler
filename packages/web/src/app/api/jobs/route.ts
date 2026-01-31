/**
 * POST /api/jobs
 *
 * Enqueue a new job
 * Requires authentication and tenant membership
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enqueueJob } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";
import { appLogger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";

// Validation schema - simplified for Zod v4 compatibility
const enqueueSchema = z.object({
  tenant_id: z.string(),
  type: z.string(),
  payload: z.record(z.string(), z.unknown()),
  idempotency_key: z.string().optional(),
  max_attempts: z.number(),
  run_at: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const traceId = uuidv4();

  try {
    // Authenticate user
    const client = await createClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          traceId,
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = enqueueSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          traceId,
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { tenant_id, type, payload, idempotency_key, max_attempts, run_at } = validation.data;

    // Verify tenant membership
    const { data: membership } = await client
      .from("memberships")
      .select("role")
      .eq("tenant_id", tenant_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        {
          error: "Forbidden: Not a member of this tenant",
          traceId,
        },
        { status: 403 }
      );
    }

    // Enqueue the job
    const result = await enqueueJob({
      tenantId: tenant_id,
      type,
      payload: payload || {},
      idempotencyKey: idempotency_key,
      maxAttempts: max_attempts || 3,
      runAt: run_at ? new Date(run_at) : undefined,
    });

    if ("error" in result) {
      return NextResponse.json(
        {
          error: result.error,
          traceId: result.traceId || traceId,
          details: result.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        job_id: result.jobId,
        status: "queued",
        traceId,
      },
      { status: 201 }
    );
  } catch (error) {
    appLogger.error("Error in POST /api/jobs", { error, traceId });

    return NextResponse.json(
      {
        error: "Internal server error",
        traceId,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

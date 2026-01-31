/**
 * POST /api/imports/validate
 *
 * Validate import files (CSV, Excel) before processing
 * Requires authentication and tenant membership
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { appLogger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";

// Validation schema
const validateSchema = z.object({
  tenant_id: z.string(),
  file_content_base64: z.string(),
  import_type: z.enum(["csv", "xlsx"]),
  expected_columns: z.array(z.string()).optional(),
  required_columns: z.array(z.string()).optional(),
  column_mapping: z.record(z.string(), z.unknown()).optional(),
  idempotency_key: z.string().optional(),
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
    const validation = validateSchema.safeParse(body);

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

    const {
      tenant_id,
      file_content_base64,
      import_type,
      expected_columns,
      required_columns,
      column_mapping,
      idempotency_key,
    } = validation.data;

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

    // Enqueue validation job
    // @ts-expect-error - Database RPC type definition issue
    const { data: jobId, error } = await client.rpc("enqueue_python_job", {
      p_tenant_id: tenant_id,
      p_workspace_id: null,
      p_job_type: "import.validate",
      p_payload: {
        tenant_id,
        file_content_base64,
        import_type,
        expected_columns: expected_columns || [],
        required_columns: required_columns || [],
        column_mapping: column_mapping || {},
        dry_run: false,
        idempotency_key: idempotency_key || null,
      },
      p_priority: 100,
      p_idempotency_key: idempotency_key || null,
      p_max_attempts: 3,
      p_delay_seconds: 0,
    });

    if (error) {
      appLogger.error("Failed to enqueue validation job", { error, tenant_id });
      return NextResponse.json(
        {
          error: "Failed to queue validation job",
          traceId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        job_id: jobId,
        status: "queued",
        import_type,
        traceId,
      },
      { status: 201 }
    );
  } catch (error) {
    appLogger.error("Error in POST /api/imports/validate", { error, traceId });

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

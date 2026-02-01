/**
 * POST /api/receipts/ocr
 *
 * Process receipt images with OCR
 * Requires authentication and tenant membership
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { appLogger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";

// Validation schema
const ocrSchema = z.object({
  tenant_id: z.string(),
  image_content_base64: z.string(),
  receipt_id: z.string().optional(),
  ocr_engine: z.enum(["tesseract", "mock"]).optional(),
  preprocess: z.boolean().optional(),
  extract_structure: z.boolean().optional(),
  language: z.string().optional(),
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
    const validation = ocrSchema.safeParse(body);

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
      image_content_base64,
      receipt_id,
      ocr_engine,
      preprocess,
      extract_structure,
      language,
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

    // Enqueue OCR job
    // @ts-expect-error - Database RPC type definition issue
    const { data: jobId, error } = await client.rpc("enqueue_python_job", {
      p_tenant_id: tenant_id,
      p_workspace_id: null,
      p_job_type: "receipt.ocr",
      p_payload: {
        tenant_id,
        image_content_base64,
        receipt_id: receipt_id || null,
        ocr_engine: ocr_engine || "tesseract",
        preprocess: preprocess !== false, // default true
        extract_structure: extract_structure !== false, // default true
        language: language || "eng",
        dry_run: false,
        idempotency_key: idempotency_key || null,
      },
      p_priority: 100,
      p_idempotency_key: idempotency_key || null,
      p_max_attempts: 3,
      p_delay_seconds: 0,
    });

    if (error) {
      appLogger.error("Failed to enqueue OCR job", { error, tenant_id, receipt_id });
      return NextResponse.json(
        {
          error: "Failed to queue OCR job",
          traceId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        job_id: jobId,
        status: "queued",
        ocr_engine: ocr_engine || "tesseract",
        traceId,
      },
      { status: 201 }
    );
  } catch (_error) {
    appLogger.error("Error in POST /api/receipts/ocr", { error, traceId });

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

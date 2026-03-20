/**
 * Create Reconciliation Run (Idempotent)
 *
 * POST /api/runs/create
 *
 * Creates a new reconciliation run with idempotency support.
 * If same idempotency_key exists, returns existing run.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateInputManifest } from "@/lib/ingest/manifest";
import { createLogger, generateCorrelationId } from "@/lib/logger";
import { z } from "zod";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { emitLifecycleEventSafe, LifecycleEventType } from "@/lib/ops/lifecycle-events";
import { prisma } from "@/shared/db/prismaClient";
import { withSecurity } from "@/lib/middleware/api-security";
import {
  resolveTenantForMutation,
  resolveTenantMembershipScope,
  TenantMembershipError,
} from "@/lib/supabase/tenant-membership";

const CreateRunSchema = z.object({
  workspace_id: z.string().uuid(),
  idempotency_key: z.string().min(1),
  input_manifest: z.record(z.string(), z.unknown()),
  name: z.string().optional(),
});

export const runtime = "nodejs";

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      const logger = createLogger();
      const correlationId = generateCorrelationId();

      try {
        const body = await request.json();
        const validated = CreateRunSchema.parse(body);
        const { supabase, userId, tenantIds } = await resolveTenantMembershipScope();
        const workspaceId = resolveTenantForMutation(tenantIds, validated.workspace_id);

        // Validate input manifest
        const manifestValidation = validateInputManifest(validated.input_manifest);
        if (!manifestValidation.valid) {
          return NextResponse.json(
            {
              error: "Invalid input manifest",
              details: manifestValidation.errors?.issues,
              correlationId,
            },
            { status: 400 }
          );
        }

        // Check for existing run with same idempotency_key
        const existingResult = await (supabase.from("recon_runs") as any)
          .select("*")
          .eq("workspace_id", workspaceId)
          .eq("idempotency_key", validated.idempotency_key)
          .single();
        const { data: existing } = existingResult as {
          data: { id: string } | null;
          error: { message?: string } | null;
        };

        if (existing) {
          logger.info("Returning existing run (idempotency)", {
            runId: existing.id,
            idempotencyKey: validated.idempotency_key,
          });

          return NextResponse.json({
            run: existing,
            created: false,
            correlationId,
          });
        }

        // Create new run
        const runResult = await (supabase.from("recon_runs") as any)
          .insert({
            workspace_id: workspaceId,
            created_by: userId,
            idempotency_key: validated.idempotency_key,
            input_manifest: validated.input_manifest,
            status: "created",
            name: validated.name || "Reconciliation Run",
          } as Record<string, unknown>)
          .select()
          .single();
        const { data: run, error: createError } = runResult as {
          data: { id: string } | null;
          error: { message?: string } | null;
        };

        if (createError || !run) {
          logger.error("Failed to create run", createError as Error);
          // Return truthful server failure semantics to avoid false-success UX.
          return NextResponse.json(
            {
              error: "Failed to create run",
              message:
                createError?.message || "Unable to create reconciliation run. Please try again.",
              correlationId,
              retryable: true,
            },
            { status: 500 }
          );
        }

        // Create initial event
        await (supabase.from("run_events" as any).insert({
          workspace_id: workspaceId,
          run_id: run.id,
          type: "state_change",
          payload: {
            from: null,
            to: "created",
            correlationId,
          },
          created_by: userId,
        } as any) as any);

        // Enqueue job to process the run
        const { error: jobError } = await (supabase.from("jobs" as any).insert({
          workspace_id: workspaceId,
          type: "run.process",
          payload: {
            run_id: run.id,
            correlation_id: correlationId,
          },
          idempotency_key: `run.process.${run.id}`,
          run_id: run.id,
          status: "queued",
        } as any) as any);

        if (jobError) {
          logger.error("Failed to enqueue job", jobError as Error);
          // Don't fail the request - job can be retried
        }

        // Track usage: Reconciliation run creation
        try {
          const { trackReconciliationTransaction } = await import("@/middleware/usage-tracking");
          // Get billing account from workspace/tenant
          const { data: billingAccount } = (await (supabase
            .from("billing_accounts" as any)
            .select("id, tenant_id, user_id")
            .eq("tenant_id", workspaceId)
            .eq("status", "active")
            .is("deleted_at", null)
            .single() as any)) as {
            data: { id: string; tenant_id: string; user_id: string } | null;
          };

          if (billingAccount?.id) {
            const accountId = billingAccount.id!;
            await trackReconciliationTransaction(
              accountId,
              billingAccount.tenant_id || workspaceId,
              billingAccount.user_id || userId,
              1, // Run creation = 1 usage event
              undefined // Will be set when run processes transactions
            );

            // Emit lifecycle event: first reconciliation run
            try {
              // Check if this is the first reconciliation run for this tenant
              const previousRuns = await prisma.reconciliationRun.count({
                where: {
                  tenantId: workspaceId,
                },
              });

              const isFirstRun = previousRuns === 0;

              if (isFirstRun) {
                const params = {
                  userId,
                  tenantId: workspaceId,
                  billingAccountId: accountId,
                  properties: {
                    run_id: run.id,
                    correlation_id: correlationId,
                  },
                };
                await emitLifecycleEventSafe(
                  LifecycleEventType.RECON_FIRST_RUN as string,
                  params as {
                    userId: string;
                    tenantId: string;
                    billingAccountId?: string;
                    properties: Record<string, unknown>;
                  }
                );
              }
            } catch (eventError) {
              // Don't fail run creation if event emission fails
              logger.warn("Failed to emit reconciliation lifecycle event", { error: eventError });
            }
          }
        } catch (usageError) {
          // Don't fail run creation if usage tracking fails
          logger.warn("Usage tracking failed", { error: usageError });
        }

        logger.info("Created run", {
          runId: run.id,
          workspaceId,
          correlationId,
        });

        return NextResponse.json({
          run,
          created: true,
          correlationId,
        });
      } catch (error) {
        logger.error("Error creating run", error as Error);

        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: "Validation error",
              details: error.issues,
              correlationId,
            },
            { status: 400 }
          );
        }

        if (error instanceof TenantMembershipError) {
          return NextResponse.json(
            {
              error: error.message,
              code: error.code,
              correlationId,
            },
            { status: error.status }
          );
        }

        return NextResponse.json(
          {
            error: "Internal server error",
            message:
              error instanceof Error ? error.message : "Unknown error occurred. Please try again.",
            correlationId,
            retryable: true,
          },
          { status: 500 }
        );
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

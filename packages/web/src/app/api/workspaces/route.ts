/**
 * Workspace API Routes
 *
 * POST /api/workspaces - Create a new workspace
 * GET /api/workspaces - List user's workspaces
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTraceId } from "@/lib/observability/trace";
import { prisma } from "@/shared/db/prismaClient";
import { z } from "zod";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { emitLifecycleEventSafe, LifecycleEventType } from "@/lib/ops/lifecycle-events";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
});

/**
 * POST /api/workspaces - Create a new workspace
 */
export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      const traceId = await getTraceId(request);

      try {
        const supabase = await createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return NextResponse.json({ error: "Unauthorized", trace_id: traceId }, { status: 401 });
        }

        const body = await request.json();
        const validated = createWorkspaceSchema.parse(body);

        // Check if slug is already taken
        const existing = await prisma.tenant.findUnique({
          where: { slug: validated.slug },
        });

        if (existing) {
          return NextResponse.json(
            { error: "Workspace slug already taken", trace_id: traceId },
            { status: 409 }
          );
        }

        // Create workspace using Prisma (fallback to direct insert if function doesn't exist)
        let tenantId: string;
        try {
           
          const { data: result, error } = await (supabase.rpc as any)(
            "create_workspace_with_owner",
            {
              p_name: validated.name,
              p_slug: validated.slug,
              p_user_id: user.id,
            }
          );

          if (error) {
            // Fallback: create manually
            const tenant = await prisma.tenant.create({
              data: {
                name: validated.name,
                slug: validated.slug,
                isActive: true,
              },
            });
            tenantId = tenant.id;

            // Add user as owner
             
            await (supabase.from("tenant_users") as any).insert({
              tenant_id: tenantId,
              user_id: user.id,
              role: "owner",
              joined_at: new Date().toISOString(),
            });

            // Initialize onboarding progress
             
            await (supabase.from("tenant_onboarding_progress") as any).insert({
              tenant_id: tenantId,
              user_id: user.id,
              current_step: "create_workspace",
              completed_steps: [],
              skipped_steps: [],
              progress: 0,
            });
          } else {
            tenantId = result as string;
          }
        } catch (_error) {
          appLogger.error("[Workspace API] Error creating workspace", error);
          // Never return 500 - return graceful error response
          return NextResponse.json(
            {
              success: false,
              error: "Failed to create workspace",
              message: "Please try again later or contact support if the issue persists",
              trace_id: traceId,
            },
            { status: 200 }
          );
        }

        // Track onboarding event (with fallback)
        try {
           
          await (supabase.rpc as any)("track_onboarding_event", {
            p_tenant_id: tenantId,
            p_user_id: user.id,
            p_event_type: "onboarding_started",
            p_step_id: "create_workspace",
            p_trace_id: traceId,
            p_properties: JSON.stringify({
              workspace_name: validated.name,
              workspace_slug: validated.slug,
            }),
          });
        } catch {
          // Fallback: insert directly
           
          await (supabase.from("onboarding_events") as any).insert({
            tenant_id: tenantId,
            user_id: user.id,
            event_type: "onboarding_started",
            step_id: "create_workspace",
            trace_id: traceId,
            properties: { workspace_name: validated.name, workspace_slug: validated.slug },
          });
        }

        // Complete the create_workspace step (with fallback)
        try {
           
          await (supabase.rpc as any)("complete_onboarding_step", {
            p_tenant_id: tenantId,
            p_user_id: user.id,
            p_step_id: "create_workspace",
            p_trace_id: traceId,
          });
        } catch {
          // Fallback: update directly
           
          await (supabase.from("tenant_onboarding_progress") as any).upsert(
            {
              tenant_id: tenantId,
              user_id: user.id,
              current_step: "add_teammates",
              completed_steps: ["create_workspace"],
              skipped_steps: [],
              progress: 20,
            },
            {
              onConflict: "tenant_id,user_id",
            }
          );
        }

        const workspace = await prisma.tenant.findUnique({
          where: { id: tenantId },
          include: {
            billingAccount: true,
          },
        });

        // Emit lifecycle events
        if (workspace) {
          // Tenant created
          await emitLifecycleEventSafe(LifecycleEventType.TENANT_CREATED as string, {
            userId: user.id,
            tenantId: workspace.id,
            billingAccountId: workspace.billingAccountId || undefined,
            properties: {
              workspace_name: validated.name,
              workspace_slug: validated.slug,
            },
          });
        }

        return NextResponse.json({
          workspace: {
            id: workspace?.id,
            name: workspace?.name,
            slug: workspace?.slug,
          },
          trace_id: traceId,
        });
      } catch (_error) {
        appLogger.error("[Workspace API] Error", error);

        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: "Invalid request", details: error.issues, trace_id: traceId },
            { status: 400 }
          );
        }

        // Never return 500 - return graceful error response
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create workspace",
            message: "Please try again later or contact support if the issue persists",
            trace_id: traceId,
          },
          { status: 200 }
        );
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

/**
 * GET /api/workspaces - List user's workspaces
 */
export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(request: NextRequest) {
      const traceId = await getTraceId(request);

      try {
        const supabase = await createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return NextResponse.json({ error: "Unauthorized", trace_id: traceId }, { status: 401 });
        }

        // Get user's tenant memberships
         
        const { data: memberships, error } = await (supabase.from("tenant_users") as any)
          .select("tenant_id, role")
          .eq("user_id", user.id);

        if (error) {
          appLogger.error("[Workspace API] Error fetching memberships", error);
          // Never return 500 - return empty workspaces array with graceful error message
          return NextResponse.json(
            {
              workspaces: [],
              error: "Failed to fetch workspaces",
              message: "Please try again later or contact support if the issue persists",
              trace_id: traceId,
            },
            { status: 200 }
          );
        }

        if (!memberships || memberships.length === 0) {
          return NextResponse.json({
            workspaces: [],
            trace_id: traceId,
          });
        }

        const tenantIds = (memberships as Array<{ tenant_id: string; role: string }>).map(
          (m) => m.tenant_id
        );
        const workspaces = await prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        });

        // Map workspaces with user's role
        const workspacesWithRole = workspaces.map((ws: (typeof workspaces)[0]) => {
          const membership = (memberships as Array<{ tenant_id: string; role: string }>).find(
            (m) => m.tenant_id === ws.id
          );
          return {
            ...ws,
            role: membership?.role || "viewer",
          };
        });

        return NextResponse.json({
          workspaces: workspacesWithRole,
          trace_id: traceId,
        });
      } catch (_error) {
        appLogger.error("[Workspace API] Error", error);
        // Never return 500 - return empty workspaces array with graceful error message
        return NextResponse.json(
          {
            workspaces: [],
            error: "Failed to fetch workspaces",
            message: "Please try again later or contact support if the issue persists",
            trace_id: traceId,
          },
          { status: 200 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

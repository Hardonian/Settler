import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Supabase

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      try {
        const contentLengthHeader = request.headers.get("content-length");
        const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : 0;
        if (Number.isFinite(contentLength) && contentLength > 1_024 * 1_024) {
          return NextResponse.json(
            {
              error: "Payload too large",
              message: "Import payload must be <= 1MB",
            },
            { status: 413 }
          );
        }

        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { jobs, integrations } = body;

        const jobsToImport = Array.isArray(jobs)
          ? jobs.slice(0, 500).map((job) => {
              const jobData = { ...(job as Record<string, unknown>) };
              delete jobData.id;
              return {
                ...jobData,
                user_id: user.id,
              };
            })
          : [];

        const integrationsToImport = Array.isArray(integrations)
          ? integrations.slice(0, 500).map((integration) => {
              const integrationTyped = integration as {
                integration_id?: string;
                is_connected?: boolean;
              };
              return {
                user_id: user.id,
                integration_id: integrationTyped.integration_id,
                is_connected: integrationTyped.is_connected,
              };
            })
          : [];

        if (jobsToImport.length > 0) {
          const { error } = await (supabase.from("reconciliation_jobs") as any).upsert(jobsToImport);
          if (error) {
            return NextResponse.json(
              {
                error: "Failed to import jobs",
                details: error.message,
              },
              { status: 500 }
            );
          }
        }

        if (integrationsToImport.length > 0) {
          const { error } = await (supabase.from("integration_credentials") as any).upsert(
            integrationsToImport
          );
          if (error) {
            return NextResponse.json(
              {
                error: "Failed to import integrations",
                details: error.message,
              },
              { status: 500 }
            );
          }
        }

        return NextResponse.json({ success: true }, { status: 200 });
      } catch (error) {
        appLogger.error("Error in import POST", error);
        return NextResponse.json(
          {
            success: false,
            error: "An error occurred",
            message: "Please try again later or contact support if the issue persists",
          },
          { status: 500 }
        );
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60_000, maxRequests: 10 }, requireAuth: true }
);

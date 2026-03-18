/**
 * List Reconciliation Runs
 *
 * GET /api/runs
 *
 * Returns a list of reconciliation runs with their latest execution results.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { withSecurity } from "@/lib/middleware/api-security";

export const runtime = "nodejs";

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(_request: NextRequest, _params: unknown) {
      const logger = createLogger({});

      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Get user's workspaces
        const { data: memberships, error: membershipsError } = await supabase
          .from("workspace_members")
          .select("workspace_id, workspaces(id, name)")
          .eq("user_id", user.id);

        if (membershipsError || !memberships || memberships.length === 0) {
          return NextResponse.json({ error: "No workspace access" }, { status: 403 });
        }

        const workspaceIds = (memberships as any[]).map((m) => m.workspace_id);

        // Get runs with their latest result
        // First get the latest result for each run
        const { data: latestResults, error: resultsError } = await supabase
          .from("recon_results" as any)
          .select(
            "id, recon_job_id, status, started_at, completed_at, source_count, target_count, matched_count, unmatched_source_count, unmatched_target_count, conflict_count"
          )
          .in("workspace_id", workspaceIds)
          .order("started_at", { ascending: false });

        if (resultsError) {
          logger.error("Error fetching results", resultsError);
          return NextResponse.json({ error: "Failed to fetch run results" }, { status: 500 });
        }

        // Get runs
        const { data: runs, error: runsError } = await supabase
          .from("recon_jobs" as any)
          .select("id, name, status, created_at, updated_at")
          .in("workspace_id", workspaceIds)
          .order("created_at", { ascending: false })
          .limit(100);

        if (runsError) {
          logger.error("Error fetching runs", runsError);
          return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
        }

        // Map runs with their latest result
        const runsWithResults = (runs || []).map(
          (run: {
            id: string;
            name: string;
            status: string;
            created_at: string;
            updated_at: string;
          }) => {
            const latestResult = ((latestResults as any[]) || []).find(
              (r: { recon_job_id: string }) => r.recon_job_id === run.id
            );

            return {
              id: run.id,
              name: run.name,
              status: latestResult?.status || run.status || "unknown",
              startedAt: latestResult?.started_at || run.created_at,
              completedAt: latestResult?.completed_at || null,
              summary: {
                total: (latestResult?.source_count || 0) + (latestResult?.target_count || 0),
                matched: latestResult?.matched_count || 0,
                unmatched:
                  (latestResult?.unmatched_source_count || 0) +
                  (latestResult?.unmatched_target_count || 0),
                conflicts: latestResult?.conflict_count || 0,
              },
            };
          }
        );

        return NextResponse.json(runsWithResults);
      } catch (error) {
        logger.error("Error fetching runs", error as Error);
        // Never return 500 - return actionable error message
        return NextResponse.json(
          {
            error: "Internal server error",
            message:
              error instanceof Error ? error.message : "Unknown error occurred. Please try again.",
            retryable: true,
          },
          { status: 200 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

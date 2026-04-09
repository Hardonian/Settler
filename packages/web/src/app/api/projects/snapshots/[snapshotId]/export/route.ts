import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Supabase

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(_request: NextRequest, { params }: { params: { snapshotId: string } }) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { snapshotId } = params;

        // Get snapshot
        const { data: snapshot, error: snapshotError } = await supabase
          .from("project_snapshots")
          .select("*")
          .eq("id", snapshotId)
          .eq("user_id", user.id)
          .single();

        if (snapshotError || !snapshot) {
          return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
        }

        // Return as JSON file
        const snapshotData = snapshot as {
          id: string;
          project_id: string;
          project_type: string;
          snapshot_name: string;
          created_at: string;
          snapshot_data: Record<string, unknown>;
        };
        const exportData = {
          snapshotId: snapshotData.id,
          projectId: snapshotData.project_id,
          projectType: snapshotData.project_type,
          snapshotName: snapshotData.snapshot_name,
          createdAt: snapshotData.created_at,
          data: snapshotData.snapshot_data,
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="snapshot-${snapshotId}.json"`,
          },
        });
      } catch (error) {
        appLogger.error("Error in export", error);
        return NextResponse.json(
          {
            success: false,
            error: "An error occurred",
            message: "Please try again later or contact support if the issue persists",
          },
          { status: 200 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

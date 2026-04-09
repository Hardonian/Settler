import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Supabase

export const GET = withSecurity(
  withUniversalBillingGate(
    async function GET(_request: NextRequest) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Mock projects (in production, fetch from projects table)
        const projects = [
          {
            id: "proj-1",
            name: "E-commerce Reconciliation",
            description: "Main reconciliation project for online store",
            memberCount: 5,
            createdAt: "2026-01-01T00:00:00Z",
          },
          {
            id: "proj-2",
            name: "Payment Processing",
            description: "Payment reconciliation across platforms",
            memberCount: 3,
            createdAt: "2026-01-10T00:00:00Z",
          },
        ];

        return NextResponse.json({ projects });
      } catch (error) {
        appLogger.error("Error in projects GET", error);
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

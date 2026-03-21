import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import { prisma } from "@/shared/db/prismaClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

        // Query real experiments from the database
        const experiments = await prisma.experiment
          .findMany({
            where: { status: "active" },
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
              trafficPercentage: true,
            },
            take: 20,
            orderBy: { createdAt: "desc" },
          })
          .catch(() => []);

        return NextResponse.json({
          experiments,
          dataSource: "live",
        });
      } catch (error) {
        appLogger.error("Error in experiments GET", error);
        return NextResponse.json(
          {
            experiments: [],
            error: "Failed to retrieve experiments",
          },
          { status: 503 }
        );
      }
    },
    { feature: "GET API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

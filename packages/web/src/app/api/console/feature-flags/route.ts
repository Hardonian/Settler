import { NextRequest, NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/security/billing-enforcement";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";

export const GET = withSecurity(
  async function GET(request: NextRequest) {
    const subscriptionCheck = await requireActiveSubscription(request);
    if (!subscriptionCheck.allowed) {
      return (
        subscriptionCheck.error ||
        NextResponse.json(
          {
            error: "Subscription Required",
            message: "This feature requires an active subscription",
          },
          { status: 403 }
        )
      );
    }
    return NextResponse.json({ message: "Feature temporarily unavailable" }, { status: 503 });
  },
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

export const POST = withSecurity(
  async function POST(request: NextRequest) {
    const subscriptionCheck = await requireActiveSubscription(request);
    if (!subscriptionCheck.allowed) {
      return (
        subscriptionCheck.error ||
        NextResponse.json(
          {
            error: "Subscription Required",
            message: "This feature requires an active subscription",
          },
          { status: 403 }
        )
      );
    }
    return NextResponse.json({ message: "Feature temporarily unavailable" }, { status: 503 });
  },
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

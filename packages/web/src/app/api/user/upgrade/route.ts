/**
 * API Route: Upgrade User Plan
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPaidWelcomeEmail, LifecycleUser } from "@settler/api/lib/email-lifecycle";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";
import { mapLegacyPlanId, PlanCode } from "@/domain/billing/planConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Supabase

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: NextRequest) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { planType: rawPlanType, planCode: rawPlanCode } = await request.json();
        const planType = rawPlanType as string | undefined;
        const planCode = rawPlanCode as PlanCode | undefined;

        const canonicalPlan = planCode ?? (planType ? mapLegacyPlanId(planType) : null);
        const normalizedProfilePlan =
          canonicalPlan === "starter"
            ? "free"
            : canonicalPlan === "pro"
              ? "commercial"
              : canonicalPlan === "scale"
                ? "enterprise"
                : canonicalPlan;

        if (
          !normalizedProfilePlan ||
          !["commercial", "enterprise", "free"].includes(normalizedProfilePlan)
        ) {
          return NextResponse.json({ error: "Invalid plan type or plan code" }, { status: 400 });
        }

        // Update user plan

        const { error: updateError } = (await (supabase.from("profiles") as any)
          .update({
            plan_type: normalizedProfilePlan,
            subscription_start_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)) as { error: { message?: string } | null };

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        // Get updated profile

        const { data: profile } = (await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()) as {
          data: {
            email?: string;
            name?: string;
            industry?: string;
            company_name?: string;
          } | null;
          error: { message?: string } | null;
        };

        // Send paid welcome email
        if (profile) {
          try {
            const lifecycleUser: LifecycleUser = {
              email: profile.email || "",
              firstName: profile.name?.split(" ")[0],
              industry: profile.industry,
              companyName: profile.company_name,
              planType: normalizedProfilePlan as
                | "free"
                | "enterprise"
                | "trial"
                | "commercial"
                | undefined,
            };

            await sendPaidWelcomeEmail(lifecycleUser);
          } catch (emailError) {
            appLogger.error("Failed to send paid welcome email", emailError);
            // Don't fail upgrade if email fails
          }
        }

        return NextResponse.json({
          success: true,
          planType: normalizedProfilePlan,
          planCode: canonicalPlan,
        });
      } catch (error) {
        appLogger.error("Upgrade error", error);
        // Never return 500 - return graceful error response
        return NextResponse.json(
          {
            success: false,
            error: "Unable to process upgrade at this time",
            message: "Please try again later or contact support",
          },
          { status: 200 }
        );
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 10 }, requireAuth: true }
);

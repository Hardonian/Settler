/**
 * API Route: Upgrade User Plan
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPaidWelcomeEmail, LifecycleUser } from "@settler/api/lib/email-lifecycle";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { planType } = await request.json();

    if (!["commercial", "enterprise"].includes(planType)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // Update user plan
    const { error: updateError } = (await (supabase.from("profiles") as any)
      .update({
        plan_type: planType,
        subscription_start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)) as { error: any };

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Get updated profile
    const { data: profile } = (await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()) as { data: any; error: any };

    // Send paid welcome email
    if (profile) {
      try {
        const lifecycleUser: LifecycleUser = {
          email: profile.email,
          firstName: profile.name?.split(" ")[0],
          industry: profile.industry,
          companyName: profile.company_name,
          planType,
        };

        await sendPaidWelcomeEmail(lifecycleUser);
      } catch (emailError) {
        console.error("Failed to send paid welcome email:", emailError);
        // Don't fail upgrade if email fails
      }
    }

    return NextResponse.json({ success: true, planType });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

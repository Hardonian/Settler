import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { milestoneType, metadata } = body;

    // Check if milestone already exists
    const { data: existing } = await supabase
      .from("user_milestones")
      .select("id")
      .eq("user_id", user.id)
      .eq("milestone_type", milestoneType)
      .single();

    if (existing) {
      return NextResponse.json({ achieved: true, message: "Milestone already achieved" });
    }

    // Create milestone
    const { data, error } = await supabase
      .from("user_milestones")
      .insert({
        user_id: user.id,
        milestone_type: milestoneType,
        milestone_data: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating milestone:", error);
      return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
    }

    // Update user lifecycle if this is an activation milestone
    if (milestoneType === "first_successful_run") {
      await supabase
        .from("user_lifecycle")
        .upsert({
          user_id: user.id,
          first_successful_setup_at: new Date().toISOString(),
          current_stage: "activation",
          updated_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({ achieved: true, milestone: data });
  } catch (error) {
    console.error("Error in milestones POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const milestoneType = searchParams.get("type");

    let query = supabase.from("user_milestones").select("milestone_type").eq("user_id", user.id);

    if (milestoneType) {
      query = query.eq("milestone_type", milestoneType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching milestones:", error);
      return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
    }

    if (milestoneType) {
      return NextResponse.json({ achieved: (data?.length || 0) > 0 });
    }

    const milestones = (data || []).map((m) => m.milestone_type);
    return NextResponse.json({ milestones });
  } catch (error) {
    console.error("Error in milestones GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

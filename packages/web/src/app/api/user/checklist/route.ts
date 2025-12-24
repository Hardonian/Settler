import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

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
    const userId = searchParams.get("userId") || user.id;

    const { data, error } = await supabase
      .from("user_checklist")
      .select("checklist_item, completed")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching checklist:", error);
      // Never return 500 - return empty checklist with graceful error message
      return NextResponse.json({ 
        completedItems: [],
        error: "Unable to fetch checklist at this time",
        message: "Please try again later"
      }, { status: 200 });
    }

    type ChecklistItemRow = {
      checklist_item: string;
      completed: boolean;
    };
    
    const completedItems = (data || [])
      .filter((item: ChecklistItemRow) => item.completed)
      .map((item: ChecklistItemRow) => item.checklist_item);

    return NextResponse.json({ completedItems });
  } catch (error) {
    console.error("Error in checklist GET:", error);
    // Never return 500 - return empty checklist with graceful error message
    return NextResponse.json({ 
      completedItems: [],
      error: "Unable to fetch checklist at this time",
      message: "Please try again later"
    }, { status: 200 });
  }
}

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
    const { userId, itemId } = body;
    const targetUserId = userId || user.id;

    const { data, error } = await supabase
      .from("user_checklist")
      .upsert({
        user_id: targetUserId,
        checklist_item: itemId,
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Error updating checklist:", error);
      // Never return 500 - return graceful error response
      return NextResponse.json({ 
        success: false,
        error: "Unable to update checklist at this time",
        message: "Please try again later"
      }, { status: 200 });
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error("Error in checklist POST:", error);
    // Never return 500 - return graceful error response
    return NextResponse.json({ 
      success: false,
      error: "Unable to update checklist at this time",
      message: "Please try again later"
    }, { status: 200 });
  }
}

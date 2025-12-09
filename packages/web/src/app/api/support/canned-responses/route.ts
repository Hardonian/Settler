import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check admin/support access
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("canned_responses")
      .select("*")
      .order("usage_count", { ascending: false });

    if (error) {
      console.error("Error fetching canned responses:", error);
      return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 });
    }

    type CannedResponseRow = {
      id: string;
      title: string;
      content: string;
      category: string;
      tags?: string[];
      usage_count?: number;
    };
    
    return NextResponse.json({
      responses: (data || []).map((r: CannedResponseRow) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        category: r.category,
        tags: r.tags || [],
        usageCount: r.usage_count || 0,
      })),
    });
  } catch (error) {
    console.error("Error in canned-responses GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check admin access
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category, tags } = body;

    const { data, error } = await supabase
      .from("canned_responses")
      .insert({
        title,
        content,
        category,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating canned response:", error);
      return NextResponse.json({ error: "Failed to create response" }, { status: 500 });
    }

    return NextResponse.json({ response: data });
  } catch (error) {
    console.error("Error in canned-responses POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

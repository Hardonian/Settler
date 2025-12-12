/**
 * API Route: Save Pre-Test Questionnaire Answers
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase
import { savePreTestAnswers } from "@/lib/data/user-dashboard";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const answers = await request.json();

    const result = await savePreTestAnswers(answers);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pre-test save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

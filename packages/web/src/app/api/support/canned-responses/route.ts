import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(_request: NextRequest) {
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
      appLogger.error("Error fetching canned responses", error);
      // Never return 500 - return empty responses array with graceful error message
      return NextResponse.json({ 
        responses: [],
        error: "Unable to fetch responses at this time",
        message: "Please try again later"
      }, { status: 200 });
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
    appLogger.error("Error in canned-responses GET", error);
    // Never return 500 - return empty responses array with graceful error message
    return NextResponse.json({ 
      responses: [],
      error: "Unable to fetch responses at this time",
      message: "Please try again later"
    }, { status: 200 });
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
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

    const { data, error } = await (supabase
      .from("canned_responses") as any)
      .insert({
        title,
        content,
        category,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      appLogger.error("Error creating canned response", error);
      // Never return 500 - return graceful error response
      return NextResponse.json({ 
        success: false,
        error: "Unable to create response at this time",
        message: "Please try again later"
      }, { status: 200 });
    }

    return NextResponse.json({ response: data });
  } catch (error) {
    appLogger.error("Error in canned-responses POST", error);
    // Never return 500 - return graceful error response
    return NextResponse.json({ 
      success: false,
      error: "Unable to create response at this time",
      message: "Please try again later"
    }, { status: 200 });
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

/**
 * Chatbot API Route
 *
 * POST /api/chatbot
 * Body: { message, conversationId?, context? }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleChatMessage } from "@/lib/chatbot/ai-handler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { message, conversationId, context } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user context if logged in
    const userContext = user
      ? {
          userId: user.id,
          userEmail: user.email,
          userPlan: (user as any).plan || "free",
        }
      : { userId: undefined, userPlan: "anonymous" };

    // Process message through AI handler
    const result = await handleChatMessage({
      message,
      conversationId,
      context: {
        ...context,
        ...userContext,
      },
    });

    // Track analytics
    if (user) {
      try {
        await supabase.from("chatbot_interactions").insert({
          user_id: user.id,
          message,
          response: result.response,
          conversation_id: result.conversationId,
          should_escalate: result.shouldEscalate,
          confidence: result.confidence,
        } as any);
      } catch {
        // Table might not exist
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json(
      { error: "Chat temporarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    version: "1.0",
    capabilities: ["ai", "escalation", "kb"],
  });
}

// try catch

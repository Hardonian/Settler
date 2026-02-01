import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseRequestBody } from "@/types/api";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

interface OnboardingRequestBody extends Record<string, unknown> {
  message: string;
}

interface UserLifecycleRow {
  activated_at: string | null;
  [key: string]: unknown;
}

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseRequestBody<OnboardingRequestBody>(request);
    const { message } = body;

    // Get user context
    const { data: lifecycle } = await supabase
      .from("user_lifecycle")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Simple AI response logic (in production, use actual AI/LLM)
    const lowerMessage = typeof message === "string" ? message.toLowerCase() : "";

    let response = "";

    if (
      lowerMessage.includes("first") ||
      lowerMessage.includes("start") ||
      lowerMessage.includes("begin")
    ) {
      response =
        "Great! Let's get you started. First, you'll want to connect an integration. I recommend starting with Stripe or Shopify. Would you like me to guide you through connecting your first integration?";
    } else if (lowerMessage.includes("integration") || lowerMessage.includes("connect")) {
      response =
        "To connect an integration, go to the Integrations page and click 'Connect' on the integration you want to use. You'll need your API keys from that platform. I can help you find where to get those if you'd like!";
    } else if (lowerMessage.includes("job") || lowerMessage.includes("reconciliation")) {
      response =
        "A reconciliation job matches transactions between two platforms. For example, you might match Shopify orders with Stripe payments. Would you like me to walk you through creating your first job?";
    } else if (lowerMessage.includes("help") || lowerMessage.includes("stuck")) {
      response =
        "I'm here to help! What specifically are you trying to do? I can help with: setting up integrations, creating reconciliation jobs, understanding matching rules, or troubleshooting issues.";
    } else if (lowerMessage.includes("pricing") || lowerMessage.includes("cost")) {
      response =
        "Settler offers a 14-day free trial with full access—no credit card required. Paid plans start at $99/month (Starter) for 10,000 reconciliations/month, and $299/month (Growth) for 100,000/month. Enterprise plans offer unlimited volume with custom pricing. Would you like to know more about our pricing?";
    } else {
      response =
        "I understand you're asking about that. Let me help you with that. Could you provide a bit more detail about what you're trying to accomplish? I can help with onboarding, integrations, reconciliation jobs, or any other questions about Settler.";
    }

    // Add contextual suggestions based on user state
    const lifecycleData = lifecycle as UserLifecycleRow | null;
    if (lifecycleData && lifecycleData.activated_at === null) {
      response +=
        " I notice you haven't completed your first reconciliation yet. Would you like me to guide you through that?";
    }

    return NextResponse.json({ response });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
    appLogger.error("Error in onboarding-assistant POST", error);
    // Never return 500 - return graceful error response
    return NextResponse.json({ 
      response: "I'm having trouble processing your question right now. Please try again in a moment or check our documentation for help.",
      error: "Unable to process request",
      message: "Please try again later"
    }, { status: 200 });
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

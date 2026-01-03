/**
 * AI Support Assistant API Route
 * Provides contextual help and explanations based on user's current context
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

interface SupportRequest {
  question: string;
  context?: {
    page?: string;
    action?: string;
    data?: Record<string, unknown>;
  };
  userId?: string;
}

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body: SupportRequest = await request.json();
    const { question, context } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Get user's onboarding progress and usage for context
    let userContext = {};
    if (user) {
      const [progressResult, usageResult] = await Promise.all([
        supabase
          .from("onboarding_progress")
          .select("step, completed")
          .eq("user_id", user.id),
        supabase
          .from("usage_events")
          .select("event_type, quantity")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      userContext = {
        onboarding_progress: progressResult.data || [],
        recent_usage: usageResult.data || [],
      };
    }

    // Generate AI response using context
    const aiResponse = await generateSupportResponse(
      question,
      context,
      userContext,
      user?.id
    );

    // Log support request for analytics
    if (user) {
      try {
        await supabase.from("support_requests").insert({
          user_id: user.id,
          question,
          context: context || {},
          ai_response: aiResponse.answer,
          helpful: null, // User can rate later
        } as never);
      } catch {
        // Table might not exist, that's okay
      }
    }

    return NextResponse.json({
      answer: aiResponse.answer,
      suggestions: aiResponse.suggestions,
      related_docs: aiResponse.relatedDocs,
    });
  } catch (error) {
    appLogger.error("AI support assistant error", error);
    // Never return 500 - return graceful error response
    return NextResponse.json(
      { 
        answer: "I'm having trouble processing your question right now. Please try again in a moment or contact support for immediate assistance.",
        suggestions: ["Try rephrasing your question", "Contact support", "Browse documentation"],
        related_docs: ["/docs", "/support"]
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: false }
);

async function generateSupportResponse(
  question: string,
  context?: SupportRequest["context"],
  _userContext?: Record<string, unknown>,
  _userId?: string
): Promise<{
  answer: string;
  suggestions: string[];
  relatedDocs: string[];
}> {
  // Simple rule-based AI (can be replaced with actual LLM API)
  const lowerQuestion = question.toLowerCase();

  // Context-aware responses
  if (context?.page === "/console/usage" && lowerQuestion.includes("limit")) {
    return {
      answer: `Your usage limits depend on your plan. Starter ($99/mo) includes 10,000 reconciliations/month, while Growth ($299/mo) includes 100,000/month. Enterprise plans offer unlimited volume. You can check your current usage and limits in the Usage dashboard. If you're approaching your limit, we'll show a warning banner.`,
      suggestions: [
        "View your current usage",
        "Upgrade to increase limits",
        "Check your plan details",
      ],
      relatedDocs: ["/docs/billing", "/docs/usage"],
    };
  }

  if (context?.page === "/console/playground" && lowerQuestion.includes("reconcile")) {
    return {
      answer: `To run a reconciliation, you'll need to configure a source (like Stripe) and target (like your database). The playground lets you test reconciliations without affecting production data. Start by creating a new reconciliation job and selecting your adapters.`,
      suggestions: [
        "Create a reconciliation job",
        "View reconciliation examples",
        "Check adapter documentation",
      ],
      relatedDocs: ["/docs/getting-started", "/docs/cookbooks"],
    };
  }

  if (lowerQuestion.includes("api key") || lowerQuestion.includes("authentication")) {
    return {
      answer: `API keys authenticate your requests to Settler's API. Create one in the Console under API Keys. Use the key in the Authorization header: "Authorization: Bearer sk_live_...". Keep your keys secure and rotate them regularly.`,
      suggestions: [
        "Create a new API key",
        "View existing API keys",
        "Learn about API authentication",
      ],
      relatedDocs: ["/docs/api", "/docs/authentication"],
    };
  }

  if (lowerQuestion.includes("trial") || lowerQuestion.includes("free")) {
    return {
      answer: `Your trial includes full access to all features for 14 days—no credit card required. After the trial, you can continue on the free plan (1,000 reconciliations/month) or upgrade to Commercial ($99/mo) for 100,000/month.`,
      suggestions: [
        "View pricing plans",
        "Check trial status",
        "Upgrade to Commercial",
      ],
      relatedDocs: ["/pricing", "/docs/billing"],
    };
  }

  if (lowerQuestion.includes("error") || lowerQuestion.includes("problem")) {
    return {
      answer: `I can help troubleshoot. Common issues include API authentication errors, rate limiting, or configuration problems. Check the error message details and our troubleshooting guide. If the issue persists, reply to this conversation and we'll help.`,
      suggestions: [
        "View error logs",
        "Check API status",
        "Contact support",
      ],
      relatedDocs: ["/docs/troubleshooting", "/support"],
    };
  }

  // Default response
  return {
    answer: `I'm here to help! Based on your question about "${question}", here are some resources that might help. If you need more specific assistance, feel free to ask a follow-up question or check our documentation.`,
    suggestions: [
      "Browse documentation",
      "View examples",
      "Contact support",
    ],
    relatedDocs: ["/docs", "/docs/getting-started"],
  };
}

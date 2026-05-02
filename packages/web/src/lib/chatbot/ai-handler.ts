/**
 * AI Chatbot Integration for Settler.dev
 *
 * This module connects the chatbot to:
 * - Support knowledge base (KB)
 * - Real AI (OpenAI/Anthropic) for natural responses
 * - Escalation flow for complex issues
 * - Conversation history for context
 *
 * Usage:
 * - Already integrated in Chatbot.tsx via /api/ai/support-assistant
 * - Add OPENAI_API_KEY or ANTHROPIC_API_KEY to enable AI responses
 */

import { createClient } from "@/lib/supabase/server";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    page?: string;
    userPlan?: string;
    userId?: string;
  };
}

interface ChatResponse {
  response: string;
  conversationId: string;
  shouldEscalate?: boolean;
  suggestions?: string[];
  confidence?: number;
}

/**
 * Main chatbot handler - processes messages through AI
 */
export async function handleChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const { message, conversationId, context } = request;

  // Get or create conversation
  const convId = conversationId || `conv_${Date.now()}`;

  // Get conversation history
  const history = await getConversationHistory(convId);

  // Build prompt with context
  const systemPrompt = buildSystemPrompt(context);
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message },
  ];

  // Check if should use AI or rule-based
  const useAI = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

  let response: string;
  let confidence = 0.5;

  if (useAI) {
    // Use real AI
    const aiResult = await callAI(messages);
    response = aiResult.response;
    confidence = aiResult.confidence;
  } else {
    // Fallback to rule-based
    const ruleResult = generateRuleBasedResponse(message, context);
    response = ruleResult.response;
    confidence = ruleResult.confidence;
  }

  // Check if should escalate
  const shouldEscalate = shouldEscalateToHuman(message, response, confidence);

  // Save conversation
  await saveMessage(convId, "user", message);
  await saveMessage(convId, "assistant", response);

  // Generate suggestions
  const suggestions = generateSuggestions(message, response);

  return {
    response,
    conversationId: convId,
    shouldEscalate,
    suggestions,
    confidence,
  };
}

/**
 * Build system prompt with KB context
 */
function buildSystemPrompt(context?: ChatRequest["context"]): string {
  const kbContext = `
You are Settler's AI Support Assistant. You're helpful, knowledgeable, and concise.

CONTEXT:
- User plan: ${context?.userPlan || "unknown"}
- Current page: ${context?.page || "unknown"}
- You help with: reconciliation, billing, API, troubleshooting

RESPONSE GUIDELINES:
1. Be concise - 2-3 sentences maximum for simple questions
2. Include links to docs when relevant
3. Suggest next steps
4. If unsure, suggest escalation

TOPICS YOU KNOW:
- Getting started with Settler
- Reconciliation concepts (match, transform, validate)
- API keys and authentication  
- Billing and plans
- Troubleshooting common errors
- Integration setup (Stripe, Xero, Amazon, etc.)

ESCALATE TO HUMAN when:
- User asks about pricing negotiation
- User reports security issue
- User needs help with enterprise features
- User is frustrated or asking for refund
- You cannot find the answer
`;
  return kbContext;
}

/**
 * Call AI API (OpenAI or Anthropic)
 */
async function callAI(messages: ChatMessage[]): Promise<{ response: string; confidence: number }> {
  // Try OpenAI first
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        return { response: data.choices[0].message.content, confidence: 0.9 };
      }
    } catch (e) {
      console.error("OpenAI error:", e);
    }
  }

  // Try Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          messages: messages
            .filter((m) => m.role !== "system")
            .map((m) => ({ role: m.role, content: m.content })),
          max_tokens: 500,
        }),
      });

      const data = await res.json();
      if (data.content?.[0]?.text) {
        return { response: data.content[0].text, confidence: 0.9 };
      }
    } catch (e) {
      console.error("Anthropic error:", e);
    }
  }

  return { response: "I'm having trouble connecting to AI. Please try again.", confidence: 0.1 };
}

/**
 * Rule-based response generator (fallback)
 */
function generateRuleBasedResponse(
  message: string,
  _context?: ChatRequest["context"]
): { response: string; confidence: number } {
  const lower = message.toLowerCase();

  // Common patterns
  const patterns: Array<{ regex: RegExp; response: string; confidence: number }> = [
    {
      regex: /api\s*key|authentication|auth/,
      response: "API keys are in Console → API Keys. Use in Authorization header.",
      confidence: 0.9,
    },
    {
      regex: /billing|pay|price|pricing|plan/,
      response: "Check /pricing for plans. Starter $99/mo, Growth $299/mo.",
      confidence: 0.8,
    },
    {
      regex: /reconcil|transform|match/,
      response: "Reconciliation has 3 steps: Load → Transform → Match. Check /docs.",
      confidence: 0.8,
    },
    {
      regex: /stripe|xero|amazon|integration/,
      response: "We support 50+ integrations. Add in Console → Connectors.",
      confidence: 0.7,
    },
    {
      regex: /error|problem|issue|bug|broken/,
      response: "Check /status for outages. Common errors in /docs/troubleshooting.",
      confidence: 0.7,
    },
    {
      regex: /trial|free|start/i,
      response: "Free trial: 14 days, 1000 reconciliations. No credit card.",
      confidence: 0.8,
    },
    {
      regex: /help|support|contact/i,
      response: "Reply here or email support@settler.dev for help.",
      confidence: 0.5,
    },
    {
      regex: /refund|cancel|terminate/i,
      response: "I can help with that. Let me connect you to billing.",
      confidence: 0.3,
    },
  ];

  for (const { regex, response, confidence } of patterns) {
    if (regex.test(lower)) {
      return { response, confidence };
    }
  }

  return {
    response: "I'm not sure I understand. Can you rephrase? Or reply here for human support.",
    confidence: 0.2,
  };
}

/**
 * Determine if should escalate to human
 */
function shouldEscalateToHuman(message: string, response: string, confidence: number): boolean {
  const lower = message.toLowerCase();

  // Escalation triggers
  const escalateTriggers = [
    "refund",
    "cancel",
    "negotiat",
    "enterprise",
    "security",
    "breach",
    "legal",
    "compliance",
    "audit",
    "soc2",
    "frustrat",
    "angry",
    "complain",
    "stuck for days",
  ];

  if (escalateTriggers.some((t) => lower.includes(t))) return true;
  if (confidence < 0.4) return true;
  if (response.includes("I cannot") || response.includes("I can't")) return true;

  return false;
}

/**
 * Generate suggested follow-ups
 */
function generateSuggestions(message: string, response: string): string[] {
  const suggestions = ["View documentation", "Check API status", "Contact support"];

  if (response.includes("billing")) suggestions.unshift("View pricing");
  if (response.includes("reconcil")) suggestions.unshift("Try playground");
  if (response.includes("API")) suggestions.unshift("Get API key");

  return suggestions.slice(0, 3);
}

/**
 * Database helpers
 */
async function getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("chatbot_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(10);

  return (data || []).map((d: any) => ({
    role: d.role as "user" | "assistant",
    content: d.content,
  }));
}

async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("chatbot_messages").insert({
    conversation_id: conversationId,
    role,
    content,
  });
}

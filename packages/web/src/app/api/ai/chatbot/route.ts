/**
 * AI Chatbot API
 * OpenAI-powered chatbot for Settler.dev support
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { loadFAQEntries, getKnowledgeBaseContext } from '@/lib/ai/knowledge-base';

const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  attachments: z
    .array(
      z.object({
        type: z.enum(['text', 'image', 'file']),
        content: z.string(),
        name: z.string().optional(),
      })
    )
    .optional(),
  metadata: z
    .object({
      device: z.string().optional(),
      userAgent: z.string().optional(),
      referrer: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful AI assistant for Settler.dev, a financial reconciliation API platform.

Your role:
- Answer questions about Settler.dev products, features, pricing, and documentation
- Help users understand the difference between OSS SDK and SaaS offerings
- Guide users to relevant documentation, playground, or support resources
- Provide accurate information based on the knowledge base provided

Guidelines:
- Be friendly, professional, and concise
- If you don't know something, direct users to /support or /docs
- For technical questions, reference specific documentation pages
- For pricing questions, direct to /pricing
- For OSS questions, mention /oss page
- Always be helpful and encouraging

Knowledge Base Context:
{KNOWLEDGE_BASE_CONTEXT}

Remember: Settler.dev is the SaaS platform, Settler SDK is the open-source version.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = chatMessageSchema.parse(body);

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API key not configured',
          message: 'Chatbot is not available. Please contact support@settler.dev',
        },
        { status: 503 }
      );
    }

    // Load knowledge base
    const knowledgeEntries = await loadFAQEntries();
    const context = getKnowledgeBaseContext(validated.message, knowledgeEntries, 3);

    // Build conversation history (in production, fetch from database)
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add system prompt with context
    const systemPrompt = SYSTEM_PROMPT.replace('{KNOWLEDGE_BASE_CONTEXT}', context);

    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: validated.message,
      },
    ];

    // Handle attachments (images/files)
    if (validated.attachments && validated.attachments.length > 0) {
      // For images, use vision API
      // For files, extract text and include in message
      const attachmentTexts = validated.attachments
        .map((att) => {
          if (att.type === 'image') {
            return `[User uploaded image: ${att.name || 'image'}]`;
          } else if (att.type === 'file') {
            return `[User uploaded file: ${att.name || 'file'}\nContent preview: ${att.content.substring(0, 500)}]`;
          }
          return att.content;
        })
        .join('\n\n');

      messages[messages.length - 1] = {
        role: 'user',
        content: `${validated.message}\n\n${attachmentTexts}`,
      };
    }

    // Call OpenAI API (using gpt-3.5-turbo for cost efficiency)
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: false,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Track conversation (in production, save to database)
    const conversationId = validated.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // TODO: Save to database
    // await db.chatbotConversations.create({
    //   data: {
    //     conversationId,
    //     message: validated.message,
    //     response: assistantMessage,
    //     metadata: validated.metadata,
    //     timestamp: new Date(),
    //   },
    // });

    console.log('Chatbot conversation:', {
      conversationId,
      message: validated.message,
      response: assistantMessage.substring(0, 100),
      metadata: validated.metadata,
    });

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        message: assistantMessage,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid chat message data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'AI service error',
          message: 'The chatbot is temporarily unavailable. Please try again or contact support@settler.dev',
        },
        { status: 503 }
      );
    }

    console.error('Chatbot error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process chat message',
      },
      { status: 500 }
    );
  }
}

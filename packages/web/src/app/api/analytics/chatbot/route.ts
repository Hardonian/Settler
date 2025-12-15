/**
 * Chatbot Analytics API
 * Tracks chatbot usage and interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const chatbotEventSchema = z.object({
  type: z.enum(['chat_opened', 'chat_closed', 'message_sent', 'message_received', 'file_uploaded', 'error']),
  data: z.record(z.string(), z.any()).optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = chatbotEventSchema.parse(body);

    // Store in database
    const { saveChatbotAnalytics } = await import('@/lib/db/prisma-analytics');
    const data = validated.data || {};
    await saveChatbotAnalytics({
      type: validated.type,
      data: data,
      sessionId: typeof data.sessionId === 'string' ? data.sessionId : undefined,
      userId: typeof data.userId === 'string' ? data.userId : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Chatbot analytics event tracked',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid chatbot analytics event data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Chatbot analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track chatbot analytics event',
      },
      { status: 500 }
    );
  }
}

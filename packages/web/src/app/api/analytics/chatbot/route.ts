/**
 * Chatbot Analytics API
 * Tracks chatbot usage and interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const chatbotEventSchema = z.object({
  type: z.enum(['chat_opened', 'chat_closed', 'message_sent', 'message_received', 'file_uploaded', 'error']),
  data: z.record(z.any()).optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = chatbotEventSchema.parse(body);

    // Store in database
    const { saveChatbotAnalytics } = await import('@/lib/db/prisma-analytics');
    await saveChatbotAnalytics({
      type: validated.type,
      data: validated.data || {},
      sessionId: validated.data?.sessionId,
      userId: validated.data?.userId,
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
          details: error.errors,
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

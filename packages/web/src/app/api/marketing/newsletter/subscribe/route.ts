/**
 * Newsletter Subscription API
 * Handles newsletter signups for marketing campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = subscribeSchema.parse(body);

    // Integrate with Resend
    const { subscribeToNewsletter } = await import('@/lib/email/resend');
    const result = await subscribeToNewsletter({
      email: validated.email,
      name: validated.name,
      source: validated.source,
      tags: validated.tags,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to subscribe to newsletter',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to newsletter',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to subscribe to newsletter',
      },
      { status: 500 }
    );
  }
}

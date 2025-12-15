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
    const { prisma } = await import('@/lib/db/prisma-analytics');
    
    // Check if already subscribed
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email: validated.email },
    });

    if (existing && existing.subscribed) {
      return NextResponse.json(
        {
          success: true,
          message: 'Already subscribed to newsletter',
        },
        { status: 200 }
      );
    }

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

    // Save to database
    if (existing) {
      await prisma.newsletterSubscription.update({
        where: { email: validated.email },
        data: {
          name: validated.name,
          source: validated.source,
          tags: validated.tags || [],
          resendContactId: result.id,
          subscribed: true,
          unsubscribedAt: null,
        },
      });
    } else {
      await prisma.newsletterSubscription.create({
        data: {
          email: validated.email,
          name: validated.name,
          source: validated.source,
          tags: validated.tags || [],
          resendContactId: result.id,
          subscribed: true,
        },
      });
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
          details: error.issues,
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

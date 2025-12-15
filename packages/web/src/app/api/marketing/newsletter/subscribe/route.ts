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

    // TODO: Integrate with your email service provider (e.g., Resend, Mailchimp, ConvertKit)
    // For now, we'll log and return success
    console.log('Newsletter subscription:', {
      email: validated.email,
      name: validated.name,
      source: validated.source,
      tags: validated.tags,
      timestamp: new Date().toISOString(),
    });

    // Example integration with Resend (uncomment when ready):
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.contacts.create({
    //   email: validated.email,
    //   firstName: validated.name?.split(' ')[0],
    //   lastName: validated.name?.split(' ').slice(1).join(' '),
    //   unsubscribed: false,
    //   audienceId: process.env.RESEND_AUDIENCE_ID,
    // });

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

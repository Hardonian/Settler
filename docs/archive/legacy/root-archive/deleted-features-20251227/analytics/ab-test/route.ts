/**
 * A/B Test Analytics API
 * Tracks A/B test conversions and assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const abTestEventSchema = z.object({
  testId: z.string(),
  variantId: z.string(),
  userId: z.string(),
  conversionEvent: z.string(),
  timestamp: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = abTestEventSchema.parse(body);

    // TODO: Store in analytics database
    console.log('A/B test event:', {
      testId: validated.testId,
      variantId: validated.variantId,
      userId: validated.userId,
      conversionEvent: validated.conversionEvent,
      timestamp: validated.timestamp || new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'A/B test event tracked',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid A/B test event data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('A/B test tracking error:', error);
    // Never return 500 - return graceful error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track A/B test event',
        message: 'Please try again later',
      },
      { status: 200 }
    );
  }
}

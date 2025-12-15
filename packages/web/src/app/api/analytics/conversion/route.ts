/**
 * Conversion Analytics API
 * Receives and processes conversion tracking events
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const conversionEventSchema = z.object({
  event: z.string(),
  properties: z.record(z.any()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = conversionEventSchema.parse(body);

    // TODO: Store in analytics database (e.g., Postgres, BigQuery, etc.)
    // For now, we'll log and return success
    console.log('Conversion event:', {
      event: validated.event,
      userId: validated.userId,
      sessionId: validated.sessionId,
      properties: validated.properties,
      timestamp: validated.timestamp || new Date().toISOString(),
    });

    // Example: Store in database
    // await db.conversionEvents.create({
    //   data: {
    //     event: validated.event,
    //     userId: validated.userId,
    //     sessionId: validated.sessionId,
    //     properties: validated.properties,
    //     timestamp: new Date(validated.timestamp || Date.now()),
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Conversion event tracked',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid conversion event data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Conversion tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track conversion event',
      },
      { status: 500 }
    );
  }
}

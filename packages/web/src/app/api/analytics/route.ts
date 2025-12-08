import { NextRequest, NextResponse } from 'next/server';

/**
 * Analytics API Endpoint
 * 
 * Receives analytics events from the onboarding flow and other components.
 * In production, this would forward to your APM system (Sentry, Datadog, etc.)
 * 
 * CTO Mode: Force dynamic rendering for API routes
 */
export const dynamic = 'force-dynamic';

interface AnalyticsEvent {
  event: string;
  timestamp: number;
  step?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEvent = await request.json();

    // Validate event structure
    if (!event.event || !event.timestamp) {
      return NextResponse.json(
        { error: 'Invalid event structure. Missing required fields.' },
        { status: 400 }
      );
    }

    // Log event (in production, send to APM system)
    console.log('[Analytics]', {
      event: event.event,
      timestamp: new Date(event.timestamp).toISOString(),
      userId: event.userId || 'anonymous',
      sessionId: event.sessionId,
      step: event.step,
      duration: event.duration,
      metadata: event.metadata,
    });

    // In production, you would:
    // 1. Send to Sentry, Datadog, or your APM system
    // 2. Store in database for analysis
    // 3. Trigger alerts for critical events
    
    // Example: Send to external service
    // await fetch('https://your-apm-endpoint.com/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event),
    // });

    // For now, we'll just acknowledge receipt
    return NextResponse.json(
      { 
        success: true,
        message: 'Event received',
        eventId: crypto.randomUUID(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Analytics Error]', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process analytics event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow GET for health checks
export function GET() {
  return NextResponse.json(
    { 
      status: 'ok',
      service: 'analytics',
      version: '1.0.0',
    },
    { status: 200 }
  );
}

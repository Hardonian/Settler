/**
 * API Route Timing Wrapper
 * 
 * Automatically records timing metrics for API handlers
 * Includes trace_id in metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordApiTiming } from '@/lib/observability/metrics';
import { getTraceId } from '@/lib/observability/trace';

export function withTiming<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  routeName?: string
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();
    const traceId = await getTraceId(request);
    const route = routeName || request.nextUrl.pathname;
    const method = request.method;

    try {
      const response = await handler(...args);
      const duration = Date.now() - startTime;

      // Record timing
      recordApiTiming(route, method, duration, response.status, traceId);

      // Ensure trace_id is in response
      response.headers.set('x-trace-id', traceId);

      return response;
    } catch (_error) {
      const duration = Date.now() - startTime;

      // Record error timing
      recordApiTiming(route, method, duration, 500, traceId);

      throw error;
    }
  }) as T;
}

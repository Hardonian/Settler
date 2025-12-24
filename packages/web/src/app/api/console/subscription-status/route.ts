import { NextResponse } from 'next/server';
import { getSubscriptionStatus } from '@/lib/get-subscription-status';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Server-side cache for subscription status
// Reduces database load for frequent requests
let serverCache: {
  data: Awaited<ReturnType<typeof getSubscriptionStatus>> | null;
  timestamp: number;
  userId: string | null;
} = {
  data: null,
  timestamp: 0,
  userId: null,
};

const SERVER_CACHE_TTL = 10000; // 10 seconds server-side cache

/**
 * Get current user's subscription status
 * 
 * CRITICAL: Never returns 500 - always returns 200 with fallback status
 * This prevents client-side errors from breaking the console UI
 * 
 * Optimized with server-side caching to reduce database load
 */
export async function GET(request: Request) {
  try {
    // Get user ID from request for cache key
    // Note: This is a simplified approach - in production, extract from auth token
    const userId = request.headers.get('x-user-id') || null;
    const now = Date.now();
    
    // Check server-side cache
    const isCacheValid = 
      serverCache.data && 
      serverCache.userId === userId &&
      (now - serverCache.timestamp) < SERVER_CACHE_TTL;
    
    if (isCacheValid && serverCache.data) {
      // Add cache headers for client-side caching
      return NextResponse.json(serverCache.data, {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch fresh data
    const status = await getSubscriptionStatus();
    
    // Update server cache
    serverCache = {
      data: status,
      timestamp: now,
      userId,
    };

    // Return with cache headers
    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    });
  } catch (error: any) {
    // Log error for debugging
    console.error('[subscription-status] Error getting subscription status:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // CRITICAL: Always return 200 with fallback status
    // Never return 500 - this breaks the console UI
    const fallback = {
      tier: 'unsubscribed' as const,
      hasSubscription: false,
      isPaid: false,
      isEnterprise: false,
      // Include error message in development only
      ...(process.env.NODE_ENV === 'development' && error?.message
        ? { error: error.message }
        : {}),
    };

    return NextResponse.json(fallback, {
      headers: {
        'Cache-Control': 'no-store', // Don't cache errors
      },
    });
  }
}

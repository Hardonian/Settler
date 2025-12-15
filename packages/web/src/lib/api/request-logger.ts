/**
 * Request Logging Middleware
 * 
 * Logs API requests for monitoring and debugging.
 * Respects privacy and doesn't log sensitive data.
 */

interface RequestLog {
  method: string;
  path: string;
  status: number;
  duration: number;
  timestamp: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Log API request (server-side only, no sensitive data)
 */
export function logRequest(
  request: Request,
  response: Response,
  startTime: number
): void {
  const duration = Date.now() - startTime;
  const url = new URL(request.url);
  
  // Extract user ID from headers (if available)
  const userId = request.headers.get('x-user-id') || undefined;
  
  // Extract IP (respect privacy)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             undefined;
  
  // Extract user agent (sanitized)
  const userAgent = request.headers.get('user-agent') || undefined;

  const log: RequestLog = {
    method: request.method,
    path: url.pathname,
    status: response.status,
    duration,
    timestamp: new Date().toISOString(),
    userId,
    userAgent: userAgent ? sanitizeUserAgent(userAgent) : undefined,
    ip: ip ? anonymizeIP(ip) : undefined,
  };

  // Only log errors and slow requests in production
  if (process.env.NODE_ENV === 'production') {
    if (response.status >= 400 || duration > 1000) {
      console.log('[API Request]', JSON.stringify(log));
    }
  } else {
    // Log all requests in development
    console.log('[API Request]', JSON.stringify(log));
  }
}

function sanitizeUserAgent(ua: string): string {
  // Remove version numbers and keep only browser/OS info
  return ua
    .replace(/\d+\.\d+/g, 'X.X')
    .substring(0, 100); // Limit length
}

function anonymizeIP(ip: string): string {
  // Anonymize last octet for IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }
  // For IPv6, just return first segment
  if (ip.includes(':')) {
    return ip.split(':')[0] + ':xxxx:xxxx:xxxx';
  }
  return 'xxx.xxx.xxx.xxx';
}

/**
 * Create request logger middleware
 */
export function withRequestLogging<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as Request;
    const startTime = Date.now();
    
    try {
      const response = await handler(...args);
      logRequest(request, response, startTime);
      return response;
    } catch (error) {
      // Create error response for logging
      const errorResponse = new Response(
        JSON.stringify({ error: 'Internal error' }),
        { status: 200 }
      );
      logRequest(request, errorResponse, startTime);
      throw error;
    }
  }) as T;
}

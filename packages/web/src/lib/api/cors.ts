/**
 * CORS Configuration
 * 
 * Configures CORS headers for API routes.
 * Supports multiple origins for global operations.
 */

import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://settler.dev',
  'https://www.settler.dev',
  'https://app.settler.dev',
  ...(process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:3001']
    : []),
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
];

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-API-Key',
  'X-Request-ID',
  'X-Client-Version',
];

const MAX_AGE = 86400; // 24 hours

interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export function getCorsHeaders(
  origin: string | null,
  options: CorsOptions = {}
): Record<string, string> {
  const allowedOrigins = options.origin || ALLOWED_ORIGINS;
  const originHeader = (origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]) || allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': originHeader,
    'Access-Control-Allow-Methods': (options.methods || ALLOWED_METHODS).join(', '),
    'Access-Control-Allow-Headers': (options.headers || ALLOWED_HEADERS).join(', '),
    'Access-Control-Allow-Credentials': options.credentials !== false ? 'true' : 'false',
    'Access-Control-Max-Age': String(options.maxAge || MAX_AGE),
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(request: Request): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    return NextResponse.json({}, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }
  return null;
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  response: NextResponse,
  request: Request
): NextResponse {
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

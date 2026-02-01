/**
 * Console API Keys API Route
 * 
 * GET - List API keys
 * POST - Create API key
 * 
 * Supports both session auth (Console UI) and API key auth (SDK/CLI)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { listApiKeys, createApiKey, CreateApiKeyInput } from '@/domain/console/apiKeys';
import { handleApiError } from '@/lib/api/error-handler';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(request: NextRequest) {
  try {
    // Authenticate using unified auth (session or API key)
    await requireAuth(request);
    
    const keys = await listApiKeys();
    return NextResponse.json({ keys });
  } catch (_error) {
    // Use unified error handler (returns 200 with error envelope)
    return handleApiError(error, 'Failed to fetch API keys');
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    // Authenticate using unified auth (session or API key)
    await requireAuth(request);
    
    const body = await request.json();
    const result = await createApiKey(undefined, {
      name: body.name,
      scopes: body.scopes,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    } as CreateApiKeyInput);

    return NextResponse.json(result);
  } catch (_error) {
    // Use unified error handler (returns 200 with error envelope)
    return handleApiError(error, 'Failed to create API key');
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

/**
 * Enterprise Contact API Route
 * 
 * Handles enterprise demo requests and sales inquiries
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, message } = body;

    // Validate required fields
    if (!name || !email || !company) {
      return NextResponse.json(
        { error: 'Name, email, and company are required' },
        { status: 400 }
      );
    }

    // Store in database for sales team follow-up
    await prisma.$executeRaw`
      INSERT INTO activity_log (
        user_id,
        action,
        resource_type,
        metadata,
        created_at
      ) VALUES (
        NULL,
        'enterprise_contact_request',
        'enterprise',
        ${JSON.stringify({
          name,
          email,
          company,
          message: message || '',
          source: 'web_form',
        })}::jsonb,
        ${new Date()}
      )
    `;

    // TODO: Send email notification to sales team
    // TODO: Create CRM lead in external system

    return NextResponse.json({
      success: true,
      message: 'Thank you! Our sales team will contact you within 24 hours.',
    });
  } catch (_error) {
    appLogger.error('[Enterprise Contact] Error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit request. Please try again or email enterprise@settler.dev',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 10 }, requireAuth: false }
);

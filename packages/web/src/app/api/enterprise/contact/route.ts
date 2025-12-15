/**
 * Enterprise Contact API Route
 * 
 * Handles enterprise demo requests and sales inquiries
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/shared/db/prismaClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
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
  } catch (error) {
    console.error('[Enterprise Contact] Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again or email enterprise@settler.dev' },
      { status: 500 }
    );
  }
}

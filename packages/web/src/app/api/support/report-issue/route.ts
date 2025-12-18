/**
 * Report Issue API
 * 
 * Creates a support ticket with auto-captured context
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';
import { autoTriageTicket } from '@/lib/support/triage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, description, context } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    // Get user's organization if available
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
    });

    // Auto-triage the ticket
    const triageResult = await autoTriageTicket({
      subject,
      description,
      context: context || {},
    });

    // Create support ticket
    const ticket = await prisma.$executeRaw`
      INSERT INTO ops_support_tickets (
        user_id,
        organization_id,
        subject,
        description,
        context,
        triage_result,
        status,
        priority,
        category
      ) VALUES (
        ${user.id}::uuid,
        ${billingAccount?.id || null}::uuid,
        ${subject},
        ${description},
        ${JSON.stringify(context)}::jsonb,
        ${JSON.stringify(triageResult)}::jsonb,
        ${triageResult.status || 'open'},
        ${triageResult.priority || 'medium'},
        ${triageResult.category || null}
      )
      RETURNING id, ticket_number
    `;

    // Log to audit
    await prisma.$executeRaw`
      INSERT INTO ops_audit_logs (
        action,
        resource_type,
        resource_id,
        user_id,
        organization_id,
        metadata
      ) VALUES (
        'support_ticket_created',
        'support_ticket',
        (SELECT id FROM ops_support_tickets WHERE user_id = ${user.id}::uuid ORDER BY created_at DESC LIMIT 1),
        ${user.id}::uuid,
        ${billingAccount?.id || null}::uuid,
        ${JSON.stringify({ subject, triageResult })}::jsonb
      )
    `;

    return NextResponse.json({
      success: true,
      ticketNumber: (ticket as any)[0]?.ticket_number,
    });
  } catch (error) {
    console.error('Failed to create support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

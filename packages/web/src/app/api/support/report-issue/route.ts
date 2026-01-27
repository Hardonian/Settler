/**
 * Report Issue API
 * 
 * Create a support ticket from in-app issue reporter
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triageTicket, storeTriageResult } from '@/lib/services/triage-engine';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description, category, context } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'subject and description required' },
        { status: 400 }
      );
    }

    // Get user's organization (if any)
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    type OrgMemberRow = {
      organization_id?: string | null;
    };
    const orgMemberData = orgMember as OrgMemberRow | null;
    const orgId = orgMemberData?.organization_id || null;

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('ops_support_tickets')
      .insert({
        user_id: user.id,
        organization_id: orgId,
        subject,
        description,
        category: category || null,
        context: context || {},
        status: 'open',
        priority: 'medium',
      } as never)
      .select()
      .single();

    if (ticketError || !ticket) {
      appLogger.error('Failed to create ticket', ticketError);
      return NextResponse.json(
      {
        success: false,
        error: 'Failed to create ticket',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
    }

    type TicketRow = {
      id: string;
      ticket_number: string;
      subject: string;
      status: string;
      priority: string;
    };
    const ticketData = ticket as TicketRow;

    // Auto-triage ticket
    try {
      const triageResult = await triageTicket(ticketData.id);
      await storeTriageResult(ticketData.id, triageResult);

      // Update ticket with triage results
      await supabase
        .from('ops_support_tickets')
        // @ts-expect-error - Supabase type inference issue
        .update({
          priority: triageResult.suggestedPriority,
          category: triageResult.suggestedCategory || category,
          triage_result: {
            score: triageResult.triageScore,
            confidence: triageResult.confidence,
            rules: triageResult.triageRulesApplied,
          },
        })
        .eq('id', ticketData.id);
    } catch (triageError) {
      appLogger.error('Auto-triage failed (non-fatal)', triageError);
      // Continue even if triage fails
    }

    return NextResponse.json({
      ticket: {
        id: ticketData.id,
        ticketNumber: ticketData.ticket_number,
        subject: ticketData.subject,
        status: ticketData.status,
        priority: ticketData.priority,
      },
    });
  } catch {
    appLogger.error('Report issue error', error);
    // Never return 500 - return graceful error response
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to report issue',
        message: 'Please try again later or contact support if the issue persists',
      },
      { status: 200 }
    );
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

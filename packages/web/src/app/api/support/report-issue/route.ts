/**
 * Report Issue API
 * 
 * Create a support ticket from in-app issue reporter
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triageTicket, storeTriageResult } from '@/lib/services/triage-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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
      console.error('Failed to create ticket:', ticketError);
      return NextResponse.json(
        { error: 'Failed to create ticket' },
        { status: 500 }
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
      console.error('Auto-triage failed (non-fatal):', triageError);
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
  } catch (error) {
    console.error('Report issue error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to report issue' },
      { status: 500 }
    );
  }
}

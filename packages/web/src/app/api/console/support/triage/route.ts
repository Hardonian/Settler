/**
 * Support Triage API
 * 
 * Triage a support ticket automatically
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { triageTicket, storeTriageResult } from '@/lib/services/triage-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json();
    const ticketId = body.ticketId;

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
    }

    // Triage ticket
    const result = await triageTicket(ticketId);

    // Store result
    await storeTriageResult(ticketId, result, adminCheck.userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Triage error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to triage ticket' },
      { status: 500 }
    );
  }
}

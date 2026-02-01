/**
 * Support Tickets API
 * 
 * List support tickets for admin
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { prisma } from '@/shared/db/prismaClient';
import { createClient } from '@/lib/supabase/server';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(request: Request) {
     
    const adminCheck = await requireAdmin(request as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const tickets = await prisma.$queryRaw<Array<{
      id: string;
      ticket_number: string;
      subject: string;
      status: string;
      priority: string;
      category: string | null;
      triage_result: Record<string, unknown> | null;
      created_at: Date;
      user_id: string;
    }>>`
      SELECT 
        id,
        ticket_number,
        subject,
        status,
        priority,
        category,
        triage_result,
        created_at,
        user_id
      FROM ops_support_tickets
      ORDER BY created_at DESC
      LIMIT 100
    `;

    // Get user emails from Supabase auth
    const supabase = await createClient();
    const userIds = tickets.map((t) => t.user_id);
    const userMap = new Map<string, string>();
    
    for (const userId of userIds) {
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        if (user?.email) {
          userMap.set(userId, user.email);
        }
      } catch {
        // Skip if user not found
      }
    }

    const ticketsWithUsers = tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      triageResult: ticket.triage_result,
      createdAt: ticket.created_at.toISOString(),
      userEmail: userMap.get(ticket.user_id) || undefined,
    }));

    return NextResponse.json({ tickets: ticketsWithUsers });
  } catch (_error) {
    appLogger.error('Failed to fetch support tickets', error);
    // Never return 500 - return empty array with graceful error message
    return NextResponse.json({ 
      tickets: [],
      error: 'Unable to fetch tickets at this time',
      message: 'Please try again later'
    }, { status: 200 });
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

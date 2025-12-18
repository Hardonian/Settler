/**
 * Support Tickets API
 * 
 * List support tickets for admin
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';
import { prisma } from '@/shared/db/prismaClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
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
      triage_result: any;
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

    // Get user emails
    const userIds = tickets.map((t) => t.user_id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.email]));

    const ticketsWithUsers = tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      triageResult: ticket.triage_result,
      createdAt: ticket.created_at.toISOString(),
      userEmail: userMap.get(ticket.user_id),
    }));

    return NextResponse.json({ tickets: ticketsWithUsers });
  } catch (error) {
    console.error('Failed to fetch support tickets:', error);
    return NextResponse.json({ tickets: [] }, { status: 500 });
  }
}

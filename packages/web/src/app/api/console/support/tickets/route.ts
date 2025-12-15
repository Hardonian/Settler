/**
 * Support Tickets API Route
 * 
 * GET - List tickets
 * POST - Create ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/unified-auth';
import { prisma } from '@/shared/db/prismaClient';
import { createTicket, listTickets, CreateTicketInput } from '@/lib/support/ticket-system';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireAuth(request);
    const tickets = await listTickets(authContext.userId);

    return NextResponse.json({ tickets });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Support Tickets] Error:', error);
    return NextResponse.json({ tickets: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuth(request);
    
    if (!authContext.billingAccountId) {
      return NextResponse.json({ error: 'Billing account not found' }, { status: 404 });
    }

    const body = await request.json();
    const input: CreateTicketInput = {
      subject: body.subject,
      description: body.description,
      category: body.category,
      priority: body.priority,
    };

    const ticket = await createTicket(
      authContext.userId,
      authContext.billingAccountId,
      input
    );

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to create ticket';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

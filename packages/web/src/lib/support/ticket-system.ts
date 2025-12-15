/**
 * Support Ticket System
 * 
 * In-app support ticket creation and management.
 */

import { prisma } from '@/shared/db/prismaClient';
import { createClient } from '@/lib/supabase/server';

export interface SupportTicket {
  id: string;
  userId: string;
  billingAccountId: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'feature_request' | 'bug' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'feature_request' | 'bug' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Create a support ticket
 */
export async function createTicket(
  userId: string,
  billingAccountId: string,
  input: CreateTicketInput
): Promise<SupportTicket> {
  // Validate inputs
  if (!input.subject || input.subject.trim().length === 0) {
    throw new Error('Subject is required');
  }

  if (input.subject.length > 200) {
    throw new Error('Subject must be 200 characters or less');
  }

  if (!input.description || input.description.trim().length === 0) {
    throw new Error('Description is required');
  }

  if (input.description.length > 5000) {
    throw new Error('Description must be 5000 characters or less');
  }

  // Sanitize inputs
  const sanitizedSubject = input.subject.trim().substring(0, 200);
  const sanitizedDescription = input.description.trim().substring(0, 5000);

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      billingAccountId,
      subject: sanitizedSubject,
      description: sanitizedDescription,
      category: input.category,
      priority: input.priority || 'medium',
      status: 'open',
    },
  });

  return ticket as SupportTicket;
}

/**
 * List tickets for a user
 */
export async function listTickets(userId: string): Promise<SupportTicket[]> {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return tickets as SupportTicket[];
}

/**
 * Get ticket details
 */
export async function getTicket(
  ticketId: string,
  userId: string
): Promise<SupportTicket | null> {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, userId },
  });

  return ticket as SupportTicket | null;
}

/**
 * Add comment to ticket
 */
export async function addTicketComment(
  ticketId: string,
  userId: string,
  comment: string
): Promise<void> {
  const ticket = await getTicket(ticketId, userId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  await prisma.ticketComment.create({
    data: {
      ticketId,
      userId,
      comment,
    },
  });
}

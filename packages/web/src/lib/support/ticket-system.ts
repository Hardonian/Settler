/**
 * Support Ticket System
 * 
 * In-app support ticket creation and management.
 */

import { prisma } from '@/shared/db/prismaClient';

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

  // Support ticket model doesn't exist yet - use audit log as placeholder
  // TODO: Add supportTicket model to Prisma schema
  const auditLog = await prisma.auditLog.create({
    data: {
      userId,
      billingAccountId,
      action: 'create',
      resourceType: 'support_ticket',
      changes: {
        subject: sanitizedSubject,
        description: sanitizedDescription,
        category: input.category,
        priority: input.priority || 'medium',
        status: 'open',
      },
    },
  });

  return {
    id: auditLog.id,
    userId,
    billingAccountId,
    subject: sanitizedSubject,
    description: sanitizedDescription,
    category: input.category,
    priority: input.priority || 'medium',
    status: 'open',
    createdAt: auditLog.createdAt,
    updatedAt: auditLog.createdAt,
  } as SupportTicket;
}

/**
 * List tickets for a user
 */
export async function listTickets(userId: string): Promise<SupportTicket[]> {
  // Support ticket model doesn't exist yet - use audit log as placeholder
  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      resourceType: 'support_ticket',
    },
    orderBy: { createdAt: 'desc' },
  });

  return logs.map((log) => {
    const changes = log.changes as Record<string, unknown>;
    return {
      id: log.id,
      userId: log.userId || userId,
      billingAccountId: log.billingAccountId || '',
      subject: (changes.subject as string) || '',
      description: (changes.description as string) || '',
      category: (changes.category as SupportTicket['category']) || 'other',
      priority: (changes.priority as SupportTicket['priority']) || 'medium',
      status: (changes.status as SupportTicket['status']) || 'open',
      createdAt: log.createdAt,
      updatedAt: log.createdAt,
    } as SupportTicket;
  });
}

/**
 * Get ticket details
 */
export async function getTicket(
  ticketId: string,
  userId: string
): Promise<SupportTicket | null> {
  const log = await prisma.auditLog.findFirst({
    where: {
      id: ticketId,
      userId,
      resourceType: 'support_ticket',
    },
  });

  if (!log) return null;

  const changes = log.changes as Record<string, unknown>;
  return {
    id: log.id,
    userId: log.userId || userId,
    billingAccountId: log.billingAccountId || '',
    subject: (changes.subject as string) || '',
    description: (changes.description as string) || '',
    category: (changes.category as SupportTicket['category']) || 'other',
    priority: (changes.priority as SupportTicket['priority']) || 'medium',
    status: (changes.status as SupportTicket['status']) || 'open',
    createdAt: log.createdAt,
    updatedAt: log.createdAt,
  } as SupportTicket;
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

  // Ticket comment model doesn't exist yet - use audit log as placeholder
  await prisma.auditLog.create({
    data: {
      userId,
      billingAccountId: ticket.billingAccountId,
      action: 'comment',
      resourceType: 'support_ticket',
      resourceId: ticketId,
      changes: {
        comment,
      },
    },
  });
}

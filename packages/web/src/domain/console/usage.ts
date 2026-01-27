/**
 * Console Usage Domain
 * 
 * Queries usage events for the Developer Console.
 * Uses Prisma with billing account scoping for tenant isolation.
 */

import { prisma } from '@/shared/db/prismaClient';
import { createClient } from '@/lib/supabase/server';

export interface UsageEventItem {
  id: string;
  timestamp: Date;
  service: string;
  operation: string;
  quantity: number;
  unit?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageSummary {
  totalCalls: number;
  byService: Record<string, number>;
  byOperation: Record<string, number>;
  errorRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface UsageQueryFilters {
  startDate?: Date;
  endDate?: Date;
  service?: string;
  operation?: string;
  limit?: number;
  offset?: number;
}

/**
 * Verify billing account belongs to authenticated user
 */
async function verifyBillingAccountAccess(billingAccountId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Check if billing account exists and belongs to user
    if (!prisma || typeof prisma.billingAccount === 'undefined') {
      return false;
    }
    
    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        id: billingAccountId,
        userId: user.id,
      },
    });
    
    return !!billingAccount;
  } catch {
    console.error('[verifyBillingAccountAccess] Error:', error);
    return false;
  }
}

/**
 * Get usage events for a billing account
 * Verifies the billing account belongs to the authenticated user
 */
export async function getUsageEvents(
  billingAccountId: string,
  filters: UsageQueryFilters = {}
): Promise<UsageEventItem[]> {
  try {
    // Verify billing account access
    const hasAccess = await verifyBillingAccountAccess(billingAccountId);
    if (!hasAccess) {
      console.warn('[getUsageEvents] Access denied for billing account:', billingAccountId);
      return [];
    }
    
    const where: Record<string, unknown> = {
      billingAccountId,
    };

    if (filters.startDate || filters.endDate) {
      const timestampFilter: { gte?: Date; lte?: Date } = {};
      if (filters.startDate) {
        timestampFilter.gte = filters.startDate;
      }
      if (filters.endDate) {
        timestampFilter.lte = filters.endDate;
      }
      where.timestamp = timestampFilter;
    }

    if (filters.service) {
      if (filters.operation) {
        where.eventType = `${filters.service}:${filters.operation}`;
      } else {
        where.eventType = {
          startsWith: `${filters.service}:`,
        };
      }
    }

    const events = await prisma.usageEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });

    return events.map((event: (typeof events)[number]) => {
      const [service, operation] = event.eventType.split(':');
      return {
        id: event.id,
        timestamp: event.timestamp,
        service: service || event.eventType,
        operation: operation || 'unknown',
        quantity: Number(event.quantity),
        unit: event.unit || undefined,
        metadata: event.metadata as Record<string, unknown> | undefined,
      };
    });
  } catch {
    console.error('[getUsageEvents] Error:', error);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  }
}

/**
 * Get usage summary for a billing account
 * Verifies the billing account belongs to the authenticated user
 */
export async function getUsageSummary(
  billingAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<UsageSummary> {
  try {
    // Verify billing account access
    const hasAccess = await verifyBillingAccountAccess(billingAccountId);
    if (!hasAccess) {
      console.warn('[getUsageSummary] Access denied for billing account:', billingAccountId);
      return {
        totalCalls: 0,
        byService: {},
        byOperation: {},
        errorRate: 0,
        period: { start: startDate, end: endDate },
      };
    }
    
    // Check if Prisma is available
    if (!prisma || typeof prisma.usageEvent === 'undefined') {
      console.warn('[getUsageSummary] Prisma client not available, returning empty summary');
      return {
        totalCalls: 0,
        byService: {},
        byOperation: {},
        errorRate: 0,
        period: { start: startDate, end: endDate },
      };
    }
    
    const events = await prisma.usageEvent.findMany({
      where: {
        billingAccountId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const byService: Record<string, number> = {};
    const byOperation: Record<string, number> = {};
    let totalCalls = 0;
    let errorCount = 0;

    for (const event of events) {
      totalCalls += Number(event.quantity);
      
      const [service, operation] = event.eventType.split(':');
      const serviceName = service || event.eventType;
      const operationName = operation || 'unknown';

      byService[serviceName] = (byService[serviceName] || 0) + Number(event.quantity);
      byOperation[operationName] = (byOperation[operationName] || 0) + Number(event.quantity);

      // Check for errors in metadata
      const metadata = event.metadata as Record<string, unknown> | null;
      if (metadata?.status === 'error' || metadata?.error) {
        errorCount += Number(event.quantity);
      }
    }

    return {
      totalCalls,
      byService,
      byOperation,
      errorRate: totalCalls > 0 ? errorCount / totalCalls : 0,
      period: { start: startDate, end: endDate },
    };
  } catch {
    console.error('[getUsageSummary] Error:', error);
    // Return empty summary instead of throwing to prevent 500 errors
    return {
      totalCalls: 0,
      byService: {},
      byOperation: {},
      errorRate: 0,
      period: { start: startDate, end: endDate },
    };
  }
}

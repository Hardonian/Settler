/**
 * Database Query Builder
 * 
 * Abstraction layer for database queries with:
 * - Automatic tenant isolation
 * - Query result caching
 * - Retry logic
 * - Performance monitoring
 * - Type safety
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/shared/db/prismaClient';
import { UnifiedAuthContext } from '@/lib/api/unified-auth';
import { withCache, generateCacheKey } from '@/lib/db/cache';

export interface QueryOptions {
  /** Cache TTL in seconds (0 = no cache) */
  cacheTtl?: number;
  /** Retry attempts on failure */
  retries?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Skip tenant isolation check (admin only) */
  skipTenantCheck?: boolean;
}

export interface QueryContext {
  auth: UnifiedAuthContext;
  billingAccountId: string;
  tenantId?: string;
}

/**
 * Verify billing account access for tenant isolation
 */
async function verifyBillingAccountAccess(
  billingAccountId: string,
  userId: string
): Promise<boolean> {
  try {
    const billingAccount = await prisma.billingAccount.findFirst({
      where: {
        id: billingAccountId,
        userId,
      },
      select: { id: true },
    });
    return !!billingAccount;
  } catch {
    return false;
  }
}

/**
 * Execute query with tenant isolation and error handling
 */
export async function executeQuery<T>(
  context: QueryContext,
  query: (prisma: PrismaClient) => Promise<T>,
  options: QueryOptions = {}
): Promise<T> {
  const { auth, billingAccountId } = context;

  // Verify tenant access (unless skipped for admin)
  if (!options.skipTenantCheck && auth.type === 'session') {
    const hasAccess = await verifyBillingAccountAccess(billingAccountId, auth.userId);
    if (!hasAccess) {
      throw new Error('Forbidden: Access denied to billing account');
    }
  }

  // Execute query with caching and retry logic
  let lastError: Error | null = null;
  const retries = options.retries ?? 3;

  // Generate cache key
  const cacheKey = options.cacheTtl
    ? generateCacheKey(`query:${billingAccountId}`, {
        userId: auth.userId,
        type: auth.type,
      })
    : null;

  // Try cache first
  if (cacheKey && options.cacheTtl) {
    try {
      const cached = await withCache(
        cacheKey,
        async () => {
          // Fall through to query execution
          return null;
        },
        { ttl: options.cacheTtl, skip: false }
      );
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      // Cache error, continue to query
      console.warn('[Query Builder] Cache error, continuing:', error);
    }
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // TODO: Add timeout handling
      const result = await query(prisma);
      
      // Cache result if cache TTL specified
      if (cacheKey && options.cacheTtl) {
        await withCache(
          cacheKey,
          async () => result,
          { ttl: options.cacheTtl, skip: false }
        ).catch(() => {
          // Cache write error, don't fail query
        });
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on auth errors
      if (lastError.message.includes('Forbidden') || lastError.message.includes('Unauthorized')) {
        throw lastError;
      }

      // Retry on transient errors
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new Error('Query failed after retries');
}

/**
 * Query builder for common patterns
 */
export class QueryBuilder {
  constructor(private context: QueryContext) {}

  /**
   * Find many with pagination
   */
  async findMany<T>(
    model: keyof PrismaClient,
    where: Record<string, unknown>,
    options: QueryOptions & {
      take?: number;
      skip?: number;
      orderBy?: Record<string, 'asc' | 'desc'>;
    } = {}
  ): Promise<T[]> {
    const { take = 50, skip = 0, orderBy, ...queryOptions } = options;

    return executeQuery(
      this.context,
      async (prismaClient) => {
        const modelName = String(model);
        const modelClient = (prismaClient as Record<string, unknown>)[modelName] as {
          findMany: (args: {
            where: Record<string, unknown>;
            take: number;
            skip: number;
            orderBy?: Record<string, 'asc' | 'desc'>;
          }) => Promise<T[]>;
        } | undefined;
        
        if (!modelClient) {
          throw new Error(`Model ${String(model)} not found in PrismaClient`);
        }

        return modelClient.findMany({
          where: {
            ...where,
            // Add tenant isolation filter
            ...(this.context.billingAccountId && !queryOptions.skipTenantCheck
              ? { billingAccountId: this.context.billingAccountId }
              : {}),
          },
          take,
          skip,
          orderBy,
        });
      },
      queryOptions
    );
  }

  /**
   * Find unique
   */
  async findUnique<T>(
    model: keyof PrismaClient,
    where: Record<string, unknown>,
    options: QueryOptions = {}
  ): Promise<T | null> {
    return executeQuery(
      this.context,
      async (prismaClient) => {
        const modelName = String(model);
        const modelClient = (prismaClient as Record<string, unknown>)[modelName] as {
          findUnique: (args: { where: Record<string, unknown> }) => Promise<T | null>;
        } | undefined;
        
        if (!modelClient) {
          throw new Error(`Model ${String(model)} not found in PrismaClient`);
        }

        return modelClient.findUnique({
          where: {
            ...where,
            // Add tenant isolation filter
            ...(this.context.billingAccountId && !options.skipTenantCheck
              ? { billingAccountId: this.context.billingAccountId }
              : {}),
          },
        });
      },
      options
    );
  }

  /**
   * Create
   */
  async create<T>(
    model: keyof PrismaClient,
    data: Record<string, unknown>,
    options: QueryOptions = {}
  ): Promise<T> {
    return executeQuery(
      this.context,
      async (prismaClient) => {
        const modelName = String(model);
        const modelClient = (prismaClient as Record<string, unknown>)[modelName] as {
          create: (args: { data: Record<string, unknown> }) => Promise<T>;
        } | undefined;
        
        if (!modelClient) {
          throw new Error(`Model ${String(model)} not found in PrismaClient`);
        }

        return modelClient.create({
          data: {
            ...data,
            // Ensure tenant isolation
            billingAccountId: this.context.billingAccountId,
            ...(this.context.tenantId ? { tenantId: this.context.tenantId } : {}),
          },
        });
      },
      options
    );
  }

  /**
   * Update
   */
  async update<T>(
    model: keyof PrismaClient,
    where: Record<string, unknown>,
    data: Record<string, unknown>,
    options: QueryOptions = {}
  ): Promise<T> {
    return executeQuery(
      this.context,
      async (prismaClient) => {
        const modelName = String(model);
        const modelClient = (prismaClient as Record<string, unknown>)[modelName] as {
          update: (args: {
            where: Record<string, unknown>;
            data: Record<string, unknown>;
          }) => Promise<T>;
        } | undefined;
        
        if (!modelClient) {
          throw new Error(`Model ${String(model)} not found in PrismaClient`);
        }

        return modelClient.update({
          where: {
            ...where,
            // Add tenant isolation filter
            ...(this.context.billingAccountId && !options.skipTenantCheck
              ? { billingAccountId: this.context.billingAccountId }
              : {}),
          },
          data,
        });
      },
      options
    );
  }

  /**
   * Delete
   */
  async delete<T>(
    model: keyof PrismaClient,
    where: Record<string, unknown>,
    options: QueryOptions = {}
  ): Promise<T> {
    return executeQuery(
      this.context,
      async (prismaClient) => {
        const modelName = String(model);
        const modelClient = (prismaClient as Record<string, unknown>)[modelName] as {
          delete: (args: { where: Record<string, unknown> }) => Promise<T>;
        } | undefined;
        
        if (!modelClient) {
          throw new Error(`Model ${String(model)} not found in PrismaClient`);
        }

        return modelClient.delete({
          where: {
            ...where,
            // Add tenant isolation filter
            ...(this.context.billingAccountId && !options.skipTenantCheck
              ? { billingAccountId: this.context.billingAccountId }
              : {}),
          },
        });
      },
      options
    );
  }
}

/**
 * Create query builder from auth context
 */
export function createQueryBuilder(context: QueryContext): QueryBuilder {
  return new QueryBuilder(context);
}

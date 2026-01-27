/**
 * Safe Helper Functions
 * 
 * Provides safe wrappers for common operations with graceful error handling.
 * These functions never throw unhandled errors and always return a result object.
 */

import Stripe from 'stripe';
import { getStripeClient } from '@/domain/billing/stripeService';
import { createClient } from '@/lib/supabase/server';

export interface SafeResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Safe environment variable getter
 * Returns undefined if not set, never throws
 */
export function requireEnv(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Safe environment variable getter (non-throwing)
 */
export function getEnv(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

/**
 * Safe fetch with retry logic and error handling
 */
export async function safeFetch(
  url: string,
  options?: RequestInit,
  retries = 3,
  retryDelay = 1000
): Promise<SafeResult<Response>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok && attempt < retries) {
        // Retry on 5xx errors
        if (response.status >= 500) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
      }

      return { success: true, data: response };
    } catch {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on network errors if we're out of retries
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Fetch failed',
    code: 'FETCH_ERROR',
  };
}

/**
 * Safe Supabase client getter
 * Returns null if Supabase is not configured
 */
export async function safeSupabase() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false as const,
        error: 'Supabase not configured',
        code: 'SUPABASE_NOT_CONFIGURED',
      };
    }

    const client = await createClient();
    return {
      success: true as const,
      data: client,
    };
  } catch {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to create Supabase client',
      code: 'SUPABASE_ERROR',
    };
  }
}

/**
 * Safe Stripe client getter
 * Returns null if Stripe is not configured
 */
export function safeStripe(): SafeResult<Stripe> {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return {
        success: false,
        error: 'Stripe not configured',
        code: 'STRIPE_NOT_CONFIGURED',
      };
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return {
        success: false,
        error: 'Stripe is not configured (demo mode)',
      };
    }
    return {
      success: true,
      data: stripe,
    };
  } catch {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Stripe client',
      code: 'STRIPE_ERROR',
    };
  }
}

/**
 * Safe database query wrapper
 * Handles Prisma errors gracefully
 */
export async function safeDbQuery<T>(
  queryFn: () => Promise<T>
): Promise<SafeResult<T>> {
  try {
    const data = await queryFn();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    // Handle Prisma-specific errors
    if (error?.code === 'P2002') {
      return {
        success: false,
        error: 'Record already exists',
        code: 'DUPLICATE_RECORD',
      };
    }
    if (error?.code === 'P2025') {
      return {
        success: false,
        error: 'Record not found',
        code: 'NOT_FOUND',
      };
    }

    return {
      success: false,
      error: error?.message || 'Database query failed',
      code: error?.code || 'DB_ERROR',
    };
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string): SafeResult<T> {
  try {
    const data = JSON.parse(json) as T;
    return {
      success: true,
      data,
    };
  } catch {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
      code: 'JSON_PARSE_ERROR',
    };
  }
}

/**
 * Safe async operation with timeout
 */
export async function safeWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = 10000
): Promise<SafeResult<T>> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });

    const data = await Promise.race([operation(), timeoutPromise]);
    return {
      success: true,
      data,
    };
  } catch {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Operation failed',
      code: 'TIMEOUT',
    };
  }
}

/**
 * Retry helper with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<SafeResult<T>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
      };
    } catch {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Operation failed after retries',
    code: 'RETRY_EXHAUSTED',
  };
}

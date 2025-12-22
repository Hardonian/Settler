/**
 * API Call Log Domain
 * 
 * Manages API call logging and retrieval for developer console.
 * Tracks all API requests made by tenants for observability.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sanitizeApiData } from '@/lib/privacy/pii-filter';
import { isSuperAdmin } from '@/lib/auth/super-admin';

export interface ApiCallLog {
  id: string;
  tenantId: string;
  userId?: string;
  apiKeyId?: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  responseBody?: unknown;
  error?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ApiLogFilters {
  tenantId?: string;
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Log an API call
 */
export async function logApiCall(log: Omit<ApiCallLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    const supabase = await createAdminClient();
    
    // Insert into api_call_logs table
    const insertData = {
      tenant_id: log.tenantId,
      user_id: log.userId,
      api_key_id: log.apiKeyId,
      method: log.method,
      path: log.path,
      status_code: log.statusCode,
      response_time: log.responseTime,
      headers: log.headers,
      query: log.query,
      body: log.body,
      response_body: log.responseBody,
      error: log.error,
      user_agent: log.userAgent,
      ip_address: log.ipAddress,
      created_at: new Date().toISOString(),
    };
    
    const { error } = await supabase
      .from('api_call_logs')
      .insert(insertData as never);
    
    if (error) {
      console.error('[logApiCall] Failed to log API call:', error);
      // Don't throw - logging failures shouldn't break API calls
    }
  } catch (error) {
    console.error('[logApiCall] Error logging API call:', error);
    // Don't throw - logging failures shouldn't break API calls
  }
}

/**
 * Get API call logs for current tenant
 */
export async function getApiCallLogs(filters: ApiLogFilters = {}): Promise<ApiCallLog[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }
    
    // Check if super admin (can see all logs)
    const isAdmin = await isSuperAdmin();
    
    let query = supabase
      .from('api_call_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (!isAdmin && filters.tenantId) {
      // Non-admins can only see their own tenant's logs
      query = query.eq('tenant_id', filters.tenantId);
    } else if (!isAdmin) {
      // Non-admins need tenantId filter
      // Get user's tenant from billing account
      const { data: billingAccount } = await supabase
        .from('billing_accounts')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
      
      type BillingAccountRow = { tenant_id: string };
      if (billingAccount && typeof billingAccount === 'object' && 'tenant_id' in billingAccount) {
        const tenantId = (billingAccount as BillingAccountRow).tenant_id;
        if (tenantId) {
          query = query.eq('tenant_id', tenantId);
        } else {
          return []; // No tenant, no logs
        }
      } else {
        return []; // No tenant, no logs
      }
    }
    
    if (filters.method) {
      query = query.eq('method', filters.method);
    }
    
    if (filters.path) {
      query = query.ilike('path', `%${filters.path}%`);
    }
    
    if (filters.statusCode) {
      query = query.eq('status_code', filters.statusCode);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    // Apply pagination (optimize with limit)
    const limit = Math.min(filters.limit || 100, 1000); // Cap at 1000
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);
    
    // Use count for total if needed (optimized query)
    const { data, error } = await query;
    
    if (error) {
      console.error('[getApiCallLogs] Error fetching logs:', error);
      // Return empty array instead of throwing
      return [];
    }
    
    // Type guard for log data
    type ApiCallLogRow = {
      id: string;
      tenant_id: string;
      user_id?: string;
      api_key_id?: string;
      method: string;
      path: string;
      status_code: number;
      response_time: number;
      created_at: string;
      headers?: unknown;
      query?: unknown;
      body?: unknown;
      response_body?: unknown;
      error?: string;
      user_agent?: string;
      ip_address?: string;
    };
    
    // Sanitize logs to remove PII (batch processing)
    return ((data || []) as ApiCallLogRow[]).map((log) => ({
      id: log.id,
      tenantId: log.tenant_id,
      userId: log.user_id,
      apiKeyId: log.api_key_id,
      method: log.method,
      path: log.path,
      statusCode: log.status_code,
      responseTime: log.response_time,
      timestamp: new Date(log.created_at),
      headers: (() => {
        if (!log.headers || typeof log.headers !== 'object') {
          return undefined;
        }
        const sanitized = sanitizeApiData({ headers: log.headers as Record<string, string> });
        const sanitizedHeaders = sanitized.headers;
        if (sanitizedHeaders && typeof sanitizedHeaders === 'object' && !Array.isArray(sanitizedHeaders)) {
          return sanitizedHeaders as Record<string, string>;
        }
        return undefined;
      })(),
      query: (log.query && typeof log.query === 'object' ? log.query : {}) as Record<string, string>,
      body: sanitizeApiData({ body: log.body }).body,
      responseBody: sanitizeApiData({ body: log.response_body }).body,
      error: log.error,
      userAgent: log.user_agent,
      ipAddress: log.ip_address,
    }));
  } catch (error) {
    console.error('[getApiCallLogs] Error:', error);
    return [];
  }
}

/**
 * Get API call statistics
 */
export async function getApiCallStats(filters: ApiLogFilters = {}): Promise<{
  totalCalls: number;
  byMethod: Record<string, number>;
  byStatusCode: Record<number, number>;
  byPath: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
}> {
  const logs = await getApiCallLogs({ ...filters, limit: 10000 });
  
  const stats = {
    totalCalls: logs.length,
    byMethod: {} as Record<string, number>,
    byStatusCode: {} as Record<number, number>,
    byPath: {} as Record<string, number>,
    averageResponseTime: 0,
    errorRate: 0,
  };
  
  let totalResponseTime = 0;
  let errorCount = 0;
  
  for (const log of logs) {
    // Count by method
    const method = log.method || 'UNKNOWN';
    stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;
    
    // Count by status code
    const statusCode = log.statusCode || 0;
    stats.byStatusCode[statusCode] = (stats.byStatusCode[statusCode] || 0) + 1;
    
    // Count by path (normalize)
    const normalizedPath = (log.path || '').split('?')[0]; // Remove query params
    if (normalizedPath) {
      stats.byPath[normalizedPath] = (stats.byPath[normalizedPath] || 0) + 1;
    }
    
    // Calculate response time
    totalResponseTime += log.responseTime;
    
    // Count errors
    if (log.statusCode >= 400 || log.error) {
      errorCount++;
    }
  }
  
  stats.averageResponseTime = logs.length > 0 ? totalResponseTime / logs.length : 0;
  stats.errorRate = logs.length > 0 ? errorCount / logs.length : 0;
  
  return stats;
}

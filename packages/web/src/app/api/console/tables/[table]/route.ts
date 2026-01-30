import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionStatus } from '@/lib/get-subscription-status';
import { hasAccess } from '@/lib/subscription-access';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';
import { safeJsonParseWithDefault } from '@/lib/utils/safe-parse';

/**
 * Generic CRUD API Route for All Tables
 * 
 * GET    /api/console/tables/[table]     - List records with pagination
 * POST   /api/console/tables/[table]     - Create new record
 * GET    /api/console/tables/[table]?id= - Get single record
 * PATCH  /api/console/tables/[table]?id= - Update record
 * DELETE /api/console/tables/[table]?id= - Delete record
 * 
 * Supports all tables in public schema and other application schemas
 */

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(request: NextRequest) {
  try {
    // Check subscription access
    const subscription = await getSubscriptionStatus();
    if (!hasAccess(subscription.tier, 'canViewTables')) {
      return NextResponse.json(
        { error: 'Subscription required to view tables' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const pathParts = request.nextUrl.pathname.split('/');
    const table = pathParts[pathParts.length - 1] || searchParams.get('table');
    const id = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const schema = searchParams.get('schema') || 'public';
    
    if (!table) {
      return NextResponse.json({ error: 'Table name required' }, { status: 400 });
    }
    
    const tableName = `${schema}.${table}`;
    
    // Get single record by ID
    if (id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return NextResponse.json({ data });
    }
    
    // Try using RPC function first (more efficient)
    try {
      const filters = searchParams.get('filters') || '{}';
      const orderBy = searchParams.get('orderBy') || 'created_at';
      const orderAsc = searchParams.get('orderAsc') === 'true';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_table_records', {
        p_table_schema: schema,
        p_table_name: table,
        p_limit: limit,
        p_offset: offset,
        p_filters: safeJsonParseWithDefault(filters, {}, "table filters query param"),
        p_order_by: orderBy,
        p_order_asc: orderAsc,
      } as any); // RPC types not fully generated
      
      if (!rpcError && rpcData && Array.isArray(rpcData) && (rpcData as unknown[]).length > 0) {
        const result = rpcData[0] as { data?: unknown[]; total_count?: number | string };
        return NextResponse.json({
          data: Array.isArray(result.data) ? result.data : [],
          count: Number(result.total_count) || 0,
          limit,
          offset,
        });
      }
    } catch {
      // Fall back to direct query
    }
    
    // List records with pagination (fallback)
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    const filters = searchParams.get('filters');
    if (filters) {
      const filterObj = safeJsonParseWithDefault<Record<string, unknown>>(filters, {}, "table filters fallback");
      for (const [key, value] of Object.entries(filterObj)) {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      }
    }
    
    // Apply sorting
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const orderAsc = searchParams.get('orderAsc') !== 'false';
    query = query.order(orderBy, { ascending: orderAsc });
    
    const { data, error, count } = await query;
    
    if (error) {
      appLogger.error('Error fetching table data', error);
      // Never return 500 - return empty data with professional error message
      return NextResponse.json(
        { 
          error: 'Unable to retrieve table data',
          message: error.message || 'An error occurred while fetching table data.',
          actionable: 'Please verify your connection and try again. If the problem persists, contact support at support@settler.dev.',
          data: [],
          count: 0,
          limit,
          offset,
          retryable: true,
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ 
      data: data || [], 
      count: count || 0,
      limit,
      offset 
    });
  } catch (error: unknown) {
    appLogger.error('Error fetching table data', error);
    // Never return 500 - return empty data with professional error message
    return NextResponse.json(
      { 
        error: 'Unable to retrieve table data',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while fetching table data.',
        actionable: 'Please verify your connection and try again. If the problem persists, contact support at support@settler.dev.',
        data: [],
        count: 0,
        limit: parseInt(request.nextUrl.searchParams.get('limit') || '100'),
        offset: parseInt(request.nextUrl.searchParams.get('offset') || '0'),
        retryable: true,
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);

export const POST = withSecurity(
  withUniversalBillingGate(async function POST(request: NextRequest) {
  try {
    // Check subscription access for editing
    const subscription = await getSubscriptionStatus();
    if (!hasAccess(subscription.tier, 'canEditTables')) {
      return NextResponse.json(
        { error: 'Paid subscription required to edit tables' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const pathParts = request.nextUrl.pathname.split('/');
    const table = pathParts[pathParts.length - 1] || searchParams.get('table');
    const schema = searchParams.get('schema') || 'public';
    const body = await request.json();
    
    if (!table) {
      return NextResponse.json({ error: 'Table name required' }, { status: 400 });
    }
    
    // Try RPC function first
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_table_record', {
        p_table_schema: schema,
        p_table_name: table,
        p_data: body,
      } as any); // RPC types not fully generated
      
      if (!rpcError && rpcData) {
        return NextResponse.json({ data: rpcData }, { status: 201 });
      }
    } catch {
      // Fall back to direct insert
    }
    
    const tableName = `${schema}.${table}`;
    
    const { data, error } = await supabase
      .from(tableName)
      .insert(body)
      .select()
      .single();
    
    if (error) {
      appLogger.error('Direct insert error', error);
      // Never return 500 - return actionable error message
      return NextResponse.json(
        { 
          error: 'Unable to create record',
          message: error.message || 'An error occurred while creating the record.',
          actionable: 'Please verify your data format and try again. If the problem persists, contact support at support@settler.dev.',
          retryable: true,
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: unknown) {
    appLogger.error('Error creating record', error instanceof Error ? error : new Error(String(error)));
    // Never return 500 - return actionable error message
    return NextResponse.json({ 
      error: 'Unable to create record',
      message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      actionable: 'If this problem persists, please contact support at support@settler.dev.',
      retryable: true,
    }, { status: 200 });
  }
}, { feature: 'POST API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

export const PATCH = withSecurity(
  withUniversalBillingGate(async function PATCH(request: NextRequest) {
  try {
    // Check subscription access for editing
    const subscription = await getSubscriptionStatus();
    if (!hasAccess(subscription.tier, 'canEditTables')) {
      return NextResponse.json(
        { error: 'Paid subscription required to edit tables' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const pathParts = request.nextUrl.pathname.split('/');
    const table = pathParts[pathParts.length - 1] || searchParams.get('table');
    const id = searchParams.get('id');
    const schema = searchParams.get('schema') || 'public';
    const body = await request.json();
    
    if (!table || !id) {
      return NextResponse.json({ error: 'Table name and ID required' }, { status: 400 });
    }
    
    // Try RPC function first
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_table_record', {
        p_table_schema: schema,
        p_table_name: table,
        p_id: id,
        p_data: body,
      } as any); // RPC types not fully generated
      
      if (!rpcError && rpcData) {
        return NextResponse.json({ data: rpcData });
      }
    } catch {
      // Fall back to direct update
    }
    
    const tableName = `${schema}.${table}`;
    
    // Type assertion needed because table name is dynamic and TypeScript can't infer the schema
    // This is safe because we're updating arbitrary tables via the console API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from(tableName) as any)
      .update(body as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      appLogger.error('Update error', error);
      // Never return 500 - return actionable error message
      return NextResponse.json(
        { 
          error: 'Unable to update record',
          message: error.message || 'An error occurred while updating the record.',
          actionable: 'Please verify your data format and try again. If the problem persists, contact support at support@settler.dev.',
          retryable: true,
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ data });
  } catch (error: unknown) {
    appLogger.error('Error updating record', error instanceof Error ? error : new Error(String(error)));
    // Never return 500 - return actionable error message
    return NextResponse.json(
      { 
        error: 'Unable to update record',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while updating the record.',
        actionable: 'Please verify your data format and try again. If the problem persists, contact support at support@settler.dev.',
        retryable: true,
      },
      { status: 200 }
    );
  }
}, { feature: 'PATCH API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

export const DELETE = withSecurity(
  withUniversalBillingGate(async function DELETE(request: NextRequest) {
  try {
    // Check subscription access for editing
    const subscription = await getSubscriptionStatus();
    if (!hasAccess(subscription.tier, 'canEditTables')) {
      return NextResponse.json(
        { error: 'Paid subscription required to delete records' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const pathParts = request.nextUrl.pathname.split('/');
    const table = pathParts[pathParts.length - 1] || searchParams.get('table');
    const id = searchParams.get('id');
    const schema = searchParams.get('schema') || 'public';
    
    if (!table || !id) {
      return NextResponse.json({ error: 'Table name and ID required' }, { status: 400 });
    }
    
    // Try RPC function first
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rpcError } = await supabase.rpc('delete_table_record', {
        p_table_schema: schema,
        p_table_name: table,
        p_id: id,
      } as any); // RPC types not fully generated
      
      if (!rpcError) {
        return NextResponse.json({ success: true });
      }
    } catch {
      // Fall back to direct delete
    }
    
    const tableName = `${schema}.${table}`;
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      appLogger.error('Delete error', error);
      // Never return 500 - return actionable error message
      return NextResponse.json(
        { 
          error: 'Unable to delete record',
          message: error.message || 'An error occurred while deleting the record.',
          actionable: 'Please verify the record ID and try again. If the problem persists, contact support at support@settler.dev.',
          success: false,
          retryable: true,
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    appLogger.error('Error deleting record', error instanceof Error ? error : new Error(String(error)));
    // Never return 500 - return actionable error message
    return NextResponse.json(
      { 
        error: 'Unable to delete record',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while deleting the record.',
        actionable: 'Please verify your connection and try again. If the problem persists, contact support at support@settler.dev.',
        success: false,
        retryable: true,
      },
      { status: 200 }
    );
  }
}, { feature: 'DELETE API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 20 }, requireAuth: true }
);

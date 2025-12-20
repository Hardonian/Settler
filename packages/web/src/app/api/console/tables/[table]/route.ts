import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionStatus } from '@/lib/get-subscription-status';
import { hasAccess } from '@/lib/subscription-access';

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

export async function GET(request: NextRequest) {
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
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_table_records', {
        p_table_schema: schema,
        p_table_name: table,
        p_limit: limit,
        p_offset: offset,
        p_filters: JSON.parse(filters),
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
      try {
        const filterObj = JSON.parse(filters);
        for (const [key, value] of Object.entries(filterObj)) {
          if (value !== null && value !== undefined) {
            query = query.eq(key, value);
          }
        }
      } catch {
        // Invalid filters JSON, ignore
      }
    }
    
    // Apply sorting
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const orderAsc = searchParams.get('orderAsc') !== 'false';
    query = query.order(orderBy, { ascending: orderAsc });
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({ 
      data: data || [], 
      count: count || 0,
      limit,
      offset 
    });
  } catch (error: any) {
    console.error('Error fetching table data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    
    if (error) throw error;
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
    
    const { data, error } = await supabase
      .from(tableName)
      .update(body as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error updating record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

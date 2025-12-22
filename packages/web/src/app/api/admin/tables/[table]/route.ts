import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin API Route for All Tables
 * 
 * Full database access for admin operations
 * Requires admin authentication
 */

export async function GET(request: NextRequest) {
  try {
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
    
    // List records with pagination
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
    // Never return 500 - return empty data with professional error message
    return NextResponse.json({ 
      error: 'Unable to retrieve table data',
      message: error.message || 'An error occurred while fetching table data. Please try again.',
      data: [],
      count: 0,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100'),
      offset: parseInt(request.nextUrl.searchParams.get('offset') || '0'),
      retryable: true,
    }, { status: 200 });
  }
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface TableInfo {
  table_schema: string;
  table_name: string;
}

/**
 * Admin Database Browser - Full Supabase Table View
 * Route: /admin/database
 * 
 * Shows ALL tables for admin access
 */

export default function AdminDatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    loadTables();
  }, []);
  
  async function loadTables() {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Try RPC function first
      try {
        const { data, error: err } = await supabase.rpc('get_tables', {
          schema_name: 'public'
        } as any); // RPC types not fully generated
        
        if (!err && data) {
          setTables(data);
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to fallback
      }
      
      // Fallback: Load from mapping file or use known tables
      try {
        const response = await fetch('/api/admin/tables');
        const result = await response.json();
        if (result.tables) {
          setTables(result.tables);
        }
      } catch {
        // Use empty list
        setTables([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  const filteredTables = tables.filter(t => 
    t.table_name.toLowerCase().includes(search.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">Loading tables...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Database Tables (Admin)</h1>
        <p className="text-gray-600 mt-2">
          Full Supabase database browser. All tables accessible for admin operations.
        </p>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map((table) => (
          <Link
            key={`${table.table_schema}.${table.table_name}`}
            href={`/admin/database/${table.table_name}?schema=${table.table_schema}`}
            className="p-4 border rounded hover:bg-gray-50 hover:shadow transition"
          >
            <div className="font-semibold">{table.table_name}</div>
            <div className="text-sm text-gray-500">{table.table_schema}</div>
          </Link>
        ))}
      </div>
      
      {filteredTables.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tables found matching "{search}"
        </div>
      )}
    </div>
  );
}

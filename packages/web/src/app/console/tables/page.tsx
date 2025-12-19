'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionGate } from '@/components/console/SubscriptionGate';

interface TableInfo {
  table_schema: string;
  table_name: string;
}

/**
 * Table Browser - Lists all available tables
 * Route: /console/tables
 */

export default function TablesPage() {
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
        });
        
        if (!err && data) {
          setTables(data);
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to fallback
      }
      
      // Only show API service tables (Receipts, Reconciliation, Feature Flags, Webhooks)
      const apiServiceTables = [
        // Receipts API
        'receipt_uploads', 'receipts', 'receipt_items',
        // Reconciliation API
        'recon_jobs', 'recon_results', 'recon_templates', 'recon_audits', 'recon_runs',
        'mapping_templates', 'transform_recipes', 'validation_rules', 'contract_versions',
        'drift_events', 'workflow_runs',
        // Feature Flags API
        'feature_flags', 'feature_flag_environments', 'feature_flag_overrides',
        // Webhooks
        'webhooks', 'webhook_deliveries',
        // API Keys & Authentication
        'api_keys', 'idempotency_keys',
        // Usage Tracking
        'usage_events', 'usage_aggregate_daily', 'usage_counters',
        // Billing
        'billing_accounts', 'subscriptions', 'add_ons', 'add_on_purchases',
        // Ingestion Pipeline
        'ingestion_sources', 'ingestions', 'raw_records', 'normalized_transactions',
        'reconciliation_runs', 'reconciliation_matches', 'exports',
      ];
      
      const availableTables: TableInfo[] = apiServiceTables.map(name => ({
        table_schema: 'public',
        table_name: name,
      }));
      
      setTables(availableTables);
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
    <SubscriptionGate requiredTier="subscribed_unpaid" feature="API Service Tables">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">API Service Tables</h1>
        <p className="text-gray-600 mb-6">
          Browse and manage tables for Settler's core API services: Receipts, Reconciliation, Feature Flags, and Webhooks.
          Use this to test API calls, webhooks, CLI commands, and SDK operations.
        </p>
      
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
            href={`/console/tables/${table.table_name}?schema=${table.table_schema}`}
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
    </SubscriptionGate>
  );
}

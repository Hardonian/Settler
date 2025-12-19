'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
      
      // Fallback: Use known tables from golden migration
      const knownTables = [
        'account_balances', 'activation_checklist', 'activity_log', 'activity_logs',
        'add_on_purchases', 'add_ons', 'advisor_findings', 'advisors_findings',
        'affiliate_conversions', 'affiliates', 'agent_runs', 'ai_analyses',
        'ai_analysis_usage', 'ai_usage_events', 'ai_usage_quotas', 'alert_notifications',
        'alert_rules', 'alerts', 'analytics_events', 'anomaly_events', 'api_keys',
        'architecture_violations', 'audit_logs', 'automated_decisions', 'billing_accounts',
        'billing_customers', 'billing_disputes', 'billing_reconciliation_log',
        'billing_subscriptions', 'blocked_ips', 'canned_responses', 'chatbot_analytics',
        'chatbot_conversations', 'chat_message_embeddings', 'chat_messages', 'chat_threads',
        'circuit_breakers', 'cms_audit', 'cms_media', 'cms_pages', 'cms_page_versions',
        'confidence_events', 'console_activities', 'contacts', 'contract_versions',
        'conversation_members', 'conversations', 'conversation_summaries', 'cron_targets',
        'customer_segments', 'diagnostics', 'drift_events', 'email_automation',
        'email_sequences', 'email_sends', 'entitlements', 'error_logs', 'experiment_metric_events',
        'experiment_variants', 'experiments', 'exports', 'feature_flag_environments',
        'feature_flag_overrides', 'feature_flags', 'financial_insights', 'health_checks',
        'idempotency_keys', 'ingestion_sources', 'ingestions', 'integration_credentials',
        'normalized_transactions', 'onboarding_events', 'onboarding_progress',
        'ops_insights', 'ops_recommendations', 'rate_limits', 'raw_records',
        'reality_events', 'reality_metrics', 'reconciliation_matches', 'reconciliation_runs',
        'receipt_items', 'receipt_uploads', 'receipts', 'recon_audits', 'recon_jobs',
        'recon_results', 'recon_templates', 'recon_runs', 'revoked_tokens',
        'shareable_artifacts', 'stripe_events', 'subscriptions', 'support_tickets',
        'tenant_branding', 'tenant_navigation', 'tenant_onboarding_progress',
        'tenant_page_revisions', 'tenant_pages', 'tenants', 'usage_aggregate_daily',
        'usage_counters', 'usage_events', 'user_lifecycle', 'webhook_deliveries', 'webhooks',
        'workspace_invites', 'workspaces'
      ];
      
      const availableTables: TableInfo[] = knownTables.map(name => ({
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
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Database Tables</h1>
      <p className="text-gray-600 mb-6">
        Browse and manage all database tables. Click on a table to view and edit records.
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
  );
}

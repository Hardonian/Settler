import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin API - List All Tables
 * 
 * Returns all tables in the database for admin browser
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Try RPC function
    try {
      const { data, error } = await supabase.rpc('get_tables', {
        schema_name: 'public'
      });
      
      if (!error && data) {
        return NextResponse.json({ tables: data });
      }
    } catch {
      // Fall through
    }
    
    // Fallback: return known tables
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
    
    const tables = knownTables.map(name => ({
      table_schema: 'public',
      table_name: name,
    }));
    
    return NextResponse.json({ tables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

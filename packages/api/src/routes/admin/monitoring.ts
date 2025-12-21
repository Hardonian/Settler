/**
 * Admin Monitoring Routes
 * 
 * Provides comprehensive monitoring metrics for admin dashboard.
 */

import { Router } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { supabase } from '../../infrastructure/supabase/client';
import { getSLAComplianceMetrics, checkSLAViolations } from '../../services/sla/tracker';
import { enforceAllRetentionPolicies } from '../../services/data-retention/enforcer';
import { logError } from '../../utils/logger';

export function createMonitoringRouter(): Router {
  const router = Router();

  /**
   * Get overall system health metrics
   */
  router.get('/health', async (req: AuthRequest, res) => {
    try {
      // Get basic system metrics
      const { data: customers, error: customersError } = await supabase
        .from('billing_accounts')
        .select('id, status')
        .eq('status', 'active')
        .is('deleted_at', null);

      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('id, status')
        .in('status', ['active', 'trialing']);

      const { data: tickets, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('id, status, sla_violated')
        .eq('status', 'open');

      const activeCustomers = customers?.length || 0;
      const activeSubscriptions = subscriptions?.length || 0;
      const openTickets = tickets?.length || 0;
      const slaViolations = tickets?.filter(t => t.sla_violated).length || 0;

      res.json({
        status: 'healthy',
        metrics: {
          active_customers: activeCustomers,
          active_subscriptions: activeSubscriptions,
          open_support_tickets: openTickets,
          sla_violations: slaViolations,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logError('Error fetching system health', error);
      res.status(500).json({ error: 'Failed to fetch system health' });
    }
  });

  /**
   * Get SLA compliance metrics
   */
  router.get('/sla', async (req: AuthRequest, res) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      const endDate = new Date();

      // Get all billing accounts
      const { data: accounts } = await supabase
        .from('billing_accounts')
        .select('id, plan_id')
        .eq('status', 'active')
        .is('deleted_at', null);

      const slaMetrics = [];
      for (const account of accounts || []) {
        const metrics = await getSLAComplianceMetrics(account.id, startDate, endDate);
        slaMetrics.push({
          billing_account_id: account.id,
          tier: account.plan_id || 'free',
          ...metrics,
        });
      }

      // Get current violations
      const violations = await checkSLAViolations();

      res.json({
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        accounts: slaMetrics,
        violations: {
          current: violations.violations,
          alerts_sent: violations.alerts_sent,
        },
      });
    } catch (error) {
      logError('Error fetching SLA metrics', error);
      res.status(500).json({ error: 'Failed to fetch SLA metrics' });
    }
  });

  /**
   * Get data retention status
   */
  router.get('/data-retention', async (req: AuthRequest, res) => {
    try {
      // Get all billing accounts with their tiers
      const { data: accounts } = await supabase
        .from('billing_accounts')
        .select('id, plan_id')
        .eq('status', 'active')
        .is('deleted_at', null);

      const retentionStatus = [];
      for (const account of accounts || []) {
        // Get data counts
        const { count: reconciliations } = await supabase
          .from('reconciliation_runs')
          .select('*', { count: 'exact', head: true })
          .eq('billing_account_id', account.id);

        const { count: receipts } = await supabase
          .from('receipts')
          .select('*', { count: 'exact', head: true })
          .eq('billing_account_id', account.id);

        const { count: usageEvents } = await supabase
          .from('usage_events')
          .select('*', { count: 'exact', head: true })
          .eq('billing_account_id', account.id);

        retentionStatus.push({
          billing_account_id: account.id,
          tier: account.plan_id || 'free',
          data_counts: {
            reconciliations: reconciliations || 0,
            receipts: receipts || 0,
            usage_events: usageEvents || 0,
          },
        });
      }

      res.json({
        accounts: retentionStatus,
        last_enforcement: null, // Would track last enforcement time
      });
    } catch (error) {
      logError('Error fetching data retention status', error);
      res.status(500).json({ error: 'Failed to fetch data retention status' });
    }
  });

  /**
   * Get unit economics metrics
   */
  router.get('/unit-economics', async (req: AuthRequest, res) => {
    try {
      // Get all active subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id, billing_account_id, plan_id, status, current_period_start, current_period_end')
        .in('status', ['active', 'trialing']);

      let totalMRR = 0;
      const planPricing: Record<string, number> = {
        free: 0,
        starter: 99,
        growth: 599,
        scale: 4999,
        enterprise: 0, // Custom pricing
      };

      const planCounts: Record<string, number> = {};
      for (const sub of subscriptions || []) {
        const planId = sub.plan_id || 'free';
        planCounts[planId] = (planCounts[planId] || 0) + 1;
        totalMRR += planPricing[planId] || 0;
      }

      // Get usage metrics
      const { data: usage } = await supabase
        .from('usage_aggregate_daily')
        .select('event_type, total_quantity')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      const totalReconciliations = usage?.reduce((sum, u) => {
        if (u.event_type === 'reconciliation_job') {
          return sum + Number(u.total_quantity || 0);
        }
        return sum;
      }, 0) || 0;

      res.json({
        mrr: totalMRR,
        active_subscriptions: subscriptions?.length || 0,
        plan_distribution: planCounts,
        usage: {
          total_reconciliations_30d: totalReconciliations,
        },
        calculated_metrics: {
          arpu: subscriptions?.length ? totalMRR / subscriptions.length : 0,
          cost_per_reconciliation: 0.0006, // From pricing logic
        },
      });
    } catch (error) {
      logError('Error fetching unit economics', error);
      res.status(500).json({ error: 'Failed to fetch unit economics' });
    }
  });

  /**
   * Get operational metrics
   */
  router.get('/operational', async (req: AuthRequest, res) => {
    try {
      // Get support ticket metrics
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('status, priority, sla_met, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const ticketMetrics = {
        total: tickets?.length || 0,
        open: tickets?.filter(t => t.status === 'open').length || 0,
        resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
        sla_met: tickets?.filter(t => t.sla_met === true).length || 0,
        sla_missed: tickets?.filter(t => t.sla_met === false).length || 0,
        by_priority: {
          critical: tickets?.filter(t => t.priority === 'critical').length || 0,
          high: tickets?.filter(t => t.priority === 'high').length || 0,
          medium: tickets?.filter(t => t.priority === 'medium').length || 0,
          low: tickets?.filter(t => t.priority === 'low').length || 0,
        },
      };

      res.json({
        support: ticketMetrics,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      });
    } catch (error) {
      logError('Error fetching operational metrics', error);
      res.status(500).json({ error: 'Failed to fetch operational metrics' });
    }
  });

  /**
   * Get business metrics
   */
  router.get('/business', async (req: AuthRequest, res) => {
    try {
      // Get customer metrics
      const { data: customers } = await supabase
        .from('billing_accounts')
        .select('id, created_at, status')
        .is('deleted_at', null);

      const totalCustomers = customers?.length || 0;
      const activeCustomers = customers?.filter(c => c.status === 'active').length || 0;
      
      // Calculate churn (customers deleted in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data: churnedCustomers } = await supabase
        .from('billing_accounts')
        .select('id')
        .not('deleted_at', 'is', null)
        .gte('deleted_at', thirtyDaysAgo.toISOString());

      const churnRate = totalCustomers > 0 
        ? ((churnedCustomers?.length || 0) / totalCustomers) * 100 
        : 0;

      res.json({
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          churned_30d: churnedCustomers?.length || 0,
          churn_rate: churnRate,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logError('Error fetching business metrics', error);
      res.status(500).json({ error: 'Failed to fetch business metrics' });
    }
  });

  return router;
}

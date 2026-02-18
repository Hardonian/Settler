import { createClient } from '@/lib/supabase/server';
import { getAppEnvStatus } from '@/lib/env/runtime-access';
import { appLogger } from '@/lib/utils/logger';

export type InvestorRealityData = {
  revenue: {
    mrr: number;
    mrr_growth: number | null;
    active_subscriptions: number;
    churn: number | null;
    status: 'proven' | 'assumed' | 'broken';
  };
  usage: {
    dau: number;
    wau: number;
    active_tenants: number;
    status: 'proven' | 'assumed' | 'broken';
  };
  reliability: {
    uptime_proxy: number | null;
    failure_events: number;
  };
  evidence_index: number;
  risk_index: number;
  week_start: string | null;
  last_updated: string;
};

const DEFAULT_INVESTOR_REALITY_DATA: InvestorRealityData = {
  revenue: {
    mrr: 0,
    mrr_growth: null,
    active_subscriptions: 0,
    churn: null,
    status: 'assumed',
  },
  usage: {
    dau: 0,
    wau: 0,
    active_tenants: 0,
    status: 'assumed',
  },
  reliability: {
    uptime_proxy: null,
    failure_events: 0,
  },
  evidence_index: 0,
  risk_index: 0,
  week_start: null,
  last_updated: new Date().toISOString(),
};

function asNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

export async function getInvestorRealityData(): Promise<InvestorRealityData> {
  if (!getAppEnvStatus().ok) {
    return { ...DEFAULT_INVESTOR_REALITY_DATA, last_updated: new Date().toISOString() };
  }

  try {
    const supabase = await createClient();
    const { data: metrics, error } = await supabase
      .from('reality_metrics')
      .select('category,name,value,status,week_start,last_updated')
      .in('category', ['revenue', 'usage', 'failure']);

    if (error) {
      appLogger.error('Error fetching investor reality metrics', error);
      return { ...DEFAULT_INVESTOR_REALITY_DATA, last_updated: new Date().toISOString() };
    }

    const rows = (metrics || []) as Array<{ category: string; name: string; value: unknown; status?: 'proven' | 'assumed' | 'broken'; week_start?: string | null; last_updated?: string }>;
    const pick = (category: string, name: string) => rows.find((row) => row.category === category && row.name === name);

    const revenueStatus = pick('revenue', 'mrr')?.status ?? 'assumed';
    const usageStatus = pick('usage', 'dau')?.status ?? 'assumed';
    const evidenceSignals = [revenueStatus, usageStatus, pick('failure', 'hard_500_count')?.status ?? 'assumed'];

    const timestampCandidates = rows.map((row) => row.last_updated).filter((value): value is string => Boolean(value)).sort();

    const failureEvents = asNumber(pick('failure', 'critical_failure_events')?.value) ?? 0;
    const hard500Count = asNumber(pick('failure', 'hard_500_count')?.value) ?? 0;

    return {
      revenue: {
        mrr: asNumber(pick('revenue', 'mrr')?.value) ?? 0,
        mrr_growth: asNumber(pick('revenue', 'mrr_growth')?.value),
        active_subscriptions: asNumber(pick('revenue', 'active_subscriptions')?.value) ?? 0,
        churn: asNumber(pick('revenue', 'churn')?.value),
        status: revenueStatus,
      },
      usage: {
        dau: asNumber(pick('usage', 'dau')?.value) ?? 0,
        wau: asNumber(pick('usage', 'wau')?.value) ?? 0,
        active_tenants: asNumber(pick('usage', 'active_tenants')?.value) ?? 0,
        status: usageStatus,
      },
      reliability: {
        uptime_proxy: hard500Count === 0 ? 99.9 : null,
        failure_events: failureEvents,
      },
      evidence_index: Math.round((evidenceSignals.filter((status) => status === 'proven').length / evidenceSignals.length) * 100),
      risk_index: failureEvents + hard500Count,
      week_start: pick('revenue', 'mrr')?.week_start ?? null,
      last_updated: timestampCandidates.at(-1) ?? new Date().toISOString(),
    };
  } catch (error) {
    appLogger.error('Error in investor reality data service', error);
    return { ...DEFAULT_INVESTOR_REALITY_DATA, last_updated: new Date().toISOString() };
  }
}

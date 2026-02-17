import { createClient } from '@/lib/supabase/server';
import { getAppEnvStatus } from '@/lib/env/runtime-access';
import { appLogger } from '@/lib/utils/logger';

export type PublicRealityResponse = {
  uptime_proxy: number | null;
  last_incident: { timestamp: string; event: string } | null;
  hard_500_count: number;
  status: string;
  data_isolation?: {
    model: string;
    enforced_at: string;
    status: string;
  };
  compliance_actions?: {
    data_deletion: string;
    data_export: string;
    access_revocation: string;
    status: string;
  };
  deployment_maturity?: {
    multi_region: boolean;
    multi_platform: boolean;
    status: string;
  };
  timestamp: string;
};

export const DEFAULT_PUBLIC_REALITY_RESPONSE: PublicRealityResponse = {
  uptime_proxy: null,
  last_incident: null,
  hard_500_count: 0,
  status: 'assumed',
  timestamp: new Date().toISOString(),
};

export async function getPublicRealityData(): Promise<PublicRealityResponse> {
  if (!getAppEnvStatus().ok) {
    return {
      ...DEFAULT_PUBLIC_REALITY_RESPONSE,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const supabase = await createClient();

    const { data: metrics, error: metricsError } = await supabase
      .from('reality_metrics')
      .select('category, name, value, status, last_updated')
      .in('category', ['failure', 'deployment'])
      .order('category', { ascending: true });

    if (metricsError) {
      appLogger.error('Error fetching public reality metrics', metricsError);
      return {
        ...DEFAULT_PUBLIC_REALITY_RESPONSE,
        timestamp: new Date().toISOString(),
      };
    }

    const metricsArray = (metrics || []) as Array<{ name: string; value: unknown; status: string }>;
    const hard500Metric = metricsArray.find((metric) => metric.name === 'hard_500_count');

    const { data: lastIncidentData } = await supabase
      .from('reality_events')
      .select('created_at, event_name, severity')
      .eq('category', 'failure')
      .eq('severity', 'critical')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastIncident = lastIncidentData as {
      created_at?: string;
      event_name?: string;
    } | null;

    const hard500Value = hard500Metric?.value;
    const uptimeProxy = typeof hard500Value === 'number' && hard500Value === 0 ? 99.9 : null;

    return {
      uptime_proxy: uptimeProxy,
      last_incident:
        lastIncident && lastIncident.created_at && lastIncident.event_name
          ? {
              timestamp: lastIncident.created_at,
              event: lastIncident.event_name,
            }
          : null,
      hard_500_count: typeof hard500Value === 'number' ? hard500Value : 0,
      status: hard500Metric?.status ?? 'assumed',
      data_isolation: {
        model: 'Row Level Security (RLS)',
        enforced_at: 'database',
        status: 'proven',
      },
      compliance_actions: {
        data_deletion: 'supported',
        data_export: 'supported',
        access_revocation: 'supported',
        status: 'assumed',
      },
      deployment_maturity: {
        multi_region: false,
        multi_platform: false,
        status: 'assumed',
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    appLogger.error('Error in public reality data service', error);
    return {
      ...DEFAULT_PUBLIC_REALITY_RESPONSE,
      timestamp: new Date().toISOString(),
    };
  }
}

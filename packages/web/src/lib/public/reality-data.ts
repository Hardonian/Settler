import { createClient } from '@/lib/supabase/server';
import { getAppEnvStatus } from '@/lib/env/runtime-access';
import { appLogger } from '@/lib/utils/logger';

export type PublicRealityResponse = {
  /** Never derived into an uptime percentage without external monitoring evidence. */
  uptime_proxy: number | null;
  last_incident: { timestamp: string; event: string } | null;
  hard_500_count: number;
  /** Machine-visible: whether metrics came from DB or defaulted. */
  metrics_source: 'reality_tables' | 'unavailable';
  status: string;
  data_isolation?: {
    model: string;
    enforced_at: string;
    /** RLS is a product mechanism — not a substitute for a customer security assessment. */
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
  metrics_source: 'unavailable',
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

    return {
      // Do not infer SLA/uptime from a single counter; null means "not published as a percent".
      uptime_proxy: null,
      last_incident:
        lastIncident && lastIncident.created_at && lastIncident.event_name
          ? {
              timestamp: lastIncident.created_at,
              event: lastIncident.event_name,
            }
          : null,
      hard_500_count: typeof hard500Value === 'number' ? hard500Value : 0,
      metrics_source: 'reality_tables',
      status: hard500Metric?.status ?? 'assumed',
      data_isolation: {
        model: 'Row Level Security (RLS)',
        enforced_at: 'database',
        status: 'implemented_in_product',
      },
      compliance_actions: {
        data_deletion: 'workflow_supported_subject_to_policy',
        data_export: 'workflow_supported_subject_to_policy',
        access_revocation: 'workflow_supported_subject_to_policy',
        status: 'not_a_compliance_attestation',
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

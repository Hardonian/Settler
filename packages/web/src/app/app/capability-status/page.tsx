import { headers } from 'next/headers';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

type StatusPayload = {
  overallStatus?: string;
  systems?: Array<{ name?: string; status?: string }>;
  connectivity?: {
    checks?: Record<string, { ok?: boolean; status?: string; reason?: string }>;
    degraded_reasons?: string[];
    timestamp?: string;
  };
  error?: string;
};

type HealthPayload = {
  kind?: string;
  status?: string;
  healthy?: boolean;
  degraded_reasons?: string[];
  timestamp?: string;
  error?: string;
};

type Capability = {
  name: string;
  maturity: string;
  visibility: string;
  gating: string;
};

async function fetchLocal<T>(route: string): Promise<T | null> {
  const h = await headers();
  const host = h.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  try {
    const res = await fetch(`${protocol}://${host}${route}`, {
      cache: 'no-store',
      headers: { authorization: h.get('authorization') || '' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function loadCapabilities(): Promise<Capability[]> {
  try {
    const file = path.join(process.cwd(), 'docs/reference/capability-surface.registry.json');
    const json = JSON.parse(await fs.readFile(file, 'utf8'));
    return json.capabilities ?? [];
  } catch {
    return [];
  }
}

function systemStatusIcon(status?: string) {
  const s = (status ?? '').toLowerCase();
  if (s === 'operational' || s === 'ok' || s === 'healthy') {
    return <CheckCircle className="h-4 w-4 text-green-600 shrink-0" aria-hidden="true" />;
  }
  if (s === 'degraded' || s === 'warning') {
    return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />;
  }
  if (s === 'down' || s === 'error' || s === 'critical') {
    return <XCircle className="h-4 w-4 text-red-500 shrink-0" aria-hidden="true" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />;
}

function formatTimestamp(ts?: string): string {
  if (!ts) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ts));
  } catch {
    return ts;
  }
}

export default async function CapabilityStatusPage() {
  const [status, health, capabilities] = await Promise.all([
    fetchLocal<StatusPayload>('/api/status'),
    fetchLocal<HealthPayload>('/api/status/health'),
    loadCapabilities(),
  ]);

  const connectivityHealthy = health?.healthy === true;
  const healthStatus = health?.status ?? 'unavailable';

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Capability Status
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Availability and operational posture
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Combines runtime status endpoints with the surfaced capability registry. Health here means
          point-in-time dependency connectivity — not KPIs, engagement, or historical uptime.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {/* System status */}
        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground">System Status</h2>
          {status ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                {systemStatusIcon(status.overallStatus)}
                <span className="text-sm font-medium capitalize text-foreground">
                  {status.overallStatus ?? 'Unknown'}
                </span>
              </div>
              {status.systems && status.systems.length > 0 && (
                <ul className="mt-3 space-y-2" aria-label="System component statuses">
                  {status.systems.slice(0, 6).map((s) => (
                    <li key={s.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="flex items-center gap-1.5">
                        {systemStatusIcon(s.status)}
                        <span className="capitalize text-foreground">{s.status ?? 'unknown'}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {status.connectivity?.degraded_reasons &&
                status.connectivity.degraded_reasons.length > 0 && (
                  <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 font-mono break-all">
                    {status.connectivity.degraded_reasons.join(' · ')}
                  </p>
                )}
              {status.error && (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {status.error}
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Status endpoint unavailable.</p>
          )}
        </article>

        {/* Health check */}
        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground">Runtime connectivity</h2>
          {health ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                {systemStatusIcon(healthStatus)}
                <span className="text-sm font-medium capitalize text-foreground">{healthStatus}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {connectivityHealthy ? (
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
                )}
                <span className="text-sm text-muted-foreground">
                  {connectivityHealthy
                    ? 'Core probes succeeded'
                    : 'One or more connectivity probes failed — see degraded reasons'}
                </span>
              </div>
              {health.degraded_reasons && health.degraded_reasons.length > 0 && (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 font-mono break-all">
                  {health.degraded_reasons.join(' · ')}
                </p>
              )}
              {health.error && (
                <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">{health.error}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Last checked: {formatTimestamp(health.timestamp)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Health endpoint unavailable.</p>
          )}
        </article>
      </section>

      {capabilities.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground">Surfaced Capabilities</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {capabilities.map((cap) => (
              <article key={cap.name} className="rounded border border-border p-3 text-sm">
                <p className="font-medium text-foreground">{cap.name}</p>
                <dl className="mt-1 space-y-0.5">
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-16 shrink-0">Maturity</dt>
                    <dd className="text-foreground capitalize">{cap.maturity}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-16 shrink-0">Visibility</dt>
                    <dd className="text-foreground capitalize">{cap.visibility}</dd>
                  </div>
                </dl>
                {cap.gating && (
                  <p className="mt-2 text-xs text-muted-foreground">{cap.gating}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import { headers } from 'next/headers';
import fs from 'node:fs/promises';
import path from 'node:path';

type StatusPayload = {
  overallStatus?: string;
  systems?: Array<{ name?: string; status?: string }>;
  error?: string;
};

type HealthPayload = {
  status?: string;
  allCylindersFiring?: boolean;
  timestamp?: string;
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
    const res = await fetch(`${protocol}://${host}${route}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function loadCapabilities(): Promise<Capability[]> {
  const file = path.join(process.cwd(), 'docs/reference/capability-surface.registry.json');
  const json = JSON.parse(await fs.readFile(file, 'utf8'));
  return json.capabilities;
}

export default async function CapabilityStatusPage() {
  const [status, health, capabilities] = await Promise.all([
    fetchLocal<StatusPayload>('/api/status'),
    fetchLocal<HealthPayload>('/api/status/health'),
    loadCapabilities(),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Capability Status</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Availability and operational posture</h1>
        <p className="mt-2 text-sm text-slate-600">
          This page combines runtime status endpoints with the surfaced capability registry.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">System status API</h2>
          <p className="mt-2 text-sm text-slate-700">Overall: {status?.overallStatus ?? 'unavailable'}</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {(status?.systems ?? []).slice(0, 6).map((s) => (
              <li key={s.name}>{s.name}: {s.status ?? 'unknown'}</li>
            ))}
          </ul>
          {status?.error ? <p className="mt-2 text-sm text-amber-700">{status.error}</p> : null}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Health API</h2>
          <p className="mt-2 text-sm text-slate-700">Status: {health?.status ?? 'unavailable'}</p>
          <p className="text-sm text-slate-600">All cylinders firing: {String(health?.allCylindersFiring ?? false)}</p>
          <p className="text-xs text-slate-500">Timestamp: {health?.timestamp ?? 'not returned'}</p>
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Surfaced capabilities</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {capabilities.map((cap) => (
            <article key={cap.name} className="rounded border border-slate-200 p-3 text-sm">
              <p className="font-medium text-slate-900">{cap.name}</p>
              <p className="text-slate-600">Maturity: {cap.maturity}</p>
              <p className="text-slate-600">Visibility: {cap.visibility}</p>
              <p className="mt-1 text-xs text-slate-500">{cap.gating}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

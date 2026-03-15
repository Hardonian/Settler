import { headers } from "next/headers";
import Link from "next/link";

type Run = {
  run_id: string;
  created_at: string;
  status: string;
  policy?: string;
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function getRuns(): Promise<Run[]> {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(`${protocol}://${host}/api/v1/runs?limit=20`, {
    headers: { authorization: h.get("authorization") || "" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.rows ?? []) as Run[];
}

export default async function RunsPage() {
  const rows = await getRuns();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Execution Infrastructure
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Run Explorer</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Run ID</th>
              <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Created</th>
              <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Status</th>
              <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Policy</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center">
                  <p className="text-sm text-slate-500">No runs found.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Start a reconciliation workflow to populate this list. If you expect data,
                    verify API connectivity.
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.run_id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link
                      href={`/app/runs/${row.run_id}`}
                      className="text-primary hover:underline"
                    >
                      {row.run_id}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    <time dateTime={row.created_at}>{formatDate(row.created_at)}</time>
                  </td>
                  <td className="px-3 py-2">
                    <span className="capitalize text-slate-700">{row.status}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{row.policy ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

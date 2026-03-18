import { headers } from "next/headers";
import Link from "next/link";

type Run = {
  run_id: string;
  created_at: string;
  status: string;
  status_label?: string;
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

async function getRuns(): Promise<{ runs: Run[]; error?: string }> {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  try {
    const res = await fetch(`${protocol}://${host}/api/v1/runs?limit=20`, {
      headers: { authorization: h.get("authorization") || "" },
      cache: "no-store",
    });
    if (!res.ok) {
      return { runs: [], error: `Backend API failed with status ${res.status}.` };
    }
    const data = await res.json();
    return { runs: (data.rows ?? []) as Run[] };
  } catch {
    return { runs: [], error: "Network error connecting to internal API." };
  }
}

export default async function RunsPage() {
  const { runs, error } = await getRuns();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Execution Infrastructure
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Run Explorer</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold text-foreground">
                Run ID
              </th>
              <th scope="col" className="px-3 py-2 font-semibold text-foreground">
                Created
              </th>
              <th scope="col" className="px-3 py-2 font-semibold text-foreground">
                Status
              </th>
              <th scope="col" className="px-3 py-2 font-semibold text-foreground">
                Policy
              </th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No runs found.</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Start a reconciliation workflow to populate this list. If you expect data,
                    verify API connectivity.
                  </p>
                </td>
              </tr>
            ) : (
              runs.map((row) => (
                <tr key={row.run_id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link href={`/app/runs/${row.run_id}`} className="text-primary hover:underline">
                      {row.run_id}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <time dateTime={row.created_at}>{formatDate(row.created_at)}</time>
                  </td>
                  <td className="px-3 py-2">
                    <span className="capitalize text-foreground">
                      {row.status_label ?? row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.policy ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

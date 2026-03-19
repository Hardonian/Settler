import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getRunsList, RunListItem } from "@/lib/domain/runs/runs-reader";

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

async function getRuns(): Promise<{ runs: RunListItem[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const tenantId = user?.user_metadata?.tenant_id;

    if (!tenantId) {
      return { runs: [], error: "No active workspace context found." };
    }

    const runs = await getRunsList(tenantId, 20);
    return { runs };
  } catch (err: any) {
    console.error("[RunsPage] Error fetching runs:", err);
    return { runs: [], error: "Failed to connect to the database. Please try again." };
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
                    Start a reconciliation workflow to populate this list.
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

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getRunsList, RunListItem } from "@/lib/domain/runs/runs-reader";

async function getRuns(): Promise<RunListItem[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const tenantId = user?.user_metadata?.tenant_id;

    if (!tenantId) return [];

    return await getRunsList(tenantId, 50);
  } catch (err) {
    console.error("[MismatchesPage] Error fetching runs:", err);
    return [];
  }
}

export default async function MismatchesPage() {
  const runs = await getRuns();
  const mismatches = runs.filter((run) => run.status !== "completed");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Detected Mismatches</h1>
      <div className="mt-4 overflow-hidden rounded border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2 text-foreground">Run ID</th>
              <th className="px-3 py-2 text-foreground">Created</th>
              <th className="px-3 py-2 text-foreground">Status</th>
              <th className="px-3 py-2 text-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {mismatches.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  No mismatches detected yet. Run a reconciliation workflow to surface differences.
                </td>
              </tr>
            ) : (
              mismatches.map((row) => (
                <tr key={row.run_id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">{row.run_id}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.created_at}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                  <td className="px-3 py-2">
                    <Link href={`/app/runs/${row.run_id}`} className="text-primary hover:underline">
                      Review run
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

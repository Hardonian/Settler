import { headers } from "next/headers";
import Link from "next/link";

async function getRuns() {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(`${protocol}://${host}/api/v1/runs?limit=50`, {
    headers: { authorization: h.get("authorization") || "" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.rows || [];
}

export default async function MismatchesPage() {
  const runs = await getRuns();
  const mismatches = runs.filter((run: { status?: string }) => run.status !== "succeeded");

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
              mismatches.map((row: { run_id: string; created_at: string; status: string }) => (
                <tr key={row.run_id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">{row.run_id}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.created_at}</td>
                  <td className="px-3 py-2">{row.status}</td>
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

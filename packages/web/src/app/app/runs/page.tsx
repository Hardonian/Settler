import { headers } from "next/headers";
import Link from "next/link";

async function getRuns() {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(`${protocol}://${host}/api/v1/runs?limit=20`, {
    headers: { authorization: h.get("authorization") || "" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.rows || [];
}

export default async function RunsPage() {
  const rows = await getRuns();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Runs</h1>
      <div className="mt-4 overflow-hidden rounded border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">Run ID</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Policy</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  No runs found.
                </td>
              </tr>
            ) : (
              rows.map((row: any) => (
                <tr key={row.run_id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link href={`/app/runs/${row.run_id}`}>{row.run_id}</Link>
                  </td>
                  <td className="px-3 py-2">{row.created_at}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.policy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

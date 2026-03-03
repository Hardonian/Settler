import { headers } from "next/headers";

async function getRun(id: string) {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(`${protocol}://${host}/api/v1/runs/${id}`, {
    headers: { authorization: h.get("authorization") || "" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run)
    return <div className="rounded border border-slate-200 bg-white p-4">Run not found.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Run {run.id}</h1>
      <div className="rounded border border-slate-200 bg-white p-4 text-sm">
        <div>Status: {run.status}</div>
        <div>Created: {run.created_at}</div>
      </div>
    </div>
  );
}

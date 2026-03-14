"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface TableRecord {
  id: string;
  [key: string]: any;
}

/**
 * Admin Table Viewer - Full Database Access
 * Route: /admin/database/[table]
 *
 * Full CRUD access to any table for admin operations
 */

export default function AdminTablePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const table = (params?.table as string) || "";
  const schema = searchParams.get("schema") || "public";

  const [data, setData] = useState<TableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);

  useEffect(() => {
    if (table) {
      loadData();
    }
  }, [table, offset]);

  async function loadData() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        schema,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`/api/admin/tables/${table}?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      setData(result.data || []);
      setCount(result.count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !data.length) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  const displayName = table
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const columns = data.length > 0 && data[0] ? Object.keys(data[0]) : [];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/admin/database"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Database Browser
        </Link>
        <h1 className="text-2xl font-bold">{displayName}</h1>
        <p className="text-sm text-slate-500">
          {schema}.{table}
        </p>
        <p className="text-sm text-slate-500 mt-1">{count} total records</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((key) => (
                <th
                  key={key}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                {columns.map((key) => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {typeof record[key] === "object"
                      ? JSON.stringify(record[key]).substring(0, 50) + "..."
                      : String(record[key] || "").substring(0, 100)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {count > limit && (
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 bg-slate-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Showing {offset + 1}-{Math.min(offset + limit, count)} of {count}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= count}
            className="px-4 py-2 bg-slate-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

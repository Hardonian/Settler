'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type VarianceItem = {
  id: string;
  type: string;
  transaction_id?: string;
  settlement_id?: string;
  message: string;
  amount_diff_cents?: number;
  date_diff_days?: number;
};

export default function ViewVariancesPage() {
  const [variances, setVariances] = useState<VarianceItem[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('settler-engine-variances');
    if (stored) {
      setVariances(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 text-white">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">View Variances</h1>
        <p className="text-white/70">
          Variances are loaded from your last import session. If nothing appears, re-import a results bundle.
        </p>
        <Link href="/engine/import-results" className="text-sm text-blue-200 underline">
          ← Back to Import Results
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        {variances.length === 0 ? (
          <p className="text-sm text-white/70">No variances loaded yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {variances.map((item) => (
              <li key={item.id} className="rounded-lg bg-black/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-white">{item.type}</span>
                  <span className="text-xs text-white/60">{item.id}</span>
                </div>
                <p className="mt-2 text-xs text-white/70">{item.message}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/60">
                  {item.transaction_id ? <span>Transaction: {item.transaction_id}</span> : null}
                  {item.settlement_id ? <span>Settlement: {item.settlement_id}</span> : null}
                  {item.amount_diff_cents !== undefined ? (
                    <span>Amount diff (cents): {item.amount_diff_cents}</span>
                  ) : null}
                  {item.date_diff_days !== undefined ? (
                    <span>Date diff (days): {item.date_diff_days}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

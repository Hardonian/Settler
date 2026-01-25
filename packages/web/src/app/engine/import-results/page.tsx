'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { unzipSync, strFromU8 } from 'fflate';
import { z } from 'zod';

const varianceCountSchema = z.object({
  type: z.string(),
  count: z.number(),
});

const engineOutputSchema = z.object({
  schema_version: z.string(),
  tool_version: z.string(),
  normalization_summary: z.object({
    transactions: z.number(),
    settlements: z.number(),
    warnings: z.array(z.string()),
  }),
  variance_summary: z.object({
    total: z.number(),
    by_type: z.array(varianceCountSchema),
  }),
  variance_items_path: z.string(),
  evidence_manifest: z.object({
    schema_version: z.string(),
    tool_version: z.string(),
    generated_at: z.string(),
    input_files: z.array(z.object({ path: z.string(), sha256: z.string() })),
    outputs: z.array(z.object({ path: z.string(), sha256: z.string() })),
  }),
  deterministic_statement: z.string(),
});

type EngineOutput = z.infer<typeof engineOutputSchema>;

type VarianceItem = {
  id: string;
  type: string;
  transaction_id?: string;
  settlement_id?: string;
  message: string;
  amount_diff_cents?: number;
  date_diff_days?: number;
};

export default function ImportResultsPage() {
  const [engineOutput, setEngineOutput] = useState<EngineOutput | null>(null);
  const [variances, setVariances] = useState<VarianceItem[]>([]);
  const [status, setStatus] = useState<string>('');

  const handleEngineOutput = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = engineOutputSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      setStatus('engine_output.json failed schema validation.');
      return;
    }
    setEngineOutput(parsed.data);
    setStatus('engine_output.json loaded.');
    sessionStorage.setItem('settler-engine-output', JSON.stringify(parsed.data));
  }, []);

  const handleEvidenceBundle = useCallback(async (file: File) => {
    const data = new Uint8Array(await file.arrayBuffer());
    const unzipped = unzipSync(data);
    const varianceEntry = Object.keys(unzipped).find((key) => key.endsWith('variances.jsonl') || key.endsWith('variances.json'));
    if (!varianceEntry) {
      setStatus('Evidence bundle missing variances.jsonl.');
      return;
    }
    const content = strFromU8(unzipped[varianceEntry]);
    const items: VarianceItem[] = [];
    if (varianceEntry.endsWith('.jsonl')) {
      content
        .split('\n')
        .filter(Boolean)
        .forEach((line) => {
          items.push(JSON.parse(line));
        });
    } else {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        items.push(...parsed);
      }
    }
    setVariances(items);
    sessionStorage.setItem('settler-engine-variances', JSON.stringify(items));
    setStatus(`Loaded ${items.length} variance items.`);
  }, []);

  const varianceSummary = useMemo(() => {
    if (!engineOutput) return [];
    return engineOutput.variance_summary.by_type;
  }, [engineOutput]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 text-white">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">Import Results</h1>
        <p className="text-white/70">
          Upload the engine_output.json file and optional evidence bundle zip. The UI remains fully local and
          surfaces discrepancies without any server dependency.
        </p>
        <Link href="/engine" className="text-sm text-blue-200 underline">
          ← Back to Engine overview
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <label className="block text-sm font-medium">engine_output.json</label>
        <input
          type="file"
          accept="application/json"
          className="mt-2 w-full rounded border border-white/10 bg-black/30 p-2 text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleEngineOutput(file);
            }
          }}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <label className="block text-sm font-medium">Evidence bundle zip (optional)</label>
        <input
          type="file"
          accept="application/zip"
          className="mt-2 w-full rounded border border-white/10 bg-black/30 p-2 text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleEvidenceBundle(file);
            }
          }}
        />
      </div>

      {status ? <p className="text-sm text-emerald-200">{status}</p> : null}

      {engineOutput ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Variance Summary</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-black/30 p-3">
              <p className="text-xs text-white/60">Transactions</p>
              <p className="text-xl font-semibold">{engineOutput.normalization_summary.transactions}</p>
            </div>
            <div className="rounded-lg bg-black/30 p-3">
              <p className="text-xs text-white/60">Settlements</p>
              <p className="text-xl font-semibold">{engineOutput.normalization_summary.settlements}</p>
            </div>
            <div className="rounded-lg bg-black/30 p-3">
              <p className="text-xs text-white/60">Variances</p>
              <p className="text-xl font-semibold">{engineOutput.variance_summary.total}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            {varianceSummary.map((item) => (
              <li key={item.type}>
                {item.type}: {item.count}
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 text-sm text-white/70">
            <p>{engineOutput.deterministic_statement}</p>
            <p>
              Evidence manifest includes {engineOutput.evidence_manifest.input_files.length} input hashes and{' '}
              {engineOutput.evidence_manifest.outputs.length} output hashes.
            </p>
          </div>
        </div>
      ) : null}

      {variances.length ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Latest Variances</h2>
          <p className="mt-2 text-sm text-white/60">
            Showing the first 20 discrepancy items from the evidence bundle.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {variances.slice(0, 20).map((item) => (
              <li key={item.id} className="rounded-lg bg-black/30 p-3">
                <p className="text-white">{item.type}</p>
                <p className="text-xs text-white/60">{item.message}</p>
              </li>
            ))}
          </ul>
          <Link href="/engine/view-variances" className="mt-4 inline-block text-sm text-blue-200 underline">
            View full variance list →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

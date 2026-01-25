'use client';

import { useMemo, useState } from 'react';
import type { EvidenceManifest, NamedFile, VerificationResult } from '@/types/verification';
import { verifyBundle } from '@/lib/verify';

const bytesFromFile = async (file: File): Promise<number[]> => {
  const buffer = await file.arrayBuffer();
  return Array.from(new Uint8Array(buffer));
};

export default function VerifyClient() {
  const [manifestFile, setManifestFile] = useState<File | null>(null);
  const [bundleFiles, setBundleFiles] = useState<FileList | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle');

  const filesLabel = useMemo(() => {
    if (!bundleFiles || bundleFiles.length === 0) {
      return 'No bundle files selected.';
    }
    return `${bundleFiles.length} file(s) selected.`;
  }, [bundleFiles]);

  const runVerification = async () => {
    setError(null);
    setResult(null);
    if (!manifestFile || !bundleFiles) {
      setError('Select a manifest and bundle files before verifying.');
      return;
    }
    setStatus('running');
    try {
      const manifestText = await manifestFile.text();
      const manifest = JSON.parse(manifestText) as EvidenceManifest;

      const files: NamedFile[] = [];
      for (const file of Array.from(bundleFiles)) {
        files.push({
          path: file.name,
          bytes: await bytesFromFile(file),
        });
      }

      const verification = await verifyBundle(manifest, files);
      if (!verification) {
        setError('WASM verifier unavailable. Use the CLI verifier for offline checks.');
        setStatus('complete');
        return;
      }
      setResult(verification);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Verification failed.');
    } finally {
      setStatus('complete');
    }
  };

  return (
    <section className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Upload evidence bundle
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Select the manifest.json and any referenced files from your evidence bundle.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Manifest file
          <input
            type="file"
            accept="application/json"
            onChange={(event) => setManifestFile(event.target.files?.[0] ?? null)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2"
          />
          <span className="text-xs text-slate-500">
            {manifestFile ? manifestFile.name : 'No manifest selected.'}
          </span>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
          Bundle files
          <input
            type="file"
            multiple
            onChange={(event) => setBundleFiles(event.target.files)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2"
          />
          <span className="text-xs text-slate-500">{filesLabel}</span>
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runVerification}
          disabled={status === 'running'}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'running' ? 'Verifying…' : 'Run verification'}
        </button>
        <button
          type="button"
          onClick={() => {
            setManifestFile(null);
            setBundleFiles(null);
            setResult(null);
            setError(null);
            setStatus('idle');
          }}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          Reset
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Verification result
            </h3>
            <span
              className={
                result.success
                  ? 'text-green-600 font-semibold'
                  : 'text-red-600 font-semibold'
              }
            >
              {result.success ? 'Pass' : 'Fail'}
            </span>
          </div>
          {result.mismatches.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No mismatches detected.
            </p>
          ) : (
            <ul className="space-y-3">
              {result.mismatches.map((mismatch, index) => (
                <li
                  key={`${mismatch.path}-${index}`}
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
                >
                  <p className="font-semibold">{mismatch.path}</p>
                  <p>{mismatch.reason}</p>
                  <p className="text-xs">
                    Expected: {mismatch.expected ?? 'unknown'}
                  </p>
                  <p className="text-xs">
                    Actual: {mismatch.actual ?? 'unknown'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="text-xs text-slate-500">
        Verification runs locally in your browser when the wasm verifier is
        available. Otherwise, use the CLI verifier to surface discrepancies.
      </div>
    </section>
  );
}

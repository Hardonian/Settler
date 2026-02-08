import React from "react";

import { coerceReconRun, ReconItem, ReconRun } from "../../contracts/recon";
import { CsvOverlayAnnotation, CsvOverlayTable } from "./CsvOverlayTable";

export type ReconResultExplainerProps = {
  run?: ReconRun;
  rawJson?: unknown;
  rawCsv?: string;
  rawLog?: string;
  title?: string;
};

type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

const parseCsv = (csv?: string): ParsedCsv | null => {
  if (!csv) {
    return null;
  }

  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return null;
  }

  const rows = lines.map((line) => line.split(",").map((cell) => cell.trim()));
  const [headers, ...dataRows] = rows;

  return {
    headers: headers ?? [],
    rows: dataRows,
  };
};

const buildAnnotations = (items: ReconItem[]): CsvOverlayAnnotation[] =>
  items
    .map((item) => {
      const trace = item.sourceTrace;
      if (!trace || typeof trace.line !== "number") {
        return null;
      }

      const rowIndex = Math.max(trace.line - 2, 0);
      const column = trace.column;

      return {
        rowIndex,
        column,
        status: item.status,
        message: item.reason ?? item.reasonCategory,
      } satisfies CsvOverlayAnnotation;
    })
    .filter((annotation): annotation is CsvOverlayAnnotation => Boolean(annotation));

const formatCount = (value?: number) => (typeof value === "number" ? value.toString() : "—");

const summarizeItems = (items: ReconItem[]) => {
  const summary = { match: 0, missing: 0, drift: 0, mismatch: 0 } as const;
  const counts = { ...summary } as Record<keyof typeof summary, number>;

  items.forEach((item) => {
    if (counts[item.status] !== undefined) {
      counts[item.status] += 1;
    }
  });

  return counts;
};

export const ReconResultExplainer = ({
  run,
  rawJson,
  rawCsv,
  rawLog,
  title = "Reconciliation result",
}: ReconResultExplainerProps) => {
  const parsedRun = run ?? coerceReconRun(rawJson);
  const items = parsedRun?.items ?? [];
  const summaryCounts = parsedRun?.summary ?? summarizeItems(items);
  const summary = summaryCounts as Record<string, number | undefined>;
  const parsedCsv = parseCsv(rawCsv ?? parsedRun?.raw?.csv);
  const annotations = buildAnnotations(items);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{title}</h2>
        <p style={{ color: "#475569", margin: 0 }}>Run ID: {parsedRun?.runId ?? "Unknown"}</p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <strong>Matched</strong>
          <div>{formatCount(summary.matched ?? summary.match)}</div>
        </div>
        <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <strong>Missing</strong>
          <div>{formatCount(summary.missing)}</div>
        </div>
        <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <strong>Drift</strong>
          <div>{formatCount(summary.drift)}</div>
        </div>
        <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <strong>Mismatched</strong>
          <div>{formatCount(summary.mismatched ?? summary.mismatch)}</div>
        </div>
      </div>

      <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
        <h3 style={{ fontSize: 16, marginTop: 0 }}>Item explanations</h3>
        {items.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b" }}>No reconciliation items available.</p>
        ) : (
          <ul
            style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}
          >
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.status.toUpperCase()}</strong> —{" "}
                {item.reason ?? "No reason provided."}
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Category: {item.reasonCategory ?? "unclassified"} · Amount: {item.amount ?? "—"}{" "}
                  {item.currency ?? ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {parsedCsv ? (
        <CsvOverlayTable
          headers={parsedCsv.headers}
          rows={parsedCsv.rows}
          annotations={annotations}
          caption="CSV overlay annotations"
        />
      ) : null}

      {(rawLog ?? parsedRun?.raw?.log) ? (
        <details style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Run log</summary>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {rawLog ?? parsedRun?.raw?.log ?? ""}
          </pre>
        </details>
      ) : null}
    </section>
  );
};

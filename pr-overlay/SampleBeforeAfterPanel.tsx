import React from "react";

import { ReconRun } from "../contracts/recon";

export type SampleBeforeAfterPanelProps = {
  before: ReconRun;
  after: ReconRun;
  title?: string;
  description?: string;
};

const computeCounts = (run: ReconRun) => {
  const base = run.summary ?? {};
  const items = run.items ?? [];
  if (Object.keys(base).length > 0) {
    return base;
  }

  const counts = { matched: 0, missing: 0, drift: 0, mismatched: 0 };
  items.forEach((item) => {
    if (item.status === "match") counts.matched += 1;
    if (item.status === "missing") counts.missing += 1;
    if (item.status === "drift") counts.drift += 1;
    if (item.status === "mismatch") counts.mismatched += 1;
  });
  return counts;
};

const formatValue = (value?: number) => (typeof value === "number" ? value.toString() : "—");

export const SampleBeforeAfterPanel = ({
  before,
  after,
  title = "Reconciliation change preview",
  description = "Sample output derived from fixtures to show how rule changes affect reconciliation.",
}: SampleBeforeAfterPanelProps) => {
  const beforeCounts = computeCounts(before);
  const afterCounts = computeCounts(after);

  return (
    <section
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 16,
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
      }}
    >
      <header style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
        <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>{description}</p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {[
          { label: "Matched", before: beforeCounts.matched, after: afterCounts.matched },
          { label: "Missing", before: beforeCounts.missing, after: afterCounts.missing },
          { label: "Drift", before: beforeCounts.drift, after: afterCounts.drift },
          { label: "Mismatched", before: beforeCounts.mismatched, after: afterCounts.mismatched },
        ].map((row) => (
          <div
            key={row.label}
            style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}
          >
            <strong style={{ display: "block", marginBottom: 6 }}>{row.label}</strong>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>Before: {formatValue(row.before)}</span>
              <span>After: {formatValue(row.after)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

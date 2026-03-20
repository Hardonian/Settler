"use client";

import { useMemo, useState } from "react";
import { buildDashboardData, resolveDataMode } from "@/lib/data/adapters";

type ExplorerPayload = {
  run_id: string;
  graph?: {
    graphHash: string;
    nodes: Array<{ id: string; label: string; type: string }>;
  };
  lineage?: {
    lineage: Array<{
      node: { id: string; label: string; type: string };
      viaEdge: { type: string } | null;
    }>;
  };
  impact?: {
    impactedArtifacts: Array<{ id: string; label: string }>;
    impactedExecutionNodes: Array<{ id: string; label: string }>;
  };
  verification?: {
    verified: boolean;
    checks: Record<string, boolean>;
    graphHash: string;
    proofNodeRefs: string[];
  };
};

async function fetchJson(path: string, apiKey: string) {
  const response = await fetch(path, {
    headers: { "X-API-Key": apiKey },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || payload?.detail || `Request failed: ${response.status}`);
  }
  return payload;
}

export function ProofExplorer() {
  const [runId, setRunId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graph, setGraph] = useState<ExplorerPayload | null>(null);
  const [lineage, setLineage] = useState<ExplorerPayload | null>(null);
  const [impact, setImpact] = useState<ExplorerPayload | null>(null);
  const [verification, setVerification] = useState<ExplorerPayload | null>(null);
  const [replayResult, setReplayResult] = useState<string | null>(null);

  const basePath = useMemo(() => `/api/v1/runs/${runId}/trust-explorer`, [runId]);
  const dataMode = resolveDataMode(Boolean(graph?.graph), !apiKey || !runId);
  const dashboardData = buildDashboardData({ mode: dataMode });

  async function loadExplorer() {
    if (!runId || !apiKey) {
      setError("Enter a run id and API key for LIVE mode. DEMO mode remains available.");
      return;
    }

    setLoading(true);
    setError(null);
    setReplayResult(null);
    try {
      const [graphRes, lineageRes, verifyRes, impactRes] = await Promise.all([
        fetchJson(`${basePath}/getExecutionGraph`, apiKey),
        fetchJson(`${basePath}/traceArtifactLineage`, apiKey),
        fetchJson(`${basePath}/verifyProofChain`, apiKey),
        fetchJson(`${basePath}/findPolicyImpact`, apiKey),
      ]);
      setGraph(graphRes);
      setLineage(lineageRes);
      setVerification(verifyRes);
      setImpact(impactRes);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Trust Explorer.");
    } finally {
      setLoading(false);
    }
  }

  async function replayRun() {
    setReplayResult(null);
    try {
      const replay = await fetchJson(`/api/v1/runs/${runId}/replay`, apiKey);
      setReplayResult(`Replay integrity: ${replay.match ? "verified" : "drift detected"}`);
    } catch (replayError) {
      setReplayResult(replayError instanceof Error ? replayError.message : "Replay failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/40 dark:border-border p-4 bg-white dark:bg-card">
        <h2 className="text-xl font-semibold mb-3">Proof Explorer</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Event links, provenance metadata, and proof hashes surfaced with deterministic replay
          verification.
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Data mode: <span className="font-semibold">{dataMode}</span>
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded border border-border bg-transparent px-3 py-2 text-sm"
            placeholder="Run ID"
            value={runId}
            onChange={(event) => setRunId(event.target.value.trim())}
          />
          <input
            className="rounded border border-border bg-transparent px-3 py-2 text-sm"
            placeholder="API Key"
            value={apiKey}
            type="password"
            onChange={(event) => setApiKey(event.target.value)}
          />
          <button
            type="button"
            disabled={!runId || !apiKey || loading}
            onClick={loadExplorer}
            className="rounded bg-card text-white dark:bg-white dark:text-foreground px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load execution graph"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <section className="rounded-xl border border-border/40 dark:border-border p-4 bg-white dark:bg-card">
        <h3 className="font-semibold mb-3">Audit / Replay Intelligence</h3>
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          {dashboardData.auditEvents.map((event) => (
            <div
              key={event.id}
              className="rounded border border-border/40 dark:border-border p-3"
            >
              <p className="font-medium">{event.action}</p>
              <p className="text-muted-foreground">trace: {event.traceId}</p>
              <p className="text-muted-foreground">
                entity: {event.entityType}:{event.entityId}
              </p>
            </div>
          ))}
          {dashboardData.proofReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className="rounded border border-border/40 dark:border-border p-3"
            >
              <p className="font-medium">Proof {receipt.id}</p>
              <p className="text-muted-foreground">hash: {receipt.hash}</p>
              <p className="text-muted-foreground">provenance: {receipt.provenance.join(" → ")}</p>
            </div>
          ))}
        </div>
      </section>

      {graph?.graph && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-border/40 dark:border-border p-4 bg-white dark:bg-card">
            <h3 className="font-semibold mb-2">Execution Timeline</h3>
            <ul className="space-y-2 text-sm">
              {graph.graph.nodes.map((node) => (
                <li key={node.id} className="border-l-2 border-blue-500 pl-3">
                  <span className="font-medium">{node.label}</span>
                  <div className="text-muted-foreground">{node.type}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border/40 dark:border-border p-4 bg-white dark:bg-card">
            <h3 className="font-semibold mb-2">Artifact Dependency Tree</h3>
            <ul className="space-y-2 text-sm">
              {lineage?.lineage?.lineage.map((entry) => (
                <li key={entry.node.id}>
                  <span className="font-medium">{entry.node.label}</span>
                  <span className="text-muted-foreground"> ({entry.node.type})</span>
                  {entry.viaEdge && (
                    <div className="text-xs text-muted-foreground">via {entry.viaEdge.type}</div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border/40 dark:border-border p-4 bg-white dark:bg-card">
            <h3 className="font-semibold mb-2">Policy Decision Viewer</h3>
            <p className="text-sm mb-2">Impacted artifacts:</p>
            <ul className="list-disc pl-5 text-sm">
              {impact?.impact?.impactedArtifacts.map((artifact) => (
                <li key={artifact.id}>{artifact.label}</li>
              ))}
            </ul>
            <p className="text-sm mt-3 mb-2">Impacted workflow nodes:</p>
            <ul className="list-disc pl-5 text-sm">
              {impact?.impact?.impactedExecutionNodes.map((execution) => (
                <li key={execution.id}>{execution.label}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border/40 dark:border-border p-4 bg-white dark:bg-card">
            <h3 className="font-semibold mb-2">Proof Integrity</h3>
            <p className="text-sm">
              Graph hash:{" "}
              <code>{verification?.verification?.graphHash || graph.graph.graphHash}</code>
            </p>
            <p className="text-sm mt-2">
              Verification: {verification?.verification?.verified ? "Verified" : "Failed"}
            </p>
            <button
              type="button"
              onClick={replayRun}
              className="mt-3 rounded bg-blue-600 text-white px-3 py-2 text-sm"
            >
              Replay run
            </button>
            {replayResult && <p className="text-sm mt-2">{replayResult}</p>}
          </section>
        </div>
      )}
    </div>
  );
}

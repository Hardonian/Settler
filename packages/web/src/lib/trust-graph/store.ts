import { stableHash } from "@settler/protocol";
import type { TrustGraph } from "@/lib/trust-graph/types";

const graphStore = new Map<string, TrustGraph>();

function key(tenantId: string, runId: string) {
  return `${tenantId}:${runId}`;
}

export function buildCasRef(payload: unknown) {
  const hash = stableHash(payload);
  return `cas://${hash}`;
}

export function persistTrustGraph(graph: TrustGraph) {
  graphStore.set(key(graph.tenantId, graph.runId), graph);
  return graph;
}

export function readTrustGraph(tenantId: string, runId: string) {
  return graphStore.get(key(tenantId, runId)) || null;
}

export function graphHashFromShape(shape: { runId: string; nodes: unknown; edges: unknown }) {
  return stableHash(shape);
}

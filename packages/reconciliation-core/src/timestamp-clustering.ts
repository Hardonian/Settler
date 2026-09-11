/**
 * Dynamic Timestamp Clustering Heuristic
 *
 * Clusters asynchronous settlement transactions across distributed payment rail
 * clearing delays (e.g. FedACH T+1..T+3, card network batch sweeps, SEPA).
 *
 * Deterministic, integer millisecond arithmetic, zero floating-point drift.
 */

export interface TimestampClusteringConfig {
  /** Maximum allowable clearing lag window in milliseconds (e.g. 3 days = 259,200,000 ms) */
  maxLagMs: number;
  /** Minimum density threshold of events to form a cluster */
  minClusterSize: number;
  /** Expected typical clearance lag in milliseconds (used for Gaussian/kernel weighting) */
  targetLagMs: number;
}

export interface TemporalEvent {
  id: string;
  tenantId: string;
  timestampMs: number;
  amountCents: number;
  rail?: string;
  metadata?: Record<string, unknown>;
}

export interface TemporalCluster {
  clusterId: string;
  rail: string;
  startTimeMs: number;
  endTimeMs: number;
  eventIds: string[];
  totalAmountCents: number;
  centroidTimestampMs: number;
  dispersionMs: number;
}

export const DEFAULT_CLUSTERING_CONFIGS: Record<
  "STRIPE_CARD_SWEEP" | "FEDACH_SETTLEMENT" | "SEPA_INSTANT",
  TimestampClusteringConfig
> = {
  STRIPE_CARD_SWEEP: {
    maxLagMs: 3 * 24 * 60 * 60 * 1000, // 3 days
    minClusterSize: 2,
    targetLagMs: 2 * 24 * 60 * 60 * 1000, // T+2
  },
  FEDACH_SETTLEMENT: {
    maxLagMs: 5 * 24 * 60 * 60 * 1000, // 5 days
    minClusterSize: 1,
    targetLagMs: 1 * 24 * 60 * 60 * 1000, // T+1
  },
  SEPA_INSTANT: {
    maxLagMs: 60 * 60 * 1000, // 1 hour
    minClusterSize: 1,
    targetLagMs: 10 * 1000, // 10s
  },
};

/**
 * Clusters a series of temporal events into clearing batches based on dynamic time-density windows.
 */
export function clusterTransactionsByTime(
  tenantId: string,
  events: TemporalEvent[],
  config: TimestampClusteringConfig,
  rail: string = "DEFAULT"
): TemporalCluster[] {
  if (!tenantId || tenantId.trim() === "") {
    throw new Error("Tenant isolation invariant violation: tenantId is required");
  }

  // Filter events by tenant and sort deterministically by timestamp ascending, then id
  const tenantEvents = events
    .filter((e) => e.tenantId === tenantId)
    .sort((a, b) => {
      if (a.timestampMs !== b.timestampMs) {
        return a.timestampMs - b.timestampMs;
      }
      return a.id.localeCompare(b.id);
    });

  if (tenantEvents.length === 0) {
    return [];
  }

  const clusters: TemporalCluster[] = [];
  let currentGroup: TemporalEvent[] = [tenantEvents[0]!];

  for (let i = 1; i < tenantEvents.length; i++) {
    const current = tenantEvents[i]!;
    const prev = currentGroup[currentGroup.length - 1]!;

    const gap = current.timestampMs - prev.timestampMs;

    // If within the max allowed clearance window, accumulate into current cluster
    if (gap <= config.maxLagMs) {
      currentGroup.push(current);
    } else {
      // Finalize previous cluster if it meets minimum cluster size threshold
      if (currentGroup.length >= config.minClusterSize) {
        clusters.push(buildCluster(tenantId, rail, currentGroup));
      }
      currentGroup = [current];
    }
  }

  if (currentGroup.length >= config.minClusterSize) {
    clusters.push(buildCluster(tenantId, rail, currentGroup));
  }

  return clusters;
}

function buildCluster(tenantId: string, rail: string, group: TemporalEvent[]): TemporalCluster {
  const eventIds = group.map((e) => e.id);
  const totalAmountCents = group.reduce((sum, e) => sum + e.amountCents, 0);
  const startTimeMs = group[0]!.timestampMs;
  const endTimeMs = group[group.length - 1]!.timestampMs;

  // Compute integer centroid
  const sumMs = group.reduce((sum, e) => sum + BigInt(e.timestampMs), BigInt(0));
  const centroidTimestampMs = Number(sumMs / BigInt(group.length));

  // Compute dispersion (max distance from centroid)
  let maxDispersion = 0;
  for (const e of group) {
    const diff = Math.abs(e.timestampMs - centroidTimestampMs);
    if (diff > maxDispersion) maxDispersion = diff;
  }

  const clusterId = `cluster_${tenantId}_${rail}_${startTimeMs}_${group.length}`;

  return {
    clusterId,
    rail,
    startTimeMs,
    endTimeMs,
    eventIds,
    totalAmountCents,
    centroidTimestampMs,
    dispersionMs: maxDispersion,
  };
}

/**
 * Calculates temporal likelihood score in basis points (0 - 10000 bps)
 * where 10000 bps = 100% exact clearance timing match.
 */
export function calculateTemporalLikelihoodBps(
  observedLagMs: number,
  targetLagMs: number,
  maxLagMs: number
): number {
  if (observedLagMs < 0 || observedLagMs > maxLagMs) {
    return 0;
  }
  const delta = Math.abs(observedLagMs - targetLagMs);
  if (delta === 0) return 10000;

  // Linear decay to 0 at maxLagMs
  const penalty = Math.min(10000, Math.floor((delta * 10000) / maxLagMs));
  return Math.max(0, 10000 - penalty);
}

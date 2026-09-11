/**
 * Multi-Rail Clock Skew Compensation Mechanism
 *
 * Reconciles asynchronous timestamp drift across distributed payment processors,
 * cloud providers, and depository clearing systems within bounded drift windows (±180s).
 * Prevents temporal ordering paradoxes ("settled before authorized") using statistical offset estimation.
 */

export interface ClockSample {
  sourceRail: string;
  sourceTimestamp: Date | string | number;
  receivedAt: Date | string | number;
}

export interface ClockSkewEstimate {
  sourceRail: string;
  sampleCount: number;
  medianOffsetMs: number;
  p95OffsetMs: number;
  maxOffsetMs: number;
  driftStatus: "nominal" | "compensated" | "sla_breach";
  calculatedAt: string;
}

export interface NormalizedTemporalEvent<T = unknown> {
  originalTimestamp: string;
  normalizedTimestamp: string;
  offsetAppliedMs: number;
  isOrderingParadoxResolved: boolean;
  event: T;
}

export class ClockSkewCompensator {
  private offsetSamplesByRail = new Map<string, number[]>();
  private readonly maxSamplesPerRail: number;
  private readonly maxAllowedSkewMs: number;

  constructor(options: { maxSamplesPerRail?: number; maxAllowedSkewMs?: number } = {}) {
    this.maxSamplesPerRail = options.maxSamplesPerRail ?? 100;
    this.maxAllowedSkewMs = options.maxAllowedSkewMs ?? 180_000; // 180 seconds default
  }

  /**
   * Ingests a paired clock observation: external event timestamp vs ingestion receipt timestamp.
   */
  public recordSample(sample: ClockSample): number {
    const sourceTime = new Date(sample.sourceTimestamp).getTime();
    const receivedTime = new Date(sample.receivedAt).getTime();

    if (isNaN(sourceTime) || isNaN(receivedTime)) {
      throw new Error("Invalid timestamp in clock sample");
    }

    // Offset = external clock - internal clock
    const offsetMs = sourceTime - receivedTime;

    const rail = sample.sourceRail.toLowerCase();
    let samples = this.offsetSamplesByRail.get(rail);
    if (!samples) {
      samples = [];
      this.offsetSamplesByRail.set(rail, samples);
    }

    samples.push(offsetMs);
    if (samples.length > this.maxSamplesPerRail) {
      samples.shift();
    }

    return offsetMs;
  }

  /**
   * Calculates the median and percentile clock offset for a given rail using outlier-resistant statistics.
   */
  public estimateSkew(sourceRail: string): ClockSkewEstimate {
    const rail = sourceRail.toLowerCase();
    const samples = this.offsetSamplesByRail.get(rail) ?? [0];
    const sorted = [...samples].sort((a, b) => a - b);

    const mid = Math.floor(sorted.length / 2);
    const medianOffsetMs =
      sorted.length % 2 !== 0 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);

    const p95Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    const p95OffsetMs = sorted[p95Idx]!;
    const maxOffsetMs = Math.max(...sorted.map(Math.abs));

    let driftStatus: "nominal" | "compensated" | "sla_breach" = "nominal";
    if (Math.abs(medianOffsetMs) > this.maxAllowedSkewMs) {
      driftStatus = "sla_breach";
    } else if (Math.abs(medianOffsetMs) > 1000) {
      driftStatus = "compensated";
    }

    return {
      sourceRail: rail,
      sampleCount: sorted.length,
      medianOffsetMs,
      p95OffsetMs,
      maxOffsetMs,
      driftStatus,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Normalizes an incoming event timestamp, subtracting estimated clock drift to align with sovereign ledger time.
   */
  public normalizeTimestamp<T>(
    sourceRail: string,
    eventTimestamp: Date | string | number,
    eventData: T,
    options: { precedingEventTimestamp?: Date | string | number } = {}
  ): NormalizedTemporalEvent<T> {
    const originalTime = new Date(eventTimestamp).getTime();
    if (isNaN(originalTime)) {
      throw new Error(`Invalid event timestamp: ${eventTimestamp}`);
    }

    const skew = this.estimateSkew(sourceRail);
    let offsetAppliedMs = skew.medianOffsetMs;
    let normalizedTime = originalTime - offsetAppliedMs;
    let isOrderingParadoxResolved = false;

    // Temporal paradox check: if clearing appears before authorization due to remaining drift
    if (options.precedingEventTimestamp) {
      const precedingTime = new Date(options.precedingEventTimestamp).getTime();
      if (!isNaN(precedingTime) && normalizedTime < precedingTime) {
        // Clamp to preceding timestamp + 1ms and record paradox resolution
        const correctionMs = precedingTime + 1 - normalizedTime;
        normalizedTime = precedingTime + 1;
        offsetAppliedMs -= correctionMs;
        isOrderingParadoxResolved = true;
      }
    }

    return {
      originalTimestamp: new Date(originalTime).toISOString(),
      normalizedTimestamp: new Date(normalizedTime).toISOString(),
      offsetAppliedMs,
      isOrderingParadoxResolved,
      event: eventData,
    };
  }
}

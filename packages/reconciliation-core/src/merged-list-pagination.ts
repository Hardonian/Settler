/**
 * Dual-stream keyset cursor pagination for merged recon_jobs + recon_results lists.
 * Ordering: COALESCE(started_at, created_at) DESC, id DESC (per stream).
 */

import { z } from "zod";

const streamCursorSchema = z.object({
  /** ISO 8601 sort key (inclusive-exclusive keyset uses strictly less than) */
  t: z.string().min(1),
  id: z.string().uuid(),
});

const mergedCursorV1Schema = z.object({
  v: z.literal(1),
  ij: streamCursorSchema.nullable().optional(),
  ir: streamCursorSchema.nullable().optional(),
});

export type MergedRunsStreamCursor = z.infer<typeof streamCursorSchema>;
export type MergedRunsCursorV1 = z.infer<typeof mergedCursorV1Schema>;

export class MergedRunsCursorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MergedRunsCursorError";
  }
}

export function encodeMergedRunsCursor(state: MergedRunsCursorV1): string {
  const json = JSON.stringify(state);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeMergedRunsCursor(
  encoded: string | undefined | null
): MergedRunsCursorV1 | null {
  if (encoded === undefined || encoded === null || encoded.trim() === "") {
    return null;
  }
  let raw: string;
  try {
    raw = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    throw new MergedRunsCursorError("cursor is not valid base64url");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new MergedRunsCursorError("cursor is not valid JSON");
  }
  const result = mergedCursorV1Schema.safeParse(parsed);
  if (!result.success) {
    throw new MergedRunsCursorError("cursor failed schema validation");
  }
  for (const key of ["ij", "ir"] as const) {
    const c = result.data[key];
    if (c) {
      const d = Date.parse(c.t);
      if (!Number.isFinite(d)) {
        throw new MergedRunsCursorError(`cursor ${key}.t is not a valid ISO timestamp`);
      }
    }
  }
  return result.data;
}

export interface MergeCandidate<T> {
  row: T;
  sortTimeMs: number;
  id: string;
}

/** Lexicographic: higher sort time first; tie-break id (uuid) descending */
export function compareMergeCandidates(
  a: MergeCandidate<unknown>,
  b: MergeCandidate<unknown>
): number {
  if (a.sortTimeMs !== b.sortTimeMs) {
    return b.sortTimeMs - a.sortTimeMs;
  }
  return b.id.localeCompare(a.id);
}

export interface DualStreamMergeResult<T> {
  items: T[];
  nextCursor: MergedRunsCursorV1 | null;
  pagination: {
    limit: number;
    returned: number;
    has_more: boolean;
    job_stream_has_more: boolean;
    ingestion_stream_has_more: boolean;
    job_stream_exhausted: boolean;
    ingestion_stream_exhausted: boolean;
  };
}

/**
 * Merge two pre-fetched DESC-ordered buffers (each length <= limit+1).
 * Carries forward stream cursors for streams that did not emit in this page.
 */
export function mergeDualStreamPage<TJob, TIng>(input: {
  limit: number;
  jobCandidates: MergeCandidate<TJob>[];
  ingestionCandidates: MergeCandidate<TIng>[];
  mapJob: (row: TJob) => unknown;
  mapIngestion: (row: TIng) => unknown;
  prev: MergedRunsCursorV1 | null;
}): DualStreamMergeResult<unknown> {
  const { limit, jobCandidates, ingestionCandidates, mapJob, mapIngestion, prev } = input;
  if (limit < 1 || limit > 500) {
    throw new MergedRunsCursorError("limit must be between 1 and 500");
  }

  const jobHasMoreInBuffer = jobCandidates.length > limit;
  const ingHasMoreInBuffer = ingestionCandidates.length > limit;
  const jobSlice = jobCandidates.slice(0, limit + 1);
  const ingSlice = ingestionCandidates.slice(0, limit + 1);

  let i = 0;
  let j = 0;
  const items: unknown[] = [];
  let lastJobCursor: MergedRunsStreamCursor | null = prev?.ij ?? null;
  let lastIngCursor: MergedRunsStreamCursor | null = prev?.ir ?? null;
  let emittedFromJob = false;
  let emittedFromIng = false;

  while (items.length < limit && (i < jobSlice.length || j < ingSlice.length)) {
    const jobPeek = i < jobSlice.length ? jobSlice[i]! : null;
    const ingPeek = j < ingSlice.length ? ingSlice[j]! : null;

    if (jobPeek && ingPeek) {
      const cmp = compareMergeCandidates(jobPeek, ingPeek);
      if (cmp < 0 || (cmp === 0 && jobPeek.id >= ingPeek.id)) {
        items.push(mapJob(jobPeek.row));
        lastJobCursor = { t: new Date(jobPeek.sortTimeMs).toISOString(), id: jobPeek.id };
        emittedFromJob = true;
        i += 1;
      } else {
        items.push(mapIngestion(ingPeek.row));
        lastIngCursor = { t: new Date(ingPeek.sortTimeMs).toISOString(), id: ingPeek.id };
        emittedFromIng = true;
        j += 1;
      }
    } else if (jobPeek) {
      items.push(mapJob(jobPeek.row));
      lastJobCursor = { t: new Date(jobPeek.sortTimeMs).toISOString(), id: jobPeek.id };
      emittedFromJob = true;
      i += 1;
    } else if (ingPeek) {
      items.push(mapIngestion(ingPeek.row));
      lastIngCursor = { t: new Date(ingPeek.sortTimeMs).toISOString(), id: ingPeek.id };
      emittedFromIng = true;
      j += 1;
    } else {
      break;
    }
  }

  const jobStreamExhausted = !jobHasMoreInBuffer && i >= jobSlice.length;
  const ingestionStreamExhausted = !ingHasMoreInBuffer && j >= ingSlice.length;
  const globalHasMore =
    items.length === limit &&
    (i < jobSlice.length || j < ingSlice.length || jobHasMoreInBuffer || ingHasMoreInBuffer);

  const nextCursor: MergedRunsCursorV1 | null = globalHasMore
    ? {
        v: 1,
        ij: emittedFromJob ? lastJobCursor : (prev?.ij ?? null),
        ir: emittedFromIng ? lastIngCursor : (prev?.ir ?? null),
      }
    : null;

  return {
    items,
    nextCursor,
    pagination: {
      limit,
      returned: items.length,
      has_more: Boolean(nextCursor),
      job_stream_has_more: !jobStreamExhausted,
      ingestion_stream_has_more: !ingestionStreamExhausted,
      job_stream_exhausted: jobStreamExhausted,
      ingestion_stream_exhausted: ingestionStreamExhausted,
    },
  };
}

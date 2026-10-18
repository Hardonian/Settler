/**
 * Backpressure-Aware Server-Sent Events (SSE) Stream Router (v2)
 *
 * Streams high-volume reconciliation records (100k+ line items) with
 * cursor-based chunking, TCP backpressure flow control, and client disconnect cleanup.
 */

import { Router, Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";

export const streamRouter: Router = Router();

interface StreamRecord {
  id: string;
  runId: string;
  lineIndex: number;
  sourceAmount: number;
  targetAmount: number;
  currency: string;
  status: "MATCHED" | "VARIANCE" | "UNMATCHED";
  timestamp: string;
  referenceId: string;
}

/**
 * Generates synthetic deterministic records for a run chunk
 */
function generateSyntheticBatch(runId: string, startIndex: number, count: number): StreamRecord[] {
  const records: StreamRecord[] = [];
  const baseTime = Date.now() - 86400000;

  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const isVariance = idx % 17 === 0;
    const isUnmatched = idx % 43 === 0;

    const sourceAmount = Math.round((10 + (idx % 500) * 1.75) * 100) / 100;
    const targetAmount = isVariance
      ? Math.round((sourceAmount - 2.9) * 100) / 100
      : isUnmatched
        ? 0
        : sourceAmount;

    records.push({
      id: `rec_${runId}_${idx}`,
      runId,
      lineIndex: idx,
      sourceAmount,
      targetAmount,
      currency: "USD",
      status: isUnmatched ? "UNMATCHED" : isVariance ? "VARIANCE" : "MATCHED",
      timestamp: new Date(baseTime + idx * 1000).toISOString(),
      referenceId: `REF-${runId.slice(-4)}-${idx.toString().padStart(6, "0")}`,
    });
  }

  return records;
}

/**
 * Writes data with backpressure handling (waits for drain if buffer full)
 */
async function writeWithBackpressure(res: Response, payload: string): Promise<boolean> {
  const ok = res.write(payload);
  if (!ok) {
    await new Promise<void>((resolve) => res.once("drain", resolve));
  }
  return true;
}

/**
 * GET /api/v2/stream/runs/:runId/records
 * Streams reconciliation records over SSE with flow control
 */
streamRouter.get("/runs/:runId/records", async (req: Request, res: Response): Promise<void> => {
  const runId = String(req.params.runId ?? "");
  const authReq = req as AuthRequest;
  const tenantId =
    authReq.tenantId ?? (authReq.user as any)?.tenantId ?? (req.query.tenantId as string);

  if (!tenantId) {
    res.status(403).json({ error: "Tenant context is required" });
    return;
  }

  const batchSize = Math.min(
    Math.max(parseInt((req.query.batchSize as string) ?? "250", 10), 10),
    1000
  );
  const totalRecords = Math.min(
    Math.max(parseInt((req.query.totalRecords as string) ?? "1000", 10), 10),
    100000
  );
  const startCursor = Math.max(parseInt((req.query.cursor as string) ?? "0", 10), 0);

  // Initialize SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  let isClientConnected = true;
  req.on("close", () => {
    isClientConnected = false;
  });

  // Send initial connection event
  await writeWithBackpressure(
    res,
    `event: connected\ndata: ${JSON.stringify({
      status: "streaming",
      runId,
      tenantId,
      totalRecords,
      batchSize,
      startCursor,
    })}\n\n`
  );

  let currentCursor = startCursor;

  while (currentCursor < totalRecords && isClientConnected) {
    const recordsToFetch = Math.min(batchSize, totalRecords - currentCursor);
    const batch = generateSyntheticBatch(runId, currentCursor, recordsToFetch);

    currentCursor += recordsToFetch;
    const progressPercent = Math.round((currentCursor / totalRecords) * 10000) / 100;

    const eventPayload = `event: record_batch\ndata: ${JSON.stringify({
      cursor: currentCursor,
      batchSize: batch.length,
      records: batch,
      progress: {
        current: currentCursor,
        total: totalRecords,
        percentage: progressPercent,
      },
    })}\n\n`;

    await writeWithBackpressure(res, eventPayload);

    // Yield event loop to allow socket flushing
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  if (isClientConnected) {
    await writeWithBackpressure(
      res,
      `event: stream_complete\ndata: ${JSON.stringify({
        runId,
        totalStreamed: currentCursor - startCursor,
        finalCursor: currentCursor,
        completedAt: new Date().toISOString(),
      })}\n\n`
    );
    res.end();
  }
});

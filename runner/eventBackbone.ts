import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { sha256, stableStringify } from "../evidence/hash";

export type ExecutionEventType =
  | "workflow.triggered"
  | "worker.lease.acquired"
  | "execution.started"
  | "state.persisted"
  | "proof.artifact.generated"
  | "execution.completed"
  | "execution.failed";

export interface ExecutionEvent {
  event_id: string;
  idempotency_key: string;
  tenant_id: string;
  run_id: string;
  type: ExecutionEventType;
  sequence: number;
  created_at: string;
  payload: Record<string, unknown>;
}

interface ConsumerOffsets {
  [consumer: string]: number;
}

interface BackboneOptions {
  baseDir?: string;
  maxReplayBatch?: number;
}

const DEFAULT_BASE_DIR = path.resolve(".settler", "event-backbone");

export class FileEventBackbone {
  private readonly logPath: string;
  private readonly offsetsPath: string;
  private readonly maxReplayBatch: number;
  private initialized = false;
  private events: ExecutionEvent[] = [];
  private idempotencyIndex = new Map<string, ExecutionEvent>();
  private nextSequence = 1;

  constructor(options: BackboneOptions = {}) {
    const baseDir = options.baseDir ?? DEFAULT_BASE_DIR;
    this.logPath = path.join(baseDir, "events.ndjson");
    this.offsetsPath = path.join(baseDir, "consumer-offsets.json");
    this.maxReplayBatch = options.maxReplayBatch ?? 500;
  }

  async append(input: {
    tenantId: string;
    runId: string;
    type: ExecutionEventType;
    payload: Record<string, unknown>;
    idempotencyKey?: string;
  }): Promise<ExecutionEvent> {
    await this.ensureInitialized();

    const idempotencyKey =
      input.idempotencyKey ??
      sha256(
        stableStringify({
          tenant_id: input.tenantId,
          run_id: input.runId,
          type: input.type,
          payload: input.payload,
        })
      );

    const existing = this.idempotencyIndex.get(idempotencyKey);
    if (existing) {
      return existing;
    }

    const event: ExecutionEvent = {
      event_id: crypto.randomUUID(),
      idempotency_key: idempotencyKey,
      tenant_id: input.tenantId,
      run_id: input.runId,
      type: input.type,
      sequence: this.nextSequence,
      created_at: new Date().toISOString(),
      payload: input.payload,
    };

    await fs.mkdir(path.dirname(this.logPath), { recursive: true });
    await fs.appendFile(this.logPath, `${JSON.stringify(event)}\n`, "utf8");

    this.events.push(event);
    this.idempotencyIndex.set(idempotencyKey, event);
    this.nextSequence += 1;

    return event;
  }

  async readFromSequence(
    fromSequence: number,
    limit = this.maxReplayBatch
  ): Promise<ExecutionEvent[]> {
    await this.ensureInitialized();
    return this.events.filter((event) => event.sequence > fromSequence).slice(0, limit);
  }

  async lease(consumer: string, limit = this.maxReplayBatch): Promise<ExecutionEvent[]> {
    const offsets = await this.readOffsets();
    const fromSequence = offsets[consumer] ?? 0;
    return this.readFromSequence(fromSequence, limit);
  }

  async ack(consumer: string, upToSequence: number): Promise<void> {
    const offsets = await this.readOffsets();
    const current = offsets[consumer] ?? 0;
    offsets[consumer] = Math.max(current, upToSequence);
    await this.writeOffsets(offsets);
  }

  async replay(runId: string): Promise<ExecutionEvent[]> {
    await this.ensureInitialized();
    return this.events
      .filter((event) => event.run_id === runId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async health(): Promise<{ eventCount: number; consumerCount: number; lastSequence: number }> {
    await this.ensureInitialized();
    const offsets = await this.readOffsets();
    return {
      eventCount: this.events.length,
      consumerCount: Object.keys(offsets).length,
      lastSequence: this.events.at(-1)?.sequence ?? 0,
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const loadedEvents = await this.readEventsFromDisk();
    for (const event of loadedEvents) {
      this.events.push(event);
      this.idempotencyIndex.set(event.idempotency_key, event);
    }
    this.nextSequence = (this.events.at(-1)?.sequence ?? 0) + 1;
  }

  private async readEventsFromDisk(): Promise<ExecutionEvent[]> {
    try {
      const raw = await fs.readFile(this.logPath, "utf8");
      const lines = raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const events: ExecutionEvent[] = [];

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line) as ExecutionEvent;
          if (typeof parsed.sequence === "number") {
            events.push(parsed);
          }
        } catch {
          // tolerate partial WAL line writes by skipping malformed tail rows
        }
      }

      return events.sort((a, b) => a.sequence - b.sequence);
    } catch {
      return [];
    }
  }

  private async readOffsets(): Promise<ConsumerOffsets> {
    try {
      const raw = await fs.readFile(this.offsetsPath, "utf8");
      return JSON.parse(raw) as ConsumerOffsets;
    } catch {
      return {};
    }
  }

  private async writeOffsets(offsets: ConsumerOffsets): Promise<void> {
    await fs.mkdir(path.dirname(this.offsetsPath), { recursive: true });
    await fs.writeFile(this.offsetsPath, JSON.stringify(offsets, null, 2), "utf8");
  }
}

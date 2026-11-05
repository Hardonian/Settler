/**
 * TigerBeetle Multi-Replica Cluster Driver with Failover and Exponential Backoff
 *
 * Provides resilient connection pooling, cluster health monitoring, and
 * exponential backoff retry handling across TigerBeetle cluster replicas.
 */

import { createClient, type Client } from "tigerbeetle-node";
import { logger } from "@settler/types";
import { LedgerConnectionError, LedgerTimeoutError } from "../../domain/LedgerError";

export interface TigerBeetleDriverConfig {
  clusterId?: number;
  addresses?: string | string[];
  concurrencyMax?: number;
  timeoutMs?: number;
  maxRetries?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
}

export function parseTigerBeetleAddresses(raw?: string | string[]): string[] {
  if (Array.isArray(raw)) {
    return raw
      .flatMap((item) => item.split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const envRaw =
    process.env.TIGERBEETLE_REPLICAS ||
    process.env.TIGERBEETLE_CLUSTER_ADDRESSES ||
    process.env.TIGERBEETLE_ADDRESS ||
    "127.0.0.1:4300";

  return envRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export class TigerBeetleClusterDriver {
  private client: Client | null = null;
  private readonly clusterId: number;
  private readonly addresses: string[];
  private readonly concurrencyMax: number;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly initialBackoffMs: number;
  private readonly maxBackoffMs: number;
  private failoverCount = 0;
  private isConnecting = false;

  constructor(config?: TigerBeetleDriverConfig) {
    this.clusterId = config?.clusterId ?? Number(process.env.TIGERBEETLE_CLUSTER_ID || "0");
    this.addresses = parseTigerBeetleAddresses(config?.addresses);
    this.concurrencyMax = config?.concurrencyMax ?? 32;
    this.timeoutMs = config?.timeoutMs ?? 5000;
    this.maxRetries = config?.maxRetries ?? 3;
    this.initialBackoffMs = config?.initialBackoffMs ?? 50;
    this.maxBackoffMs = config?.maxBackoffMs ?? 1000;
  }

  public getAddresses(): string[] {
    return [...this.addresses];
  }

  public getFailoverCount(): number {
    return this.failoverCount;
  }

  public isConnected(): boolean {
    return this.client !== null;
  }

  public async getClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    if (this.isConnecting) {
      // Small spin-wait if another thread is currently initializing
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      if (this.client) return this.client;
    }

    this.isConnecting = true;
    try {
      this.client = await createClient({
        cluster_id: BigInt(this.clusterId),
        replica_addresses: this.addresses,
      });
      logger.info("TigerBeetle multi-replica driver connected", {
        clusterId: this.clusterId,
        replicas: this.addresses,
      });
      return this.client;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.client = null;
      logger.error("TigerBeetle multi-replica client connection failed", {
        replicas: this.addresses,
        error: msg,
      });
      throw new LedgerConnectionError(`Failed to connect to TigerBeetle cluster: ${msg}`);
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Execute an operation against the cluster with automatic retry and exponential backoff.
   */
  public async executeWithRetry<T>(operation: (client: Client) => Promise<T>): Promise<T> {
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const client = await this.getClient();
        return await operation(client);
      } catch (err: unknown) {
        lastError = err;
        const isRetryable = this.isRetryableError(err);

        if (!isRetryable || attempt >= this.maxRetries) {
          break;
        }

        this.failoverCount++;
        // Cycle / invalidate current client so reconnect attempts fresh handshake
        this.destroyClient();

        const jitter = Math.floor(Math.random() * 25);
        const backoff = Math.min(
          this.maxBackoffMs,
          this.initialBackoffMs * Math.pow(2, attempt) + jitter
        );

        logger.warn("Transient TigerBeetle error encountered; backing off before retry", {
          attempt: attempt + 1,
          maxRetries: this.maxRetries,
          backoffMs: backoff,
          failoverCount: this.failoverCount,
          error: err instanceof Error ? err.message : String(err),
        });

        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }

    if (lastError instanceof LedgerConnectionError || lastError instanceof LedgerTimeoutError) {
      throw lastError;
    }
    const message = lastError instanceof Error ? lastError.message : String(lastError);
    throw new LedgerConnectionError(
      `TigerBeetle cluster operation failed after retries: ${message}`
    );
  }

  private isRetryableError(err: unknown): boolean {
    if (!err) return false;
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    return (
      msg.includes("econnrefused") ||
      msg.includes("etimedout") ||
      msg.includes("connection reset") ||
      msg.includes("broken pipe") ||
      msg.includes("client destroyed") ||
      msg.includes("network") ||
      msg.includes("leader")
    );
  }

  private destroyClient(): void {
    if (this.client) {
      try {
        this.client.destroy();
      } catch {
        // Ignore destroy cleanup errors
      }
      this.client = null;
    }
  }

  public async close(): Promise<void> {
    this.destroyClient();
  }

  public getMetrics(): {
    clusterId: number;
    replicas: string[];
    failoverCount: number;
    connected: boolean;
  } {
    return {
      clusterId: this.clusterId,
      replicas: this.getAddresses(),
      failoverCount: this.failoverCount,
      connected: this.isConnected(),
    };
  }
}

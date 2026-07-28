import { Pool } from "pg";
import { cache } from "../redis/client";

/**
 * PgBouncer-Aware Connection Manager
 * Enforces control-plane infrastructure settings at the driver level.
 */
export class ConnectionManager {
  private pool: Pool;

  constructor() {
    // If we are connecting via PgBouncer transaction pooling (e.g. Supabase port 6543)
    const connectionString = process.env.DATABASE_URL;

    this.pool = new Pool({
      connectionString,
      // Hard protection against Lambda connection exhaustion spikes
      max: parseInt(process.env.DB_POOL_MAX || "20", 10),
      connectionTimeoutMillis: 5000, // Fast-fail if PgBouncer queue is full (Hostile condition protection)
      idleTimeoutMillis: 30000,
    });
  }

  /**
   * Executes a query wrapped in the dynamic operator infrastructure constraints.
   */
  async executeConstrainedQuery<T>(text: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      // 1. Fetch dynamic timeout from cache (or default to 10s). Cache avoids 1 extra query per execution.
      let timeoutMs = await cache.get<number>("infra:statement_timeout_ms");

      if (!timeoutMs) {
        const res = await client.query(
          `SELECT max_statement_timeout_ms FROM public.operator_infrastructure_settings WHERE id = 'global'`
        );
        timeoutMs = res.rows[0]?.max_statement_timeout_ms || 10000;
        await cache.set("infra:statement_timeout_ms", timeoutMs, 60); // 60s TTL
      }

      // 2. ENFORCEMENT: Physically restrict this transaction to the operator's control plane setting
      await client.query(`SELECT set_config('statement_timeout', $1, true)`, [
        timeoutMs.toString(),
      ]);

      // 3. Execute payload
      const result = await client.query(text, params);
      return result.rows;
    } catch (error: any) {
      if (error.code === "57014") {
        // query_canceled
        console.error(
          `[INFRA ENFORCEMENT] Query canceled by operator statement_timeout threshold.`
        );
        error.message =
          "System load threshold exceeded. Request terminated by Infrastructure Control Plane.";
        error.status = 503;
      }
      throw error;
    } finally {
      client.release();
    }
  }

  getPool() {
    return this.pool;
  }
}

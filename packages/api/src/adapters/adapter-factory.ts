/**
 * Adapter Factory
 *
 * Creates data source adapters for ingestion.
 * Placeholder — real implementations will be added per integration.
 */

interface FetchOptions {
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
}

interface DataAdapter {
  fetchTransactions(options: FetchOptions): Promise<Record<string, unknown>[]>;
}

export class AdapterFactory {
  static create(adapterType: string, configEncrypted: string): DataAdapter {
    // Future: resolve adapter by type (stripe, xero, bank-csv, etc.)
    throw new Error(
      `Adapter "${adapterType}" is not yet implemented. Config length: ${configEncrypted.length}`
    );
  }
}

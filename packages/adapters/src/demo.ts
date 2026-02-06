/**
 * Demo Adapter
 *
 * Stub adapter that returns deterministic demo data
 * without making external API calls.
 *
 * Used when DEMO_MODE=true to enable self-contained demonstrations.
 */

import * as fs from "fs";
import * as path from "path";
import { Adapter, NormalizedData, FetchOptions } from "./base";

const DEMO_DATA_DIR = path.join(process.cwd(), "demo/data");

interface DemoRecord {
  id: string;
  externalId: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  type: string;
  source: string;
  status: string;
}

function loadDemoData(source: "stripe" | "bank"): DemoRecord[] {
  const fileName =
    source === "stripe" ? "demo_stripe_transactions.json" : "demo_bank_transactions.json";
  const filePath = path.join(DEMO_DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Demo data not found: ${filePath}. Run 'npx tsx scripts/seed-demo.ts' first.`);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as DemoRecord[];
}

function demoRecordToNormalized(record: DemoRecord): NormalizedData {
  return {
    id: record.id,
    amount: record.amount,
    currency: record.currency,
    date: new Date(record.date),
    metadata: {
      externalId: record.externalId,
      type: record.type,
      status: record.status,
      description: record.description,
    },
    sourceId: record.externalId,
    referenceId: undefined,
  };
}

export class DemoStripeAdapter implements Adapter {
  name = "demo-stripe";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const records = loadDemoData("stripe");

    let filtered = records.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate >= options.dateRange.start && recordDate <= options.dateRange.end;
    });

    if (options.config?.types) {
      const types = options.config.types as string[];
      filtered = filtered.filter((r) => types.includes(r.type));
    }

    return filtered.map(demoRecordToNormalized);
  }

  normalize(data: unknown): NormalizedData {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid demo data: expected object");
    }

    const record = data as DemoRecord;
    return demoRecordToNormalized(record);
  }

  validate(data: NormalizedData): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!data.id) errors.push("Missing id");
    if (typeof data.amount !== "number") errors.push("Invalid amount");
    if (!data.currency) errors.push("Missing currency");
    if (!data.date || !(data.date instanceof Date)) errors.push("Invalid date");

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

export class DemoBankAdapter implements Adapter {
  name = "demo-bank";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const records = loadDemoData("bank");

    let filtered = records.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate >= options.dateRange.start && recordDate <= options.dateRange.end;
    });

    return filtered.map(demoRecordToNormalized);
  }

  normalize(data: unknown): NormalizedData {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid demo data: expected object");
    }

    const record = data as DemoRecord;
    return demoRecordToNormalized(record);
  }

  validate(data: NormalizedData): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!data.id) errors.push("Missing id");
    if (typeof data.amount !== "number") errors.push("Invalid amount");
    if (!data.currency) errors.push("Missing currency");

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function getDemoAdapter(type: "stripe" | "bank"): Adapter {
  if (type === "stripe") {
    return new DemoStripeAdapter();
  }
  return new DemoBankAdapter();
}

export function getAvailableAdapters(): Adapter[] {
  return [new DemoStripeAdapter(), new DemoBankAdapter()];
}

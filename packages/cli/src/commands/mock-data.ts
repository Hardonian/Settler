/**
 * Deterministic Mock Data Generator
 *
 * Synthesizes realistic multi-currency, multi-rail financial transactions
 * with seeded pseudorandom distributions for load testing and due diligence.
 *
 * Guarantees 100% deterministic output for identical seeds.
 */

import { Command } from "commander";
import * as fs from "node:fs";

export interface MockTransaction {
  id: string;
  tenantId: string;
  rail: "stripe" | "paypal" | "fedach" | "adyen" | "sepa";
  amountCents: number;
  feeCents: number;
  currency: string;
  timestamp: string;
  status: "settled" | "pending" | "disputed";
  reference: string;
}

/**
 * Deterministic LCG pseudo-random number generator.
 */
export class DeterministicRng {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed >>> 0;
  }

  /** Returns pseudo-random float [0, 1) */
  next(): number {
    // Numerical Recipes LCG parameters
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  /** Returns pseudo-random integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Pick one element from array */
  pick<T>(items: T[]): T {
    const idx = this.nextInt(0, items.length - 1);
    return items[idx]!;
  }
}

export function generateMockDataset(
  tenantId: string,
  count: number,
  seed: number = 1337
): MockTransaction[] {
  const rng = new DeterministicRng(seed);
  const rails: MockTransaction["rail"][] = ["stripe", "paypal", "fedach", "adyen", "sepa"];
  const currencies = ["USD", "EUR", "GBP"];
  const statuses: MockTransaction["status"][] = [
    "settled",
    "settled",
    "settled",
    "pending",
    "disputed",
  ];
  const baseTime = 1725926400000; // 2024-09-10T00:00:00.000Z

  const dataset: MockTransaction[] = [];

  for (let i = 1; i <= count; i++) {
    const rail = rng.pick(rails);
    const currency = rng.pick(currencies);
    const status = rng.pick(statuses);

    // Amount between $5.00 and $2,500.00 in integer cents
    const amountCents = rng.nextInt(500, 250000);

    // Approximate interchange/processor fee: 1.5% - 3.2% + 30 cents
    const bpsFee = rng.nextInt(150, 320);
    const feeCents = Math.floor((amountCents * bpsFee) / 10000) + 30;

    // Time increment
    const timeDelta = rng.nextInt(1000, 60000); // 1s to 60s
    const txTime = new Date(baseTime + i * timeDelta).toISOString();

    const id = `mock_tx_${rail}_${String(i).padStart(7, "0")}`;
    const reference = `REF-${rail.toUpperCase()}-${rng.nextInt(100000, 999999)}`;

    dataset.push({
      id,
      tenantId,
      rail,
      amountCents,
      feeCents,
      currency,
      timestamp: txTime,
      status,
      reference,
    });
  }

  return dataset;
}

export const mockDataCommand = new Command("mock-data")
  .description("Generate deterministic financial transaction datasets for stress testing")
  .option("--tenant <tenantId>", "Tenant ID context", "tenant_bench_01")
  .option("--count <count>", "Number of transactions to generate", "100")
  .option("--seed <seed>", "Deterministic PRNG seed", "1337")
  .option("--out <file>", "Output file path (default prints to stdout)")
  .action((options: { tenant: string; count: string; seed: string; out?: string }) => {
    const count = parseInt(options.count, 10);
    const seed = parseInt(options.seed, 10);
    const dataset = generateMockDataset(options.tenant, count, seed);

    const json = JSON.stringify(dataset, null, 2);
    if (options.out) {
      fs.writeFileSync(options.out, json, "utf-8");
      console.log(
        `[mock-data] Successfully generated ${dataset.length} transactions in ${options.out}`
      );
    } else {
      console.log(json);
    }
  });

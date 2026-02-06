/**
 * Demo Mode Seed Script
 *
 * Generates demo data files for Settler's demo mode.
 * Creates deterministic financial data for testing reconciliation workflows.
 *
 * Usage:
 *   npx tsx scripts/seed-demo.ts [--reset]
 *
 * Environment:
 *   DEMO_MODE=true    - Generate demo data files (optional, generates files regardless)
 *   DEMO_SEED=42     - Seed for deterministic data (default: 42)
 */

import * as fs from "fs";
import * as path from "path";

const DEMO_SEED = Number(process.env.DEMO_SEED ?? 42);

interface SeededRandom {
  seed: number;
  next(): number;
}

function createSeededRandom(initialSeed: number): SeededRandom {
  let seed = initialSeed;
  return {
    seed,
    next(): number {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    },
  };
}

function seededUuid(rng: SeededRandom): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(rng.next() * 16).toString(16)).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function randomDate(rng: SeededRandom, startDate: Date, days: number): Date {
  const date = new Date(startDate);
  date.setDate(date.getDate() + Math.floor(rng.next() * days));
  date.setHours(
    Math.floor(rng.next() * 24),
    Math.floor(rng.next() * 60),
    Math.floor(rng.next() * 60)
  );
  return date;
}

interface PayoutData {
  netAmount: number;
  date: Date;
  charges: string[];
}

interface DemoTransaction {
  id: string;
  externalId: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  type: "charge" | "payout" | "refund" | "fee" | "transfer";
  source: "stripe" | "bank";
  status: string;
}

function generateDemoData(rng: SeededRandom): {
  stripe: DemoTransaction[];
  bank: DemoTransaction[];
  matches: { stripeId: string; bankId: string }[];
} {
  const startDate = new Date("2025-01-01T00:00:00Z");
  const stripe: DemoTransaction[] = [];
  const bank: DemoTransaction[] = [];
  const matches: { stripeId: string; bankId: string }[] = [];

  const chargeCount = 20;
  for (let i = 0; i < chargeCount; i++) {
    const amount = Number((rng.next() * 100 + 10).toFixed(2));
    const fee = Number((amount * 0.029 + 0.3).toFixed(2));
    const net = Number((amount - fee).toFixed(2));
    const date = randomDate(rng, startDate, 30);
    const payoutId = `po_demo_${Math.floor(i / 5)}`;

    const stripeCharge: DemoTransaction = {
      id: seededUuid(rng),
      externalId: `ch_${seededUuid(rng).substring(0, 8)}`,
      amount,
      currency: "USD",
      date: date.toISOString(),
      description: `Charge for order_${1000 + i}`,
      type: "charge",
      source: "stripe",
      status: "succeeded",
    };
    stripe.push(stripeCharge);
  }

  const payouts = new Map<string, PayoutData>();

  stripe
    .filter((t) => t.type === "charge")
    .forEach((charge) => {
      const key = charge.externalId.split("_")[1]?.split("_")[0] || "";
      const existing = payouts.get(key) || {
        netAmount: 0,
        date: new Date(charge.date),
        charges: [],
      };
      existing.netAmount += charge.amount - (charge.amount * 0.029 + 0.3);
      existing.charges.push(charge.id);
      if (new Date(charge.date) > existing.date) {
        existing.date = new Date(charge.date);
      }
      payouts.set(key, existing);
    });

  payouts.forEach((data, payoutId) => {
    const payoutDate = new Date(data.date);
    payoutDate.setDate(payoutDate.getDate() + 2);

    const stripePayout: DemoTransaction = {
      id: seededUuid(rng),
      externalId: payoutId,
      amount: Number(data.netAmount.toFixed(2)),
      currency: "USD",
      date: payoutDate.toISOString(),
      description: `Payout ${payoutId}`,
      type: "payout",
      source: "stripe",
      status: "paid",
    };
    stripe.push(stripePayout);

    const bankDeposit: DemoTransaction = {
      id: seededUuid(rng),
      externalId: `txn_${seededUuid(rng).substring(0, 8)}`,
      amount: stripePayout.amount,
      currency: "USD",
      date: payoutDate.toISOString(),
      description: `STRIPE TRANSFER ${payoutId}`,
      type: "transfer",
      source: "bank",
      status: "posted",
    };
    bank.push(bankDeposit);

    matches.push({ stripeId: stripePayout.id, bankId: bankDeposit.id });
  });

  bank.push({
    id: seededUuid(rng),
    externalId: `txn_fee_${seededUuid(rng).substring(0, 8)}`,
    amount: 15.0,
    currency: "USD",
    date: randomDate(rng, startDate, 30).toISOString(),
    description: "MONTHLY SERVICE FEE",
    type: "fee",
    source: "bank",
    status: "posted",
  });

  return { stripe, bank, matches };
}

async function seedDemo(reset: boolean = false) {
  console.log("🎯 Demo Mode Seed Script\n");
  console.log(`   Seed: ${DEMO_SEED}`);
  console.log(`   Output: demo/data/\n`);

  const rng = createSeededRandom(DEMO_SEED);
  const demoData = generateDemoData(rng);

  const outputDir = path.join(process.cwd(), "demo", "data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (reset && fs.existsSync(outputDir)) {
    console.log("🗑️  Clearing existing demo data...");
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "demo_stripe_transactions.json"),
    JSON.stringify(demoData.stripe, null, 2)
  );
  fs.writeFileSync(
    path.join(outputDir, "demo_bank_transactions.json"),
    JSON.stringify(demoData.bank, null, 2)
  );
  fs.writeFileSync(
    path.join(outputDir, "demo_expected_matches.json"),
    JSON.stringify(demoData.matches, null, 2)
  );

  console.log("📁 Generated demo data files:");
  console.log(
    `   - ${outputDir}/demo_stripe_transactions.json (${demoData.stripe.length} records)`
  );
  console.log(`   - ${outputDir}/demo_bank_transactions.json (${demoData.bank.length} records)`);
  console.log(
    `   - ${outputDir}/demo_expected_matches.json (${demoData.matches.length} expected matches)\n`
  );

  console.log("📊 Demo Data Summary:");
  console.log(`   - Stripe charges: ${demoData.stripe.filter((t) => t.type === "charge").length}`);
  console.log(`   - Stripe payouts: ${demoData.stripe.filter((t) => t.type === "payout").length}`);
  console.log(`   - Bank transfers: ${demoData.bank.filter((t) => t.type === "transfer").length}`);
  console.log(
    `   - Bank fees (unmatched): ${demoData.bank.filter((t) => t.type === "fee").length}\n`
  );

  console.log("=".repeat(60));
  console.log("🎉 Demo Data Generation Complete!");
  console.log("=".repeat(60));
  console.log("\n📖 Usage:");
  console.log("   npm run demo:seed       # Generate demo data");
  console.log("   npm run demo:seed:reset # Clear and regenerate");
  console.log("\n🔗 API Endpoints:");
  console.log("   GET  /api/v1/playground/demo-dataset");
  console.log("   POST /api/v1/playground/demo-run");
  console.log("\n🌐 Console URLs:");
  console.log("   http://localhost:3000/console (requires running server)");
  console.log("");
}

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset") || args.includes("-r");

  try {
    await seedDemo(reset);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error generating demo data:", error);
    process.exit(1);
  }
}

main();

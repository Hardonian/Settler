import fs from "node:fs";
import path from "node:path";
import { matchTransactions } from "../match-engine";

describe("synthetic foundry engine harness", () => {
  it("runs smoke fixture through matcher and preserves counts", () => {
    const fixtureRoot = path.resolve(
      __dirname,
      "../../../../../../test-data/fixtures/smoke-seed42"
    );
    const processor = JSON.parse(
      fs.readFileSync(path.join(fixtureRoot, "payment_processor.json"), "utf8")
    );
    const bank = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "bank_statement.json"), "utf8"));
    const expected = JSON.parse(
      fs.readFileSync(path.join(fixtureRoot, "expected_results.json"), "utf8")
    );

    const source = processor.map((r: any) => ({
      id: r.transaction_id,
      amount: r.gross_amount,
      date: new Date(r.occurred_at),
      description: r.external_reference_id ?? null,
      currency: r.currency,
    }));
    const target = bank.map((r: any) => ({
      id: r.transaction_id,
      amount: r.gross_amount,
      date: new Date(r.occurred_at),
      description: r.external_reference_id ?? null,
      currency: r.currency,
    }));

    const out = matchTransactions(source, target, {
      requireExactMerchant: false,
      amountTolerance: 0.02,
      dateWindowDays: 4,
    });
    const exact = out.filter((m) => m.matchType === "exact").length;
    const fuzzy = out.filter((m) => m.matchType === "fuzzy").length;
    const unmatched = out.filter((m) => m.matchType === "unmatched").length;

    expect(out.length).toBe(source.length);
    expect(exact + fuzzy + unmatched).toBe(source.length);
    expect(expected.exact_matches.length).toBeGreaterThan(0);
  });
});

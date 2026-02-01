/**
 * Unit Tests: Deterministic Matcher
 *
 * Tests the deterministic matching logic with various scenarios.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { matchTransactions, MatchingRule } from "@/lib/reconciliation/deterministic-matcher";

describe("Deterministic Matcher", () => {
  const sourceTransactions = [
    {
      id: "source-1",
      amount: 100.0,
      date: new Date("2025-01-01"),
      description: "Starbucks Coffee",
      currency: "USD",
    },
    {
      id: "source-2",
      amount: 45.5,
      date: new Date("2025-01-02"),
      description: "Amazon Purchase",
      currency: "USD",
    },
    {
      id: "source-3",
      amount: 25.0,
      date: new Date("2025-01-03"),
      description: "Uber Ride",
      currency: "USD",
    },
  ];

  describe("Exact Matches", () => {
    it("should match transactions with exact amount, date, and merchant", () => {
      const targetTransactions = [
        {
          id: "target-1",
          amount: 100.0,
          date: new Date("2025-01-01"),
          description: "Starbucks Coffee",
          currency: "USD",
        },
        {
          id: "target-2",
          amount: 45.5,
          date: new Date("2025-01-02"),
          description: "Amazon Purchase",
          currency: "USD",
        },
      ];

      const matches = matchTransactions(sourceTransactions, targetTransactions);

      expect(matches).toHaveLength(3);
      expect(matches[0].matchType).toBe("exact");
      expect(matches[0].confidence).toBeGreaterThanOrEqual(0.9);
      expect(matches[0].targetTransactionId).toBe("target-1");
      expect(matches[1].matchType).toBe("exact");
      expect(matches[1].targetTransactionId).toBe("target-2");
      expect(matches[2].matchType).toBe("unmatched");
    });
  });

  describe("Amount Tolerance", () => {
    it("should match transactions within amount tolerance", () => {
      const targetTransactions = [
        {
          id: "target-1",
          amount: 100.01, // Within ±$0.01 tolerance
          date: new Date("2025-01-01"),
          description: "Starbucks Coffee",
          currency: "USD",
        },
      ];

      const matches = matchTransactions(sourceTransactions, targetTransactions);

      expect(matches[0].matchType).toBe("exact");
      expect(matches[0].amountDiff).toBeLessThanOrEqual(0.01);
    });

    it("should not match transactions outside amount tolerance", () => {
      const targetTransactions = [
        {
          id: "target-1",
          amount: 100.02, // Outside ±$0.01 tolerance
          date: new Date("2025-01-01"),
          description: "Starbucks Coffee",
          currency: "USD",
        },
      ];

      const matches = matchTransactions(sourceTransactions, targetTransactions);

      expect(matches[0].matchType).toBe("unmatched");
    });
  });

  describe("Date Window", () => {
    it("should match transactions within date window", () => {
      const targetTransactions = [
        {
          id: "target-1",
          amount: 100.0,
          date: new Date("2025-01-04"), // 3 days after source (within ±3 day window)
          description: "Starbucks Coffee",
          currency: "USD",
        },
      ];

      const matches = matchTransactions(sourceTransactions, targetTransactions);

      expect(matches[0].matchType).toBe("fuzzy");
      expect(matches[0].dateDiff).toBeLessThanOrEqual(3);
    });

    it("should not match transactions outside date window", () => {
      const targetTransactions = [
        {
          id: "target-1",
          amount: 100.0,
          date: new Date("2025-01-05"), // 4 days after source (outside ±3 day window)
          description: "Starbucks Coffee",
          currency: "USD",
        },
      ];

      const matches = matchTransactions(sourceTransactions, targetTransactions);

      expect(matches[0].matchType).toBe("unmatched");
    });
  });

  describe("Merchant Matching", () => {
    it("should match transactions with exact merchant name (case-insensitive)", () => {
      const targetTransactions = [
        {
          id: "target-1",
          amount: 100.0,
          date: new Date("2025-01-01"),
          description: "STARBUCKS COFFEE", // Different case
          currency: "USD",
        },
      ];

      const matches = matchTransactions(sourceTransactions, targetTransactions);

      expect(matches[0].matchType).toBe("exact");
    });

    it("should not match transactions with different merchant when exact required", () => {
      const targetTransactions = [
        {
          id: "target-1",
          amount: 100.0,
          date: new Date("2025-01-01"),
          description: "Coffee Shop", // Different merchant
          currency: "USD",
        },
      ];

      const matches = matchTransactions(sourceTransactions, targetTransactions, {
        requireExactMerchant: true,
      });

      expect(matches[0].matchType).toBe("unmatched");
    });
  });

  describe("Currency Matching", () => {
    it("should not match transactions with different currencies", () => {
      const targetTransactions = [
        {
          id: "target-1",
          amount: 100.0,
          date: new Date("2025-01-01"),
          description: "Starbucks Coffee",
          currency: "EUR", // Different currency
        },
      ];

      const matches = matchTransactions(sourceTransactions, targetTransactions);

      expect(matches[0].matchType).toBe("unmatched");
    });
  });

  describe("Best Match Selection", () => {
    it("should select best match when multiple candidates exist", () => {
      const targetTransactions = [
        {
          id: "target-1",
          amount: 100.01, // Slight amount difference
          date: new Date("2025-01-02"), // 1 day difference
          description: "Starbucks Coffee",
          currency: "USD",
        },
        {
          id: "target-2",
          amount: 100.0, // Exact amount
          date: new Date("2025-01-01"), // Exact date
          description: "Starbucks Coffee",
          currency: "USD",
        },
      ];

      const matches = matchTransactions(sourceTransactions, targetTransactions);

      // Should match with target-2 (better match)
      expect(matches[0].targetTransactionId).toBe("target-2");
      expect(matches[0].confidence).toBeGreaterThan(0.9);
    });
  });

  describe("Unmatched Transactions", () => {
    it("should mark transactions as unmatched when no match found", () => {
      const targetTransactions: Array<{
        id: string;
        amount: number;
        date: Date;
        description: string | null;
        currency: string;
      }> = [];

      const matches = matchTransactions(sourceTransactions, targetTransactions);

      expect(matches).toHaveLength(3);
      matches.forEach((match) => {
        expect(match.matchType).toBe("unmatched");
        expect(match.targetTransactionId).toBeNull();
        expect(match.confidence).toBe(0);
      });
    });
  });
});

import { matchTransactions } from "../match-engine";

describe("match-engine indexed matcher", () => {
  test("matches by exact merchant and currency", () => {
    const matches = matchTransactions(
      [
        {
          id: "s1",
          amount: 10,
          date: new Date("2026-01-01T00:00:00.000Z"),
          description: "Coffee Shop",
          currency: "USD",
        },
      ],
      [
        {
          id: "t1",
          amount: 10,
          date: new Date("2026-01-01T00:00:00.000Z"),
          description: "Coffee Shop",
          currency: "USD",
        },
      ]
    );

    expect(matches[0]).toMatchObject({ targetTransactionId: "t1", matchType: "exact" });
  });

  test("does not match across currencies with same merchant", () => {
    const matches = matchTransactions(
      [
        {
          id: "s1",
          amount: 10,
          date: new Date("2026-01-01T00:00:00.000Z"),
          description: "Coffee Shop",
          currency: "USD",
        },
      ],
      [
        {
          id: "t1",
          amount: 10,
          date: new Date("2026-01-01T00:00:00.000Z"),
          description: "Coffee Shop",
          currency: "EUR",
        },
      ]
    );

    expect(matches[0]).toMatchObject({ targetTransactionId: null, matchType: "unmatched" });
  });

  test("deterministically resolves ties by target id", () => {
    const source = [
      {
        id: "s1",
        amount: 100,
        date: new Date("2026-01-01T00:00:00.000Z"),
        description: "Store",
        currency: "USD",
      },
    ];

    const target = [
      {
        id: "t2",
        amount: 100,
        date: new Date("2026-01-01T00:00:00.000Z"),
        description: "Store",
        currency: "USD",
      },
      {
        id: "t1",
        amount: 100,
        date: new Date("2026-01-01T00:00:00.000Z"),
        description: "Store",
        currency: "USD",
      },
    ];

    const first = matchTransactions(source, target);
    const second = matchTransactions(source, target);

    expect(first[0]?.targetTransactionId).toBe("t1");
    expect(second[0]?.targetTransactionId).toBe("t1");
  });

  test("amount bucket boundaries still include valid matches", () => {
    const matches = matchTransactions(
      [
        {
          id: "s1",
          amount: 100,
          date: new Date("2026-01-01T00:00:00.000Z"),
          description: "Store",
          currency: "USD",
        },
      ],
      [
        {
          id: "t1",
          amount: 100.01,
          date: new Date("2026-01-01T00:00:00.000Z"),
          description: "Store",
          currency: "USD",
        },
      ],
      { amountTolerance: 0.01 }
    );

    expect(matches[0]?.targetTransactionId).toBe("t1");
  });
});

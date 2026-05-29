import { formatMoney } from "../utils";

describe("formatMoney", () => {
  it("should format valid money successfully", () => {
    const money = { value: 100, currency: "USD" };
    expect(formatMoney(money)).toBe("$100.00");
  });

  it("should handle invalid money", () => {
    expect(formatMoney(null as any)).toBe("Invalid");
  });

  it("should fallback when Intl.NumberFormat throws an error", () => {
    // We can use jest.spyOn to mock Intl.NumberFormat to throw an error,
    // simulating the catch block being executed.
    const spy = jest.spyOn(Intl, "NumberFormat").mockImplementation(() => {
      throw new Error("Simulated Intl error");
    });

    try {
      const money = { value: 100, currency: "USD" };
      const result = formatMoney(money);
      expect(result).toBe("USD 100.00");
    } finally {
      spy.mockRestore();
    }
  });
});

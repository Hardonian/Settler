import { formatMoney, generateSecureId } from '../utils';

describe('formatMoney', () => {
  it('should format valid money successfully', () => {
    const money = { value: 100, currency: 'USD' };
    expect(formatMoney(money)).toBe('$100.00');
  });

  it('should handle invalid money', () => {
    expect(formatMoney(null as any)).toBe('Invalid');
  });

  it('should fallback when Intl.NumberFormat throws an error', () => {
    const spy = jest.spyOn(Intl, 'NumberFormat').mockImplementation(() => {
      throw new Error('Simulated Intl error');
    });

    try {
      const money = { value: 100, currency: 'USD' };
      const result = formatMoney(money);
      expect(result).toBe('USD 100.00');
    } finally {
      spy.mockRestore();
    }
  });
});

describe("generateSecureId", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("should generate secure id using fallback when crypto.getRandomValues is not present", async () => {
    jest.doMock("node:crypto", () => {
      return {
        createHash: jest.fn(),
      };
    });

    const { generateSecureId: generateSecureIdMocked } = await import("../utils");

    const mathRandomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);

    const result = generateSecureIdMocked("test");

    expect(mathRandomSpy).toHaveBeenCalledTimes(16);
    expect(result).toMatch(/^test_[0-9a-f]{32}$/);
    expect(result).toBe("test_80808080808080808080808080808080");
  });

  it("should generate secure id using crypto.getRandomValues when available", async () => {
    const getRandomValuesSpy = jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = 128;
      }
      return arr;
    });

    jest.doMock("node:crypto", () => {
      return {
        createHash: jest.fn(),
        getRandomValues: getRandomValuesSpy,
      };
    });

    const { generateSecureId: generateSecureIdMocked } = await import("../utils");

    const result = generateSecureIdMocked("test");

    expect(getRandomValuesSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe("test_80808080808080808080808080808080");
  });
});

import { countJsonDepth } from "../../utils/json-depth";

describe("countJsonDepth", () => {
  it("returns 0 for primitives and arrays", () => {
    expect(countJsonDepth("value")).toBe(0);
    expect(countJsonDepth(123)).toBe(0);
    expect(countJsonDepth([1, 2, 3])).toBe(0);
  });

  it("computes depth for nested objects", () => {
    const payload = { a: { b: { c: 1 } }, d: 2 };
    expect(countJsonDepth(payload)).toBe(3);
  });

  it("short-circuits when max depth is exceeded", () => {
    const payload = { a: { b: { c: { d: 1 } } } };
    expect(countJsonDepth(payload, { maxDepth: 2 })).toBeGreaterThan(2);
  });
});

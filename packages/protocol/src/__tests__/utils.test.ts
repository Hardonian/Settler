import { generateSecureId } from "../utils";

describe("generateSecureId", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("should generate secure id using fallback when crypto.getRandomValues is not present", async () => {
    // Arrange
    jest.doMock("node:crypto", () => {
      return {
        createHash: jest.fn(),
        // Intentionally not providing getRandomValues
      };
    });

    const { generateSecureId: generateSecureIdMocked } = await import("../utils");

    const mathRandomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);

    // Act
    const result = generateSecureIdMocked("test");

    // Assert
    expect(mathRandomSpy).toHaveBeenCalledTimes(16);
    expect(result).toMatch(/^test_[0-9a-f]{32}$/);
    expect(result).toBe("test_80808080808080808080808080808080");
  });

  it("should generate secure id using crypto.getRandomValues when available", async () => {
    // Arrange
    const getRandomValuesSpy = jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = 128; // 0x80
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

    // Act
    const result = generateSecureIdMocked("test");

    // Assert
    expect(getRandomValuesSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe("test_80808080808080808080808080808080");
  });
});

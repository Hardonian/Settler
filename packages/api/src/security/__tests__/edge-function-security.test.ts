import { getCORSHeaders } from "../edge-function-security";

describe("getCORSHeaders", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return * if allowedOrigins includes *", () => {
    process.env.ALLOWED_ORIGINS = "*";
    const headers = getCORSHeaders("https://example.com");
    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("should return the origin if it is explicitly allowed", () => {
    process.env.ALLOWED_ORIGINS = "https://example.com,https://test.com";
    const headers = getCORSHeaders("https://example.com");
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://example.com");
  });

  it("should not return Access-Control-Allow-Origin if origin is not allowed", () => {
    process.env.ALLOWED_ORIGINS = "https://example.com,https://test.com";
    const headers = getCORSHeaders("https://malicious.com");
    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});

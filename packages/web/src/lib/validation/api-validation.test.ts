import { validateWebhookUrl } from "./api-validation";

describe("validateWebhookUrl", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = "production";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("should accept valid public HTTPS URLs", () => {
    expect(validateWebhookUrl("https://example.com/webhook")).toEqual(
      expect.objectContaining({ valid: true })
    );
    expect(validateWebhookUrl("https://api.settler.dev/hooks")).toEqual(
      expect.objectContaining({ valid: true })
    );
    expect(validateWebhookUrl("https://1.1.1.1/webhook")).toEqual(
      expect.objectContaining({ valid: true })
    ); // Public IP
  });

  it("should reject non-HTTPS URLs in production", () => {
    expect(validateWebhookUrl("http://example.com/webhook")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/must use HTTPS/) })
    );
    expect(validateWebhookUrl("ftp://example.com/webhook")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Invalid URL format/) })
    );
    expect(validateWebhookUrl("file:///etc/passwd")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Invalid URL format/) })
    );
  });

  it("should reject loopback addresses", () => {
    expect(validateWebhookUrl("https://localhost/webhook")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Localhost/) })
    );
    expect(validateWebhookUrl("https://127.0.0.1/webhook")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Localhost/) })
    );
    expect(validateWebhookUrl("https://[::1]/webhook")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Private|Internal/) })
    );
  });

  it("should reject RFC 1918 private IPv4 addresses", () => {
    expect(validateWebhookUrl("https://10.0.0.1/webhook")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Private|Internal/) })
    );
    expect(validateWebhookUrl("https://172.16.0.1/webhook")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Private|Internal/) })
    );
    expect(validateWebhookUrl("https://172.31.255.255/webhook")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Private|Internal/) })
    );
    expect(validateWebhookUrl("https://192.168.1.1/webhook")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Private|Internal/) })
    );
  });

  it("should reject link-local and cloud metadata endpoints", () => {
    expect(validateWebhookUrl("https://169.254.169.254/latest/meta-data")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Cloud metadata/) })
    );
  });

  it("should reject malformed URLs", () => {
    expect(validateWebhookUrl("not-a-url")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Invalid URL/) })
    );
    expect(validateWebhookUrl("")).toEqual(
      expect.objectContaining({ valid: false, error: expect.stringMatching(/Invalid URL/) })
    );
  });
});

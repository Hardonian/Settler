import { validateWebhookUrl } from "./api-validation";

describe("validateWebhookUrl", () => {
  it("should accept valid public HTTPS URLs", () => {
    expect(validateWebhookUrl("https://example.com/webhook")).toBe(true);
    expect(validateWebhookUrl("https://api.settler.dev/hooks")).toBe(true);
    expect(validateWebhookUrl("https://1.1.1.1/webhook")).toBe(true); // Public IP
  });

  it("should reject non-HTTPS URLs", () => {
    expect(() => validateWebhookUrl("http://example.com/webhook")).toThrow(/must use HTTPS/);
    expect(() => validateWebhookUrl("ftp://example.com/webhook")).toThrow(/must use HTTPS/);
    expect(() => validateWebhookUrl("file:///etc/passwd")).toThrow(/must use HTTPS/);
  });

  it("should reject loopback addresses", () => {
    expect(() => validateWebhookUrl("https://localhost/webhook")).toThrow(
      /cannot resolve to localhost/
    );
    expect(() => validateWebhookUrl("https://127.0.0.1/webhook")).toThrow(/Internal IP/);
    expect(() => validateWebhookUrl("https://[::1]/webhook")).toThrow(/Internal IP/);
  });

  it("should reject RFC 1918 private IPv4 addresses", () => {
    expect(() => validateWebhookUrl("https://10.0.0.1/webhook")).toThrow(/Internal IP/);
    expect(() => validateWebhookUrl("https://172.16.0.1/webhook")).toThrow(/Internal IP/);
    expect(() => validateWebhookUrl("https://172.31.255.255/webhook")).toThrow(/Internal IP/);
    expect(() => validateWebhookUrl("https://192.168.1.1/webhook")).toThrow(/Internal IP/);
  });

  it("should reject link-local and cloud metadata endpoints", () => {
    expect(() => validateWebhookUrl("https://169.254.169.254/latest/meta-data")).toThrow(
      /Internal IP/
    );
  });

  it("should reject malformed URLs", () => {
    expect(() => validateWebhookUrl("not-a-url")).toThrow(/Invalid URL/);
    expect(() => validateWebhookUrl("")).toThrow(/Invalid URL/);
  });
});

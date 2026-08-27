import { validateUrl } from "../../utils/ssrf-protection";

describe("Webhook SSRF Protection", () => {
  it("should allow valid public domains", async () => {
    await expect(validateUrl("https://example.com/webhook")).resolves.not.toThrow();
    await expect(validateUrl("https://google.com")).resolves.not.toThrow();
  });

  it("should reject localhost strings", async () => {
    await expect(validateUrl("http://localhost:8080")).rejects.toThrow(/SSRF attempt blocked/);
    await expect(validateUrl("http://127.0.0.1")).rejects.toThrow(/SSRF attempt blocked/);
    await expect(validateUrl("http://[::1]")).rejects.toThrow(/SSRF attempt blocked/);
  });

  it("should reject private IPs", async () => {
    await expect(validateUrl("http://10.0.0.1")).rejects.toThrow(/SSRF attempt blocked/);
    await expect(validateUrl("http://172.16.0.5")).rejects.toThrow(/SSRF attempt blocked/);
    await expect(validateUrl("http://192.168.1.1")).rejects.toThrow(/SSRF attempt blocked/);
    await expect(validateUrl("http://169.254.169.254")).rejects.toThrow(/SSRF attempt blocked/);
    await expect(validateUrl("http://0.0.0.0")).rejects.toThrow(/SSRF attempt blocked/);
  });

  it("should reject IPv4-mapped IPv6 localhost", async () => {
    await expect(validateUrl("http://[::ffff:127.0.0.1]")).rejects.toThrow(/SSRF attempt blocked/);
  });

  it("should only allow HTTP and HTTPS protocols", async () => {
    await expect(validateUrl("file:///etc/passwd")).rejects.toThrow(
      /Only HTTP\/HTTPS protocols are allowed/
    );
    await expect(validateUrl("ftp://example.com")).rejects.toThrow(
      /Only HTTP\/HTTPS protocols are allowed/
    );
  });

  it("should fail on unresolvable domains", async () => {
    await expect(validateUrl("http://this-domain-does-not-exist-at-all-xyz.com")).rejects.toThrow();
  });
});

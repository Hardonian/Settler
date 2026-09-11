import { MtlsTransportEnforcer, MtlsSecurityError } from "../mtls-transport";

describe("MtlsTransportEnforcer", () => {
  const enforcer = new MtlsTransportEnforcer();

  it("authorizes valid internal certificate presented by RECON_WORKER", () => {
    const cert = {
      subject: { CN: "recon-worker-node-4.settler.internal", OU: "RECON_WORKER" },
      issuer: { CN: "Settler Internal CA" },
      fingerprint256: "AA:BB:CC:DD:EE:FF",
      valid_to: new Date(Date.now() + 86400000).toISOString(),
    };

    const identity = enforcer.validateCertificate(cert);
    expect(identity.authorized).toBe(true);
    expect(identity.serviceRole).toBe("RECON_WORKER");
    expect(identity.subjectCn).toBe("recon-worker-node-4.settler.internal");
  });

  it("rejects untrusted third-party certificate issuer", () => {
    const cert = {
      subject: { CN: "attacker.com", OU: "RECON_WORKER" },
      issuer: { CN: "Untrusted Rogue CA" },
      fingerprint256: "00:11:22:33",
      valid_to: new Date(Date.now() + 86400000).toISOString(),
    };

    expect(() => enforcer.validateCertificate(cert)).toThrow(MtlsSecurityError);
    expect(() => enforcer.validateCertificate(cert)).toThrow(
      /Certificate issuer 'Untrusted Rogue CA' is untrusted/
    );
  });

  it("rejects unauthorized organizational unit service role", () => {
    const cert = {
      subject: { CN: "guest.settler.internal", OU: "UNAUTHORIZED_GUEST" },
      issuer: { CN: "Settler Internal CA" },
      fingerprint256: "33:44:55:66",
      valid_to: new Date(Date.now() + 86400000).toISOString(),
    };

    expect(() => enforcer.validateCertificate(cert)).toThrow(
      /Service role 'UNAUTHORIZED_GUEST' is not authorized/
    );
  });

  it("rejects expired peer certificate", () => {
    const cert = {
      subject: { CN: "recon-worker-node-1.settler.internal", OU: "RECON_WORKER" },
      issuer: { CN: "Settler Internal CA" },
      fingerprint256: "55:66:77:88",
      valid_to: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
    };

    expect(() => enforcer.validateCertificate(cert)).toThrow(/Client certificate is expired/);
  });
});

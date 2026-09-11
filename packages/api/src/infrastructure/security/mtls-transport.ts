import { Request, Response, NextFunction } from "express";

export interface MtlsClientIdentity {
  subjectCn: string;
  issuerCn: string;
  fingerprintSha256: string;
  serviceRole: "API_GATEWAY" | "RECON_WORKER" | "TIGERBEETLE_ADAPTER" | "EDGE_PROXY";
  tenantBinding?: string;
  authorized: boolean;
}

export class MtlsSecurityError extends Error {
  public readonly code = "SETTLER_INVARIANT_MTLS_UNAUTHORIZED";
  public readonly statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = "MtlsSecurityError";
  }
}

/**
 * Zero-Trust Mutual TLS (mTLS) Inter-Service Communication (#99)
 * Enforces cryptographic mutual authentication between API control plane pods and background reconciliation workers.
 */
export class MtlsTransportEnforcer {
  private readonly allowedIssuers: Set<string>;
  private readonly allowedRoles: Set<string>;

  constructor(config: { allowedIssuers?: string[]; allowedRoles?: string[] } = {}) {
    this.allowedIssuers = new Set(
      config.allowedIssuers ?? ["Settler Internal CA", "Settler Production Root CA"]
    );
    this.allowedRoles = new Set(
      config.allowedRoles ?? ["API_GATEWAY", "RECON_WORKER", "TIGERBEETLE_ADAPTER", "EDGE_PROXY"]
    );
  }

  public validateCertificate(
    peerCert: {
      subject?: { CN?: string; OU?: string };
      issuer?: { CN?: string };
      fingerprint256?: string;
      valid_to?: string;
    } | null
  ): MtlsClientIdentity {
    if (!peerCert || !peerCert.subject || !peerCert.issuer) {
      throw new MtlsSecurityError(
        "Zero-Trust mTLS Invariant Violation: Client failed to present a valid X.509 peer certificate"
      );
    }

    const issuerCn = peerCert.issuer.CN || "";
    if (!this.allowedIssuers.has(issuerCn)) {
      throw new MtlsSecurityError(
        `Zero-Trust mTLS Invariant Violation: Certificate issuer '${issuerCn}' is untrusted`
      );
    }

    if (peerCert.valid_to && new Date(peerCert.valid_to).getTime() < Date.now()) {
      throw new MtlsSecurityError(
        "Zero-Trust mTLS Invariant Violation: Client certificate is expired"
      );
    }

    const subjectCn = peerCert.subject.CN || "";
    const serviceRole = (
      peerCert.subject.OU || ""
    ).toUpperCase() as MtlsClientIdentity["serviceRole"];

    if (!this.allowedRoles.has(serviceRole)) {
      throw new MtlsSecurityError(
        `Zero-Trust mTLS Invariant Violation: Service role '${serviceRole}' is not authorized for internal RPC transport`
      );
    }

    return {
      subjectCn,
      issuerCn,
      fingerprintSha256: peerCert.fingerprint256 || "00:00:00:00",
      serviceRole,
      authorized: true,
    };
  }

  public middleware() {
    return (
      req: Request & { mtlsClient?: MtlsClientIdentity },
      res: Response,
      next: NextFunction
    ) => {
      try {
        const socket = req.socket as any;
        const peerCert =
          typeof socket?.getPeerCertificate === "function" ? socket.getPeerCertificate() : null;

        // In development/test environments, check custom header or fallback mock cert
        if (process.env.NODE_ENV !== "production" && req.headers["x-settler-mock-mtls-role"]) {
          const role = req.headers["x-settler-mock-mtls-role"] as MtlsClientIdentity["serviceRole"];
          req.mtlsClient = {
            subjectCn: "dev-worker-01.settler.internal",
            issuerCn: "Settler Internal CA",
            fingerprintSha256: "MOCK_FINGERPRINT",
            serviceRole: role,
            authorized: true,
          };
          return next();
        }

        req.mtlsClient = this.validateCertificate(peerCert);
        return next();
      } catch (error) {
        if (error instanceof MtlsSecurityError) {
          return res.status(error.statusCode).json({
            error: error.message,
            code: error.code,
          });
        }
        return res.status(403).json({ error: "mTLS authentication failed" });
      }
    };
  }
}

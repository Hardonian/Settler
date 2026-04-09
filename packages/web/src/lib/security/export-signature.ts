import { createHmac } from "node:crypto";

const SIGNING_ALGORITHM = "hmac-sha256";

export interface ExportSignatureResult {
  signature: string;
  keyId: string;
  algorithm: string;
}

export function signExportPayload(payload: string): ExportSignatureResult {
  const secret = process.env.EXPORT_SIGNING_KEY;
  if (!secret) {
    throw new Error("EXPORT_SIGNING_KEY is required for export signing.");
  }

  const keyId = process.env.EXPORT_SIGNING_KEY_ID || "default";
  const signature = createHmac("sha256", secret).update(payload).digest("hex");

  return {
    signature,
    keyId,
    algorithm: SIGNING_ALGORITHM,
  };
}

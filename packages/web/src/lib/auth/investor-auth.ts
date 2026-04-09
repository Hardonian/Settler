/**
 * Investor Metrics API Authentication
 * Protects investor metrics endpoints.
 *
 * Runtime posture:
 * - API key auth is canonical.
 * - OIDC session auth is optional and explicitly degraded when provider env contracts are missing.
 */

import { NextRequest } from "next/server";
import { getOidcProviderStatus } from "@/lib/auth/enterprise-oidc";

export interface AuthResult {
  authorized: boolean;
  userId?: string;
  error?: string;
  degradedReason?: string;
}

/**
 * Check if request is authorized for investor metrics
 */
export async function checkInvestorAuth(request: NextRequest): Promise<AuthResult> {
  // Canonical path: explicit API key
  const apiKey = request.headers.get("x-investor-api-key");
  const validApiKey = process.env.INVESTOR_API_KEY;

  if (apiKey && validApiKey && apiKey === validApiKey) {
    return {
      authorized: true,
      userId: "investor-api-key",
    };
  }

  // Optional machine-to-machine OIDC token path for enterprise automation.
  // This route currently verifies static token equality only; JWT validation is explicitly not GA here.
  const bearer = request.headers.get("authorization");
  const expectedToken = process.env.INVESTOR_BEARER_TOKEN;
  if (bearer?.startsWith("Bearer ") && expectedToken && bearer.slice(7) === expectedToken) {
    return {
      authorized: true,
      userId: "investor-bearer-token",
    };
  }

  const oidcDegraded = [
    getOidcProviderStatus("okta"),
    getOidcProviderStatus("entra"),
    getOidcProviderStatus("google_workspace"),
  ].every((status) => status.state === "degraded");

  return {
    authorized: false,
    degradedReason: oidcDegraded ? "enterprise_oidc_unconfigured" : undefined,
    error: "Unauthorized. Provide x-investor-api-key or configured bearer token.",
  };
}

/**
 * Require investor auth (throws if not authorized)
 */
export async function requireInvestorAuth(request: NextRequest): Promise<void> {
  const auth = await checkInvestorAuth(request);

  if (!auth.authorized) {
    throw new Error(auth.error || "Unauthorized");
  }
}

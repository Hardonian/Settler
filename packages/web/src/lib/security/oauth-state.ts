import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export interface OAuthStatePayload {
  connectorId: string;
  tenantId: string;
  providerId: string;
  userId: string;
  nonce: string;
  issuedAt: number;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function resolveStateSigningKey(): string {
  const key =
    process.env.OAUTH_STATE_SIGNING_KEY ||
    process.env.JWT_SECRET ||
    process.env.ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key || key.length < 32) {
    throw new Error("OAuth state signing key missing or too short");
  }

  return key;
}

function createSignature(payload: string, signingKey: string): string {
  return createHmac("sha256", signingKey).update(payload).digest("base64url");
}

export function createOAuthState(input: Omit<OAuthStatePayload, "nonce" | "issuedAt">): string {
  const payload: OAuthStatePayload = {
    ...input,
    nonce: randomUUID(),
    issuedAt: Date.now(),
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = createSignature(encodedPayload, resolveStateSigningKey());

  return `${encodedPayload}.${signature}`;
}

export function verifyOAuthState(
  state: string,
  expected: Pick<OAuthStatePayload, "providerId" | "userId">,
  ttlMs: number = OAUTH_STATE_TTL_MS
): OAuthStatePayload | null {
  const [encodedPayload, providedSignature] = state.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const signingKey = resolveStateSigningKey();
  const expectedSignature = createSignature(encodedPayload, signingKey);

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  let parsedPayload: OAuthStatePayload;

  try {
    parsedPayload = JSON.parse(decodeBase64Url(encodedPayload)) as OAuthStatePayload;
  } catch {
    return null;
  }

  if (
    !parsedPayload.connectorId ||
    !parsedPayload.tenantId ||
    !parsedPayload.providerId ||
    !parsedPayload.userId ||
    !parsedPayload.nonce ||
    typeof parsedPayload.issuedAt !== "number"
  ) {
    return null;
  }

  if (
    parsedPayload.providerId !== expected.providerId ||
    parsedPayload.userId !== expected.userId
  ) {
    return null;
  }

  if (Date.now() - parsedPayload.issuedAt > ttlMs) {
    return null;
  }

  return parsedPayload;
}

import crypto from "crypto";

const DEFAULT_ALLOWED_ADAPTERS = ["stripe", "shopify", "paypal", "quickbooks", "xero"];
const DEFAULT_TOLERANCE_SECONDS = 300;

export function getAllowedWebhookAdapters(): string[] {
  const raw = process.env.WEBHOOK_ALLOWED_ADAPTERS;
  if (!raw) {
    return DEFAULT_ALLOWED_ADAPTERS;
  }

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

export function isAllowedWebhookAdapter(
  adapter: string,
  allowedAdapters = getAllowedWebhookAdapters()
): boolean {
  return allowedAdapters.includes(adapter.toLowerCase());
}

export function validateWebhookTimestamp(
  timestampHeader: string | undefined,
  nowEpochSeconds = Math.floor(Date.now() / 1000),
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS
): { valid: true; timestamp: number } | { valid: false; reason: "missing" | "invalid" | "stale" } {
  if (!timestampHeader) {
    return { valid: false, reason: "missing" };
  }

  const timestamp = Number.parseInt(timestampHeader, 10);
  if (!Number.isFinite(timestamp)) {
    return { valid: false, reason: "invalid" };
  }

  const timeDiff = Math.abs(nowEpochSeconds - timestamp);
  if (timeDiff > toleranceSeconds) {
    return { valid: false, reason: "stale" };
  }

  return { valid: true, timestamp };
}

export function buildWebhookReplayKey(
  adapter: string,
  signature: string,
  timestamp: string
): string {
  const digest = crypto
    .createHash("sha256")
    .update(`${adapter}:${signature}:${timestamp}`)
    .digest("hex");

  return `settler:webhook:replay:v1:${adapter}:${digest}`;
}

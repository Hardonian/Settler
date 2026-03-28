import { query } from "../db";

export type WebhookSecretRow = {
  secret: string;
  signature_algorithm: string;
};

/**
 * Resolve webhook signing secret for a tenant + adapter (fail-closed).
 * Must match all verification paths — do not query webhook_configs without tenant_id.
 */
export async function getWebhookSecretForTenant(
  adapter: string,
  tenantId: string
): Promise<WebhookSecretRow | null> {
  const normalizedAdapter = adapter.trim().toLowerCase();
  if (!normalizedAdapter) {
    return null;
  }

  const rows = await query<WebhookSecretRow>(
    `SELECT secret, signature_algorithm
       FROM webhook_configs
      WHERE tenant_id = $1 AND adapter = $2
      LIMIT 1`,
    [tenantId, normalizedAdapter]
  );

  return rows[0] ?? null;
}
